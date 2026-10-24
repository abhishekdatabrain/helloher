import cron from "node-cron";
import Message from "../modals/message.model";
import { logger } from "../config/logger";
import { deleteFromS3 } from "../config/s3Uploader";
import { config } from "../config/config";

/**
 * Extract S3 key from full public URL
 */
export const extractS3KeyFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    let pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
    if (config.s3.bucket && pathname.startsWith(`${config.s3.bucket}/`)) {
      pathname = pathname.slice(config.s3.bucket.length + 1);
    }
    return pathname;
  } catch {
    if (url && typeof url === "string" && !url.startsWith("http")) {
      return url.replace(/^\/+/, "");
    }
    return null;
  }
};

/**
 * Clean up images sent by listeners (providers) that were seen by users 12+ hours ago.
 */
export const cleanExpiredProviderChatImages = async (
  io?: any,
  getSocketUser?: any
): Promise<number> => {
  try {
   // Production (12 hours): const expiryTimeAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
   // 🧪 Testing: 10 minutes (10 * 60 * 1000)
   const expiryTimeAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find messages:
    // 1. Sent by provider (listener)
    // 2. Read/seen by user at least 10 minutes ago (fallback to updatedAt if readAt was null)
    // 3. Contains at least one image in media
    const expiredMessages = await Message.find({
      senderRole: "provider",
      status: "read",
      isRead: true,
      $or: [
        { readAt: { $exists: true, $ne: null, $lte: expiryTimeAgo } },
        { readAt: null, updatedAt: { $lte: expiryTimeAgo } },
      ],
      "media.type": "image",
    });

    if (expiredMessages.length === 0) {
      return 0;
    }

    logger.info(
      `🧹 Found ${expiredMessages.length} expired listener chat image message(s) to clean up.`
    );

    let cleanedCount = 0;

    for (const msg of expiredMessages) {
      try {
        const mediaList = msg.media || [];
        const imageMedia = mediaList.filter((m) => m.type === "image");
        const nonImageMedia = mediaList.filter((m) => m.type !== "image");

        // Delete each image file from S3
        for (const img of imageMedia) {
          if (img.url) {
            const s3Key = extractS3KeyFromUrl(img.url);
            if (s3Key) {
              try {
                await deleteFromS3(s3Key);
                logger.info(`🗑️ Deleted expired chat image from S3: ${s3Key}`);
              } catch (s3Err: any) {
                logger.warn(`Failed to delete S3 file ${s3Key}: ${s3Err.message}`);
              }
            }
          }
        }

        const senderIdStr = msg.senderId.toString();
        const receiverIdStr = msg.receiverId.toString();

        // If message has no other media and no text, delete the whole message document
        if ((!msg.text || msg.text.trim() === "") && nonImageMedia.length === 0) {
          await Message.findByIdAndDelete(msg._id);

          // Real-time socket notification if active
          if (io && getSocketUser) {
            const senderSocket = getSocketUser(senderIdStr);
            const receiverSocket = getSocketUser(receiverIdStr);
            const payload = {
              messageId: msg._id.toString(),
              senderId: senderIdStr,
              receiverId: receiverIdStr,
              action: "deleted",
            };
            if (senderSocket) io.to(senderSocket.socketId).emit("messageDeleted", payload);
            if (receiverSocket) io.to(receiverSocket.socketId).emit("messageDeleted", payload);
          }
        } else {
          // If message still has text or other media, keep it but remove the image(s)
          msg.media = nonImageMedia;
          await msg.save();

          if (io && getSocketUser) {
            const senderSocket = getSocketUser(senderIdStr);
            const receiverSocket = getSocketUser(receiverIdStr);
            const payload = {
              messageId: msg._id.toString(),
              senderId: senderIdStr,
              receiverId: receiverIdStr,
              media: nonImageMedia,
              action: "imagesExpired",
            };
            if (senderSocket) io.to(senderSocket.socketId).emit("messageMediaUpdated", payload);
            if (receiverSocket) io.to(receiverSocket.socketId).emit("messageMediaUpdated", payload);
          }
        }

        cleanedCount++;
      } catch (itemErr: any) {
        logger.error(`Error processing expired message ${msg._id}:`, itemErr.message);
      }
    }

    logger.info(`✅ Successfully cleaned up ${cleanedCount} expired listener chat image message(s).`);
    return cleanedCount;
  } catch (err: any) {
    logger.error("Error in cleanExpiredProviderChatImages:", err);
    return 0;
  }
};

/**
 * Start recurring background scheduler to delete listener images 12 hours after being seen by user.
 * Runs every 10 minutes.
 */
export const startChatImageExpiryScheduler = (
  io?: any,
  getSocketUser?: any
): void => {
  try {
    // 🧪 Testing: Runs every 1 minute so expired messages (10 mins) are cleaned up immediately
    // Production: cron.schedule("*/10 * * * *", ...)
    cron.schedule("* * * * *", async () => {
      await cleanExpiredProviderChatImages(io, getSocketUser);
    });

    // Also run once 10 seconds after server startup
    setTimeout(() => {
      cleanExpiredProviderChatImages(io, getSocketUser).catch((e) =>
        logger.error("Initial chat image expiry cleanup error:", e)
      );
    }, 10000);

    logger.info("✅ Chat image expiry scheduler started (Testing mode: 10 mins expiry, runs every minute)");
  } catch (err: any) {
    logger.error("Failed to start chat image expiry scheduler:", err);
  }
};
