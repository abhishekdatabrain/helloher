import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import TermsModel from "../../modals/terms.model";
import { CommonService } from "../../services/common.services";

export const TermsService = new CommonService(TermsModel);
export class TermsController {
    static async createTerms(req: Request, res: Response, next: NextFunction) {
        const adminid = (req as any).user.id;
        console.log("admin id is", (req as any).user);
        try {
            const { type, ...rest } = req.body;
            await TermsModel.updateMany(
                { type, isActive: true },  // filter old active terms
                { $set: { isActive: false } }  // deactivate them
            );
            // Find latest version for this type
            const lastTerms = await TermsModel.findOne({ type }).sort({ version: -1 });
            const version = lastTerms ? lastTerms.version + 1 : 1;
            const termandcondition = {
                ...rest,
                createdBy: adminid,
                type, version
            }
            const result = await TermsService.create(termandcondition);

            if (!result)
                return res
                    .status(400)
                    .json(new ApiError(400, "Failed to create Terms"));

            return res
                .status(201)
                .json(new ApiResponse(201, result, "Terms created successfully"));
        } catch (err) {
            next(err);
        }
    }

    static async getAllTerms(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TermsService.getAll(req.query);
            return res
                .status(200)
                .json(new ApiResponse(200, result, "Terms fetched successfully"));
        } catch (err) {
            next(err);
        }
    }

    static async getTermsById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TermsService.getById(req.params.id);
            if (!result)
                return res.status(404).json(new ApiError(404, "Terms not found"));

            return res
                .status(200)
                .json(new ApiResponse(200, result, "Terms fetched successfully"));
        } catch (err) {
            next(err);
        }
    }

    static async updateTermsById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TermsService.updateById(req.params.id, req.body);
            if (!result)
                return res.status(404).json(new ApiError(404, "Failed to update Terms"));

            return res
                .status(200)
                .json(new ApiResponse(200, result, "Terms updated successfully"));
        } catch (err) {
            next(err);
        }
    }

    static async deleteTermsById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TermsService.deleteById(req.params.id);
            if (!result)
                return res.status(404).json(new ApiError(404, "Failed to delete Terms"));

            return res
                .status(200)
                .json(new ApiResponse(200, result, "Terms deleted successfully"));
        } catch (err) {
            next(err);
        }
    }
}
