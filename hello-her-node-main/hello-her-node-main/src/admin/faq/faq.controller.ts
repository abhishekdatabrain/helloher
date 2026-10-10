import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import { Faq, IFaq, FaqVisibility } from "../../modals/faq.model";

const FaqService = new CommonService(Faq);

export class FaqController {
  // Create FAQ (Admin only)
  static async createFaq(req: Request, res: Response, next: NextFunction) {
    try {
      const { question, answer, category, visibilityFor, pageSlug, isActive } =
        req.body;

      // Validation
      if (!question || !answer || !category) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "question, answer, and category are required"
            )
          );
      }

      const faqData: Partial<IFaq> = {
        question,
        answer,
        category,
        visibilityFor: visibilityFor || "all",
        pageSlug: pageSlug || undefined,
        isActive: isActive !== undefined ? isActive : true,
      };

      const result = await FaqService.create(faqData);
      if (!result) {
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create FAQ"));
      }

      return res
        .status(201)
        .json(new ApiResponse(201, result, "FAQ created successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get all FAQs with optional userType filter
  static async getAllFaqs(req: Request, res: Response, next: NextFunction) {
    try {
      const { userType, page = 1, limit = 10 } = req.query;

      const pageNumber = Math.max(parseInt(String(page), 10), 1);
      const limitNumber = Math.max(parseInt(String(limit), 10), 1);
      const skip = (pageNumber - 1) * limitNumber;

      // Build filter query
      let matchStage: any = {
        isActive: true,
      };

      if (userType) {
        // Show FAQs visible to "all" or the specific userType
        matchStage.$or = [
          { visibilityFor: "all" },
          { visibilityFor: userType },
        ];
      }

      // Execute query with pagination
      const [result, totalCount] = await Promise.all([
        Faq.find(matchStage)
          .populate("category")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        Faq.countDocuments(matchStage),
      ]);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result,
            pagination: {
              currentPage: pageNumber,
              itemsPerPage: limitNumber,
              totalItems: totalCount,
              totalPages: Math.ceil(totalCount / limitNumber),
            },
          },
          "FAQs fetched successfully"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // Get FAQ by ID
  static async getFaqById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FaqService.getById(req.params.id);
      if (!result) {
        return res.status(404).json(new ApiError(404, "FAQ not found"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "FAQ fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Update FAQ by ID (Admin only)
  static async updateFaqById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { question, answer, category, visibilityFor, pageSlug, isActive } =
        req.body;

      const updateData: Partial<IFaq> = {};

      if (question !== undefined) updateData.question = question;
      if (answer !== undefined) updateData.answer = answer;
      if (category !== undefined) updateData.category = category;
      if (visibilityFor !== undefined) updateData.visibilityFor = visibilityFor;
      if (pageSlug !== undefined) updateData.pageSlug = pageSlug;
      if (isActive !== undefined) updateData.isActive = isActive;

      const result = await FaqService.updateById(req.params.id, updateData);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update FAQ"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "FAQ updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Delete FAQ by ID (Admin only)
  static async deleteFaqById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FaqService.deleteById(req.params.id);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete FAQ"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "FAQ deleted successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get FAQs by category with optional userType filter
  static async getFaqsByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryId } = req.params;
      const { userType, page = 1, limit = 10 } = req.query;

      const pageNumber = Math.max(parseInt(String(page), 10), 1);
      const limitNumber = Math.max(parseInt(String(limit), 10), 1);
      const skip = (pageNumber - 1) * limitNumber;

      let query: any = {
        category: categoryId,
        isActive: true,
      };

      if (userType) {
        query.$or = [
          { visibilityFor: "all" },
          { visibilityFor: userType },
        ];
      }

      const [result, totalCount] = await Promise.all([
        Faq.find(query)
          .populate("category")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        Faq.countDocuments(query),
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              result,
              pagination: {
                currentPage: pageNumber,
                itemsPerPage: limitNumber,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limitNumber),
              },
            },
            "FAQs by category fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }
}
