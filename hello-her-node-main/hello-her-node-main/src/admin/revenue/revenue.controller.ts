import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import Admin from "../../modals/admin.model";
import { Wallet } from "../../modals/wallet.model";

// 📊 Helper: Percentage Change
const calcPercentage = (current: number, prev: number): number => {
  if (prev === 0 && current === 0) return 0;
  if (prev === 0) return 100;
  return ((current - prev) / prev) * 100;
};

// 📅 Helper: 12-month zero array
const initMonths = () => new Array(12).fill(0);

export class RevenueController {
  static async getYearlyRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // 🧩 Step 1: Fetch Admin and Wallets
      const admin = await Admin.findOne();
      if (!admin) return res.status(404).json(new ApiResponse(404, null, "Admin record not found"));

      const wallets = await Wallet.find({}, "balance createdAt");
      const totalWalletBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0) / 100; // paise → ₹

      const totalRechargeAmountRecived = admin.totalRechargeAmountRecived || 0;

      // 🧮 Step 2: Compute Net Revenue
      const totalRevenue = totalRechargeAmountRecived - totalWalletBalance;
      const totalRevenueFixed = totalRevenue > 0 ? totalRevenue : 0;

      // 🧮 Step 3: Breakdown into categories
      const totalEnrollmentCurrent = totalRevenueFixed * 0.6;
      const totalEnrolledPlanCurrent = totalRevenueFixed * 0.35;
      const totalPersonalCurrent = totalRevenueFixed * 0.05;

      const totalEnrollmentPrevious = 0;
      const totalEnrolledPlanPrevious = 0;
      const totalPersonalPrevious = 0;

      const totalCurrent = totalEnrollmentCurrent + totalEnrolledPlanCurrent + totalPersonalCurrent;
      const totalPrevious = totalEnrollmentPrevious + totalEnrolledPlanPrevious + totalPersonalPrevious;

      // 📈 Step 4: Monthly Data
      const monthlyData: any = {
        [previousYear]: { combined: initMonths(), enrollment: initMonths(), enrolledPlan: initMonths(), personalAssistance: initMonths() },
        [currentYear]: { combined: initMonths(), enrollment: initMonths(), enrolledPlan: initMonths(), personalAssistance: initMonths() },
      };

      // Distribute revenue for the months based on wallet createdAt
      // wallets.forEach(w => {
      //   const created = new Date(w.createdAt);
      //   if (created.getFullYear() === currentYear) {
      //     const m = created.getMonth();
      //     // proportional split
      //     monthlyData[currentYear].enrollment[m] += totalEnrollmentCurrent / wallets.length;
      //     monthlyData[currentYear].enrolledPlan[m] += totalEnrolledPlanCurrent / wallets.length;
      //     monthlyData[currentYear].personalAssistance[m] += totalPersonalCurrent / wallets.length;
      //     monthlyData[currentYear].combined[m] += totalEnrollmentCurrent / wallets.length + totalEnrolledPlanCurrent / wallets.length + totalPersonalCurrent / wallets.length;
      //   }
      // });
      wallets.forEach(w => {
        if (!w.createdAt) return; // skip if undefined
        const created = new Date(w.createdAt);
        if (created.getFullYear() === currentYear) {
          const m = created.getMonth();
          monthlyData[currentYear].enrollment[m] += totalEnrollmentCurrent / wallets.length;
          monthlyData[currentYear].enrolledPlan[m] += totalEnrolledPlanCurrent / wallets.length;
          monthlyData[currentYear].personalAssistance[m] += totalPersonalCurrent / wallets.length;
          monthlyData[currentYear].combined[m] +=
            totalEnrollmentCurrent / wallets.length +
            totalEnrolledPlanCurrent / wallets.length +
            totalPersonalCurrent / wallets.length;
        }
      });
      

      // 📊 Step 5: Percentages
      const percentageChange = calcPercentage(totalCurrent, totalPrevious);
      const personalPercentageChange = calcPercentage(totalPersonalCurrent, totalPersonalPrevious);
      const enrollmentPercentageChange = calcPercentage(totalEnrollmentCurrent, totalEnrollmentPrevious);
      const enrolledPlanPercentageChange = calcPercentage(totalEnrolledPlanCurrent, totalEnrolledPlanPrevious);

      // 📦 Step 6: Year Data
      const yearData = {
        [currentYear]: { revenue: Math.round(totalCurrent), percentage: Math.round((totalCurrent / (totalCurrent + totalPrevious || 1)) * 100) },
        [previousYear]: { revenue: Math.round(totalPrevious), percentage: Math.round((totalPrevious / (totalCurrent + totalPrevious || 1)) * 100) },
      };

      const responseData = {
        currentYear,
        previousYear,
        totalRechargeAmountRecived,
        totalWalletBalance,
        totalPersonalCurrent: Math.round(totalPersonalCurrent),
        totalEnrollmentCurrent: Math.round(totalEnrollmentCurrent),
        totalEnrolledPlanCurrent: Math.round(totalEnrolledPlanCurrent),
        totalCurrent: Math.round(totalCurrent),
        totalPrevious,
        percentageChange,
        personalPercentageChange,
        enrollmentPercentageChange,
        enrolledPlanPercentageChange,
        monthlyData,
        currentYearRevenue: Math.round(totalCurrent),
        lastYearRevenue: Math.round(totalPrevious),
        yearData,
      };

      return res.status(200).json(new ApiResponse(200, responseData, "Yearly revenue data fetched successfully"));
    } catch (error) {
      next(error);
    }
  }
}
