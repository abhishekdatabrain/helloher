import cron from "node-cron";
import Admin from "../../modals/admin.model";

/**
 * This job runs every day at midnight (00:00) and moves wallet to earnings
 */
export const walletResetJob = () => {
  // Cron: "0 0 * * *" -> every day at 00:00 server time
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running daily wallet reset job...");

      const admins = await Admin.find({});

      for (const admin of admins) {
        // Add wallet to total and monthly earning
        admin.totalEarning = (admin.totalEarning || 0) + (admin.wallet || 0);
        admin.monthlyEarning = (admin.monthlyEarning || 0) + (admin.wallet || 0);
        admin.wallet = 0; // reset wallet

        await admin.save();
      }

      console.log("Wallet reset completed for all admins.");
    } catch (err) {
      console.error("Error in wallet reset job:", err);
    }
  });
};
