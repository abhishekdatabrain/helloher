import cron from "node-cron";
import { PaidProfile } from "../modals/paidProfile.model";
import { User } from "../modals/user.model";
import { logger } from "../config/logger";

/**
 * Daily job that clears the isPaidProfilePicture flag for users whose
 * paid profile subscriptions have expired.
 */
export const startPaidProfileScheduler = (): void => {
    try {
        cron.schedule("0 0 * * *", async () => {
            try {
                logger.info("🔄 Running paid profile expiration job...");

                const now = new Date();
                // find all approved subscriptions that have ended
                const expired = await PaidProfile.find({
                    status: "approved",
                    endDate: { $lte: now },
                }).select("userId");

                if (expired.length > 0) {
                    const userIds = expired.map((p) => p.userId);
                    await User.updateMany(
                        { _id: { $in: userIds }, isPaidProfilePicture: true },
                        { $set: { isPaidProfilePicture: false } }
                    );
                    logger.info(
                        `✅ Cleared paid-profile flag for ${userIds.length} users`
                    );
                } else {
                    logger.info("✅ No expired paid profiles found");
                }
            } catch (err: any) {
                logger.error("Error in paid profile scheduler:", err);
            }
        });
        logger.info("✅ Paid profile scheduler started (daily at 00:00)");
    } catch (err: any) {
        logger.error("Failed to start paid profile scheduler:", err);
        throw err;
    }
};