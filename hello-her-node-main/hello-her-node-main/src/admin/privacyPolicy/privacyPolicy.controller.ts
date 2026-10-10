import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import { PrivacyPolicy, IPrivacyPolicy } from "../../modals/privacyPolicy.model";

const PrivacyPolicyService = new CommonService(PrivacyPolicy);

export class PrivacyPolicyController {
  // Create Privacy Policy (Admin only)
  static async createPrivacyPolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { title, content, image, status, seo } = req.body;

      // Validation
      if (!title || !content) {
        return res
          .status(400)
          .json(new ApiError(400, "Title and content are required"));
      }

      const policyData: Partial<IPrivacyPolicy> = {
        title,
        content,
        image: image || undefined,
        status: status || "ACTIVE",
        seo: seo || undefined,
      };

      const result = await PrivacyPolicyService.create(policyData);
      if (!result) {
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create Privacy Policy"));
      }

      return res
        .status(201)
        .json(
          new ApiResponse(201, result, "Privacy Policy created successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  // Get all Privacy Policies
  static async getAllPrivacyPolicies(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await PrivacyPolicyService.getAll(req.query);
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Privacy Policies fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  // Get Privacy Policy by ID
  static async getPrivacyPolicyById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await PrivacyPolicyService.getById(req.params.id, false);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Privacy Policy not found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Privacy Policy fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  // Get Active Privacy Policy (Public endpoint)
  static async getActivePrivacyPolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await PrivacyPolicy.findOne({ status: "ACTIVE" });
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "No active Privacy Policy found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Privacy Policy fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  // Update Privacy Policy by ID (Admin only)
  static async updatePrivacyPolicyById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { title, content, image, status, seo } = req.body;

      const updateData: Partial<IPrivacyPolicy> = {};

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (image !== undefined) updateData.image = image;
      if (status !== undefined) updateData.status = status;
      if (seo !== undefined) updateData.seo = seo;

      const result = await PrivacyPolicyService.updateById(
        req.params.id,
        updateData
      );
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update Privacy Policy"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Privacy Policy updated successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  // Delete Privacy Policy by ID (Admin only)
  static async deletePrivacyPolicyById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await PrivacyPolicyService.deleteById(req.params.id);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete Privacy Policy"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Privacy Policy deleted successfully")
        );
    } catch (err) {
      next(err);
    }
  }
}
