import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { WalletTransaction } from "../../modals/walletTransaction.model";
import { CommonService } from "../../services/common.services";
import mongoose from "mongoose";
import { CallSession } from "../../modals/callSession.model";
import Message from "../../modals/message.model";
import ChatCommission from "../../modals/chatCommission.model";

const walletService = new CommonService(WalletTransaction);

export class WalletTransactionController {
  // 🟢 Create a new wallet transaction
  static async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityId, entityType, amount, type, status, meta } = req.body;

      if (!entityId || !entityType || !amount || !type) {
        throw new ApiError(400, "Missing required fields");
      }

      const newTransaction = await walletService.create({
        entityId,
        entityType,
        amount,
        type,
        status: status || "success",
        meta: meta || {},
      });

      return res
        .status(201)
        .json(new ApiResponse(201, newTransaction, "Transaction created successfully"));
    } catch (error) {
      next(error);
    }
  }

  // 📜 Get all transactions (with dynamic user/provider info)
  static async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query || {};

      // ✅ Build aggregation stages for dynamic entity population
      const additionalStages = [
        {
          $lookup: {
            from: "users",
            localField: "entityId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "entityId",
            foreignField: "_id",
            as: "providerInfo",
          },
        },
        {
          $addFields: {
            entityInfo: {
              $cond: [
                { $eq: ["$entityType", "User"] },
                { $arrayElemAt: ["$userInfo", 0] },
                { $arrayElemAt: ["$providerInfo", 0] },
              ],
            },
          },
        },
        {
          $project: {
            entityId: 1,
            entityType: 1,
            amount: { $divide: ["$amount", 100] },
            type: 1,
            status: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
            "entityInfo.name": 1,
            "entityInfo.email": 1,
            "entityInfo.phoneNumber": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const serviceResult = await walletService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Wallet transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async getAllUserRechargeTransactions(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const query = req.query || {};

      // ✅ Filter: only User + recharge transactions
      const matchStage = {
        $match: {
          entityType: "User",
          type: "recharge",
        },
      };

      // ✅ Aggregation stages
      const additionalStages = [
        matchStage,
        {
          $lookup: {
            from: "users",
            localField: "entityId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $addFields: {
            entityInfo: { $arrayElemAt: ["$userInfo", 0] },
          },
        },
        {
          $project: {
            entityId: 1,
            entityType: 1,
            amount: { $divide: ["$amount", 100] },
            type: 1,
            status: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
            "entityInfo.name": 1,
            "entityInfo.email": 1,
            "entityInfo.phoneNumber": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const serviceResult = await walletService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "User recharge transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // 📜 Get all transactions for a specific provider
  static async getAllProviderTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params;
      if (!providerId) throw new ApiError(400, "Provider ID required");

      const query = req.query || {};

      // ✅ Filter: only transactions for this provider
      const matchStage = {
        $match: {
          entityType: "ServiceProvider",
          entityId: new mongoose.Types.ObjectId(providerId),
        },
      };

      // ✅ Aggregation stages
      const additionalStages = [
        matchStage,
        {
          $lookup: {
            from: "serviceproviders",
            localField: "entityId",
            foreignField: "_id",
            as: "providerInfo",
          },
        },
        {
          $addFields: {
            entityInfo: { $arrayElemAt: ["$providerInfo", 0] },
          },
        },
        {
          $project: {
            entityId: 1,
            entityType: 1,
            amount: { $divide: ["$amount", 100] },
            type: 1,
            status: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
            "entityInfo.name": 1,
            "entityInfo.email": 1,
            "entityInfo.phoneNumber": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const serviceResult = await walletService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Provider transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // 🟢 Get all transactions for the authenticated user
  static async getMyUserTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "User not authenticated");
      const query = req.query || {};
      const matchStage = {
        $match: {
          entityType: "User",
          entityId: new mongoose.Types.ObjectId(userId),
        },
      };
      const additionalStages = [
        matchStage,
        {
          $lookup: {
            from: "users",
            localField: "entityId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $addFields: {
            entityInfo: { $arrayElemAt: ["$userInfo", 0] },
          },
        },
        {
          $project: {
            entityId: 1,
            entityType: 1,
            amount: { $divide: ["$amount", 100] },
            type: 1,
            status: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
            "entityInfo.name": 1,
            "entityInfo.email": 1,
            "entityInfo.phoneNumber": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];
      const serviceResult = await walletService.getAll(query, additionalStages);
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Authenticated user transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async getUserTransactionsById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "User ID required");
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
      }

      const query = req.query || {};
      const matchStage = {
        $match: {
          entityType: "User",
          entityId: new mongoose.Types.ObjectId(id),
        },
      };
      const additionalStages = [
        matchStage,
        {
          $lookup: {
            from: "users",
            localField: "entityId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $addFields: {
            entityInfo: { $arrayElemAt: ["$userInfo", 0] },
          },
        },
        {
          $project: {
            entityId: 1,
            entityType: 1,
            amount: { $divide: ["$amount", 100] },
            type: 1,
            status: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
            "entityInfo.name": 1,
            "entityInfo.email": 1,
            "entityInfo.phoneNumber": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];
      const serviceResult = await walletService.getAll(query, additionalStages);
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "User transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // 🟢 Get all transactions for the authenticated provider
  static async getMyProviderTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const providerId = req.user?.id;
      if (!providerId) throw new ApiError(401, "Provider not authenticated");
      const query = req.query || {};
      const matchStage = {
        $match: {
          entityType: "ServiceProvider",
          entityId: new mongoose.Types.ObjectId(providerId),
        },
      };
      const additionalStages = [
        matchStage,
        {
          $lookup: {
            from: "serviceproviders",
            localField: "entityId",
            foreignField: "_id",
            as: "providerInfo",
          },
        },
        {
          $addFields: {
            entityInfo: { $arrayElemAt: ["$providerInfo", 0] },
          },
        },
        {
          $project: {
            entityId: 1,
            entityType: 1,
            amount: { $divide: ["$amount", 100] },
            type: 1,
            status: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
            "entityInfo.name": 1,
            "entityInfo.email": 1,
            "entityInfo.phoneNumber": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];
      const serviceResult = await walletService.getAll(query, additionalStages);
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Authenticated provider transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // 🔍 Get a single transaction by ID
  static async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "Transaction ID required");

      const transaction = await walletService.getById(id);
      return res
        .status(200)
        .json(new ApiResponse(200, transaction, "Transaction fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // ✏️ Update a transaction (status or meta)
  static async updateTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "Transaction ID required");

      const updateData = req.body;
      const updated = await walletService.updateById(id, updateData);

      return res
        .status(200)
        .json(new ApiResponse(200, updated, "Transaction updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  // 🗑️ Delete a transaction
  static async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "Transaction ID required");

      const deleted = await walletService.deleteById(id);
      return res
        .status(200)
        .json(new ApiResponse(200, deleted, "Transaction deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // 📊 Get User Stats (Today, Yesterday, This Week)
  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "User not authenticated");
      const authRole = (req as any).user?.role;
      console.log("[getUserStats] auth context:", {
        userId,
        role: authRole,
      });
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const now = new Date();

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfToday);

      const daysToMonday = (startOfToday.getDay() + 6) % 7; // Monday as start of week
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - daysToMonday);

      // get active chat commission to calculate message earnings
      const chatCommission = await ChatCommission.findOne({ enabled: true }).lean();

      let chatEarningPerMsgPaise = 0;
      if (chatCommission && chatCommission.perMessageAmountPaise) {
        chatEarningPerMsgPaise = Math.floor(chatCommission.perMessageAmountPaise * (chatCommission.commissionPercentage / 100));
      }

      const getStatsForRange = async (start: Date, end: Date) => {
        // Call Stats: "sum of all the calls i have taken in minuts + their earning"
        const callStats = await CallSession.aggregate([
          {
            $match: {
              callee: userObjectId,
              createdAt: { $gte: start, $lt: end },
              // filter out failed or ringing calls
              status: { $in: ["ended", "completed", "processing"] }
            }
          },
          {
            $group: {
              _id: null,
              totalDurationSeconds: { $sum: { $ifNull: ["$billedDuration", { $ifNull: ["$totalSeconds", 0] }] } },
              totalEarningPaise: {
                $sum: {
                  $multiply: [
                    { $divide: [{ $ifNull: ["$billedDuration", { $ifNull: ["$totalSeconds", 0] }] }, 60] },
                    { $ifNull: ["$perMinutePricePaise", 0] }
                  ]
                }
              }
            }
          }
        ]);

        const callsDurationSeconds = callStats.length > 0 ? callStats[0].totalDurationSeconds : 0;
        const callsDurationMin = callsDurationSeconds / 60;
        const callsEarningPaise = callStats.length > 0 ? callStats[0].totalEarningPaise : 0;
        const callsEarning = callsEarningPaise / 100;

        // Messages Stats: count user-authored messages received by this account
        const msgQuery =
          authRole === "ServiceProvider"
            ? {
                receiverId: userObjectId,
                createdAt: { $gte: start, $lt: end },
                $or: [
                  { senderRole: "user" },
                  { senderRole: { $exists: false } },
                ],
              }
            : {
                senderId: userObjectId,
                createdAt: { $gte: start, $lt: end },
                $or: [
                  { senderRole: "user" },
                  { senderRole: { $exists: false } },
                ],
              };
        const msgCount = await Message.countDocuments(msgQuery);
        console.log("[getUserStats] message count query:", {
          rangeStart: start,
          rangeEnd: end,
          query: msgQuery,
          authRole,
          msgCount,
        });

        const messagesEarningPaise = msgCount * chatEarningPerMsgPaise;
        const messagesEarning = messagesEarningPaise / 100;

        return {
          callsDurationMinutes: parseFloat(callsDurationMin.toFixed(2)),
          callsEarning: parseFloat(callsEarning.toFixed(2)),
          messagesSentCount: msgCount,
          messagesEarning: parseFloat(messagesEarning.toFixed(2)),
          totalEarning: parseFloat((callsEarning + messagesEarning).toFixed(2))
        };
      };

      const todayStats = await getStatsForRange(startOfToday, endOfToday);
      const yesterdayStats = await getStatsForRange(startOfYesterday, endOfYesterday);
      const thisWeekStats = await getStatsForRange(startOfWeek, endOfToday);

      return res.status(200).json(
        new ApiResponse(200, {
          today: todayStats,
          yesterday: yesterdayStats,
          thisWeek: thisWeekStats
        }, "User stats fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  }
}
