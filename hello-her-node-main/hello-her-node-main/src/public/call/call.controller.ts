import { Request, Response, NextFunction } from "express";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { CallService } from "../../services/call.service";
import { config } from "../../config/config";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { CallSession } from "../../modals/callSession.model";
import { CommonService } from "../../services/common.services";
import { IUser, User } from "../../modals/user.model";
import ServiceProvider from "../../modals/serviceProvider.model";
import CommissionModel from "../../modals/commission.model";
import mongoose from "mongoose";
import { scheduleAutoMissTimeout } from "../../utils/callTimeouts";
import { getCallParticipantMeta } from "../../utils/callParticipantMeta";
const callService = new CommonService(CallSession);

// Simple in-memory cache to store channel per user
const channelCache = new Map<string, { channel: string; timestamp: number }>();
const CHANNEL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CustomRequest extends Request {
  user?: IUser;
}

export class CallController {
  // 🎫 Generate Agora RTC Token
  static async createToken(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        channel,
        uid,
        role = "publisher",
        expireSeconds = 3600,
      } = req.body;
      if (!channel || !uid) throw new ApiError(400, "channel and uid required");

      const roleEnum =
        role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expireTime = Math.floor(Date.now() / 1000) + Number(expireSeconds);

      const token = RtcTokenBuilder.buildTokenWithUid(
        config.agora.appId,
        config.agora.appCertificate,
        channel,
        Number(uid),
        roleEnum,
        expireTime,
      );

      // Store channel in cache for this user (if authenticated)
      const userId = req.user?.id;
      if (userId) {
        channelCache.set(userId, {
          channel,
          timestamp: Date.now(),
        });
      }

      return res
        .status(200)
        .json(new ApiResponse(200, { token }, "Token generated"));
    } catch (err) {
      next(err);
    }
  }

  // 📞 Initiate call
  static async initiateCall(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const callerId = req.user?.id;
      const callerRole = req.user?.role;
      const { calleeId } = req.body;

      if (!callerId) throw new ApiError(401, "Unauthorized");
      if (!calleeId) throw new ApiError(400, "calleeId required");

      // Retrieve channel from cache (stored in createToken)
      let channel: string | undefined;
      const cachedChannel = channelCache.get(callerId);
      if (cachedChannel && Date.now() - cachedChannel.timestamp < CHANNEL_CACHE_TTL) {
        channel = cachedChannel.channel;
        // Clean up after use
        channelCache.delete(callerId);
      }

      const callerType =
        callerRole === "ServiceProvider" ? "ServiceProvider" : "User";
      const calleeType =
        callerType === "ServiceProvider" ? "User" : "ServiceProvider";

      // 🚫 Prevent blocked users from initiating calls to a provider
      if (calleeType === "ServiceProvider") {
        const provider = await ServiceProvider.findById(calleeId).select("blockedUsers");
        if (provider?.blockedUsers?.some((id) => id.toString() === callerId)) {
          return res.status(403).json({
            success: false,
            message: "You are blocked by this provider",
          });
        }
      }

      const result = await CallService.initiateCall({
        callerId,
        callerType,
        calleeId,
        calleeType,
        channel, // Uses channel from createToken cache, or generates one if not found
      });
      // console.log("result from the initiate call ", result);
      if (!result.allowed) {
        return res
          .status(402)
          .json(
            // new ApiResponse(402, { reason: result.reason }, `Call not allowed: ${result.reason}`),
            new ApiResponse(402, { message: result.reason, reason: result.reason }, `Call not allowed: ${result.reason}`),
          );
      }

      // ✅ HARD GUARD FOR TS + SAFETY
      if (!result.session) {
        throw new ApiError(500, "Call session creation failed");
      }

      const sessionId = result.session._id;

      // 🆕 Determine if this is a new user (only for User -> ServiceProvider calls)
      let isNewUser = false;
      let callerName = callerId;
      let callerImageUrl: string | null = null;

      try {
        const callerMeta = await getCallParticipantMeta(callerId, callerType);
        callerName = callerMeta.callerName;
        callerImageUrl = callerMeta.callerImageUrl;
      } catch (err) {
        console.warn("⚠️ Error resolving caller meta:", err);
      }

      if (callerType === "User" && calleeType === "ServiceProvider") {
        try {
          // Check if there are any previous calls from this user to this provider
          const previousCalls = await CallSession.findOne({
            caller: callerId,
            callee: calleeId,
            callerModel: "User",
            calleeModel: "ServiceProvider",
            status: { $in: ["connected", "missed", "declined"] }, // Only count completed/attempted calls
          }).select("_id");

          isNewUser = !previousCalls; // If no previous calls, it's a new user
        } catch (err) {
          console.warn("⚠️ Error determining if user is new:", err);
          // Continue with default values if lookup fails
        }
      }

      /* 🔔 SOCKET RING LOGIC */
      const io = req.app.get("socketio");
      const getSocketUser = req.app.get("getSocketUser");

      const calleeSocketUser = getSocketUser(calleeId);

      if (calleeSocketUser) {
        io.to(calleeSocketUser.socketId).emit("incoming_call", {
          sessionId: result.session._id,
          channel: result.session.channel,
          channelName: result.session.channel,
          callerId,
          caller_id: callerId,
          callerName,
          caller_name: callerName,
          callerImageUrl,
          caller_image_url: callerImageUrl,
          callerProfileImage: callerImageUrl,
          callerType,
          calleeId,
          perMinutePricePaise: result.session.perMinutePricePaise,
          isNewUser,
        });

        console.log("📞 Incoming call emitted to callee:", {
          calleeId,
          callerName,
          callerImageUrl,
          isNewUser,
          socketId: calleeSocketUser.socketId,
        });
      } else {
        console.log("⚠️ Callee is offline, cannot ring:", calleeId);
      }

      // 🔔 Create notification for call received
      try {
        const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
        const calleeRoleType = calleeType === "User" ? "user" : "provider";
        const callerRoleType = callerType === "User" ? "user" : "provider";

        // Resolve caller name for a better notification message
        let callerDisplayName = callerId;
        try {
          if (callerType === "User") {
            const callerUser = await User.findById(callerId).select("name");
            if (callerUser?.name) callerDisplayName = callerUser.name;
          } else {
            const callerProvider = await ServiceProvider.findById(callerId).select("alias name");
            callerDisplayName =
              callerProvider?.alias ||
              callerProvider?.name ||
              callerDisplayName;
          }
        } catch (nameLookupErr) {
          console.warn("Could not fetch caller name for notification:", nameLookupErr);
        }

        await createAndEmitNotification({
          type: "call_received",
          title: "Incoming Call",
          message: `You have an incoming call from ${callerDisplayName}`,
          recipientId: calleeId,
          recipientType: calleeRoleType,
          senderId: callerId,
          senderType: callerRoleType,
          metadata: {
            sessionId: result.session._id.toString(),
            channel: result.session.channel,
            channelName: result.session.channel,
            callerId,
            caller_id: callerId,
            perMinutePricePaise: result.session.perMinutePricePaise,
            callerName,
            caller_name: callerName,
            callerImageUrl,
            caller_image_url: callerImageUrl,
            isNewUser,
          },
          io,
          getSocketUser,
        });
      } catch (notifError) {
        console.error("Error creating call notification:", notifError);
        // Don't fail the request if notification fails
      }

      // ⏳ Auto mark as missed if not connected within 60s (shared with socket layer)
      try {
        await scheduleAutoMissTimeout({
          sessionId: result.session._id.toString(),
          io,
          getUser: getSocketUser,
        });
      } catch (err) {
        console.error("Failed to schedule auto-miss timeout:", err);
      }

      // ✅ THEN return response
      return res
        .status(201)
        .json(new ApiResponse(201, result.session, "Call initiated"));
      // return res
      //   .status(201)
      //   .json(new ApiResponse(201, result.session, "Call initiated"));
    } catch (err) {
      next(err);
    }
  }

  static async markConnected(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) throw new ApiError(400, "sessionId required");

      const connection = await CallService.markConnected(sessionId);
      if (connection.outcome === "not_found") {
        throw new ApiError(404, "Session not found");
      }
      if (connection.outcome === "not_connectable") {
        throw new ApiError(
          409,
          `Call can no longer be connected (status: ${connection.session.status})`,
        );
      }

      // Reconcile provider state for both the winning transition and an
      // idempotent retry of an already-connected call.
      try {
        const io = req.app.get("socketio");
        await CallService.startProviderOnCallBySession(sessionId, io);
      } catch (err) {
        console.error("Error while starting provider on-call:", err);
      }
      return res
        .status(200)
        .json(new ApiResponse(200, connection.session, "Call connected"));
    } catch (err) {
      next(err);
    }
  }

  // 🛑 End call (idempotent, does wallet/earnings/statistics atomically)
  static async endCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) throw new ApiError(400, "sessionId is required");
      const result = await CallService.endCall(
        sessionId,
        req.app.get("socketio"),
        req.app.get("getSocketUser"),
      );

      if (!result) throw new ApiError(404, "Session not found");

      // If 'result.sessionId' doesn't exist, it means result is a raw Mongoose Document, 
      // indicating another thread already locked and processed this call.
      if (!(result as any).sessionId) {
        console.log(`[CallController] Ended requested for already-ended or processing session ${sessionId}`);
        return res.status(200).json(new ApiResponse(200, result, "Session already ended or being processed."));
      }

      console.log(`[CallController] Session ${sessionId} ended and fully billed.`);
      return res.status(200).json(new ApiResponse(200, result, "✅ Call ended and billed successfully"));
    } catch (err) {
      console.error("[CallController] endCall error:", err);
      next(err);
    }
  }

  // 📋 Get all call logs (includes user/provider details)
  static async getAllCallLogs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const query = req.query || {};

      const additionalStages = [
        {
          $lookup: {
            from: "users",
            localField: "caller",
            foreignField: "_id",
            as: "callerUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "caller",
            foreignField: "_id",
            as: "callerProvider",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "callee",
            foreignField: "_id",
            as: "calleeUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "callee",
            foreignField: "_id",
            as: "calleeProvider",
          },
        },
        {
          $addFields: {
            callerInfo: {
              $cond: [
                { $eq: ["$callerModel", "User"] },
                { $arrayElemAt: ["$callerUser", 0] },
                { $arrayElemAt: ["$callerProvider", 0] },
              ],
            },
            calleeInfo: {
              $cond: [
                { $eq: ["$calleeModel", "User"] },
                { $arrayElemAt: ["$calleeUser", 0] },
                { $arrayElemAt: ["$calleeProvider", 0] },
              ],
            },
          },
        },
        {
          $project: {
            channel: 1,
            status: 1,
            startedAt: 1,
            endedAt: 1,
            totalSeconds: 1,
            perMinutePricePaise: 1,
            createdAt: 1,
            updatedAt: 1,
            recordingUrl: 1,
            "callerInfo._id": 1,
            "callerInfo.name": 1,
            "callerInfo.phoneNumber": 1,
            "callerInfo.activeImageURL": {
              $cond: [
                { $eq: ["$callerInfo.activeImageType", "avatar"] },
                { $ifNull: ["$callerInfo.avatar", "$callerInfo.profilePicture"] },
                { $ifNull: ["$callerInfo.profilePicture", "$callerInfo.avatar"] },
              ],
            },
            "calleeInfo._id": 1,
            "calleeInfo.name": 1,
            "calleeInfo.phoneNumber": 1,
            "calleeInfo.activeImageURL": {
              $cond: [
                { $eq: ["$calleeInfo.activeImageType", "avatar"] },
                { $ifNull: ["$calleeInfo.avatar", "$calleeInfo.profilePicture"] },
                { $ifNull: ["$calleeInfo.profilePicture", "$calleeInfo.avatar"] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 as 1 } },
      ];

      const serviceResult = await callService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Call logs fetched successfully",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  // 📋 Get call logs for the authenticated user (uses JWT token)
  static async getUserCallLogs(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const userIdString = req.user?.id;
      if (!userIdString) throw new ApiError(401, "Unauthorized");

      // Convert to ObjectId for proper MongoDB comparison
      const userId = new mongoose.Types.ObjectId(userIdString);

      // Use empty query (filter will be done in aggregation pipeline)
      const query: any = req.query || {};

      const additionalStages = [
        // ✅ Match only calls where user is caller OR callee (FIRST STAGE - critical for filtering)
        {
          $match: {
            $or: [{ caller: userId }, { callee: userId }],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "caller",
            foreignField: "_id",
            as: "callerUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "caller",
            foreignField: "_id",
            as: "callerProvider",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "callee",
            foreignField: "_id",
            as: "calleeUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "callee",
            foreignField: "_id",
            as: "calleeProvider",
          },
        },
        {
          $addFields: {
            callerInfo: {
              $cond: [
                { $eq: ["$callerModel", "User"] },
                { $arrayElemAt: ["$callerUser", 0] },
                { $arrayElemAt: ["$callerProvider", 0] },
              ],
            },
            calleeInfo: {
              $cond: [
                { $eq: ["$calleeModel", "User"] },
                { $arrayElemAt: ["$calleeUser", 0] },
                { $arrayElemAt: ["$calleeProvider", 0] },
              ],
            },
          },
        },
        {
          $project: {
            channel: 1,
            status: 1,
            startedAt: 1,
            endedAt: 1,
            totalSeconds: 1,
            recordingUrl: 1,
            perMinutePricePaise: 1,
            createdAt: 1,
            updatedAt: 1,
            callerModel: 1,
            "callerInfo._id": 1,
            "callerInfo.name": 1,
            "callerInfo.phoneNumber": 1,
            "callerInfo.activeImageURL": {
              $cond: [
                { $eq: ["$callerInfo.activeImageType", "avatar"] },
                { $ifNull: ["$callerInfo.avatar", "$callerInfo.profilePicture"] },
                { $ifNull: ["$callerInfo.profilePicture", "$callerInfo.avatar"] },
              ],
            },
            calleeModel: 1,
            "calleeInfo._id": 1,
            "calleeInfo.name": 1,
            "calleeInfo.phoneNumber": 1,
            "calleeInfo.activeImageURL": {
              $cond: [
                { $eq: ["$calleeInfo.activeImageType", "avatar"] },
                { $ifNull: ["$calleeInfo.avatar", "$calleeInfo.profilePicture"] },
                { $ifNull: ["$calleeInfo.profilePicture", "$calleeInfo.avatar"] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 as 1 } },
      ];

      const serviceResult = await callService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "User call logs fetched successfully",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  // fetch all call logs for a specific user ID
  static async getUserCallLogsById(
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const targetIdString = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(targetIdString)) {
        return res
          .status(400)
          .json(new ApiError(400, "Invalid user ID"));
      }

      const targetId = new mongoose.Types.ObjectId(targetIdString);
      const query: any = req.query || {};

      const additionalStages = [
        // ✅ Match only calls where target user is caller OR callee
        {
          $match: {
            $or: [{ caller: targetId }, { callee: targetId }],
          },
        },

        // same lookups as before
        {
          $lookup: {
            from: "users",
            localField: "caller",
            foreignField: "_id",
            as: "callerUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "caller",
            foreignField: "_id",
            as: "callerProvider",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "callee",
            foreignField: "_id",
            as: "calleeUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "callee",
            foreignField: "_id",
            as: "calleeProvider",
          },
        },

        {
          $addFields: {
            callerInfo: {
              $cond: [
                { $eq: ["$callerModel", "User"] },
                { $arrayElemAt: ["$callerUser", 0] },
                { $arrayElemAt: ["$callerProvider", 0] },
              ],
            },
            calleeInfo: {
              $cond: [
                { $eq: ["$calleeModel", "User"] },
                { $arrayElemAt: ["$calleeUser", 0] },
                { $arrayElemAt: ["$calleeProvider", 0] },
              ],
            },
          },
        },

        {
          $project: {
            channel: 1,
            status: 1,
            startedAt: 1,
            endedAt: 1,
            totalSeconds: 1,
            perMinutePricePaise: 1,
            createdAt: 1,
            callerModel: 1,
            "callerInfo._id": 1,
            "callerInfo.name": 1,
            "callerInfo.phoneNumber": 1,
            "callerInfo.activeImageURL": {
              $cond: [
                { $eq: ["$callerInfo.activeImageType", "avatar"] },
                { $ifNull: ["$callerInfo.avatar", "$callerInfo.profilePicture"] },
                { $ifNull: ["$callerInfo.profilePicture", "$callerInfo.avatar"] },
              ],
            },
            calleeModel: 1,
            "calleeInfo._id": 1,
            "calleeInfo.name": 1,
            "calleeInfo.phoneNumber": 1,
            "calleeInfo.activeImageURL": {
              $cond: [
                { $eq: ["$calleeInfo.activeImageType", "avatar"] },
                { $ifNull: ["$calleeInfo.avatar", "$calleeInfo.profilePicture"] },
                { $ifNull: ["$calleeInfo.profilePicture", "$calleeInfo.avatar"] },
              ],
            },
          },
        },

        { $sort: { createdAt: -1 as 1 } },
      ];

      const serviceResult = await callService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "User call logs with specific profile fetched successfully"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // 📞 Get only active (connected) calls
  static async getAllActiveCall(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const query = {
        status: "connected",
        billingProcessed: { $ne: true },
      };

      const additionalStages = [
        {
          $lookup: {
            from: "users",
            localField: "caller",
            foreignField: "_id",
            as: "callerUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "caller",
            foreignField: "_id",
            as: "callerProvider",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "callee",
            foreignField: "_id",
            as: "calleeUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "callee",
            foreignField: "_id",
            as: "calleeProvider",
          },
        },
        {
          $addFields: {
            callerInfo: {
              $cond: [
                { $eq: ["$callerModel", "User"] },
                { $arrayElemAt: ["$callerUser", 0] },
                { $arrayElemAt: ["$callerProvider", 0] },
              ],
            },
            calleeInfo: {
              $cond: [
                { $eq: ["$calleeModel", "User"] },
                { $arrayElemAt: ["$calleeUser", 0] },
                { $arrayElemAt: ["$calleeProvider", 0] },
              ],
            },
          },
        },
        {
          $project: {
            channel: 1,
            status: 1,
            startedAt: 1,
            endedAt: 1,
            totalSeconds: 1,
            perMinutePricePaise: 1,
            createdAt: 1,
            updatedAt: 1,
            "callerInfo._id": 1,
            "callerInfo.name": 1,
            "callerInfo.phoneNumber": 1,
            "callerInfo.avatar": 1,
            "callerInfo.profilePicture": 1,
            "calleeInfo._id": 1,
            "calleeInfo.name": 1,
            "calleeInfo.phoneNumber": 1,
            "calleeInfo.avatar": 1,
            "calleeInfo.profilePicture": 1,
          },
        },
        { $sort: { createdAt: -1 as 1 } },
      ];

      const serviceResult = await callService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Active (connected) calls fetched successfully",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  // 📞 Get provider call logs (calls where provider is caller or callee)
  static async getProviderCallLogs(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const userIdString = req.user?.id;
      if (!userIdString) throw new ApiError(401, "Unauthorized");
      console.log(userIdString)
      // Convert to ObjectId for proper MongoDB comparison
      const providerId = new mongoose.Types.ObjectId(userIdString);
      console.log("providerId", providerId)
      // Use empty query (filter will be done in aggregation pipeline)
      const query: any = { ...req.query };
      // delete query.status; // Ignore any status filter from the client to fetch all calls

      const additionalStages = [
        // ✅ Match only calls where provider is caller OR callee (FIRST STAGE - critical for filtering)
        {
          $match: {
            $or: [
              { caller: providerId },
              { callee: providerId },
              // { caller: userIdString },
              // { callee: userIdString }
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "caller",
            foreignField: "_id",
            as: "callerUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "caller",
            foreignField: "_id",
            as: "callerProvider",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "callee",
            foreignField: "_id",
            as: "calleeUser",
          },
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "callee",
            foreignField: "_id",
            as: "calleeProvider",
          },
        },
        {
          $addFields: {
            callerInfo: {
              $cond: [
                { $eq: ["$callerModel", "User"] },
                { $arrayElemAt: ["$callerUser", 0] },
                { $arrayElemAt: ["$callerProvider", 0] },
              ],
            },
            calleeInfo: {
              $cond: [
                { $eq: ["$calleeModel", "User"] },
                { $arrayElemAt: ["$calleeUser", 0] },
                { $arrayElemAt: ["$calleeProvider", 0] },
              ],
            },
          },
        },
        {
          $project: {
            channel: 1,
            status: 1,
            startedAt: 1,
            endedAt: 1,
            billedDuration: 1,
            totalSeconds: {
              $max: [
                { $ifNull: ["$totalSeconds", 0] },
                { $ifNull: ["$billedDuration", 0] }
              ]
            },
            perMinutePricePaise: 1,
            createdAt: 1,
            updatedAt: 1,
            recordingMeta: 1,
            callerModel: 1,
            "callerInfo._id": 1,
            "callerInfo.name": 1,
            "callerInfo.phoneNumber": 1,
            "callerInfo.activeImageURL": {
              $cond: [
                { $eq: ["$callerInfo.activeImageType", "avatar"] },
                { $ifNull: ["$callerInfo.avatar", "$callerInfo.profilePicture"] },
                { $ifNull: ["$callerInfo.profilePicture", "$callerInfo.avatar"] },
              ],
            },
            calleeModel: 1,
            "calleeInfo._id": 1,
            "calleeInfo.name": 1,
            "calleeInfo.phoneNumber": 1,
            "calleeInfo.activeImageURL": {
              $cond: [
                { $eq: ["$calleeInfo.activeImageType", "avatar"] },
                { $ifNull: ["$calleeInfo.avatar", "$calleeInfo.profilePicture"] },
                { $ifNull: ["$calleeInfo.profilePicture", "$calleeInfo.avatar"] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 as 1 } },
      ];

      const serviceResult = await callService.getAll(query, additionalStages);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result: serviceResult.result,
            pagination: serviceResult.pagination,
          },
          "Service provider call logs fetched successfully",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  // 📋 Get call logs between authenticated provider and a specific user (with aggregation and formatted response)
  static async getProviderCallLogsWithUser(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const providerId = req.user?.id;
      const userId = req.params.userid;
      if (!providerId || !userId) {
        return res.status(400).json({ success: false, message: "Provider and user ID required" });
      }
      const providerObjId = new mongoose.Types.ObjectId(providerId);
      const userObjId = new mongoose.Types.ObjectId(userId);
      // Aggregation pipeline to match calls between provider and user, and populate info
      const pipeline = [
        {
          $match: {
            $or: [
              { caller: providerObjId, callerModel: "ServiceProvider", callee: userObjId, calleeModel: "User" },
              { caller: userObjId, callerModel: "User", callee: providerObjId, calleeModel: "ServiceProvider" }
            ]
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "caller",
            foreignField: "_id",
            as: "callerUser"
          }
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "caller",
            foreignField: "_id",
            as: "callerProvider"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "callee",
            foreignField: "_id",
            as: "calleeUser"
          }
        },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "callee",
            foreignField: "_id",
            as: "calleeProvider"
          }
        },
        {
          $addFields: {
            callerInfo: {
              $cond: [
                { $eq: ["$callerModel", "User"] },
                { $arrayElemAt: ["$callerUser", 0] },
                { $arrayElemAt: ["$callerProvider", 0] }
              ]
            },
            calleeInfo: {
              $cond: [
                { $eq: ["$calleeModel", "User"] },
                { $arrayElemAt: ["$calleeUser", 0] },
                { $arrayElemAt: ["$calleeProvider", 0] }
              ]
            }
          }
        },
        {
          $project: {
            channel: 1,
            status: 1,
            startedAt: 1,
            endedAt: 1,
            totalSeconds: 1,
            perMinutePricePaise: 1,
            createdAt: 1,
            updatedAt: 1,
            callerModel: 1,
            "callerInfo._id": 1,
            "callerInfo.name": 1,
            "callerInfo.phoneNumber": 1,
            // "callerInfo.profilePicture": 1,
            // "callerInfo.avatar": 1,
            "callerInfo.activeImageUrl": {
              $cond: [
                { $eq: ["$callerInfo.activeImageType", "avatar"] },
                { $ifNull: ["$callerInfo.avatar", "$callerInfo.profilePicture"] },
                { $ifNull: ["$callerInfo.profilePicture", "$callerInfo.avatar"] }
              ]
            },
            calleeModel: 1,
            "calleeInfo._id": 1,
            "calleeInfo.name": 1,
            "calleeInfo.phoneNumber": 1,
            // "calleeInfo.profilePicture": 1,
            // "calleeInfo.avatar": 1,
            "calleeInfo.activeImageUrl": {
              $cond: [
                { $eq: ["$calleeInfo.activeImageType", "avatar"] },
                { $ifNull: ["$calleeInfo.avatar", "$calleeInfo.profilePicture"] },
                { $ifNull: ["$calleeInfo.profilePicture", "$calleeInfo.avatar"] }
              ]
            }
          }
        },
        { $sort: { createdAt: -1 as 1 } }
      ];
      // Pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const [result, totalItems] = await Promise.all([
        CallSession.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        CallSession.aggregate([...pipeline, { $count: "count" }])
      ]);
      const total = totalItems[0]?.count || 0;
      const totalPages = Math.ceil(total / limit) || 1;
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Service provider call logs fetched successfully",
        data: {
          result,
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: total,
            totalPages
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
