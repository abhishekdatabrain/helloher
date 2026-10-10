import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { User } from "../../modals/user.model";
import ServiceProvider from "../../modals/serviceProvider.model";
import { Withdrawal } from "../../modals/withdraw.model";
import { CallSession } from "../../modals/callSession.model";
import Admin from "../../modals/admin.model";
import { Wallet } from "../../modals/wallet.model"
import { Chat } from "../../modals/chat.model";
import Issue from "../../modals/issue.model";
import Query from "../../modals/query.model";
import mongoose from "mongoose";
// 🧮 Helper to calculate % change
const calcPercentageChange = (current: number, previous: number): number => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};


// // 🧮 Helper to generate dummy chart data
// const generateChartData = (value: number): number[] => {
//   const chart = new Array(9).fill(0);
//   chart[3] = value;
//   return chart;
// };
// 🧮 Helper to generate chart data dynamically based on date range
const generateChartData = (value: number, start: Date, end: Date): number[] => {
  const dayDiff = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Create an array of 'dayDiff' length filled with 0s
  const chart = new Array(dayDiff).fill(0);

  // For demonstration, you can place value at last index or distribute later
  chart[chart.length - 1] = value;

  return chart;
};


const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));


const generateLabels = (start: Date, end: Date, range: "day" | "week" | "month") => {
  const labels: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    if (range === "day") {
      labels.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    } else if (range === "week") {
      labels.push(`${current.getFullYear()}-W${getWeekNumber(current)}`);
      current.setDate(current.getDate() + 7);
    } else if (range === "month") {
      labels.push(`${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, "0")}`);
      current.setMonth(current.getMonth() + 1);
    }
  }
  return labels;
};

const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};




export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Get startDate and endDate from query params
      const { startDate, endDate } = req.query;

      const now = new Date();
      const start = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : now;

      // Previous period for % change (same length as selected range)
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);

      // ----- TOTAL USERS -----
      const totalUsers = await User.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });
      const prevUsers = await User.countDocuments({ status: "active", createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- TOTAL PROVIDERS -----
      const totalProviders = await ServiceProvider.countDocuments({ isActive: true, createdAt: { $gte: start, $lte: end } });
      const prevProviders = await ServiceProvider.countDocuments({ isActive: true, createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- EARNINGS -----
      // const earnings = await Admin.aggregate([
      //   { $match: { updatedAt: { $gte: start, $lte: end } } },
      //   { $group: { _id: null, totalWallet: { $sum: "$wallet" }, totalMonthlyEarning: { $sum: "$monthlyEarning" }, totalEarning: { $sum: "$totalEarning" } } },
      // ]);

      // const prevEarnings = await Admin.aggregate([
      //   { $match: { updatedAt: { $gte: prevStart, $lte: prevEnd } } },
      //   { $group: { _id: null, totalWallet: { $sum: "$wallet" }, totalMonthlyEarning: { $sum: "$monthlyEarning" }, totalEarning: { $sum: "$totalEarning" } } },
      // ]);

      // const wallet = earnings[0]?.totalWallet || 0;
      // const monthlyEarning = earnings[0]?.totalMonthlyEarning || 0;
      // const totalEarning = earnings[0]?.totalEarning || 0;

      // const prevWallet = prevEarnings[0]?.totalWallet || 0;
      // const prevMonthlyEarning = prevEarnings[0]?.totalMonthlyEarning || 0;
      // const prevTotalEarning = prevEarnings[0]?.totalEarning || 0;

      // ----- ACTIVE SESSIONS -----
      const activeSessions = await CallSession.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });
      const prevActiveSessions = await CallSession.countDocuments({ status: "active", createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- PENDING WITHDRAWALS -----
      const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending", createdAt: { $gte: start, $lte: end } });
      const prevPendingWithdrawals = await Withdrawal.countDocuments({ status: "pending", createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- TOTAL WITHDRAW AMOUNTS -----
      const totalWithdrawCurrentResult = await Withdrawal.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalWithdrawPreviousResult = await Withdrawal.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalWithdrawCurrent = totalWithdrawCurrentResult[0]?.totalAmount || 0;
      const totalWithdrawPrevious = totalWithdrawPreviousResult[0]?.totalAmount || 0;

      // ----- TOTAL PENDING WITHDRAWALS AMOUNT -----
      const totalPendingCurrentResult = await Withdrawal.aggregate([
        { $match: { status: "pending", createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalPendingPreviousResult = await Withdrawal.aggregate([
        { $match: { status: "pending", createdAt: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalPendingCurrent = totalPendingCurrentResult[0]?.totalAmount || 0;
      const totalPendingPrevious = totalPendingPreviousResult[0]?.totalAmount || 0;

      // // ----- 🆕 TOTAL WALLET BALANCE (sum of all wallets) -----
      // const totalWalletBalanceResult = await Wallet.aggregate([
      //   { $group: { _id: null, totalBalance: { $sum: "$balance" } } },
      // ]);
      // const totalWalletBalance = totalWalletBalanceResult[0]?.totalBalance || 0;

      // // ----- 🆕 TOTAL RECHARGE AMOUNT RECEIVED (from Admin collection) -----
      // const admin = await Admin.findOne();
      // const totalRechargeAmountRecived = admin?.totalRechargeAmountRecived || 0;

      // ----- 🆕 TOTAL WALLET BALANCE (sum of all wallets in date range) -----
      const totalWalletBalanceResult = await Wallet.aggregate([
        {
          $match: {
            updatedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$balance" },
          },
        },
      ]);
      const totalWalletBalance = totalWalletBalanceResult[0]?.totalBalance || 0;

      // ----- 🆕 TOTAL RECHARGE AMOUNT RECEIVED -----

      const totalRechargeResult = await Admin.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId("6879f604cfe8425a6b907423"),
            updatedAt: { $gte: start, $lte: end }, // date filter
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalRechargeAmountRecived" },
          },
        },
      ]);

      const totalRechargeAmountRecived = totalRechargeResult[0]?.totalAmount || 0;

      // const rechargeResult = await Admin.aggregate([
      //   {
      //     $match: {
      //       createdAt: { $gte: start, $lte: end },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       totalAmount: { $sum: "$totalRechargeAmountRecived" },
      //     },
      //   },
      // ]);
      // const totalRechargeAmountRecived = rechargeResult[0]?.totalAmount || 0;


      // ----- STRUCTURED DASHBOARD RESPONSE -----
      const dashboardData = {
        users: {
          totalCurrent: totalUsers,
          totalPrevious: prevUsers,
          percentageChange: calcPercentageChange(totalUsers, prevUsers),
          chartData: generateChartData(totalUsers, start, end)
        },
        providers: {
          totalCurrent: totalProviders,
          totalPrevious: prevProviders,
          percentageChange: calcPercentageChange(totalProviders, prevProviders),
          chartData: generateChartData(totalProviders, start, end)
        },
        // wallet: {
        //   totalCurrent: wallet,
        //   totalPrevious: prevWallet,
        //   percentageChange: calcPercentageChange(wallet, prevWallet),
        //   chartData: generateChartData(wallet)
        // },

        activeSessions: {
          totalCurrent: activeSessions,
          totalPrevious: prevActiveSessions, percentageChange: calcPercentageChange(activeSessions, prevActiveSessions),
          // chartData: generateChartData(activeSessions)
          chartData: generateChartData(activeSessions, start, end)

        },
        // it is not of people
        pendingWithdrawals: {
          totalCurrent: pendingWithdrawals,
          totalPrevious: prevPendingWithdrawals, percentageChange: calcPercentageChange(pendingWithdrawals, prevPendingWithdrawals),
          // chartData: generateChartData(pendingWithdrawals)
          chartData: generateChartData(pendingWithdrawals, start, end)

        },
        // monthlyEarning: { totalCurrent: monthlyEarning, totalPrevious: prevMonthlyEarning, percentageChange: calcPercentageChange(monthlyEarning, prevMonthlyEarning), chartData: generateChartData(monthlyEarning) },
        // totalEarning: { totalCurrent: totalEarning, totalPrevious: prevTotalEarning, percentageChange: calcPercentageChange(totalEarning, prevTotalEarning), chartData: generateChartData(totalEarning) },


        withdrawals: {
          totalCurrent: totalWithdrawCurrent / 100,
          totalPrevious: totalWithdrawPrevious / 100,
          percentageChange: calcPercentageChange(totalWithdrawCurrent, totalWithdrawPrevious),
          //  chartData: generateChartData(totalWithdrawCurrent / 100)
          chartData: generateChartData(totalWithdrawCurrent / 100, start, end)

        },
        totalPendingWithdrawalsAmount: {
          totalCurrent: Number((totalPendingCurrent / 100).toFixed(2)),
          totalPrevious: Number((totalPendingPrevious / 100).toFixed(2)),
          percentageChange: calcPercentageChange(totalPendingCurrent, totalPendingPrevious),
          //  chartData: generateChartData(totalPendingCurrent / 100)
          chartData: generateChartData(Number((totalPendingCurrent / 100).toFixed(2)), start, end)

        },
        // 🆕 ADDED THESE TWO NEW FIELDS
        totalWalletBalance: {
          totalCurrent: Number((totalWalletBalance / 100).toFixed(2)),
          totalPrevious: 0,
          percentageChange: 0,
          chartData: generateChartData(Number((totalWalletBalance / 100).toFixed(2)), start, end)
        },
        totalRechargeAmountRecived: {
          totalCurrent: Number((totalRechargeAmountRecived).toFixed(2)),
          totalPrevious: 0,
          percentageChange: 0,
          chartData: generateChartData(Number(totalRechargeAmountRecived.toFixed(2)), start, end)
        },

      };

      res.status(200).json(new ApiResponse(200, dashboardData, "Dashboard data fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // static async getDashboardV2(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     // ✅ Get startDate and endDate from query params
  //     const { startDate, endDate } = req.query;

  //     const now = new Date();
  //     const start = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
  //     const end = endDate ? new Date(endDate as string) : now;

  //     // Previous period for % change (same length as selected range)
  //     const prevStart = new Date(start);
  //     prevStart.setDate(prevStart.getDate() - (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  //     const prevEnd = new Date(start);
  //     prevEnd.setDate(prevEnd.getDate() - 1);

  //     // ----- TOTAL USERS -----
  //     const totalUsers = await User.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });
  //     const prevUsers = await User.countDocuments({ status: "active", createdAt: { $gte: prevStart, $lte: prevEnd } });

  //     // ----- TOTAL PROVIDERS -----
  //     const totalProviders = await ServiceProvider.countDocuments({ isActive: true, createdAt: { $gte: start, $lte: end } });
  //     const prevProviders = await ServiceProvider.countDocuments({ isActive: true, createdAt: { $gte: prevStart, $lte: prevEnd } });

  //     // ----- ACTIVE SESSIONS -----
  //     const activeSessions = await CallSession.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });
  //     const prevActiveSessions = await CallSession.countDocuments({ status: "active", createdAt: { $gte: prevStart, $lte: prevEnd } });

  //     // ----- PENDING WITHDRAWALS -----
  //     const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending", createdAt: { $gte: start, $lte: end } });
  //     const prevPendingWithdrawals = await Withdrawal.countDocuments({ status: "pending", createdAt: { $gte: prevStart, $lte: prevEnd } });

  //     // ----- PENDING WITHDRAWALS AMOUNT -----
  //     const totalPendingCurrentResult = await Withdrawal.aggregate([
  //       { $match: { status: "pending", createdAt: { $gte: start, $lte: end } } },
  //       { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  //     ]);

  //     const totalPendingPreviousResult = await Withdrawal.aggregate([
  //       { $match: { status: "pending", createdAt: { $gte: prevStart, $lte: prevEnd } } },
  //       { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  //     ]);

  //     const totalPendingCurrent = totalPendingCurrentResult[0]?.totalAmount || 0;
  //     const totalPendingPrevious = totalPendingPreviousResult[0]?.totalAmount || 0;

  //     // ----- TOTAL WITHDRAW AMOUNTS -----
  //     const totalWithdrawCurrentResult = await Withdrawal.aggregate([
  //       { $match: { isPaid: true, status: "approved", createdAt: { $gte: start, $lte: end } } },
  //       { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  //     ]);

  //     const totalWithdrawPreviousResult = await Withdrawal.aggregate([
  //       { $match: { isPaid: true, status: "approved", createdAt: { $gte: prevStart, $lte: prevEnd } } },
  //       { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  //     ]);

  //     const totalWithdrawCurrent = totalWithdrawCurrentResult[0]?.totalAmount || 0;
  //     const totalWithdrawPrevious = totalWithdrawPreviousResult[0]?.totalAmount || 0;

  //     // ----- TOTAL WALLET BALANCE -----
  //     const totalWalletBalanceResult = await Wallet.aggregate([
  //       {
  //         $match: {
  //           updatedAt: { $gte: start, $lte: end },
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalBalance: { $sum: "$balance" },
  //         },
  //       },
  //     ]);
  //     const totalWalletBalance = totalWalletBalanceResult[0]?.totalBalance || 0;

  //     // ----- TOTAL RECHARGE AMOUNT RECEIVED -----
  //     const totalRechargeResult = await Admin.aggregate([
  //       {
  //         $match: {
  //           _id: new mongoose.Types.ObjectId("6879f604cfe8425a6b907423"),
  //           updatedAt: { $gte: start, $lte: end },
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalAmount: { $sum: "$totalRechargeAmountRecived" },
  //         },
  //       },
  //     ]);

  //     const totalRechargeAmountRecived = totalRechargeResult[0]?.totalAmount || 0;

  //     // ----- STRUCTURED CARDS RESPONSE -----
  //     const cardsData = {
  //       users: {
  //         title: "Total Users",
  //         totalCurrent: totalUsers,
  //         totalPrevious: prevUsers,
  //         percentageChange: calcPercentageChange(totalUsers, prevUsers),
  //       },
  //       providers: {
  //         title: "Total Providers",
  //         totalCurrent: totalProviders,
  //         totalPrevious: prevProviders,
  //         percentageChange: calcPercentageChange(totalProviders, prevProviders),
  //       },
  //       activeSessions: {
  //         title: "Active Sessions",
  //         totalCurrent: activeSessions,
  //         totalPrevious: prevActiveSessions,
  //         percentageChange: calcPercentageChange(activeSessions, prevActiveSessions),
  //       },
  //       pendingWithdrawals: {
  //         title: "Pending Withdrawals (number)",
  //         totalCurrent: pendingWithdrawals,
  //         totalPrevious: prevPendingWithdrawals,
  //         percentageChange: calcPercentageChange(pendingWithdrawals, prevPendingWithdrawals),
  //       },
  //       totalPendingWithdrawalsAmount: {
  //         title: "Pending Withdrawals Amount",
  //         totalCurrent: Number((totalPendingCurrent / 100).toFixed(2)),
  //         totalPrevious: Number((totalPendingPrevious / 100).toFixed(2)),
  //         percentageChange: calcPercentageChange(totalPendingCurrent, totalPendingPrevious),
  //       },
  //       withdrawals: {
  //         title: "Total Withdrawals Amount (approved)",
  //         totalCurrent: Number((totalWithdrawCurrent / 100).toFixed(2)),
  //         totalPrevious: Number((totalWithdrawPrevious / 100).toFixed(2)),
  //         percentageChange: calcPercentageChange(totalWithdrawCurrent, totalWithdrawPrevious),
  //       },
  //       totalWalletBalance: {
  //         title: "Total Wallet Balance",
  //         totalCurrent: Number((totalWalletBalance / 100).toFixed(2)),
  //         totalPrevious: 0,
  //         percentageChange: 0,
  //       },
  //       totalRechargeAmountRecived: {
  //         title: "Total Recharge Amount Received (Revenue)",
  //         totalCurrent: Number(totalRechargeAmountRecived.toFixed(2)),
  //         totalPrevious: 0,
  //         percentageChange: 0,
  //       },
  //     };

  //     res.status(200).json(new ApiResponse(200, cardsData, "Dashboard V2 cards data fetched successfully"));
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  // 📊 GET /api/dashboard/analytics

  static async getDashboardV3(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Get startDate and endDate from query params
      const { startDate, endDate } = req.query;

      const now = new Date();
      const start = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : now;

      // Previous period for % change (same length as selected range)
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);

      // ----- TOTAL USERS -----
      const totalUsers = await User.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });
      const prevUsers = await User.countDocuments({ status: "active", createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- TOTAL PROVIDERS -----
      const totalProviders = await ServiceProvider.countDocuments({ isOnline: true, createdAt: { $gte: start, $lte: end } });
      const prevProviders = await ServiceProvider.countDocuments({ isOnline: true, createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- ACTIVE SESSIONS -----
      const activeSessions = await CallSession.countDocuments({ status: "active", createdAt: { $gte: start, $lte: end } });
      const prevActiveSessions = await CallSession.countDocuments({ status: "active", createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- LIVE CALLS (Connected Status) -----
      const liveCalls = await CallSession.countDocuments({
        status: "connected",
        billingProcessed: { $ne: true },
      });
      const prevLiveCalls = await CallSession.countDocuments({
        status: "connected",
        billingProcessed: { $ne: true },
        createdAt: { $gte: prevStart, $lte: prevEnd },
      });

      // ----- PENDING WITHDRAWALS -----
      const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending", createdAt: { $gte: start, $lte: end } });
      const prevPendingWithdrawals = await Withdrawal.countDocuments({ status: "pending", createdAt: { $gte: prevStart, $lte: prevEnd } });

      // ----- TOTAL WITHDRAW AMOUNTS -----
      const totalWithdrawCurrentResult = await Withdrawal.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalWithdrawPreviousResult = await Withdrawal.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalWithdrawCurrent = totalWithdrawCurrentResult[0]?.totalAmount || 0;
      const totalWithdrawPrevious = totalWithdrawPreviousResult[0]?.totalAmount || 0;

      // ----- TOTAL PENDING WITHDRAWALS AMOUNT -----
      const totalPendingCurrentResult = await Withdrawal.aggregate([
        { $match: { status: "pending", createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalPendingPreviousResult = await Withdrawal.aggregate([
        { $match: { status: "pending", createdAt: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);

      const totalPendingCurrent = totalPendingCurrentResult[0]?.totalAmount || 0;
      const totalPendingPrevious = totalPendingPreviousResult[0]?.totalAmount || 0;

      // ----- 🆕 TOTAL RECHARGE AMOUNT RECEIVED -----

      const totalRechargeResult = await Admin.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId("6879f604cfe8425a6b907423"),
            updatedAt: { $gte: start, $lte: end }, // date filter
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalRechargeAmountRecived" },
          },
        },
      ]);

      const totalRechargeAmountRecived = totalRechargeResult[0]?.totalAmount || 0;

      // ----- ADMIN WALLET & EARNINGS -----
      const admin = await Admin.findById(new mongoose.Types.ObjectId("6879f604cfe8425a6b907423"));

      // Calculate today's earning from wallet transactions
      const todayStart = getStartOfDay(new Date());
      const todayEnd = getEndOfDay(new Date());

      const todayEarningResult = await Wallet.aggregate([
        {
          $match: {
            updatedAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalEarning: { $sum: "$balance" },
          },
        },
      ]);

      const todayEarning = todayEarningResult[0]?.totalEarning || 0;

      // ----- PROVIDER STATUS TILES -----
      const providerOnline = await ServiceProvider.countDocuments({ isOnline: true });
      const providerOffline = await ServiceProvider.countDocuments({ isOnline: false });
      const providerBlocked = await ServiceProvider.countDocuments({ isBlocked: true });
      const providerKycPending = await ServiceProvider.countDocuments({ kycStatus: "pending" });
      // const totalProvidersCount = await ServiceProvider.countDocuments();

      // ----- ALERTS (Issues & Queries) -----
      const userIssues = await Issue.countDocuments({ role: "user", status: "pending" });
      const userQueries = await Query.countDocuments({ role: "user", status: "pending" });
      const providerIssues = await Issue.countDocuments({ role: "provider", status: "pending" });
      const providerQueries = await Query.countDocuments({ role: "provider", status: "pending" });

      const dashboardData = {
        users: {
          totalCurrent: totalUsers,
          totalPrevious: prevUsers,
          percentageChange: calcPercentageChange(totalUsers, prevUsers),
        },
        providers: {
          totalCurrent: totalProviders,
          totalPrevious: prevProviders,
          percentageChange: calcPercentageChange(totalProviders, prevProviders),
        },

        activeSessions: {
          totalCurrent: activeSessions,
          totalPrevious: prevActiveSessions, percentageChange: calcPercentageChange(activeSessions, prevActiveSessions),
        },

        liveCalls: {
          title: "Live Calls",
          totalCurrent: liveCalls,
          totalPrevious: prevLiveCalls,
          percentageChange: calcPercentageChange(liveCalls, prevLiveCalls),
        },

        pendingWithdrawals: {
          title: "pendingWithdrawals (number)",
          totalCurrent: pendingWithdrawals,
          totalPrevious: prevPendingWithdrawals, percentageChange: calcPercentageChange(pendingWithdrawals, prevPendingWithdrawals),
        },

        totalPendingWithdrawalsAmount: {
          totalCurrent: Number((totalPendingCurrent).toFixed(2)),
          totalPrevious: Number((totalPendingPrevious / 100).toFixed(2)),
          percentageChange: calcPercentageChange(totalPendingCurrent, totalPendingPrevious),
        },

        withdrawals: {
          title: "Total approved withdrawals",
          totalCurrent: totalWithdrawCurrent,
          totalPrevious: totalWithdrawPrevious,
          percentageChange: calcPercentageChange(totalWithdrawCurrent, totalWithdrawPrevious),
        },

        totalRechargeAmountRecived: {
          totalCurrent: Number((totalRechargeAmountRecived).toFixed(2)),
          totalPrevious: 0,
          percentageChange: 0,
        },
        adminEarnings: {
          title: "Admin's Earnings",
          // todayEarning: Number((todayEarning / 100).toFixed(2)),
          monthlyEarning: Number((admin?.monthlyEarning || 0) / 100).toFixed(2),
          totalEarning: Number((admin?.totalEarning || 0) / 100).toFixed(2),
        },
      };

      // ----- PROVIDER STATUS TILES -----
      const statusTiles = {
        providers: {
          title: "Provider Status",
          // total: {
          //   label: "Total Providers",
          //   count: totalProvidersCount,
          // },
          online: {
            label: "Online",
            count: providerOnline,
          },
          offline: {
            label: "Offline",
            count: providerOffline,
          },
          blocked: {
            label: "Blocked",
            count: providerBlocked,
          },
          kycPending: {
            label: "KYC Pending",
            count: providerKycPending,
          },
          "In-call": {
            label: "In-Call",
            count: liveCalls,
          },
        },
      };

      // ----- ALERTS (Issues & Queries) -----
      const alerts = {
        user: {
          issue: userIssues,
          query: userQueries,
        },
        provider: {
          issue: providerIssues,
          query: providerQueries,
        },
      };

      res.status(200).json(new ApiResponse(200, { cardData: dashboardData, statusTiles, alerts }, "Dashboard data fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        startDate,
        endDate,
        providerId,
        userId,
        range = "day",
      } = req.query;

      // 🕒 Date range setup
      const start = startDate
        ? getStartOfDay(new Date(startDate as string))
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate
        ? getEndOfDay(new Date(endDate as string))
        : getEndOfDay(new Date());

      const matchFilter: any = { createdAt: { $gte: start, $lte: end } };
      if (providerId)
        matchFilter.providerId = new mongoose.Types.ObjectId(
          providerId as string
        );
      if (userId)
        matchFilter.userId = new mongoose.Types.ObjectId(userId as string);

      const groupFormat =
        range === "month" ? "%Y-%m" : range === "week" ? "%Y-%U" : "%Y-%m-%d";
      const labels = generateLabels(start, end, range as any);

      // ---------------------------------------------------------------------
      // 👤 USER SUMMARY
      // ---------------------------------------------------------------------
      const usersInRange = await User.find({
        createdAt: { $gte: start, $lte: end },
      });
      const newUsersCount = usersInRange.length;

      const returningUsers = await CallSession.distinct("caller", {
        callerModel: "User",
        createdAt: { $gte: start, $lte: end },
      });

      const totalUsers = await User.countDocuments();

      // Dynamic user charts
      const usersCreatedRaw = await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const returningUsersRaw = await CallSession.aggregate([
        {
          $match: {
            callerModel: "User",
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const newUsersChartData = labels.map((label) => {
        const found = usersCreatedRaw.find((d) => d._id === label);
        return found ? found.count : 0;
      });

      const returningUsersChartData = labels.map((label) => {
        const found = returningUsersRaw.find((d) => d._id === label);
        return found ? found.count : 0;
      });

      // ---------------------------------------------------------------------
      // 💼 SERVICE PROVIDER SUMMARY
      // ---------------------------------------------------------------------
      const totalProviders = await ServiceProvider.countDocuments();
      const mostActiveProviders = await CallSession.aggregate([
        { $match: matchFilter },
        { $group: { _id: "$callee", sessionCount: { $sum: 1 } } },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "_id",
            foreignField: "_id",
            as: "provider",
          },
        },
        { $unwind: "$provider" },
        { $sort: { sessionCount: -1 } },
        { $limit: 5 },
        {
          $project: {
            providerId: "$provider._id",
            name: "$provider.name",
            profilePicture: "$provider.profilePicture",
            sessionCount: 1,
          },
        },
      ]);

      // ---------------------------------------------------------------------
      // 💰 REVENUE & SPENDING
      // ---------------------------------------------------------------------
      const topEarningProviders = await ServiceProvider.aggregate([
        { $match: { isActive: true } },
        {
          $project: {
            name: 1,
            profilePicture: 1,
            totalEarnings: { $divide: ["$totalEarnings", 100] },
          },
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 5 },
      ]);

      const mostSpentUsers = await Wallet.aggregate([
        { $match: { updatedAt: { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            userId: "$user._id",
            name: "$user.name",
            email: "$user.email",
            profilePicture: "$user.profilePicture",
            spent: { $divide: ["$balance", 100] },
          },
        },
        { $sort: { spent: -1 } },
        { $limit: 5 },
      ]);

      // ---------------------------------------------------------------------
      // 🏦 RECHARGE CHARTS
      // ---------------------------------------------------------------------
      const walletRecharges = await Wallet.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: "$transactions" },
        { $match: { "transactions.type": "credit" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupFormat,
                date: "$transactions.createdAt",
              },
            },
            totalRecharge: { $sum: "$transactions.amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const rechargeChartData = labels.map((label) => {
        const found = walletRecharges.find((d) => d._id === label);
        return found ? found.totalRecharge / 100 : 0;
      });

      // ---------------------------------------------------------------------
      // 🕓 CALL & CHAT TIME CHARTS
      // ---------------------------------------------------------------------
      const callTimeRaw = await CallSession.aggregate([
        { $match: { startedAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $hour: "$startedAt" },
            totalDuration: { $sum: "$totalSeconds" },
            count: { $sum: 1 },
          },
        },
      ]);

      const chatTimeRaw = await Chat.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            totalChats: { $sum: 1 },
          },
        },
      ]);

      const callTimeData = Array.from({ length: 24 }, (_, i) => {
        const found = callTimeRaw.find((d) => d._id === i);
        return {
          hour: i,
          totalDuration: found?.totalDuration || 0,
          count: found?.count || 0,
        };
      });

      const chatTimeData = Array.from({ length: 24 }, (_, i) => {
        const found = chatTimeRaw.find((d) => d._id === i);
        return { hour: i, totalChats: found?.totalChats || 0 };
      });

      const formatHour = (h: number) =>
        h === 0
          ? "12 AM"
          : h < 12
            ? `${h} AM`
            : h === 12
              ? "12 PM"
              : `${h - 12} PM`;

      const peakCallHour = formatHour(
        callTimeData.reduce(
          (a, b) => (a.totalDuration > b.totalDuration ? a : b),
          { hour: 0, totalDuration: 0, count: 0 }
        ).hour
      );

      const peakChatHour = formatHour(
        chatTimeData.reduce((a, b) => (a.totalChats > b.totalChats ? a : b), {
          hour: 0,
          totalChats: 0,
        }).hour
      );

      // ---------------------------------------------------------------------
      // 📅 SESSIONS & WITHDRAWALS
      // ---------------------------------------------------------------------
      const dailySessionsRaw = await CallSession.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]);

      const sessionChartData = labels.map((label) => {
        const found = dailySessionsRaw.find((d) => d._id === label);
        return found ? found.count : 0;
      });

      const dailyWithdrawalsRaw = await Withdrawal.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      const withdrawalChartData = labels.map((label) => {
        const found = dailyWithdrawalsRaw.find((d) => d._id === label);
        return found ? found.totalAmount / 100 : 0;
      });

      // ---------------------------------------------------------------------
      // ✅ FINAL RESPONSE
      // ---------------------------------------------------------------------
      const analyticsData = {
        filters: { startDate: start, endDate: end, range },
        summary: {
          users: {
            total: totalUsers,
            new: newUsersCount,
            returning: returningUsers.length,
          },
          providers: { total: totalProviders, mostActive: mostActiveProviders },
          revenue: { topEarningProviders, mostSpentUsers },
        },
        charts: {
          labels,
          sessionChartData,
          withdrawalChartData,
          rechargeChartData,
          callTimeData,
          chatTimeData,
          newUsersChartData,
          returningUsersChartData,
        },
        insights: { peakCallHour, peakChatHour },
      };

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            analyticsData,
            "Dashboard analytics fetched successfully"
          )
        );
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      next(error);
    }
  }
}
