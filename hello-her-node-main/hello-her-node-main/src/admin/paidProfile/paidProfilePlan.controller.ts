import { Request, Response, NextFunction } from "express";
import { PaidProfilePlan } from "../../modals/paidProfilePlan.model";
import { PaidProfileSetting } from "../../modals/paidProfile.model";
import { CommonService } from "../../services/common.services";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";

export class PaidProfilePlanController {
    private static service = new CommonService(PaidProfilePlan as any);

    static async createPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, amount, durationDays, description } = req.body;

            if (!name || typeof name !== "string" || !name.trim())
                throw new ApiError(400, "name is required");

            if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0)
                throw new ApiError(400, "valid amount is required");

            if (
                durationDays === undefined ||
                isNaN(Number(durationDays)) ||
                Number(durationDays) <= 0
            )
                throw new ApiError(400, "durationDays must be greater than 0");

            const plan = await PaidProfilePlanController.service.create({
                name: name.trim(),
                amount: Number(amount),
                durationDays: Number(durationDays),
                description: description ? String(description) : "",
            } as any);

            return res
                .status(201)
                .json(new ApiResponse(201, plan, "Paid profile plan created"));
        } catch (error) {
            next(error);
        }
    }


    static async getAllPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await PaidProfilePlanController.service.getAll(req.query || {});
            return res.status(200).json(new ApiResponse(200, result, "OK"));
        } catch (error) {
            next(error);
        }
    }

    static async getPlanById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) throw new ApiError(400, "Plan id required");
            const plan = await PaidProfilePlanController.service.getById(id);
            return res.status(200).json(new ApiResponse(200, plan, "OK"));
        } catch (error) {
            next(error);
        }
    }

    static async updatePlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const update: any = {};
            const { name, amount, durationDays, description } = req.body;

            if (name !== undefined) {
                if (!String(name).trim())
                    throw new ApiError(400, "name cannot be empty");
                update.name = String(name).trim();
            }

            if (amount !== undefined) {
                if (isNaN(Number(amount)) || Number(amount) <= 0)
                    throw new ApiError(400, "amount must be greater than 0");
                update.amount = Number(amount);
            }

            if (durationDays !== undefined) {
                if (isNaN(Number(durationDays)) || Number(durationDays) <= 0)
                    throw new ApiError(400, "durationDays must be greater than 0");
                update.durationDays = Number(durationDays);
            }

            if (description !== undefined)
                update.description = String(description);

            const updated = await PaidProfilePlanController.service.updateById(id, update);

            return res.status(200).json(new ApiResponse(200, updated, "Updated"));
        } catch (error) {
            next(error);
        }
    }


    static async deletePlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deleted = await PaidProfilePlanController.service.deleteById(id);
            return res.status(200).json(new ApiResponse(200, deleted, "Deleted"));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle paid profile feature on/off
     */
    static async toggleFeature(req: Request, res: Response, next: NextFunction) {
        try {
            const { enabled } = req.body;

            if (typeof enabled !== "boolean")
                throw new ApiError(400, "enabled must be a boolean");

            const setting = await PaidProfileSetting.findOneAndUpdate(
                { key: "paid_profile_enabled" },
                { key: "paid_profile_enabled", enabled },
                { upsert: true, new: true }
            );

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        setting,
                        `Paid profile feature ${enabled ? "enabled" : "disabled"}`
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get paid profile feature status
     */
    static async getFeatureStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const setting = await PaidProfileSetting.findOne({ key: "paid_profile_enabled" });
            const enabled = setting?.enabled ?? true; // Default enabled if not set

            return res
                .status(200)
                .json(new ApiResponse(200, { enabled }, "Feature status"));
        } catch (error) {
            next(error);
        }
    }
}
