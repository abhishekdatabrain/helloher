import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { AvailabilityPenaltySetting } from "../../modals/availabilityPenaltySetting.model";
import { applyManualPenalty } from "../../services/availabilityPenalty.service";

const SettingsService = new CommonService(AvailabilityPenaltySetting as any);
const FIXED_KEY = "availability_penalty";

export class AvailabilityPenaltyController {
    static async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AvailabilityPenaltySetting.findOne({ key: FIXED_KEY });
            return res.status(200).json(new ApiResponse(200, result, "OK"));
        } catch (error) {
            next(error);
        }
    }

    static async createSetting(req: Request, res: Response, next: NextFunction) {
        try {
            const { minCallsPerDay, minOnlineHoursPerDay, penaltyAmountRs, enabled, meta } = req.body;
            const existing = await AvailabilityPenaltySetting.findOne({ key: FIXED_KEY });
            if (existing) throw new ApiError(400, "Setting already exists (availability_penalty)");
            const created = await SettingsService.create({ key: FIXED_KEY, minCallsPerDay, minOnlineHoursPerDay, penaltyAmountRs, enabled, meta } as any);
            return res.status(201).json(new ApiResponse(201, created, "Created"));
        } catch (error) {
            next(error);
        }
    }

    static async updateSetting(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const update = req.body;
            const updated = await SettingsService.updateById(id, update as any);
            return res.status(200).json(new ApiResponse(200, updated, "Updated"));
        } catch (error) {
            next(error);
        }
    }

    static async deleteSetting(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const deleted = await SettingsService.deleteById(id);
            return res.status(200).json(new ApiResponse(200, deleted, "Deleted"));
        } catch (error) {
            next(error);
        }
    }

    static async applyManualPenalty(req: Request, res: Response, next: NextFunction) {
        try {
            const { providerId, penaltyAmountRs, reason } = req.body;
            if (!providerId || !penaltyAmountRs || !reason) {
                throw new ApiError(400, "providerId, penaltyAmountRs, and reason are required");
            }
            if (penaltyAmountRs <= 0) {
                throw new ApiError(400, "penaltyAmountRs must be positive");
            }

            const io = req.app.get("socketio");
            const getSocketUser = req.app.get("getSocketUser");

            const result = await applyManualPenalty({
                providerId,
                penaltyAmountRs,
                reason,
                io,
                getSocketUser,
            });

            return res.status(200).json(new ApiResponse(200, result, "Manual penalty applied successfully"));
        } catch (error) {
            next(error);
        }
    }
}

export default AvailabilityPenaltyController;
