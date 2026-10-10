import { Notification, UserType } from "../modals/notification.model";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { sendPushNotification } from "./pushNotification.service";
import { User } from "../modals/user.model";
import ServiceProvider from "../modals/serviceProvider.model";

interface CreateNotificationOptions {
  type: string;
  title: string;
  message: string;
  notificationKey?: string;
  recipientId: string;
  recipientType: UserType;
  senderId?: string;
  senderType?: UserType;
  metadata?: Record<string, any>;
}

const toFcmData = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
};

const buildPushData = (
  notification: any,
  options: CreateNotificationOptions,
): Record<string, string> => {
  const data: Record<string, string> = {
    type: options.type,
    notificationId: notification._id.toString(),
  };

  const metadata = options.metadata || {};

  const callPayload: Record<string, any> = {
    sessionId: metadata.sessionId,
    call_id: metadata.sessionId,
    channel: metadata.channel,
    channelName: metadata.channelName || metadata.channel,
    callerId: metadata.callerId || options.senderId,
    caller_id: metadata.caller_id || metadata.callerId || options.senderId,
    callerName: metadata.callerName,
    caller_name: metadata.caller_name || metadata.callerName,
    callerImageUrl: metadata.callerImageUrl,
    caller_image_url: metadata.caller_image_url || metadata.callerImageUrl,
    isNewUser: metadata.isNewUser,
    reason: metadata.reason,
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (!(key in callPayload)) {
      callPayload[key] = value;
    }
  }

  for (const [key, value] of Object.entries(callPayload)) {
    const normalized = toFcmData(value);
    if (normalized !== undefined) {
      data[key] = normalized;
    }
  }

  return data;
};

const buildNotificationKey = (options: CreateNotificationOptions): string | undefined => {
  if (options.notificationKey) return options.notificationKey;

  const sessionId = options.metadata?.sessionId;
  if (
    options.type === "call_received" &&
    sessionId &&
    options.recipientId &&
    options.senderId
  ) {
    return `call_received:${options.recipientId}:${options.senderId}:${sessionId}`;
  }

  if (
    options.type === "call_ended" &&
    sessionId &&
    options.recipientId &&
    options.senderId
  ) {
    return `call_ended:${options.recipientId}:${options.senderId}:${sessionId}`;
  }

  return undefined;
};

interface EmitNotificationOptions {
  io: Server;
  getSocketUser: (userId: string) => { userId: string; socketId: string } | undefined;
  notification: any;
  recipientId: string;
}

const UNREGISTERED_FCM_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

const isUnregisteredFcmError = (error: any): boolean => {
  const code = error?.code || error?.errorInfo?.code;
  const message = String(error?.message || "");
  return (
    UNREGISTERED_FCM_ERROR_CODES.has(code) ||
    message.includes("registration-token-not-registered") ||
    message.includes("Requested entity was not found.")
  );
};

const clearStoredFcmToken = async (recipientType: UserType, recipientId: string) => {
  try {
    if (recipientType === "user") {
      await User.findByIdAndUpdate(recipientId, { $unset: { fcmToken: 1 } });
      return;
    }

    if (recipientType === "provider") {
      await ServiceProvider.findByIdAndUpdate(recipientId, { $unset: { fcmToken: 1 } });
    }
  } catch (err) {
    console.warn("⚠️ Failed to clear stale FCM token:", err);
  }
};

/**
 * Create a notification in the database
 */
export async function createNotification(
  options: CreateNotificationOptions
): Promise<any> {
  try {
    const notificationKey = buildNotificationKey(options);
    const notification = await Notification.create({
      type: options.type,
      title: options.title,
      message: options.message,
      notificationKey,
      recipientId: new mongoose.Types.ObjectId(options.recipientId),
      recipientType: options.recipientType,
      senderId: options.senderId
        ? new mongoose.Types.ObjectId(options.senderId)
        : undefined,
      senderType: options.senderType,
      metadata: options.metadata || {},
      status: "unread",
    });

    return notification;
  } catch (error: any) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Emit notification via socket.io to the recipient if they're online
 */
export function emitNotification(
  options: EmitNotificationOptions
): void {
  try {
    const { io, getSocketUser, notification, recipientId } = options;

    const recipientSocket = getSocketUser(recipientId);
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("new_notification", notification);
      console.log("📬 [NOTIFICATION] Emitted to recipient:", {
        recipientId,
        socketId: recipientSocket.socketId,
        notificationId: notification._id,
      });
    } else {
      console.log("⚠️ [NOTIFICATION] Recipient not online:", recipientId);
    }
  } catch (error: any) {
    console.error("Error emitting notification:", error);
  }
}

/**
 * Create and emit notification in one call
 */
export async function createAndEmitNotification(
  options: CreateNotificationOptions & {
    io?: Server;
    getSocketUser?: (userId: string) => { userId: string; socketId: string } | undefined;
  }
): Promise<any> {
  try {
    console.log("\n================ NOTIFICATION FLOW START ================\n");
    const safeOptions = {
      ...options,
      io: options.io ? "SOCKET_IO_INSTANCE" : null,
      getSocketUser: options.getSocketUser ? "FUNCTION" : null,
    };

    console.log("📥 Incoming options:", safeOptions);
    // ✅ STEP 1: Silent update check
    const SILENT_FIELDS = ["fcmToken", "lastSeen", "socketId"];
    const updatedFields = options.metadata?.updatedFields || [];

    console.log("🔍 Updated fields:", updatedFields);

    const isSilentUpdate =
      options.type === "profile_updated" &&
      updatedFields.length > 0 &&
      updatedFields.every((field: string) => SILENT_FIELDS.includes(field));

    if (isSilentUpdate) {
      console.log("⛔ Skipping notification (silent update):", updatedFields);
      console.log("\n================ END =================\n");
      return null;
    }

    const notificationKey = buildNotificationKey(options);

    if (notificationKey) {
      const existing = await Notification.findOne({ notificationKey });
      if (existing) {
        console.log("⏭️ Skipping duplicate notification:", {
          notificationKey,
          notificationId: existing._id,
        });
        console.log("\n================ END =================\n");
        return existing;
      }
    }

    // ✅ STEP 2: Create notification
    console.log("📝 Creating notification in DB...");
    let notification;
    try {
      notification = await createNotification(options);
    } catch (createErr: any) {
      if (notificationKey && createErr?.code === 11000) {
        const existing = await Notification.findOne({ notificationKey });
        if (existing) {
          console.log("⏭️ Duplicate notification detected after write race:", {
            notificationKey,
            notificationId: existing._id,
          });
          console.log("\n================ END =================\n");
          return existing;
        }
      }
      throw createErr;
    }
    console.log("✅ Notification created:", notification?._id);

    // ✅ STEP 2.5: Send PUSH (FCM)
    try {
      let fcmToken: string | null = null;

      console.log("🔍 Fetching FCM token for:", options.recipientType, options.recipientId);

      if (options.recipientType === "user") {
        const user = await User.findById(options.recipientId).select("fcmToken");
        console.log("👤 User fetched:", user?._id);
        console.log("📱 User FCM token:", user?.fcmToken);

        fcmToken = user?.fcmToken || null;
      } else if (options.recipientType === "provider") {
        const provider = await (await import("../modals/serviceProvider.model")).default
          .findById(options.recipientId)
          .select("fcmToken");

        console.log("🧑‍🔧 Provider fetched:", provider?._id);
        console.log("📱 Provider FCM token:", provider?.fcmToken);

        fcmToken = provider?.fcmToken || null;
      }

      if (fcmToken) {
        console.log("🚀 Sending push notification...");
        console.log("➡️ Token:", fcmToken);
        console.log("➡️ Title:", options.title);
        console.log("➡️ Message:", options.message);

        try {
          const pushResponse = await sendPushNotification({
            token: fcmToken,
            title: options.title,
            body: options.message,
            data: buildPushData(notification, options),
          });

          console.log("✅ PUSH SENT SUCCESSFULLY 🎉");
          console.log("📦 FCM Response:", pushResponse);
        } catch (pushError: any) {
          if (isUnregisteredFcmError(pushError)) {
            console.warn("⚠️ Stale FCM token detected, clearing stored token:", {
              recipientType: options.recipientType,
              recipientId: options.recipientId,
            });
            await clearStoredFcmToken(options.recipientType, options.recipientId);
          } else {
            throw pushError;
          }
        }
      } else {
        console.log("⚠️ No FCM token found → Push NOT sent");
      }
    } catch (err) {
      console.error("❌ FCM error:", err);
    }

    // ✅ STEP 3: Socket Emit
    if (options.io && options.getSocketUser) {
      console.log("🔌 Checking socket connection...");

      const socketUser = options.getSocketUser(options.recipientId);

      if (socketUser) {
        console.log("✅ User is ONLINE");
        console.log("🧠 Socket ID:", socketUser.socketId);

        emitNotification({
          io: options.io,
          getSocketUser: options.getSocketUser,
          notification: notification.toObject ? notification.toObject() : notification,
          recipientId: options.recipientId,
        });

        console.log("📡 Notification emitted via socket");
      } else {
        console.log("⚠️ User is OFFLINE → Socket emit skipped");
      }
    } else {
      console.log("⚠️ Socket not configured");
    }

    console.log("\n================ NOTIFICATION FLOW END ================\n");

    return notification;
  } catch (error: any) {
    console.error("💥 FULL ERROR in notification flow:", error);
    throw error;
  }
}
