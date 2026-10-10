import { Request, Response } from "express";
import mongoose from "mongoose";
import ChatRequest from "../../modals/chatRequest.model";
import { CommonService } from "../../services/common.services";

const chatRequestService = new CommonService(ChatRequest);

export class ChatRequestController {

    // ✅ User sends chat request
    static async sendChatRequest(req: Request | any, res: Response) {
        try {

            const userId = req.user.id;
            const { providerId } = req.body;

            if (!providerId) {
                return res.status(400).json({
                    success: false,
                    message: "providerId is required",
                });
            }

            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid providerId",
                });
            }

            // check existing request
            const existing = await ChatRequest.findOne({
                userId,
                providerId,
            });

            let request;
            if (existing) {
                // If previously rejected, allow resend by resetting back to requested
                if (existing.status === "rejected") {
                    request = await chatRequestService.updateById(existing._id.toString(), {
                        status: "requested",
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Chat request already exists",
                    });
                }
            } else {
                request = await chatRequestService.create({
                    userId,
                    providerId,
                    status: "requested",
                });
            }

            // 🔔 Notify provider about new chat request
            try {
                const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
                const io = req.app.get("socketio");
                const getSocketUser = req.app.get("getSocketUser");

                await createAndEmitNotification({
                    type: "chat_request",
                    title: "New Chat Request",
                    message: "You have a new chat request",
                    recipientId: providerId,
                    recipientType: "provider",
                    senderId: userId,
                    senderType: "user",
                    metadata: {
                        chatRequestId: request._id?.toString(),
                    },
                    io,
                    getSocketUser,
                });
            } catch (notifError) {
                console.error("Error sending chat request notification:", notifError);
                // Don't fail request on notification error
            }

            return res.status(201).json({
                success: true,
                message: "Chat request sent successfully",
                data: request,
            });

        } catch (error: any) {
            console.error("Error sending chat request:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    }

    // ✅ Provider gets pending requests
    static async getProviderChatRequests(req: Request | any, res: Response) {
        try {

            const providerId = req.user.id;

            // merge provider filter into query
            const query = {
                ...req.query,
                providerId,
                status: "requested",
            };

            // populate user + provider details for easier client consumption
            const additionalStages = [
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "provider",
                    },
                },
                {
                    $addFields: {
                        userId: { $arrayElemAt: ["$user", 0] },
                        providerId: { $arrayElemAt: ["$provider", 0] },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        "userId._id": 1,
                        "userId.name": 1,
                        // choose only the active image type for users
                        "userId.profilePicture": {
                            $cond: [
                                { $eq: ["$userId.activeImageType", "avatar"] },
                                "$userId.avatar",
                                "$userId.profilePicture",
                            ],
                        },
                        "userId.activeImageType": 1,
                        "providerId._id": 1,
                        "providerId.name": 1,
                        "providerId.profilePicture": 1,
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ];

            const requests = await chatRequestService.getAll(query, additionalStages);

            return res.status(200).json({
                success: true,
                data: requests.result,
                requestCount: requests.pagination?.totalItems ?? requests.result.length,
                pagination: requests.pagination,
            });

        } catch (error: any) {
            console.error("Error fetching chat requests:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    }

    // ✅ User gets their chat requests
    static async getUserChatRequests(req: Request | any, res: Response) {
        try {

            const userId = req.user.id;
            console.log(userId, "userID is ")
            // merge user filter into query
            const query = {
                ...req.query,
                userId,
                // optionally filter status if needed
                // status: "requested",
            };

            // populate user + provider details
            const additionalStages = [
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "provider",
                    },
                },
                {
                    $addFields: {
                        userId: { $arrayElemAt: ["$user", 0] },
                        providerId: { $arrayElemAt: ["$provider", 0] },
                    },
                },
                {
                    $project: {
                        _id: 1,

                        // USER (self)
                        "userId._id": 1,
                        "userId.name": 1,
                        "userId.profilePicture": {
                            $cond: [
                                { $eq: ["$userId.activeImageType", "avatar"] },
                                "$userId.avatar",
                                "$userId.profilePicture",
                            ],
                        },
                        "userId.activeImageType": 1,

                        // PROVIDER (important for user view)
                        "providerId._id": 1,
                        "providerId.name": 1,
                        "providerId.profilePicture": 1,

                        status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ];

            const requests = await chatRequestService.getAll(query, additionalStages);

            return res.status(200).json({
                success: true,
                data: requests.result,
                requestCount: requests.pagination?.totalItems ?? requests.result.length,
                pagination: requests.pagination,
            });

        } catch (error: any) {
            console.error("Error fetching user chat requests:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    }

    static async acceptChatRequest(req: Request | any, res: Response) {
        try {

            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "Invalid request id",
                });
            }

            const existingRequest = await ChatRequest.findById(id);
            if (!existingRequest) {
                return res.status(404).json({
                    message: "Chat request not found",
                });
            }

            const updated = await chatRequestService.updateById(id, {
                status: "accepted",
            });

            // 🔔 Notify user that their request was accepted
            try {
                const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
                const io = req.app.get("socketio");
                const getSocketUser = req.app.get("getSocketUser");

                await createAndEmitNotification({
                    type: "chat_request_accepted",
                    title: "Chat Request Accepted",
                    message: "Your chat request has been accepted.",
                    recipientId: existingRequest.userId.toString(),
                    recipientType: "user",
                    senderId: req.user.id,
                    senderType: "provider",
                    metadata: {
                        chatRequestId: id,
                    },
                    io,
                    getSocketUser,
                });
            } catch (notifError) {
                console.error("Error sending chat request accepted notification:", notifError);
                // Do not fail request on notification error
            }

            return res.status(200).json({
                success: true,
                message: "Chat request accepted",
                data: updated,
            });

        } catch (error) {
            console.error("Error accepting request:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }

    // ❌ Provider rejects request
    static async rejectChatRequest(req: Request | any, res: Response) {
        try {

            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: "Invalid request id",
                });
            }

            const existingRequest = await ChatRequest.findById(id);
            if (!existingRequest) {
                return res.status(404).json({
                    message: "Chat request not found",
                });
            }

            const updated = await chatRequestService.updateById(id, {
                status: "rejected",
            });

            // 🔔 Notify user that their request was rejected
            try {
                const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
                const io = req.app.get("socketio");
                const getSocketUser = req.app.get("getSocketUser");

                await createAndEmitNotification({
                    type: "chat_request_rejected",
                    title: "Chat Request Rejected",
                    message: "Your chat request has been rejected.",
                    recipientId: existingRequest.userId.toString(),
                    recipientType: "user",
                    senderId: req.user.id,
                    senderType: "provider",
                    metadata: {
                        chatRequestId: id,
                    },
                    io,
                    getSocketUser,
                });
            } catch (notifError) {
                console.error("Error sending chat request rejected notification:", notifError);
                // Do not fail request on notification error
            }

            return res.status(200).json({
                success: true,
                message: "Chat request rejected",
                data: updated,
            });

        } catch (error) {
            console.error("Error rejecting request:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }

    // 📄 Get all chat requests (admin / debug)
    static async getAllChatRequests(req: Request | any, res: Response) {
        try {

            const query = req.query;

            const requests = await chatRequestService.getAll(query);

            return res.status(200).json({
                success: true,
                data: requests,
            });

        } catch (error: any) {
            console.error("Error fetching chat requests:", error);
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        }
    }

}