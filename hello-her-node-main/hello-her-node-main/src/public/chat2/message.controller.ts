import mongoose from "mongoose";
import { Request, Response } from "express";
import Message from "../../modals/message.model";
import ServiceProvider from "../../modals/serviceProvider.model";
import { User } from "../../modals/user.model";
import Provider from "../../modals/serviceProvider.model";
import { CommonService } from "../../services/common.services";
import { encrypt, decrypt } from "../../utils/crypto";
import { safelyDecryptMessage } from "../../utils/messageUtils";
import { applyChatCommission } from "../../services/chatCommission.service";
import ChatRequest from "../../modals/chatRequest.model";
import dotenv from "dotenv";
dotenv.config();

const messageService = new CommonService(Message);

export class MessageController {

  // 💬 Create Message (API owns messages)
  // static async createMessage(req: Request | any, res: Response) {
  //   try {
  //     const { senderId, role, receiverId, text, media } = req.body;

  //     if (!senderId || !receiverId || !role) {
  //       return res.status(400).json({ message: "Missing required fields" });
  //     }

  //     if (
  //       !mongoose.Types.ObjectId.isValid(senderId) ||
  //       !mongoose.Types.ObjectId.isValid(receiverId)
  //     ) {
  //       return res.status(400).json({ message: "Invalid sender or receiver ID" });
  //     }

  //     // 1️⃣ Save message in DB (single source of truth)
  //     const message = await Message.create({
  //       senderId,
  //       receiverId,
  //       senderRole: role,
  //       text: text ? encrypt(text) : undefined,
  //       media: media || [],
  //       isRead: false,
  //     });

  //     // 2️⃣ Prepare decrypted message for socket and API response
  //     const decryptedText = message.text
  //       ? safelyDecryptMessage(message.text, message._id)
  //       : "";

  //     const messagePayload = {
  //       _id: message._id,
  //       senderId: message.senderId,
  //       receiverId: message.receiverId,
  //       senderRole: message.senderRole,
  //       text: decryptedText,
  //       media: message.media,
  //       createdAt: message.createdAt,
  //       isRead: message.isRead,
  //     };

  //     // 3️⃣ Emit real-time message to BOTH sender and receiver
  //     const io = req.app.get("socketio");
  //     const getSocketUser = req.app.get("getSocketUser");

  //     if (io && getSocketUser) {
  //       // const getAllUsers = req.app.get("getAllSocketUsers");
  //       // const allRegisteredUsers = getAllUsers ? getAllUsers() : [];

  //       console.log("💬 [MESSAGE] Preparing to emit getMessage:", {
  //         messageId: message._id,
  //         senderId: senderId.toString(),
  //         receiverId: receiverId.toString(),
  //         timestamp: new Date().toISOString(),
  //       });

  //       // Emit to receiver - try multiple ID formats
  //       let receiver = getSocketUser(receiverId.toString());

  //       if (receiver) {
  //         io.to(receiver.socketId).emit("getMessage", messagePayload);
  //         console.log("📤 [MESSAGE] ✅ Emitted getMessage to receiver:", {
  //           receiverId: receiverId.toString(),
  //           receiverSocketId: receiver.socketId,
  //           messageId: message._id,
  //           receiverUserId: receiver.userId,
  //         });
  //       } else {
  //         // Get all users for debugging
  //         const allUsers = (io as any).sockets?.sockets
  //           ? Object.keys((io as any).sockets.sockets).length
  //           : 0;
  //         console.warn("⚠️ [MESSAGE] Receiver not found online:", {
  //           receiverId: receiverId.toString(),
  //           receiverIdRaw: receiverId,
  //           messageId: message._id,
  //           totalActiveSockets: allUsers,
  //           hint: "Receiver may not have called addUser or userId format mismatch",
  //         });

  //       }

  //       // Emit to sender (so they see their message immediately)
  //       let sender = getSocketUser(senderId.toString());
  //       if (!sender) {
  //         // Try with ObjectId directly
  //         sender = getSocketUser(senderId);
  //       }
  //       if (!sender && senderId._id) {
  //         // Try with nested _id
  //         sender = getSocketUser(senderId._id.toString());
  //       }

  //       if (sender) {
  //         io.to(sender.socketId).emit("getMessage", messagePayload);
  //         console.log("📤 [MESSAGE] ✅ Emitted getMessage to sender:", {
  //           senderId: senderId.toString(),
  //           senderSocketId: sender.socketId,
  //           messageId: message._id,
  //           senderUserId: sender.userId,
  //         });
  //       } else {
  //         console.warn("⚠️ [MESSAGE] Sender not found online:", {
  //           senderId: senderId.toString(),
  //           senderIdRaw: senderId,
  //           messageId: message._id,
  //           hint: "Sender may not have called addUser or userId format mismatch",
  //         });
  //       }
  //     } else {
  //       console.error("❌ [MESSAGE] Socket.IO not available:", {
  //         hasIo: !!io,
  //         hasGetSocketUser: !!getSocketUser,
  //         messageId: message._id,
  //       });
  //     }

  //     // 4️⃣ API response with decrypted text
  //     const responseMessage = {
  //       ...message.toObject(),
  //       text: decryptedText,
  //     };

  //     // 🔔 Create notification for message received
  //     try {
  //       const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
  //       const senderRoleType = role === "user" ? "user" : "provider";
  //       const receiverRoleType = role === "user" ? "provider" : "user";

  //       await createAndEmitNotification({
  //         type: "message_received",
  //         title: "New Message",
  //         message: `You received a new message from ${senderId}`,
  //         recipientId: receiverId.toString(),
  //         recipientType: receiverRoleType,
  //         senderId: senderId.toString(),
  //         senderType: senderRoleType,
  //         metadata: {
  //           messageId: message._id.toString(),
  //           hasText: !!text,
  //           hasMedia: !!(media && media.length > 0),
  //         },
  //         io,
  //         getSocketUser,
  //       });
  //     } catch (notifError) {
  //       console.error("Error creating message notification:", notifError);
  //       // Don't fail the request if notification fails
  //     }

  //     return res.status(201).json({
  //       success: true,
  //       message: "Message sent successfully",
  //       data: responseMessage,
  //     });

  //   } catch (error) {
  //     console.error("Error creating message:", error);
  //     return res.status(500).json({ message: "Internal server error" });
  //   }
  // }
  static async createMessage(req: Request | any, res: Response) {
    try {
      console.log("🚀 [START] createMessage API called");
      console.log("📥 Raw Body:", req.body);

      console.log("ðŸ§¾ Auth User:", req.user);

      console.log("[createMessage] auth user:", req.user);

      const { senderId, role, receiverId, text, media, status } = req.body;
      const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
      console.log("[createMessage] parsed inputs:", {
        senderId,
        receiverId,
        role,
        normalizedRole,
        text,
        mediaCount: Array.isArray(media) ? media.length : 0,
      });

      console.log("📌 Parsed Inputs:", {
        senderId,
        receiverId,
        role,
        normalizedRole,
        text,
        media,
      });

      // ✅ Basic validation
      if (!senderId || !receiverId || !normalizedRole) {
        console.warn("❌ Missing required fields");
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!["user", "provider"].includes(normalizedRole)) {
        console.warn("âŒ Invalid role provided", { role, normalizedRole });
        return res.status(400).json({ message: "Invalid role" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(senderId) ||
        !mongoose.Types.ObjectId.isValid(receiverId)
      ) {
        console.warn("❌ Invalid ObjectId", { senderId, receiverId });
        return res.status(400).json({ message: "Invalid sender or receiver ID" });
      }

      console.log("✅ IDs are valid");

      // ================= USER FLOW =================
      console.log("ðŸ“Š Message creation context:", {
        senderId,
        receiverId,
        senderRole: normalizedRole,
        hasText: Boolean(text),
        mediaCount: Array.isArray(media) ? media.length : 0,
      });

      if (normalizedRole === "user") {
        console.log("👤 Role = USER → Running validations");

        // 🔎 Check chat request
        const chatAllowed = await ChatRequest.findOne({
          userId: senderId,
          providerId: receiverId,
          status: "accepted",
        });

        console.log("🔎 ChatRequest result:", chatAllowed);

        if (!chatAllowed) {
          console.warn("❌ Chat NOT accepted");
          return res.status(403).json({
            success: false,
            message: "Provider has not accepted your chat request yet",
          });
        }

        console.log("✅ Chat is accepted");

        // 🚫 Block check
        const provider = await ServiceProvider.findById(receiverId).select("blockedUsers");

        console.log("🔎 Provider blockedUsers:", provider?.blockedUsers);

        const isBlocked = provider?.blockedUsers?.some(
          (id: any) => id.toString() === senderId.toString()
        );

        console.log("🚫 Is user blocked?", isBlocked);

        if (isBlocked) {
          console.warn("❌ User is BLOCKED by provider");
          return res.status(403).json({
            success: false,
            message: "You are blocked by this provider",
          });
        }

        console.log("✅ User is NOT blocked");

        // 🎤 Audio limit check
        const isAudioMessage =
          Array.isArray(media) &&
          media.some((item: any) => item?.type === "audio");

        console.log("🎤 Is audio message?", isAudioMessage);

        if (isAudioMessage) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const count = await Message.countDocuments({
            senderId,
            senderRole: "user",
            createdAt: { $gte: todayStart },
            "media.type": "audio",
          });

          console.log("📊 Audio messages sent today:", count);

          if (count >= 5) {
            console.warn("❌ Audio limit exceeded");
            return res.status(429).json({
              success: false,
              message: "You have reached the daily limit of 5 audio messages.",
            });
          }
        }
      }

      // ================= MESSAGE CREATION =================
      let message: any;

      try {
        console.log("💾 Creating message...");

        const io = req.app.get("socketio");
        const getSocketUser = req.app.get("getSocketUser");
        const receiver = (io && getSocketUser) ? getSocketUser(receiverId.toString()) : null;
        const initialStatus: "sent" | "delivered" = receiver ? "delivered" : "sent";

        message = await Message.create({
          senderId,
          receiverId,
          senderRole: normalizedRole,
          text: text ? encrypt(text) : undefined,
          media: media || [],
          status: initialStatus,
          isRead: false,
        });

        console.log("✅ Message created:", message._id, "with status:", message.status);

        console.log("ðŸ“ Saved message details:", {
          messageId: message._id?.toString(),
          senderId: message.senderId?.toString?.() || senderId?.toString?.(),
          receiverId: message.receiverId?.toString?.() || receiverId?.toString?.(),
          senderRole: message.senderRole,
          status: message.status,
          createdAt: message.createdAt,
        });

        console.log("[createMessage] saved message details:", {
          messageId: message._id?.toString(),
          senderId: message.senderId?.toString?.() || senderId?.toString?.(),
          receiverId: message.receiverId?.toString?.() || receiverId?.toString?.(),
          senderRole: message.senderRole,
          status: message.status,
          createdAt: message.createdAt,
        });

        if (normalizedRole === "user") {
          console.log("💰 Applying chat commission...");

          await applyChatCommission(
            senderId.toString(),
            receiverId.toString(),
            message._id.toString()
          );

          console.log("✅ Commission applied");
        }

      } catch (err: any) {
        console.error("❌ Commission/Save error:", err.message);

        if (message?._id) {
          console.log("↩️ Rolling back message:", message._id);
          await Message.findByIdAndDelete(message._id);
        }

        return res.status(400).json({
          success: false,
          message: err.message || "Chat commission failed",
        });
      }

      // ================= DECRYPT =================
      const decryptedText = message.text
        ? safelyDecryptMessage(message.text, message._id)
        : "";

      console.log("🔓 Decrypted text:", decryptedText);

      const messagePayload = {
        _id: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        senderRole: message.senderRole,
        text: decryptedText,
        media: message.media,
        createdAt: message.createdAt,
        status: message.status,
        isRead: message.isRead,
      };

      // ================= SOCKET =================
      const io = req.app.get("socketio");
      const getSocketUser = req.app.get("getSocketUser");

      console.log("🔌 Socket status:", { hasIO: !!io, hasGetter: !!getSocketUser });

      if (io && getSocketUser) {
        const receiver = getSocketUser(receiverId.toString());
        console.log("📡 Receiver socket:", receiver);

        if (receiver) {
          io.to(receiver.socketId).emit("getMessage", messagePayload);
          console.log("📤 Sent to receiver");
        }

        let sender = getSocketUser(senderId.toString());
        console.log("📡 Sender socket:", sender);

        if (sender) {
          io.to(sender.socketId).emit("getMessage", messagePayload);
          if (message.status === "delivered") {
            const deliveredPayload = {
              messageId: message._id.toString(),
              messageIds: [message._id.toString()],
              senderId: senderId.toString(),
              receiverId: receiverId.toString(),
              status: "delivered",
            };
            io.to(sender.socketId).emit("messageDelivered", deliveredPayload);
            io.to(sender.socketId).emit("messagesDelivered", deliveredPayload);
            io.to(sender.socketId).emit("message_delivered", deliveredPayload);
          }
          console.log("📤 Sent to sender");
        }
      }

      // ================= NOTIFICATION =================
      try {
        console.log("🔔 Sending notification...");

        const senderDoc = normalizedRole === "user"
          ? await User.findById(senderId).select("name").lean()
          : await ServiceProvider.findById(senderId).select("name").lean();
        const senderName = senderDoc?.name || senderId.toString();

        const { createAndEmitNotification } = await import(
          "../../services/notificationHelper.service"
        );

        await createAndEmitNotification({
          type: "message_received",
          title: "New Message",
          message: `You received a new message from ${senderName}`,
          recipientId: receiverId.toString(),
          recipientType: normalizedRole === "user" ? "provider" : "user",
          senderId: senderId.toString(),
          senderType: normalizedRole === "user" ? "user" : "provider",
          metadata: {
            messageId: message._id.toString(),
          },
          io,
          getSocketUser,
        });

        console.log("✅ Notification sent");

      } catch (err) {
        console.error("❌ Notification error:", err);
      }

      console.log("✅ SUCCESS RESPONSE");

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: {
          ...message.toObject(),
          text: decryptedText,
          status: message.status,
        },
      });

    } catch (error) {
      console.error("💥 FATAL ERROR:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  // 📩 Get message by ID
  static async getMessageById(req: Request | any, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const message: any = await Message.findById(id);
      if (!message) return res.status(404).json({ message: "Message not found" });

      const currentUserId = req.user?._id?.toString() || null;
      const adminId = process.env.ADMIN_USER_ID;

      const canRead =
        message.senderId.toString() === currentUserId ||
        message.receiverId.toString() === currentUserId ||
        currentUserId === adminId;

      if (canRead) {
        message.text = canRead
          ? safelyDecryptMessage(message.text, message._id)
          : "Encrypted message";
      } else {
        message.text = "Encrypted message";
      }

      return res.status(200).json({ success: true, data: message });
    } catch (error) {
      console.error("Error fetching message:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 🔄 Get chat between a User and Provider
  static async getChatBetweenUsers(req: Request | any, res: Response) {
    try {
      const { userId, providerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ message: "Invalid user or provider ID" });
      }

      // Auto-deliver pending "sent" messages destined for the requesting user
      const currentAuthUser = (req as any).user?.id || (req as any).user?._id;
      if (currentAuthUser) {
        const readerIdStr = currentAuthUser.toString();
        let otherUserIdStr: string | null = null;
        if (readerIdStr === userId) {
          otherUserIdStr = providerId;
        } else if (readerIdStr === providerId) {
          otherUserIdStr = userId;
        }

        if (otherUserIdStr && mongoose.Types.ObjectId.isValid(otherUserIdStr) && mongoose.Types.ObjectId.isValid(readerIdStr)) {
          const undeliveredDocs = await Message.find({
            senderId: new mongoose.Types.ObjectId(otherUserIdStr),
            receiverId: new mongoose.Types.ObjectId(readerIdStr),
            status: "sent",
          }).select("_id").lean();

          if (undeliveredDocs.length > 0) {
            const undeliveredIds = undeliveredDocs.map((d: any) => d._id);
            await Message.updateMany(
              { _id: { $in: undeliveredIds } },
              { $set: { status: "delivered" } }
            );

            const io = req.app.get("socketio");
            const getSocketUser = req.app.get("getSocketUser");
            if (io && getSocketUser) {
              const senderSocket = getSocketUser(otherUserIdStr);
              if (senderSocket) {
                const deliveryPayload = {
                  senderId: otherUserIdStr,
                  receiverId: readerIdStr,
                  messageIds: undeliveredIds.map((id: any) => id.toString()),
                  messageId: undeliveredIds[0].toString(),
                  status: "delivered",
                };
                io.to(senderSocket.socketId).emit("messagesDelivered", deliveryPayload);
                io.to(senderSocket.socketId).emit("messages_delivered", deliveryPayload);
                io.to(senderSocket.socketId).emit("messageDelivered", deliveryPayload);
                io.to(senderSocket.socketId).emit("message_delivered", deliveryPayload);
              }
            }
          }
        }
      }

      const messages: any[] = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId), receiverId: new mongoose.Types.ObjectId(providerId) },
              { senderId: new mongoose.Types.ObjectId(providerId), receiverId: new mongoose.Types.ObjectId(userId) },
            ],
          },
        },
        { $sort: { createdAt: 1 } },
        {
          $lookup: { from: "users", localField: "senderId", foreignField: "_id", as: "senderUser" },
        },
        {
          $lookup: { from: "serviceproviders", localField: "senderId", foreignField: "_id", as: "senderProvider" },
        },
        {
          $lookup: { from: "users", localField: "receiverId", foreignField: "_id", as: "receiverUser" },
        },
        {
          $lookup: { from: "serviceproviders", localField: "receiverId", foreignField: "_id", as: "receiverProvider" },
        },
        {
          $addFields: {
            senderInfo: {
              $cond: [
                { $eq: ["$senderRole", "user"] },
                { $arrayElemAt: ["$senderUser", 0] },
                { $arrayElemAt: ["$senderProvider", 0] },
              ],
            },
            receiverInfo: {
              $cond: [
                { $eq: ["$senderRole", "user"] },
                { $arrayElemAt: ["$receiverProvider", 0] },
                { $arrayElemAt: ["$receiverUser", 0] },
              ],
            },
          },
        },
        {
          $addFields: {
            senderProviderId: {
              $cond: [
                { $eq: ["$senderRole", "provider"] },
                "$senderInfo.providerId",
                null
              ]
            },
            receiverProviderId: {
              $cond: [
                { $eq: ["$senderRole", "user"] },
                "$receiverInfo.providerId",
                "$senderInfo.providerId"
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            text: 1,
            status: 1,
            isRead: 1,
            createdAt: 1,
            media: 1,
            senderRole: 1,
            senderId: 1,
            receiverId: 1,
            "senderInfo.name": 1,
            "senderInfo.providerId": 1,
            "senderInfo.activeImageType": 1,
            "senderInfo.activeImageUrl": {
              $cond: [
                { $eq: ["$senderInfo.activeImageType", "avatar"] },
                { $ifNull: ["$senderInfo.avatar", "$senderInfo.profilePicture"] },
                { $ifNull: ["$senderInfo.profilePicture", "$senderInfo.avatar"] }
              ]
            },
            "receiverInfo.name": 1,
            "receiverInfo.providerId": 1,
            "receiverInfo.activeImageType": 1,
            "receiverInfo.activeImageUrl": {
              $cond: [
                { $eq: ["$receiverInfo.activeImageType", "avatar"] },
                { $ifNull: ["$receiverInfo.avatar", "$receiverInfo.profilePicture"] },
                { $ifNull: ["$receiverInfo.profilePicture", "$receiverInfo.avatar"] }
              ]
            },
          },
        },
      ]);

      // Fetch provider to check blockedUsers and connectedUsers
      const Provider = mongoose.model("ServiceProvider");
      const providerDocRaw = await Provider.findById(providerId).select("blockedUsers connectedUsers").lean();
      let blockedByProvider = false;
      let isDearOne = false;
      const providerDoc = Array.isArray(providerDocRaw) ? providerDocRaw[0] : providerDocRaw;
      if (providerDoc && providerDoc.blockedUsers && providerDoc.connectedUsers) {
        blockedByProvider = Array.isArray(providerDoc.blockedUsers) && providerDoc.blockedUsers.some((id: any) => id.toString() === userId);
        isDearOne = Array.isArray(providerDoc.connectedUsers) && providerDoc.connectedUsers.some((id: any) => id.toString() === userId);
      }

      const currentUserId = (req as any).user?.id.toString() || null;
      const adminId = process.env.ADMIN_USER_ID;

      const decryptedMessages = messages.map(msg => {
        const canRead =
          msg.senderId?.toString() === currentUserId ||
          msg.receiverId?.toString() === currentUserId ||
          currentUserId === adminId;

        if (canRead) {
          // Only attempt to decrypt if text exists and is a string
          if (msg.text && typeof msg.text === "string" && msg.text.trim() !== "") {
            try {
              msg.text = safelyDecryptMessage(msg.text, msg._id);
              // msg.text = decrypt(msg.text);
            } catch (err) {
              console.error("Decrypt error for message", msg._id, err);
              msg.text = "Encrypted message";
            }
          } else {
            // No text (maybe only file), leave empty string
            msg.text = "";
          }
        } else {
          msg.text = "Encrypted message";
        }

        return msg;
      });


      return res.status(200).json({
        success: true,
        data: decryptedMessages,
        blockedByProvider,
        isDearOne
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async markMessagesAsRead(req: Request | any, res: Response) {
    try {
      const { messageId, messageIds } = req.body || {};
      const rawSenderId = req.body.senderId || req.body.userId;
      const rawReceiverId = req.body.receiverId || req.body.providerId;
      const currentUserId = (req as any).user?.id || (req as any).user?._id;

      let query: any = {};
      const unreadCondition = { $or: [{ isRead: false }, { status: { $ne: "read" } }] };

      if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
        const validIds = messageIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        query = { _id: { $in: validIds }, ...unreadCondition };
      } else if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
        query = { _id: new mongoose.Types.ObjectId(messageId), ...unreadCondition };
      } else if (rawSenderId && rawReceiverId && mongoose.Types.ObjectId.isValid(rawSenderId) && mongoose.Types.ObjectId.isValid(rawReceiverId)) {
        const sObjId = new mongoose.Types.ObjectId(rawSenderId.toString());
        const rObjId = new mongoose.Types.ObjectId(rawReceiverId.toString());

        if (currentUserId && (currentUserId.toString() === rawSenderId.toString() || currentUserId.toString() === rawReceiverId.toString())) {
          const readerObjId = new mongoose.Types.ObjectId(currentUserId.toString());
          const otherObjId = readerObjId.equals(sObjId) ? rObjId : sObjId;
          query = {
            senderId: otherObjId,
            receiverId: readerObjId,
            ...unreadCondition,
          };
        } else {
          query = {
            $and: [
              {
                $or: [
                  { senderId: sObjId, receiverId: rObjId },
                  { senderId: rObjId, receiverId: sObjId },
                ],
              },
              unreadCondition,
            ],
          };
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Please provide messageId, messageIds, or valid senderId and receiverId (or userId and providerId)",
        });
      }

      const unreadDocs = await Message.find(query).select("_id senderId receiverId").lean();

      if (unreadDocs.length > 0) {
        await Message.updateMany(query, { $set: { status: "read", isRead: true } });
      }

      const updatedIds = unreadDocs.map((doc: any) => doc._id.toString());
      const senderIdStr = rawSenderId?.toString() || (unreadDocs[0]?.senderId?.toString() ?? "");
      const receiverIdStr = rawReceiverId?.toString() || (unreadDocs[0]?.receiverId?.toString() ?? "");

      console.log("✅ [MESSAGE] Messages marked as read in DB:", {
        modifiedCount: unreadDocs.length,
        senderId: senderIdStr,
        receiverId: receiverIdStr,
        updatedIds,
      });

      // 🔔 Emit socket AFTER DB update
      const io = req.app.get("socketio");
      const getSocketUser = req.app.get("getSocketUser");

      if (io && getSocketUser && unreadDocs.length > 0) {
        const payload = {
          messageIds: updatedIds,
          messageId: updatedIds[0] || null,
          senderId: senderIdStr,
          receiverId: receiverIdStr,
          userId: senderIdStr,
          providerId: receiverIdStr,
          modifiedCount: unreadDocs.length,
          status: "read",
          isRead: true,
        };

        const emitToUser = (targetId: string) => {
          if (!targetId) return;
          const targetSocket = getSocketUser(targetId);
          if (targetSocket) {
            io.to(targetSocket.socketId).emit("messagesRead", payload);
            io.to(targetSocket.socketId).emit("messages_read", payload);
            io.to(targetSocket.socketId).emit("messageRead", payload);
            io.to(targetSocket.socketId).emit("message_read", payload);
          }
        };

        emitToUser(senderIdStr);
        emitToUser(receiverIdStr);

        const distinctSenders = new Set<string>();
        unreadDocs.forEach((d: any) => {
          if (d.senderId) distinctSenders.add(d.senderId.toString());
        });
        distinctSenders.forEach((sId) => {
          if (sId !== senderIdStr && sId !== receiverIdStr) {
            emitToUser(sId);
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: `${unreadDocs.length} messages marked as read.`,
        data: {
          modifiedCount: unreadDocs.length,
          messageIds: updatedIds,
          status: "read",
          isRead: true,
        },
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async markMessagesAsDelivered(req: Request | any, res: Response) {
    try {
      const { messageId, messageIds } = req.body || {};
      const rawSenderId = req.body.senderId || req.body.userId;
      const rawReceiverId = req.body.receiverId || req.body.providerId;
      const currentUserId = (req as any).user?.id || (req as any).user?._id;

      let query: any = {};

      if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
        const validIds = messageIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        query = { _id: { $in: validIds }, status: "sent" };
      } else if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
        query = { _id: new mongoose.Types.ObjectId(messageId), status: "sent" };
      } else if (rawSenderId && rawReceiverId && mongoose.Types.ObjectId.isValid(rawSenderId) && mongoose.Types.ObjectId.isValid(rawReceiverId)) {
        const sObjId = new mongoose.Types.ObjectId(rawSenderId.toString());
        const rObjId = new mongoose.Types.ObjectId(rawReceiverId.toString());

        if (currentUserId && (currentUserId.toString() === rawSenderId.toString() || currentUserId.toString() === rawReceiverId.toString())) {
          const readerObjId = new mongoose.Types.ObjectId(currentUserId.toString());
          const otherObjId = readerObjId.equals(sObjId) ? rObjId : sObjId;
          query = {
            senderId: otherObjId,
            receiverId: readerObjId,
            status: "sent",
          };
        } else {
          query = {
            senderId: sObjId,
            receiverId: rObjId,
            status: "sent",
          };
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Please provide messageId, messageIds, or valid senderId and receiverId (or userId and providerId)",
        });
      }

      const undeliveredDocs = await Message.find(query).select("_id senderId receiverId").lean();

      if (undeliveredDocs.length > 0) {
        await Message.updateMany(query, { $set: { status: "delivered" } });

        const io = req.app.get("socketio");
        const getSocketUser = req.app.get("getSocketUser");

        if (io && getSocketUser) {
          const senderMap: { [key: string]: string[] } = {};
          undeliveredDocs.forEach((doc: any) => {
            const sId = doc.senderId.toString();
            if (!senderMap[sId]) senderMap[sId] = [];
            senderMap[sId].push(doc._id.toString());
          });

          for (const [sId, ids] of Object.entries(senderMap)) {
            const sUser = getSocketUser(sId);
            if (sUser) {
              const deliveryPayload = {
                senderId: sId,
                receiverId: rawReceiverId?.toString() || undeliveredDocs[0].receiverId?.toString(),
                messageIds: ids,
                messageId: ids[0],
                status: "delivered",
              };
              io.to(sUser.socketId).emit("messagesDelivered", deliveryPayload);
              io.to(sUser.socketId).emit("messages_delivered", deliveryPayload);
              io.to(sUser.socketId).emit("messageDelivered", deliveryPayload);
              io.to(sUser.socketId).emit("message_delivered", deliveryPayload);
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `${undeliveredDocs.length} messages marked as delivered.`,
        data: {
          modifiedCount: undeliveredDocs.length,
          messageIds: undeliveredDocs.map((d: any) => d._id.toString()),
          status: "delivered",
        },
      });
    } catch (error) {
      console.error("Error marking messages as delivered:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 🧭 Get all unique user-provider conversations
  static async getUniqueConversations(req: Request | any, res: Response) {
    try {
      const conversations: any = await Message.aggregate([
        {
          $addFields: {
            pairKey: {
              $cond: [
                { $lt: ["$senderId", "$receiverId"] },
                { $concat: [{ $toString: "$senderId" }, "_", { $toString: "$receiverId" }] },
                { $concat: [{ $toString: "$receiverId" }, "_", { $toString: "$senderId" }] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$pairKey", lastMessage: { $first: "$$ROOT" } } },
        { $lookup: { from: "users", localField: "lastMessage.senderId", foreignField: "_id", as: "senderUser" } },
        { $lookup: { from: "serviceproviders", localField: "lastMessage.senderId", foreignField: "_id", as: "senderProvider" } },
        { $lookup: { from: "users", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiverUser" } },
        { $lookup: { from: "serviceproviders", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiverProvider" } },
        {
          $addFields: {
            senderInfo: {
              $cond: [
                { $eq: ["$lastMessage.senderRole", "user"] },
                { $arrayElemAt: ["$senderUser", 0] },
                { $arrayElemAt: ["$senderProvider", 0] },
              ],
            },
            receiverInfo: {
              $cond: [
                { $eq: ["$lastMessage.senderRole", "user"] },
                { $arrayElemAt: ["$receiverProvider", 0] },
                { $arrayElemAt: ["$receiverUser", 0] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            messageId: "$lastMessage._id",
            text: "$lastMessage.text",
            createdAt: "$lastMessage.createdAt",
            status: "$lastMessage.status",
            isRead: "$lastMessage.isRead",
            sender: {
              _id: "$lastMessage.senderId",
              role: "$lastMessage.senderRole",
              name: "$senderInfo.name",
              activeImageType: "$senderInfo.activeImageType",
              activeImageUrl: {
                $cond: [
                  { $eq: ["$senderInfo.activeImageType", "avatar"] },
                  { $ifNull: ["$senderInfo.avatar", "$senderInfo.profilePicture"] },
                  { $ifNull: ["$senderInfo.profilePicture", "$senderInfo.avatar"] }
                ]
              },
            },
            receiver: {
              _id: "$lastMessage.receiverId",
              name: "$receiverInfo.name",
              activeImageType: "$receiverInfo.activeImageType",
              activeImageUrl: {
                $cond: [
                  { $eq: ["$receiverInfo.activeImageType", "avatar"] },
                  { $ifNull: ["$receiverInfo.avatar", "$receiverInfo.profilePicture"] },
                  { $ifNull: ["$receiverInfo.profilePicture", "$receiverInfo.avatar"] }
                ]
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      const currentUserId = req.user?._id?.toString() || null;
      const adminId = process.env.ADMIN_USER_ID;

      conversations.forEach((msg: any) => {
        const canRead =
          msg.sender._id.toString() === currentUserId ||
          msg.receiver._id.toString() === currentUserId ||
          currentUserId === adminId;

        msg.text = canRead
          ? safelyDecryptMessage(msg.text, msg.messageId)
          : "Encrypted message";

      });

      return res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching unique conversations:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 📚 Get all messages using common service
  static async getAllMessages(req: Request | any, res: Response) {
    try {
      const query = req.query || {};

      const additionalStages = [
        { $lookup: { from: "users", localField: "senderId", foreignField: "_id", as: "senderUser" } },
        { $lookup: { from: "serviceproviders", localField: "senderId", foreignField: "_id", as: "senderProvider" } },
        { $lookup: { from: "users", localField: "receiverId", foreignField: "_id", as: "receiverUser" } },
        { $lookup: { from: "serviceproviders", localField: "receiverId", foreignField: "_id", as: "receiverProvider" } },
        {
          $addFields: {
            senderInfo: {
              $cond: [
                { $eq: ["$senderRole", "user"] },
                { $arrayElemAt: ["$senderUser", 0] },
                { $arrayElemAt: ["$senderProvider", 0] },
              ],
            },
            receiverInfo: {
              $cond: [
                { $eq: ["$senderRole", "user"] },
                { $arrayElemAt: ["$receiverProvider", 0] },
                { $arrayElemAt: ["$receiverUser", 0] },
              ],
            },
          },
        },
        {
          $project: {
            text: 1,
            status: 1,
            isRead: 1,
            createdAt: 1,
            media: 1,
            senderRole: 1,
            "senderInfo.name": 1,
            "senderInfo.profilePicture": 1,
            "receiverInfo.name": 1,
            "receiverInfo.profilePicture": 1,
          },
        },
      ];

      const messages: any = await messageService.getAll(query, additionalStages);
      const currentUserId = req.user?._id?.toString() || null;
      const adminId = process.env.ADMIN_USER_ID;

      messages.result.forEach((msg: any) => {
        const canRead =
          msg.senderId?.toString() === currentUserId ||
          msg.receiverId?.toString() === currentUserId ||
          currentUserId === adminId;

        msg.text = canRead
          ? safelyDecryptMessage(msg.text, msg._id)
          : "Encrypted message";
      });

      return res.status(200).json({
        success: true,
        data: {
          result: messages.result,
          pagination: messages.pagination,
        },
      });
    } catch (error: any) {
      console.error("Error fetching all messages:", error);
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  // 🧾 Get all conversations for logged-in service provider
  static async getProviderConversations(req: Request | any, res: Response) {
    try {
      const user = (req as any).user;

      const providerId = user.id;

      // const providerId = req.user?._id;

      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }

      const conversations: any[] = await Message.aggregate([
        {
          // only messages where this provider is involved
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(providerId) },
              { receiverId: new mongoose.Types.ObjectId(providerId) },
            ],
          },
        },
        {
          $addFields: {
            pairKey: {
              $cond: [
                { $lt: ["$senderId", "$receiverId"] },
                {
                  $concat: [
                    { $toString: "$senderId" },
                    "_",
                    { $toString: "$receiverId" },
                  ],
                },
                {
                  $concat: [
                    { $toString: "$receiverId" },
                    "_",
                    { $toString: "$senderId" },
                  ],
                },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$pairKey",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$receiverId", new mongoose.Types.ObjectId(providerId)] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            }
          },
        },

        // lookups
        { $lookup: { from: "users", localField: "lastMessage.senderId", foreignField: "_id", as: "senderUser" } },
        { $lookup: { from: "serviceproviders", localField: "lastMessage.senderId", foreignField: "_id", as: "senderProvider" } },
        { $lookup: { from: "users", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiverUser" } },
        { $lookup: { from: "serviceproviders", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiverProvider" } },

        {
          $addFields: {
            senderInfo: {
              $cond: [
                { $eq: ["$lastMessage.senderRole", "user"] },
                { $arrayElemAt: ["$senderUser", 0] },
                { $arrayElemAt: ["$senderProvider", 0] },
              ],
            },
            receiverInfo: {
              $cond: [
                { $eq: ["$lastMessage.senderRole", "user"] },
                { $arrayElemAt: ["$receiverProvider", 0] },
                { $arrayElemAt: ["$receiverUser", 0] },
              ],
            },
          },
        },

        {
          $project: {
            _id: 0,
            messageId: "$lastMessage._id",
            text: "$lastMessage.text",
            createdAt: "$lastMessage.createdAt",
            status: "$lastMessage.status",
            isRead: "$lastMessage.isRead",
            unreadCount: 1,
            sender: {
              _id: "$lastMessage.senderId",
              role: "$lastMessage.senderRole",
              name: "$senderInfo.name",
              activeImageType: "$senderInfo.activeImageType",
              activeImageUrl: {
                $cond: [
                  { $eq: ["$senderInfo.activeImageType", "avatar"] },
                  { $ifNull: ["$senderInfo.avatar", "$senderInfo.profilePicture"] },
                  { $ifNull: ["$senderInfo.profilePicture", "$senderInfo.avatar"] }
                ]
              },
            },
            receiver: {
              _id: "$lastMessage.receiverId",
              name: "$receiverInfo.name",
              activeImageType: "$receiverInfo.activeImageType",
              activeImageUrl: {
                $cond: [
                  { $eq: ["$receiverInfo.activeImageType", "avatar"] },
                  { $ifNull: ["$receiverInfo.avatar", "$receiverInfo.profilePicture"] },
                  { $ifNull: ["$receiverInfo.profilePicture", "$receiverInfo.avatar"] }
                ]
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      const adminId = process.env.ADMIN_USER_ID;

      conversations.forEach((msg: any) => {
        const canRead =
          msg.sender._id.toString() === providerId.toString() ||
          msg.receiver._id.toString() === providerId.toString() ||
          providerId.toString() === adminId;

        msg.text = canRead
          ? safelyDecryptMessage(msg.text, msg.messageId)
          : "Encrypted message";
      });

      return res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      console.error("Error fetching provider conversations:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getUserConversations(req: Request | any, res: Response) {
    try {
      const user = req.user;
      const userId = user.id;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const conversations: any[] = await Message.aggregate([
        {
          // only messages where this user is involved
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { receiverId: new mongoose.Types.ObjectId(userId) },
            ],
          },
        },
        {
          $addFields: {
            pairKey: {
              $cond: [
                { $lt: ["$senderId", "$receiverId"] },
                {
                  $concat: [
                    { $toString: "$senderId" },
                    "_",
                    { $toString: "$receiverId" },
                  ],
                },
                {
                  $concat: [
                    { $toString: "$receiverId" },
                    "_",
                    { $toString: "$senderId" },
                  ],
                },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$pairKey",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] }, // 👈 user is receiver
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        // lookups
        { $lookup: { from: "users", localField: "lastMessage.senderId", foreignField: "_id", as: "senderUser" } },
        { $lookup: { from: "serviceproviders", localField: "lastMessage.senderId", foreignField: "_id", as: "senderProvider" } },
        { $lookup: { from: "users", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiverUser" } },
        { $lookup: { from: "serviceproviders", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiverProvider" } },

        {
          $addFields: {
            senderInfo: {
              $cond: [
                { $eq: ["$lastMessage.senderRole", "user"] },
                { $arrayElemAt: ["$senderUser", 0] },
                { $arrayElemAt: ["$senderProvider", 0] },
              ],
            },
            receiverInfo: {
              $cond: [
                { $eq: ["$lastMessage.senderRole", "user"] },
                { $arrayElemAt: ["$receiverProvider", 0] },
                { $arrayElemAt: ["$receiverUser", 0] },
              ],
            },
          },
        },

        {
          $project: {
            _id: 0,
            messageId: "$lastMessage._id",
            text: "$lastMessage.text",
            createdAt: "$lastMessage.createdAt",
            status: "$lastMessage.status",
            isRead: "$lastMessage.isRead",
            unreadCount: 1,
            sender: {
              _id: "$lastMessage.senderId",
              role: "$lastMessage.senderRole",
              name: "$senderInfo.name",
              activeImageType: "$senderInfo.activeImageType",
              activeImageUrl: {
                $cond: [
                  { $eq: ["$senderInfo.activeImageType", "avatar"] },
                  { $ifNull: ["$senderInfo.avatar", "$senderInfo.profilePicture"] },
                  { $ifNull: ["$senderInfo.profilePicture", "$senderInfo.avatar"] }
                ]
              },
            },
            receiver: {
              _id: "$lastMessage.receiverId",
              name: "$receiverInfo.name",
              activeImageType: "$receiverInfo.activeImageType",
              activeImageUrl: {
                $cond: [
                  { $eq: ["$receiverInfo.activeImageType", "avatar"] },
                  { $ifNull: ["$receiverInfo.avatar", "$receiverInfo.profilePicture"] },
                  { $ifNull: ["$receiverInfo.profilePicture", "$receiverInfo.avatar"] }
                ]
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      // Integrate blockedByProvider and isDearOne
      let blockedByProvider = false;
      let isDearOne = false;
      // Find the provider in the conversation
      let providerId = null;
      if (conversations.length > 0) {
        // Try to find providerId from sender or receiver
        for (const msg of conversations) {
          if (msg.sender.role === "provider") {
            providerId = msg.sender._id;
            break;
          }
          if (msg.receiver && msg.receiver.role === "provider") {
            providerId = msg.receiver._id;
            break;
          }
        }
      }
      if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
        const Provider = mongoose.model("ServiceProvider");
        const providerDocRaw = await Provider.findById(providerId).select("blockedUsers connectedUsers").lean();
        const providerDoc = Array.isArray(providerDocRaw) ? providerDocRaw[0] : providerDocRaw;
        if (providerDoc && providerDoc.blockedUsers && providerDoc.connectedUsers) {
          blockedByProvider = Array.isArray(providerDoc.blockedUsers) && providerDoc.blockedUsers.some((id) => id.toString() === userId);
          isDearOne = Array.isArray(providerDoc.connectedUsers) && providerDoc.connectedUsers.some((id) => id.toString() === userId);
        }
      }

      const adminId = process.env.ADMIN_USER_ID;

      conversations.forEach((msg: any) => {
        const canRead =
          msg.sender._id.toString() === userId.toString() ||
          msg.receiver._id.toString() === userId.toString() ||
          userId.toString() === adminId;

        msg.text = canRead
          ? safelyDecryptMessage(msg.text, msg.messageId)
          : "Encrypted message";
      });

      return res.status(200).json({
        success: true,
        data: conversations,
        blockedByProvider,
        isDearOne
      });
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

}
