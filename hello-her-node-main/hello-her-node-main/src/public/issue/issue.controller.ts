import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { CommonService } from "../../services/common.services";
import Issue, { IssueStatus } from "../../modals/issue.model";
import mongoose from "mongoose";

const issueService = new CommonService(Issue);

const ALLOWED_STATUSES: IssueStatus[] = ["pending", "under_review", "resolved", "escalated", "closed"];
const ALLOWED_CATEGORIES = ["payment", "technical", "account", "service", "other"];
const ALLOWED_ROLES = ["user", "provider"];

export class IssueController {
    /**
     * 🟢 Create a new issue
     */
    static async createIssue(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                role,
                name,
                mobile,
                email,
                issueCategory,
                message,
            } = req.body;

            if (!role || !ALLOWED_ROLES.includes(role)) {
                throw new ApiError(400, "Role must be either 'user' or 'provider'");
            }

            if (!name || typeof name !== "string" || name.trim().length === 0) {
                throw new ApiError(400, "Name is required");
            }

            if (!issueCategory) {
                throw new ApiError(400, "Issue category is required");
            }

            if (!ALLOWED_CATEGORIES.includes(issueCategory)) {
                throw new ApiError(400, "Invalid issue category");
            }

            if (!message || typeof message !== "string" || message.trim().length === 0) {
                throw new ApiError(400, "Message is required");
            }

            // 🖼️ Screenshot (uploaded to S3 via middleware)
            let screenshotUrl: string | undefined;
            if (Array.isArray(req.body.screenshot) && req.body.screenshot.length > 0) {
                screenshotUrl = req.body.screenshot[0].url;
            }

            const createdIssue = await issueService.create({
                role,
                name: name.trim(),
                mobile: mobile?.trim(),
                email: email?.trim().toLowerCase(),
                issueCategory,
                message: message.trim(),
                screenshot: screenshotUrl,
            });

            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        createdIssue,
                        "Issue created successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * 📜 Get all issues
     */
    static async getAllIssues(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await issueService.getAll(req.query);
            return res
                .status(200)
                .json(new ApiResponse(200, result, "All Issues fetched successfully"))
        } catch (err) {
            next(err)
        }
    }

    /**
     * 🔍 Get issue by ID
     */
    static async getIssueById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid issue ID");
            }

            const issue = await issueService.getById(id, false);
            if (!issue) throw new ApiError(404, "Issue not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        issue,
                        "Issue fetched successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * ✏️ Update issue
     */
    static async updateIssue(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const {
                role,
                name,
                mobile,
                email,
                status,
                issueCategory,
                message,
            } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid issue ID");
            }

            const update: any = {};

            if (role !== undefined) {
                if (!ALLOWED_ROLES.includes(role)) {
                    throw new ApiError(400, "Role must be either 'user' or 'provider'");
                }
                update.role = role;
            }

            if (name !== undefined) {
                if (typeof name !== "string" || name.trim().length === 0) {
                    throw new ApiError(400, "Name must be a non-empty string");
                }
                update.name = name.trim();
            }

            if (mobile !== undefined) {
                update.mobile = mobile?.trim();
            }

            if (email !== undefined) {
                update.email = email?.trim().toLowerCase();
            }

            if (status !== undefined) {
                if (!ALLOWED_STATUSES.includes(status)) {
                    throw new ApiError(400, `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
                }
                update.status = status;
            }

            if (issueCategory !== undefined) {
                if (!ALLOWED_CATEGORIES.includes(issueCategory)) {
                    throw new ApiError(400, "Invalid issue category");
                }
                update.issueCategory = issueCategory;
            }

            if (message !== undefined) {
                if (typeof message !== "string" || message.trim().length === 0) {
                    throw new ApiError(400, "Message must be a non-empty string");
                }
                update.message = message.trim();
            }

            // 🖼️ Screenshot update (optional)
            if (Array.isArray(req.body.screenshot) && req.body.screenshot.length > 0) {
                update.screenshot = req.body.screenshot[0].url;
            }

            const updatedIssue = await issueService.updateById(id, update);
            if (!updatedIssue) throw new ApiError(404, "Issue not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        updatedIssue,
                        "Issue updated successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * 🗑️ Delete issue
     */
    static async deleteIssue(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid issue ID");
            }

            const deleted = await issueService.deleteById(id);
            if (!deleted) throw new ApiError(404, "Issue not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        deleted,
                        "Issue deleted successfully"
                    )
                );
        } catch (error) {
            next(error);
        }
    }
}
