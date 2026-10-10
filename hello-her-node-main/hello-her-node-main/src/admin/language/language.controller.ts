import { Request, Response, NextFunction } from "express";
import Language, { ILanguage } from "../../modals/language.model";
import { CommonService } from "../../services/common.services";
import ApiResponse from "../../utils/ApiResponse";

const languageService = new CommonService<ILanguage>(Language);

export default class LanguageController {

  // ➕ Create Language
  static async createLanguage(req: Request, res: Response, next: NextFunction) {
    try {
      let { label, value } = req.body;
      if (!label) {
        return res.status(400).json({ success: false, message: "Label is required" });
      }
      // If value not provided, use label with first letter capitalized, rest lowercase
      if (!value) {
        value = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
      }
      const language = await languageService.create({
        label,
        value,
      });

      return res.status(201).json({
        success: true,
        message: "Language created successfully",
        data: language,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Language already exists",
        });
      }
      next(error);
    }
  }

  // 🌐 Public - Get only active languages
  static async getPublicLanguages(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const queryObj: any = { ...req.query, isActive: true };

      let disablePagination = false;

      if (
        queryObj.pagination === "false" ||
        queryObj.pagination === false
      ) {
        disablePagination = true;
      } else if (queryObj.pagination === "true") {
        queryObj.pagination = true;
      }

      if (disablePagination) {
        const filters: any = { ...queryObj };

        delete filters.pagination;
        delete filters.page;
        delete filters.limit;
        delete filters.sortKey;
        delete filters.sortDir;

        const allLanguages = await Language.find(filters);

        return res.status(200).json(
          new ApiResponse(200, allLanguages, "Languages fetched successfully")
        );
      }

      const result: any = await languageService.getAll(queryObj);

      return res.status(200).json(
        new ApiResponse(200, result, "Languages fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  // 📄 Get All Languages
  static async getLanguages(req: Request, res: Response, next: NextFunction) {
    try {
      const languages = await languageService.getAll(
        req.query,
        [
          {
            $project: {
              _id: 1,
              label: 1,
              value: 1,
              isActive: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
          {
            $sort: { label: 1 } // A-Z sort
          }
        ]
      );

      // return res.status(200).json({
      //   success: true,
      //   ...languages,
      // });
      return res
        .status(201)
        .json(new ApiResponse(201, languages, "Languages fetched successfully"));

    } catch (error) {
      next(error);
    }
  }

  // 🔍 Get Language By ID
  static async getLanguageById(req: Request, res: Response, next: NextFunction) {
    try {
      const language = await languageService.getById(req.params.id);

      return res.status(200).json({
        success: true,
        data: language,
      });
    } catch (error) {
      next(error);
    }
  }

  // ✏️ Update Language
  static async updateLanguage(req: Request, res: Response, next: NextFunction) {
    try {
      // Accept label, value, isActive for update
      const updatePayload: any = {};
      if (req.body.label !== undefined) updatePayload.label = req.body.label;
      if (req.body.value !== undefined) updatePayload.value = req.body.value;
      if (req.body.isActive !== undefined) updatePayload.isActive = req.body.isActive;

      const updated = await languageService.updateById(
        req.params.id,
        updatePayload
      );

      return res.status(200).json({
        success: true,
        message: "Language updated successfully",
        data: updated,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Language already exists",
        });
      }
      next(error);
    }
  }

  // ❌ Delete Language
  static async deleteLanguage(req: Request, res: Response, next: NextFunction) {
    try {
      await languageService.deleteById(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Language deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}