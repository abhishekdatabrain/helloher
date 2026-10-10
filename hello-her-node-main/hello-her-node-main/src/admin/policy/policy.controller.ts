import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import PolicyModel from "../../modals/policy.model";

const PolicyService = new CommonService(PolicyModel);

export class PolicyController {
  static async createPolicy(req: Request, res: Response, next: NextFunction) {
    const adminid = (req as any).user.id;
    try {
      const { type, ...rest } = req.body;
      await PolicyModel.updateMany(
        { type, isActive: true },  // filter old active terms
        { $set: { isActive: false } }  // deactivate them
    );
      // Find latest version for this type
      const lastPolicy = await PolicyModel.findOne({ type }).sort({ version: -1 });
      const version = lastPolicy ? lastPolicy.version + 1 : 1;
      const policy ={
        ...rest,
        createdBy:adminid,
        type,version
      }
      const result = await PolicyService.create(policy);
      if (!result)
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create Policy"));

      return res
        .status(201)
        .json(new ApiResponse(201, result, "Policy created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PolicyService.getAll(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Policies fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getPolicyById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PolicyService.getById(req.params.id);
      if (!result)
        return res.status(404).json(new ApiError(404, "Policy not found"));

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Policy fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updatePolicyById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PolicyService.updateById(req.params.id, req.body);
      if (!result)
        return res.status(404).json(new ApiError(404, "Failed to update Policy"));

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Policy updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deletePolicyById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PolicyService.deleteById(req.params.id);
      if (!result)
        return res.status(404).json(new ApiError(404, "Failed to delete Policy"));

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Policy deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
