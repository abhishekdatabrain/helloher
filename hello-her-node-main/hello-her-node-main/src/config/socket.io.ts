// socket.io.ts
import dotenv from "dotenv";
import { config } from "./config";
import { Server } from "socket.io";
import { Application } from "express";
import { Server as HttpServer } from "http";
import mongoose from "mongoose";
import Message from "../modals/message.model";
import Provider from "../modals/serviceProvider.model";
import { encrypt } from "../utils/crypto";
import { safelyDecryptMessage } from "../utils/messageUtils";
import { CallSession } from "../modals/callSession.model";
import ChatRequest from "../modals/chatRequest.model";
import { CallService } from "../services/call.service";
import { createAndEmitNotification } from "../services/notificationHelper.service";
import { scheduleAutoMissTimeout, clearAutoMissTimeout } from "../utils/callTimeouts";
import { getCallParticipantMeta } from "../utils/callParticipantMeta";
import { User } from "../modals/user.model";

dotenv.config();

interface SocketUser {
  userId: string;
  socketId: string;
}

let users: SocketUser[] = [];

// helpers
const addUser = (userId: string, socketId: string) => {
  // Remove existing user if they reconnect with a new socket
  const existingUserIndex = users.findIndex((u) => u.userId === userId);
  if (existingUserIndex !== -1) {
    users[existingUserIndex].socketId = socketId;
  } else {
    users.push({ userId, socketId });
  }
};

const removeUser = (socketId: string) => {
  users = users.filter((u) => u.socketId !== socketId);
};

const getUser = (userId: string) => {
  return users.find((u) => u.userId === userId);
};

const recipientTypeFromModel = (model: "User" | "ServiceProvider") =>
  model === "ServiceProvider" ? "provider" : "user";

type CallSessionParticipantRef = {
  _id: any;
  channel: string;
  caller: any;
  callerModel: "User" | "ServiceProvider";
  callee: any;
  calleeModel: "User" | "ServiceProvider";
};

const notifyPendingCallEnded = async ({
  io,
  sessionId,
  recipientId,
  senderId,
  session,
}: {
  io: Server;
  sessionId: string;
  recipientId: string;
  senderId: string;
  session: CallSessionParticipantRef;
}) => {
  const isRecipientCaller = recipientId === session.caller.toString();
  const recipientModel = isRecipientCaller ? session.callerModel : session.calleeModel;
  const senderModel = senderId === session.caller.toString() ? session.callerModel : session.calleeModel;

  await createAndEmitNotification({
    type: "call_ended",
    title: "Call Ended",
    message: "The ringing call ended before it connected.",
    recipientId,
    recipientType: recipientTypeFromModel(recipientModel),
    senderId,
    senderType: recipientTypeFromModel(senderModel),
    metadata: {
      sessionId,
      channel: session.channel,
      callerId: session.caller.toString(),
      calleeId: session.callee.toString(),
      endedByUserId: senderId,
      reason: "USER_END",
      endedBeforeConnect: true,
    },
    io,
    getSocketUser: getUser,
  });
};

export const configureSocket = async (
  httpServer: HttpServer,
  app: Application,
): Promise<void> => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  // expose globally
  app.set("socketio", io);
  app.set("getSocketUser", getUser);

  io.on("connection", (socket) => {
    console.log("[SOCKET] Client connected:", {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    socket.on("addUser", async (userId: string) => {
      console.log("[SOCKET] addUser event received:", {
        socketId: socket.id,
        userId,
        timestamp: new Date().toISOString(),
      });

      if (!userId) {
        console.warn("[SOCKET] addUser called without userId:", {
          socketId: socket.id,
        });
        return;
      }

      const previousUser = getUser(userId);
      addUser(userId, socket.id);
      console.log("[SOCKET] User added/updated:", {
        userId,
        socketId: socket.id,
        wasReconnect: previousUser !== undefined,
        previousSocketId: previousUser?.socketId,
        totalUsers: users.length,
      });

      io.emit("getUsers", users);
      console.log("[SOCKET] Emitted getUsers to all clients:", {
        totalUsers: users.length,
        users: users.map((u) => ({ userId: u.userId, socketId: u.socketId })),
      });

      try {
        const provider = await Provider.findById(userId)
          .select("isOnline socketId connectedUsers name alias isOnCall currentCallStartedAt")
          .exec();

        if (provider) {
          const wasOnline = !!provider.isOnline;
          provider.socketId = socket.id;
          provider.lastActive = new Date();
          provider.isOnline = true;
          await provider.save();

          const presencePayload = {
            providerId: provider._id.toString(),
            providerName: provider.alias || provider.name || "Provider",
            status: "online" as const,
            isOnline: true,
            lastSeen: null,
          };

          try {
            io.emit("provider:oncall", {
              providerId: provider._id.toString(),
              status: !!provider.isOnCall,
              startedAt: provider.currentCallStartedAt || null,
            });
          } catch (e) {
            console.error("Failed to emit provider:oncall on addUser:", e);
          }

          try {
            io.emit("provider:presence", presencePayload);
          } catch (e) {
            console.error("Failed to emit provider:presence on addUser:", e);
          }

          if (!wasOnline) {
            try {
              const getSocketUser = (id: string) => users.find((u) => u.userId === id.toString());
              const { ProviderController } = await import("../public/Provider/provider.controller");
              await ProviderController.notifyProviderOnline(provider, io, getSocketUser);
            } catch (e) {
              console.error("Failed to notify users of provider online on addUser:", e);
            }
          }
        }

        const user = await User.findById(userId).select("isOnline socketId name lastSeen").exec();
        if (user) {
          const wasOnline = user.isOnline;
          user.socketId = socket.id;
          user.isOnline = true;
          await user.save();

          if (!wasOnline) {
            const payload = {
              userId: user._id.toString(),
              userName: user.name,
              status: "online" as const,
              isOnline: true,
              lastSeen: null,
            };
            io.emit("user_online", payload);
            io.emit("user:presence", payload);
          }
        }
      } catch (err) {
        console.error("Error updating online state on addUser:", err);
      }

      // 📬 Update undelivered "sent" messages to "delivered" (Double Ticks)
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          const Message = (await import("../modals/message.model")).default;
          const undeliveredMessages = await Message.find({
            receiverId: new mongoose.Types.ObjectId(userId),
            status: "sent",
          }).select("_id senderId").lean();

          if (undeliveredMessages.length > 0) {
            await Message.updateMany(
              { receiverId: new mongoose.Types.ObjectId(userId), status: "sent" },
              { $set: { status: "delivered" } }
            );

            console.log(`[SOCKET] Marked ${undeliveredMessages.length} pending messages as delivered for ${userId}`);

            const senderMap: { [key: string]: string[] } = {};
            undeliveredMessages.forEach((msg: any) => {
              const sId = msg.senderId.toString();
              if (!senderMap[sId]) senderMap[sId] = [];
              senderMap[sId].push(msg._id.toString());
            });

            for (const [sId, ids] of Object.entries(senderMap)) {
              const sUser = getUser(sId);
              if (sUser) {
                const deliveryPayload = {
                  senderId: sId,
                  receiverId: userId,
                  messageIds: ids,
                  messageId: ids[0],
                  status: "delivered",
                };
                io.to(sUser.socketId).emit("messagesDelivered", deliveryPayload);
                io.to(sUser.socketId).emit("messages_delivered", deliveryPayload);
                io.to(sUser.socketId).emit("message_delivered", deliveryPayload);
                io.to(sUser.socketId).emit("messageDelivered", deliveryPayload);
              }
            }
          }
        }
      } catch (delivErr) {
        console.error("Error updating undelivered messages on addUser:", delivErr);
      }
    });

    socket.on(
      "initiate_call",
      async (
        { sessionId, callerId, calleeId, channel }: { sessionId: string; callerId: string; calleeId: string; channel?: string },
        ack?: (response: { ok: boolean; error?: string; channel?: string }) => void,
      ) => {
        try {
          if (!sessionId || !callerId || !calleeId) {
            ack?.({ ok: false, error: "MISSING_FIELDS" });
            return;
          }

          const session = await CallSession.findById(sessionId);
          if (!session) {
            ack?.({ ok: false, error: "SESSION_NOT_FOUND" });
            return;
          }

          const callee = getUser(calleeId);
          const effectiveChannel = channel || session.channel;
          const callerType = session.callerModel as "User" | "ServiceProvider";
          const callerMeta = await getCallParticipantMeta(
            session.caller.toString(),
            callerType,
          );

          // Notify callee if online
          if (callee) {
            io.to(callee.socketId).emit("incoming_call", {
              sessionId,
              callerId,
              caller_id: callerId,
              channel: effectiveChannel,
              channelName: effectiveChannel,
              callerName: callerMeta.callerName,
              caller_name: callerMeta.callerName,
              callerImageUrl: callerMeta.callerImageUrl,
              caller_image_url: callerMeta.callerImageUrl,
              callerProfileImage: callerMeta.callerImageUrl,
              callerType,
            });
          } else {
            io.to(socket.id).emit("call_unreachable", { sessionId, reason: "CALLEE_OFFLINE" });
          }

          // Always let caller know which channel to use
          ack?.({ ok: true, channel: effectiveChannel });

          // Schedule auto-miss
          scheduleAutoMissTimeout({ sessionId, io, getUser });
        } catch (err) {
          console.error("initiate_call error:", err);
          ack?.({ ok: false, error: "SERVER_ERROR" });
        }
      },
    );

    socket.on("accept_call", async ({ sessionId, callerId, channel }) => {
      try {
        if (!sessionId || !callerId) {
          console.warn("accept_call missing sessionId/callerId", { sessionId, callerId });
          return;
        }

        const connection = await CallService.markConnected(sessionId);
        if (connection.outcome === "not_found") {
          console.warn("accept_call for missing session", sessionId);
          io.to(socket.id).emit("call_unreachable", {
            sessionId,
            reason: "SESSION_NOT_FOUND",
          });
          return;
        }

        if (connection.outcome === "not_connectable") {
          io.to(socket.id).emit("call_unreachable", { sessionId, reason: "CALL_ALREADY_ENDED" });
          return;
        }

        clearAutoMissTimeout(sessionId);
        const currentSession = connection.session;

        // Ensure provider on-call state is set for a winning transition or an
        // idempotent duplicate accept. Terminal CAS losers never reach here.
        try {
          await CallService.startProviderOnCallBySession(sessionId, io);
        } catch (err) {
          console.error("startProviderOnCallBySession failed:", err);
        }

        const caller = getUser(callerId);
        const effectiveChannel = channel || currentSession.channel;

        if (caller) {
          io.to(caller.socketId).emit("call_accepted", {
            sessionId,
            channel: effectiveChannel,
            accepterSocketId: socket.id,
          });

          console.log("[CALL] Call accepted", {
            sessionId,
            channel: effectiveChannel,
            callerId,
            callerSocketId: caller.socketId,
          });
        } else {
          io.to(socket.id).emit("call_unreachable", { sessionId, reason: "CALLER_OFFLINE" });
          console.warn("accept_call: caller socket not found", { callerId, sessionId });
        }
      } catch (err) {
        console.error("accept_call error:", err);
      }
    });

    socket.on("call_heartbeat", async ({ channel }: { channel: string }) => {
      if (!channel) return;
      try {
        const socketUser = users.find((user) => user.socketId === socket.id);
        if (!socketUser) {
          console.warn("[CALL] Ignored heartbeat from unregistered socket", {
            socketId: socket.id,
          });
          return;
        }

        const now = new Date();
        const updated = await CallSession.findOneAndUpdate(
          {
            channel,
            status: "connected",
            billingProcessed: { $ne: true },
            $or: [
              { caller: socketUser.userId },
              { callee: socketUser.userId },
            ],
          },
          {
            lastHeartbeat: now,
            heartbeatExpiresAt: new Date(now.getTime() + 20000),
          },
          { new: true }
        );
        if (updated) {
          console.log("[CALL] Heartbeat updated for channel", channel);
        }
      } catch (err) {
        console.error("call_heartbeat error:", err);
      }
    });

    socket.on("reject_call", ({ sessionId, callerId }) => {
      clearAutoMissTimeout(sessionId);
      const caller = getUser(callerId);

      if (caller) {
        io.to(caller.socketId).emit("call_rejected", {
          sessionId,
        });

        console.log("[CALL] Call rejected:", {
          sessionId,
          callerId,
        });
      }
    });

    socket.on("end_call", async ({ sessionId, channel, otherUserId }: { sessionId?: string; channel?: string; otherUserId?: string }) => {
      if (sessionId) clearAutoMissTimeout(sessionId);
      const otherUser = otherUserId ? getUser(otherUserId) : undefined;

      if (sessionId && otherUserId) {
        try {
          const session = await CallSession.findById(sessionId).exec();
          if (session && ["initiated", "ringing"].includes(session.status)) {
            const senderId = session.caller.toString() === otherUserId
              ? session.callee.toString()
              : session.caller.toString();

            await notifyPendingCallEnded({
              io,
              sessionId,
              recipientId: otherUserId,
              senderId,
              session: session as CallSessionParticipantRef,
            });
          }
        } catch (notifErr) {
          console.error("[CALL] Failed to create pending end notification:", notifErr);
        }
      }

      if (otherUser) {
        io.to(otherUser.socketId).emit("call_ended", {
          sessionId,
        });
      }

      console.log("[CALL] Call ended:", {
        sessionId,
        channel,
        endedBySocket: socket.id,
      });

      try {
        if (channel) {
          await CallService.endCallSafe(channel, "USER_END", io, getUser);
        } else if (sessionId) {
          const session = await CallSession.findById(sessionId).select("channel").exec();
          if (session?.channel) {
            await CallService.endCallSafe(session.channel, "USER_END", io, getUser);
          }
        }
      } catch (err) {
        console.error("[CALL] endCallSafe on end_call failed:", err);
      }
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      console.log("[SOCKET] typing event received:", {
        socketId: socket.id,
        senderId,
        receiverId,
        timestamp: new Date().toISOString(),
      });

      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("user-typing", senderId);
        console.log("[SOCKET] Emitted user-typing to receiver:", {
          receiverId,
          receiverSocketId: user.socketId,
          senderId,
        });
      } else {
        console.warn("[SOCKET] Receiver not found for typing indicator:", {
          receiverId,
          senderId,
        });
      }
    });

    socket.on("mark_read", async ({ senderId, receiverId, userId, providerId }: any) => {
      try {
        const sId = (senderId || userId)?.toString();
        const rId = (receiverId || providerId)?.toString();
        if (!sId || !rId) return;

        const Message = (await import("../modals/message.model")).default;
        const result = await Message.updateMany(
          {
            $or: [
              { senderId: sId, receiverId: rId, isRead: false },
              { senderId: rId, receiverId: sId, isRead: false },
            ],
          },
          { $set: { status: "read", isRead: true } }
        );

        const payload = {
          senderId: sId,
          receiverId: rId,
          modifiedCount: result.modifiedCount,
          status: "read",
          isRead: true,
        };

        const sUser = getUser(sId);
        if (sUser) {
          io.to(sUser.socketId).emit("messagesRead", payload);
          io.to(sUser.socketId).emit("messages_read", payload);
          io.to(sUser.socketId).emit("message_read", payload);
        }
        const rUser = getUser(rId);
        if (rUser) {
          io.to(rUser.socketId).emit("messagesRead", payload);
          io.to(rUser.socketId).emit("messages_read", payload);
          io.to(rUser.socketId).emit("message_read", payload);
        }
      } catch (err) {
        console.error("Error handling mark_read socket event:", err);
      }
    });

    socket.on("mark_delivered", async (data: any) => {
      try {
        const { messageId, messageIds, senderId, receiverId } = data || {};
        const socketUser = users.find((u) => u.socketId === socket.id);
        const readerId = (receiverId || socketUser?.userId)?.toString();

        const Message = (await import("../modals/message.model")).default;
        const query: any = { status: "sent" };
        if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
          query._id = new mongoose.Types.ObjectId(messageId);
        } else if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
          query._id = { $in: messageIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id)).map((id: string) => new mongoose.Types.ObjectId(id)) };
        } else if (readerId && senderId && mongoose.Types.ObjectId.isValid(readerId) && mongoose.Types.ObjectId.isValid(senderId)) {
          query.senderId = new mongoose.Types.ObjectId(senderId);
          query.receiverId = new mongoose.Types.ObjectId(readerId);
        } else {
          return;
        }

        const undeliveredDocs = await Message.find(query).select("_id senderId receiverId").lean();
        if (undeliveredDocs.length === 0) return;

        await Message.updateMany(query, { $set: { status: "delivered" } });

        const senderMap: { [key: string]: string[] } = {};
        undeliveredDocs.forEach((doc: any) => {
          const sId = doc.senderId.toString();
          if (!senderMap[sId]) senderMap[sId] = [];
          senderMap[sId].push(doc._id.toString());
        });

        for (const [sId, ids] of Object.entries(senderMap)) {
          const sUser = getUser(sId);
          if (sUser) {
            const deliveryPayload = {
              senderId: sId,
              receiverId: readerId || undeliveredDocs[0].receiverId?.toString(),
              messageIds: ids,
              messageId: ids[0],
              status: "delivered",
            };
            io.to(sUser.socketId).emit("messagesDelivered", deliveryPayload);
            io.to(sUser.socketId).emit("messages_delivered", deliveryPayload);
            io.to(sUser.socketId).emit("message_delivered", deliveryPayload);
            io.to(sUser.socketId).emit("messageDelivered", deliveryPayload);
          }
        }
      } catch (err) {
        console.error("Error handling mark_delivered socket event:", err);
      }
    });

    socket.on("message_delivered", async (data: any) => {
      socket.emit("mark_delivered", data);
    });

    socket.on("disconnect", (reason) => {
      const disconnectedUser = users.find((u) => u.socketId === socket.id);
      console.log("[SOCKET] Client disconnected:", {
        socketId: socket.id,
        userId: disconnectedUser?.userId || "unknown",
        reason,
        timestamp: new Date().toISOString(),
      });

      (async () => {
        try {
          const provider = await Provider.findOne({ socketId: socket.id }).exec();
          if (provider) {
            provider.isOnCall = false;
            provider.currentCallStartedAt = null;
            // provider.isOnline = false;
            provider.socketId = null;
            provider.lastActive = new Date();
            await provider.save();

            try {
              io.emit("provider:oncall", {
                providerId: provider._id.toString(),
                status: false,
              });
            } catch (e) {
              console.error("Failed to emit provider:oncall on disconnect:", e);
            }

            try {
              const payload = {
                providerId: provider._id.toString(),
                providerName: provider.alias || provider.name || "Provider",
                status: "offline",
                isOnline: false,
                lastSeen: provider.lastActive?.toISOString() || new Date().toISOString(),
              };
              io.emit("provider_offline", payload);
              io.emit("provider:presence", payload);
            } catch (e) {
              console.error("Failed to emit provider_offline on disconnect:", e);
            }
          }
        } catch (err) {
          console.error("Error clearing provider state on disconnect:", err);
        }

        try {
          const user = await User.findOne({ socketId: socket.id }).exec();
          if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            user.socketId = undefined;
            await user.save();

            try {
              const payload = {
                userId: user._id.toString(),
                userName: user.name,
                status: "offline" as const,
                isOnline: false,
                lastSeen: user.lastSeen?.toISOString() || new Date().toISOString(),
              };
              io.emit("user_offline", payload);
              io.emit("user:presence", payload);
            } catch (e) {
              console.error("Failed to emit user_offline on disconnect:", e);
            }
          }

          if (disconnectedUser?.userId) {
            const activeSession = await CallSession.findOne({
              status: { $in: ["initiated", "ringing", "connected"] },
              billingProcessed: { $ne: true },
              $or: [
                { caller: disconnectedUser.userId },
                { callee: disconnectedUser.userId },
              ],
            }).sort({ updatedAt: -1 }).exec();

            if (activeSession?.channel) {
              console.log("[CALL] Disconnect ended active session", activeSession.channel);

              if (["initiated", "ringing"].includes(activeSession.status)) {
                const callerId = activeSession.caller.toString();
                const calleeId = activeSession.callee.toString();
                const recipientId = disconnectedUser.userId === callerId ? calleeId : callerId;
                const senderId = disconnectedUser.userId === callerId ? callerId : calleeId;

                await notifyPendingCallEnded({
                  io,
                  sessionId: activeSession._id.toString(),
                  recipientId,
                  senderId,
                  session: activeSession as CallSessionParticipantRef,
                });
              }

              await CallService.endCallSafe(activeSession.channel, "SOCKET_DROP", io, getUser);
            }
          }
        } catch (timeoutErr) {
          console.error("[CALL] Error ending call on disconnect:", timeoutErr);
        }

        removeUser(socket.id);
        console.log("[SOCKET] User removed from active users:", {
          remainingUsers: users.length,
          activeUsers: users.map((u) => ({ userId: u.userId, socketId: u.socketId })),
        });

        io.emit("getUsers", users);
        console.log("[SOCKET] Emitted getUsers after disconnect:", {
          totalUsers: users.length,
        });
      })();
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("[SOCKET] Socket error:", {
        socketId: socket.id,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    });
  });
};
