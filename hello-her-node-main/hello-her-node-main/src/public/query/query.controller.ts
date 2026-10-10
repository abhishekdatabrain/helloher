import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { CommonService } from "../../services/common.services";
import Query, { QueryStatus } from "../../modals/query.model";
import mongoose from "mongoose";

const queryService = new CommonService(Query);

const ALLOWED_STATUSES: QueryStatus[] = ["pending", "under_review", "resolved", "escalated", "closed"];
const ALLOWED_ROLES = ["user", "provider"];

export class QueryController {
    /**
     * 🟢 Create a new query
     */
    static async createQuery(req: Request, res: Response, next: NextFunction) {
        try {
            const { role, name, email, phone, message } = req.body;

            if (!role || !ALLOWED_ROLES.includes(role)) {
                throw new ApiError(400, "Role must be either 'user' or 'provider'");
            }

            if (!name || typeof name !== "string" || name.trim().length === 0) {
                throw new ApiError(400, "Name is required");
            }

            if (!email || typeof email !== "string") {
                throw new ApiError(400, "Email is required");
            }

            if (!phone || typeof phone !== "string") {
                throw new ApiError(400, "Phone is required");
            }

            if (!message || typeof message !== "string" || message.trim().length === 0) {
                throw new ApiError(400, "Message is required");
            }

            const createdQuery = await queryService.create({
                role,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                message: message.trim(),
                // status defaults to "pending" in the model
            });

            return res
                .status(201)
                .json(new ApiResponse(201, createdQuery, "Query created successfully"));
        } catch (error) {
            next(error);
        }
    }

    /**
     * 📜 Get all queries
     */
    static async getAllQueries(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await queryService.getAll(req.query);
            return res
                .status(200)
                .json(new ApiResponse(200, result, "All Queries fetched successfully"))
        } catch (err) {
            next(err)
        }
    }

    /**
     * 🔍 Get query by ID
     */
    static async getQueryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid query ID");
            }

            const query = await queryService.getById(id, false);
            if (!query) throw new ApiError(404, "Query not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(200, query, "Query fetched successfully")
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * ✏️ Update query
     */
    static async updateQuery(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { role, name, email, phone, status, message } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid query ID");
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

            if (email !== undefined) {
                update.email = email.trim().toLowerCase();
            }

            if (phone !== undefined) {
                update.phone = phone.trim();
            }

            if (status !== undefined) {
                if (!ALLOWED_STATUSES.includes(status)) {
                    throw new ApiError(400, `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
                }
                update.status = status;
            }

            if (message !== undefined) {
                if (typeof message !== "string" || message.trim().length === 0) {
                    throw new ApiError(400, "Message must be a non-empty string");
                }
                update.message = message.trim();
            }

            const updatedQuery = await queryService.updateById(id, update);
            if (!updatedQuery) throw new ApiError(404, "Query not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(200, updatedQuery, "Query updated successfully")
                );
        } catch (error) {
            next(error);
        }
    }

    /**
     * 🗑️ Delete query
     */
    static async deleteQuery(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid query ID");
            }

            const deleted = await queryService.deleteById(id);
            if (!deleted) throw new ApiError(404, "Query not found");

            return res
                .status(200)
                .json(
                    new ApiResponse(200, deleted, "Query deleted successfully")
                );
        } catch (error) {
            next(error);
        }
    }
}
