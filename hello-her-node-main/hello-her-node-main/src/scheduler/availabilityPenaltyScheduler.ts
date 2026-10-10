import cron from "node-cron";
import { logger } from "../config/logger";
import { applyAvailabilityPenalties } from "../services/availabilityPenalty.service";

/**
 * Start the availability penalty scheduler
 * Runs daily at 00:00 (midnight) to evaluate and apply penalties to providers
 */
export const startAvailabilityPenaltyScheduler = (io: any, getSocketUser: any): void => {
    try {
        // Schedule task: "0 0 * * *" = every day at 00:00 (midnight)
        const task = cron.schedule("0 0 * * *", async () => {
            try {
                logger.info("🔄 Running daily availability penalty evaluation...");

                await applyAvailabilityPenalties({
                    io,
                    getSocketUser,
                });

                logger.info("✅ Daily availability penalty evaluation completed successfully");
            } catch (error: any) {
                logger.error(`❌ Error during availability penalty evaluation: ${error.message}`);
                console.error("Full error:", error);
            }
        });

        logger.info("✅ Availability penalty scheduler started (runs daily at 00:00)");
    } catch (error: any) {
        logger.error(`Failed to start availability penalty scheduler: ${error.message}`);
        throw error;
    }
};
