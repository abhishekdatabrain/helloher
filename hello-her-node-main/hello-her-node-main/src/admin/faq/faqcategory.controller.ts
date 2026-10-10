import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import { FaqCategory, IFaqCategory } from "../../modals/faqcategory.model";

const FaqCategoryService = new CommonService(FaqCategory);

export class FaqCategoryController {
  // Create FAQ Category (Admin only)
  static async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res
          .status(400)
          .json(new ApiError(400, "Category name is required"));
      }

      // Check for duplicate category name
      const existingCategory = await FaqCategory.findOne({ name });
      if (existingCategory) {
        return res
          .status(400)
          .json(new ApiError(400, "Category with this name already exists"));
      }

      const categoryData: Partial<IFaqCategory> = {
        name,
        description: description || undefined,
        isActive: true,
      };

      const result = await FaqCategoryService.create(categoryData);
      if (!result) {
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create category"));
      }

      return res
        .status(201)
        .json(new ApiResponse(201, result, "Category created successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get all FAQ Categories
  static async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNumber = Math.max(parseInt(String(page), 10), 1);
      const limitNumber = Math.max(parseInt(String(limit), 10), 1);
      const skip = (pageNumber - 1) * limitNumber;

      const [result, totalCount] = await Promise.all([
        FaqCategory.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        FaqCategory.countDocuments({}),
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
          "Categories fetched successfully"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // Get Category by ID
  static async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await FaqCategoryService.getById(req.params.id);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Category not found"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Category fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Update Category by ID (Admin only)
  static async updateCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { name, description, isActive } = req.body;

      // Check if new name already exists (if changing name)
      if (name) {
        const existingCategory = await FaqCategory.findOne({
          name,
          _id: { $ne: req.params.id },
        });
        if (existingCategory) {
          return res
            .status(400)
            .json(new ApiError(400, "Category with this name already exists"));
        }
      }

      const updateData: Partial<IFaqCategory> = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      const result = await FaqCategoryService.updateById(
        req.params.id,
        updateData
      );
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update category"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Category updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Delete Category by ID (Admin only)
  static async deleteCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await FaqCategoryService.deleteById(req.params.id);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete category"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Category deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
