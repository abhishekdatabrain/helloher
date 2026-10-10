// import mongoose, { Types } from "mongoose";
// import ApiResponse from "../utils/ApiResponse";
// import { paginationResult } from "../utils/helper";
// import { NextFunction, Request, Response } from "express";
// import { Notification, UserType } from "../modals/notification.model";
// import { NotificationMessages } from "../config/notificationMessages";

// interface SendNotificationOptions {
//   type: string;
//   title: string;
//   message: string;
//   toUserId: string;
//   toRole: UserType;
//   fromUser?: { id: string; role: UserType };
// }

// interface DualNotifyOptions {
//   type: string;
//   senderId: string;
//   receiverId: string;
//   senderRole: UserType;
//   receiverRole: UserType;
//   context: Record<string, string | number>;
// }

// export const NotificationService = {
//   async send(
//     options: SendNotificationOptions,
//     authUser?: { id: string; role: UserType }
//   ) {
//     const { type, title, message, toRole, toUserId, fromUser } = options;
//     const sender = fromUser || authUser;

//     if (!sender) throw new Error("Sender information is missing.");
//     let notification: any;

//     try {
//       notification = await Notification.create({
//         type,
//         title,
//         message,
//         to: { user: new Types.ObjectId(toUserId), role: toRole },
//         from: { user: new Types.ObjectId(sender.id), role: sender.role },
//       });
//     } catch (err: any) {
//       console.log(`[Notification Critical] ${err.message}`);
//       if (!notification) throw err;
//     }
//     return notification;
//   },
// };

// export async function sendDualNotification({
//   type,
//   context,
//   senderId,
//   senderRole,
//   receiverId,
//   receiverRole,
// }: DualNotifyOptions) {
//   const template = NotificationMessages[type];

//   const [receiverMsg, senderMsg] = [
//     template.receiver(context),
//     template.sender(context),
//   ];

//   await Promise.all([
//     NotificationService.send({
//       type,
//       toUserId: receiverId,
//       toRole: receiverRole,
//       title: receiverMsg.title.toString(),
//       message: receiverMsg.message.toString(),
//       fromUser: { id: senderId, role: senderRole },
//     }),
//     NotificationService.send({
//       type,
//       toUserId: senderId,
//       toRole: senderRole,
//       title: senderMsg.title.toString(),
//       message: senderMsg.message.toString(),
//       fromUser: { id: receiverId, role: receiverRole },
//     }),
//   ]);
// }

// export const getNotificationStats = async (
//   req: Request & { user?: any },
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { user } = req;
//     const { user: queryUser, role: queryRole } = req.query;

//     const targetUserId = (queryUser as string) || user?.id;
//     const targetUserRole = (queryRole as string) || user?.role;

//     if (!targetUserId || !targetUserRole) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, null, "User ID and role are required."));
//     }

//     const userObjectId = new mongoose.Types.ObjectId(targetUserId);
//     const stats = await Notification.aggregate([
//       {
//         $match: {
//           "to.user": userObjectId,
//           "to.role": targetUserRole,
//         },
//       },
//       { $group: { _id: "$status", count: { $sum: 1 } } },
//     ]);

//     const mapped = stats.reduce(
//       (acc, curr) => {
//         acc[curr._id] = curr.count;
//         acc.total += curr.count;
//         return acc;
//       },
//       { read: 0, unread: 0, deleted: 0, total: 0 }
//     );
//     return res
//       .status(200)
//       .json(
//         new ApiResponse(200, mapped, "Notification stats fetched successfully.")
//       );
//   } catch (error) {
//     next(error);
//   }
// };

// export const markNotificationRead = async (
//   req: Request & { user?: any },
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id: userId, role } = req.user || {};
//     const { notificationId, markAll } = req.query;

//     if (!userId || !role) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, null, "Missing user information."));
//     }

//     const userObjectId = new mongoose.Types.ObjectId(userId);

//     // 🔹 MARK ALL AS READ
//     if (markAll === "true") {
//       const result = await Notification.updateMany(
//         {
//           "to.user": userObjectId,
//           "to.role": role,
//           status: "unread",
//         },
//         { $set: { status: "read", readAt: new Date() } }
//       );

//       return res
//         .status(200)
//         .json(
//           new ApiResponse(
//             200,
//             { modifiedCount: result.modifiedCount },
//             `${result.modifiedCount} notifications marked as read.`
//           )
//         );
//     }

//     if (!notificationId) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, null, "Notification ID is required."));
//     }

//     const updated = await Notification.findOneAndUpdate(
//       {
//         _id: new mongoose.Types.ObjectId(notificationId as string),
//         "to.user": userObjectId,
//         "to.role": role,
//         status: { $ne: "read" },
//       },
//       { $set: { status: "read", readAt: new Date() } },
//       { new: true }
//     );

//     if (!updated) {
//       return res
//         .status(404)
//         .json(
//           new ApiResponse(
//             404,
//             null,
//             "Notification not found or already marked as read."
//           )
//         );
//     }

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           updated,
//           "Notification marked as read successfully."
//         )
//       );
//   } catch (error) {
//     next(error);
//   }
// };

// export const getAllNotifications = async (
//   req: Request & { user?: any },
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { user } = req;
//     const {
//       page = 1,
//       limit = 10,
//       user: queryUser,
//       role: queryRole,
//     } = req.query;

//     const pageNumber = Math.max(parseInt(page as string, 10) || 1, 1);
//     const limitNumber = Math.max(parseInt(limit as string, 10) || 10, 10);

//     const rawUserId = (queryUser as string) || user?.id;
//     const targetRole = (queryUser ? queryRole : user?.role) as string;

//     if (
//       !rawUserId ||
//       typeof rawUserId !== "string" ||
//       !mongoose.isValidObjectId(rawUserId)
//     ) {
//       return res
//         .status(400)
//         .json(
//           new ApiResponse(
//             400,
//             null,
//             `Invalid or missing user ID. Received: ${rawUserId}`
//           )
//         );
//     }

//     if (!targetRole) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, null, "Missing role for user."));
//     }

//     const userObjectId = new mongoose.Types.ObjectId(rawUserId);
//     const matchStage =
//       user?.role === "admin" && !queryUser
//         ? {}
//         : { "to.user": userObjectId, "to.role": targetRole };

//     const notifications = await Notification.aggregate([
//       { $match: matchStage },
//       { $sort: { createdAt: -1 } },
//       { $skip: (pageNumber - 1) * limitNumber },
//       { $limit: limitNumber },

//       // 🔍 Lookup to.toUser (either user or admin)
//       {
//         $lookup: {
//           from: targetRole === "admin" ? "admins" : "users",
//           localField: "to.user",
//           foreignField: "_id",
//           as: "toUserDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: user?.role === "admin" ? "admins" : "users",
//           localField: "from.user",
//           foreignField: "_id",
//           as: "fromUserDetails",
//         },
//       },
//       {
//         $addFields: {
//           to: {
//             $mergeObjects: [{ role: "$to.role" }, { $first: "$toUserDetails" }],
//           },
//           from: {
//             $mergeObjects: [
//               { role: "$from.role" },
//               { $first: "$fromUserDetails" },
//             ],
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           type: 1,
//           title: 1,
//           message: 1,
//           status: 1,
//           readAt: 1,
//           createdAt: 1,
//           to: {
//             _id: 1,
//             role: 1,
//             email: 1,
//             lastName: 1,
//             username: 1,
//             firstName: 1,
//           },
//           from: {
//             _id: 1,
//             role: 1,
//             email: 1,
//             lastName: 1,
//             username: 1,
//             firstName: 1,
//           },
//         },
//       },
//     ]);

//     const total = await Notification.countDocuments(matchStage);
//     const data = paginationResult(
//       pageNumber,
//       limitNumber,
//       total,
//       notifications
//     );
//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           data,
//           notifications.length
//             ? "Notifications fetched successfully."
//             : "No notifications found."
//         )
//       );
//   } catch (error) {
//     next(error);
//   }
// };
