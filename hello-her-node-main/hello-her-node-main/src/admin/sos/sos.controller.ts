
import { Request, Response, NextFunction } from "express";
import Sos, { ISos } from "../../modals/sos.model";
import { CommonService } from "../../services/common.services";

const sosService = new CommonService<ISos>(Sos);

export default class SosController {

    // ➕ Create SOS
    static async createSos(req: Request, res: Response, next: NextFunction) {
        try {
            console.log("🚨 [SOS] Create called", req.body);

            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: "Message is required",
                });
            }

            const sos = await sosService.create({ message });

            return res.status(201).json({
                success: true,
                message: "SOS created successfully",
                data: sos,
            });

        } catch (error: any) {
            console.error("❌ Error creating SOS:", error.message);
            next(error);
        }
    }

    // 📄 Get all SOS
    static async getAllSos(req: Request, res: Response, next: NextFunction) {
        try {
            console.log("📄 [SOS] Get All called", req.query);

            const data = await sosService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "SOS list fetched successfully",
                data,
            });

        } catch (error: any) {
            console.error("❌ Error fetching SOS:", error.message);
            next(error);
        }
    }

    // 🔍 Get SOS by ID
    static async getSosById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            console.log("🔍 [SOS] Get By ID:", id);

            const sos = await sosService.getById(id);

            return res.status(200).json({
                success: true,
                message: "SOS fetched successfully",
                data: sos,
            });

        } catch (error: any) {
            console.error("❌ Error fetching SOS by ID:", error.message);
            next(error);
        }
    }

    // ✏️ Update SOS
    static async updateSos(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            console.log("✏️ [SOS] Update:", id, req.body);

            const updated = await sosService.updateById(id, req.body);

            return res.status(200).json({
                success: true,
                message: "SOS updated successfully",
                data: updated,
            });

        } catch (error: any) {
            console.error("❌ Error updating SOS:", error.message);
            next(error);
        }
    }

    // ❌ Delete SOS
    static async deleteSos(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            console.log("🗑️ [SOS] Delete:", id);

            await sosService.deleteById(id);

            return res.status(200).json({
                success: true,
                message: "SOS deleted successfully",
            });

        } catch (error: any) {
            console.error("❌ Error deleting SOS:", error.message);
            next(error);
        }
    }
    
    // 🚨 SOS notification request
    static async requestSosNotification(req: Request, res: Response, next: NextFunction) {
        try {
            // Get provider id from token
            const providerId = (req as any).user?.id;
            // Get userId and sosId from body
            const { userId, sosId } = req.body;
            if (!providerId || !userId || !sosId) {
                return res.status(400).json({ success: false, message: "providerId, userId, and sosId are required" });
            }

            // Fetch SOS message for notification
            const sos = await sosService.getById(sosId);
            if (!sos) {
                return res.status(404).json({ success: false, message: "SOS not found" });
            }

            // Send notification to user
            try {
                const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
                const io = req.app.get("socketio");
                const getSocketUser = req.app.get("getSocketUser");
                await createAndEmitNotification({
                    type: "sos_request",
                    title: "SOS Warning",
                    message: sos.message || "You have received an SOS Warning.",
                    recipientId: userId,
                    recipientType: "user",
                    senderId: providerId,
                    senderType: "provider",
                    metadata: { sosId },
                    io,
                    getSocketUser,
                });
            } catch (notifError) {
                console.error("Error sending SOS notification:", notifError);
                // Don't fail the request if notification fails
            }

            return res.status(200).json({ success: true, message: "SOS notification sent to user" });
        } catch (error) {
            console.error("❌ Error in SOS notification request:", error);
            next(error);
        }
    }
}