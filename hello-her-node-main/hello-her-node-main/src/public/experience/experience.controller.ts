import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { CommonService } from "../../services/common.services";
import Experience from "../../modals/experience.model";
import mongoose from "mongoose";

const experienceService = new CommonService(Experience);

export class ExperienceController {
    /**
     * 🟢 Create a new experience
     */
    static async createExperience(req: Request, res: Response, next: NextFunction) {
        try {
            const { role, userId, message } = req.body;

            // authenticated requester from middleware
            const requester: any = (req as any).user;
            if (!requester || !requester.id) {
                throw new ApiError(401, "Unauthorized");
            }

            if (!role || !["user", "provider"].includes(role)) {
                throw new ApiError(400, "Role must be either 'user' or 'provider'");
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                console.log("userId", userId);
                throw new ApiError(400, "Valid userId is required");
            }

            if (!message || typeof message !== "string" || message.trim().length === 0) {
                throw new ApiError(400, "Message is required");
            }

            const userModel = role === "user" ? "User" : "ServiceProvider";

            // map requester role to model name
            const submittedByModel = requester.role === "user" ? "User" : requester.role === "provider" ? "ServiceProvider" : "Admin";

            const createdExperience = await experienceService.create({
                role,
                userId: new mongoose.Types.ObjectId(userId),
                userModel,
                message: message.trim(),
                submittedById: new mongoose.Types.ObjectId(requester.id),
                submittedByModel,
            });

            return res
                .status(201)
                .json(new ApiResponse(201, createdExperience, "Experience created successfully"));
        } catch (error) {
            next(error);
        }
    }

    /**
     * 📜 Get all experiences
     */
    static async getAllExperiences(req: Request, res: Response, next: NextFunction) {
        try {
            const queryParams = req.query || {};

            const additionalStages = [
                { $sort: { createdAt: -1 } }, // latest first
            ];

            const result = await experienceService.getAll(queryParams, additionalStages);

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        result,
                        "All experiences fetched successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * 🔍 Get experience by ID
     */
    static async getExperienceById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid experience ID");
            }

            const experience = await experienceService.getById(id, false);
            if (!experience) throw new ApiError(404, "Experience not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        experience,
                        "Experience fetched successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * ✏️ Update experience
     */
    static async updateExperience(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { role, message } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid experience ID");
            }

            const update: any = {};

            if (role !== undefined) {
                if (!["user", "provider"].includes(role)) {
                    throw new ApiError(400, "Role must be either 'user' or 'provider'");
                }
                update.role = role;
            }

            if (message !== undefined) {
                if (typeof message !== "string" || message.trim().length === 0) {
                    throw new ApiError(400, "Message must be a non-empty string");
                }
                update.message = message.trim();
            }

            const updatedExperience = await experienceService.updateById(id, update);
            if (!updatedExperience) throw new ApiError(404, "Experience not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        updatedExperience,
                        "Experience updated successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * 🗑️ Delete experience
     */
    static async deleteExperience(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid experience ID");
            }

            const deleted = await experienceService.deleteById(id);
            if (!deleted) throw new ApiError(404, "Experience not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        deleted,
                        "Experience deleted successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }
}
