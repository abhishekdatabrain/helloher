import { Request, Response, NextFunction } from "express";
import { Notification, UserType } from "../../modals/notification.model";
import { CommonService } from "../../services/common.services";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import mongoose from "mongoose";

const notificationService = new CommonService(Notification);

export class NotificationController {
  // 📬 Create notification
  static async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, title, message, recipientId, recipientType, senderId, senderType, metadata } = req.body;

      if (!type || !title || !message || !recipientId || !recipientType) {
        throw new ApiError(400, "Missing required fields");
      }

      const notification = await notificationService.create({
        type,
        title,
        message,
        recipientId: new mongoose.Types.ObjectId(recipientId),
        recipientType: recipientType as UserType,
        senderId: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
        senderType: senderType as UserType,
        metadata: metadata || {},
        status: "unread",
      });

      return res.status(201).json(new ApiResponse(201, notification, "Notification created successfully"));
    } catch (error) {
      next(error);
    }
  }

  // 📋 Get notifications for logged-in user
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      // const user = req.user as any; // assuming your auth middleware sets req.user
      const user = (req as any).user;

      if (!user?.id || !user?.role) throw new ApiError(401, "Unauthorized");

      const query = req.query || {};
      const recipientType = user.role === "provider" || user.role === "ServiceProvider" ? "provider" : "user";

      const matchQuery: any = {
        recipientId: new mongoose.Types.ObjectId(user.id),
        recipientType,
      };
      if (query.status) matchQuery.status = query.status;

      const additionalStages = [
        { $match: matchQuery },
        {
          $lookup: {
            from: recipientType === "user" ? "users" : "serviceproviders",
            localField: "senderId",
            foreignField: "_id",
            as: "senderInfo",
          },
        },
        {
          $lookup: {
            from: recipientType === "user" ? "users" : "serviceproviders",
            localField: "recipientId",
            foreignField: "_id",
            as: "recipientInfo",
          },
        },
        {
          $addFields: {
            sender: {
              $cond: [
                { $gt: [{ $size: "$senderInfo" }, 0] },
                { $arrayElemAt: ["$senderInfo", 0] },
                null,
              ],
            },
          },
        },
        {
          $project: {
            type: 1,
            title: 1,
            message: 1,
            status: 1,
            readAt: 1,
            metadata: 1,
            createdAt: 1,
            "sender._id": 1,
            "sender.name": 1,
            "sender.profilePicture": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const result = await notificationService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(200, { result: result.result, pagination: result.pagination }, "Notifications fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  // 📋 Get all notifications (admin)
  static async getAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query || {};

      const additionalStages = [
        { $lookup: { from: "users", localField: "recipientId", foreignField: "_id", as: "recipientUser" } },
        { $lookup: { from: "serviceproviders", localField: "recipientId", foreignField: "_id", as: "recipientProvider" } },
        { $lookup: { from: "users", localField: "senderId", foreignField: "_id", as: "senderUser" } },
        { $lookup: { from: "serviceproviders", localField: "senderId", foreignField: "_id", as: "senderProvider" } },
        {
          $addFields: {
            recipient: {
              $cond: [
                { $eq: ["$recipientType", "user"] },
                { $arrayElemAt: ["$recipientUser", 0] },
                { $arrayElemAt: ["$recipientProvider", 0] },
              ],
            },
            sender: {
              $cond: [
                { $eq: ["$senderType", "user"] },
                { $arrayElemAt: ["$senderUser", 0] },
                {
                  $cond: [
                    { $eq: ["$senderType", "provider"] },
                    { $arrayElemAt: ["$senderProvider", 0] },
                    null,
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            type: 1,
            title: 1,
            message: 1,
            status: 1,
            readAt: 1,
            metadata: 1,
            createdAt: 1,
            recipientType: 1,
            "recipient._id": 1,
            "recipient.name": 1,
            "recipient.profilePicture": 1,
            "sender._id": 1,
            "sender.name": 1,
            "sender.profilePicture": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const result = await notificationService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(200, { result: result.result, pagination: result.pagination }, "Notifications fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  // ✅ Mark notification as read
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      // const user = req.user as any;
      if (!user?.id || !user?.role) throw new ApiError(401, "Unauthorized");
      if (!id) throw new ApiError(400, "Notification ID is required");

      const recipientType = user.role === "provider" || user.role === "ServiceProvider" ? "provider" : "user";

      const notification = await Notification.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), recipientId: user.id, recipientType, status: "unread" },
        { $set: { status: "read", readAt: new Date() } },
        { new: true }
      );

      if (!notification) throw new ApiError(404, "Notification not found or already marked as read");

      return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
    } catch (error) {
      next(error);
    }
  }

  // ✅ Mark all notifications as read
  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      // const user = req.user as any;
      if (!user?.id || !user?.role) throw new ApiError(401, "Unauthorized");

      const recipientType = user.role === "provider" || user.role === "ServiceProvider" ? "provider" : "user";

      const result = await Notification.updateMany(
        { recipientId: user.id, recipientType, status: "unread" },
        { $set: { status: "read", readAt: new Date() } }
      );

      return res.status(200).json(new ApiResponse(200, { modifiedCount: result.modifiedCount }, `${result.modifiedCount} notifications marked as read`));
    } catch (error) {
      next(error);
    }
  }

  // 📊 Get notification stats
  static async getNotificationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.id || !user?.role) throw new ApiError(401, "Unauthorized");

      const recipientType = user.role === "provider" || user.role === "ServiceProvider" ? "provider" : "user";

      const stats = await Notification.aggregate([
        { $match: { recipientId: new mongoose.Types.ObjectId(user.id), recipientType } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const mapped = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        acc.total += curr.count;
        return acc;
      }, { read: 0, unread: 0, total: 0 });

      return res.status(200).json(new ApiResponse(200, mapped, "Notification stats fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async deleteAllNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user;

      if (!user?.id || !user?.role)
        throw new ApiError(401, "Unauthorized");

      const recipientType =
        user.role === "provider" || user.role === "ServiceProvider"
          ? "provider"
          : "user";

      const result = await Notification.deleteMany({
        recipientId: new mongoose.Types.ObjectId(user.id),
        recipientType,
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          { deletedCount: result.deletedCount },
          `${result.deletedCount} notifications deleted successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // 🗑️ Delete notification
  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user?.id || !user?.role) throw new ApiError(401, "Unauthorized");
      if (!id) throw new ApiError(400, "Notification ID is required");

      const recipientType = user.role === "provider" || user.role === "ServiceProvider" ? "provider" : "user";

      const notification = await Notification.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        recipientId: user.id,
        recipientType,
      });

      if (!notification) throw new ApiError(404, "Notification not found");

      return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

