import mongoose from "mongoose";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import BannerModel from "../../modals/banner.model";
import { deleteFromS3 } from "../../config/s3Uploader";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";

const allowedStates = ["active", "inactive"];
const allowedTypes = ["home", "recharge"]; // ✅ NEW

type UploadedFile = Express.Multer.File & { url?: string; location?: string };

const resolveUploadUrl = (value: any) => {
  if (!value) return "";
  return value.url || value.location || value.path || "";
};

const getUploadedImageUrl = (req: Request) => {
  const bodyImage = req?.body?.image;
  const fileFromBody = Array.isArray(bodyImage) ? bodyImage[0] : bodyImage;
  const fileFromFiles = (req.files as Record<string, Express.Multer.File[]> | undefined)?.image?.[0];

  return resolveUploadUrl(fileFromBody) || resolveUploadUrl(fileFromFiles);
};

export const extractImageUrl = async (input: any, existing: string) => {
  if (!input || (Array.isArray(input) && input.length === 0))
    return existing || "";
  if (Array.isArray(input) && input.length > 0) {
    const newUrl = input[0]?.url;
    if (existing && existing !== newUrl) {
      const s3Key = existing.split(".com/")[1];
      await deleteFromS3(s3Key);
    }
    return newUrl || "";
  }
  if (typeof input === "string") return input;
  return existing || "";
};

const BannerService = new CommonService(BannerModel);

export class BannerController {
  static async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const image = getUploadedImageUrl(req);

      if (!image)
        return res
          .status(403)
          .json(new ApiError(403, "Banner Image is Required."));

      // validate isActive
      if (req.body.isActive && !allowedStates.includes(req.body.isActive))
        return res
          .status(400)
          .json(new ApiError(400, "Invalid isActive value."));

      // ✅ validate type
      if (!req.body.type || !allowedTypes.includes(req.body.type))
        return res
          .status(400)
          .json(new ApiError(400, "Invalid or missing type (home | recharge)."));

      if (req.body.cta1 && typeof req.body.cta1 !== "object")
        return res
          .status(400)
          .json(new ApiError(400, "Invalid cta1 format."));

      const result = await BannerService.create({ ...req.body, image });
      if (!result)
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create banner"));
      return res
        .status(201)
        .json(new ApiResponse(201, result, "Created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const query: any = { ...req.query };

      if (query.type && !allowedTypes.includes(query.type)) {
        return res
          .status(400)
          .json(new ApiError(400, "Invalid type filter"));
      }

      const result = await BannerService.getAll(query);

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllPublicBanners(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // public banners should only return active ones
      const query: any = { isActive: "active" };

      if (req.query.type) {
        if (!allowedTypes.includes(req.query.type as string)) {
          return res
            .status(400)
            .json(new ApiError(400, "Invalid type filter"));
        }
        query.type = req.query.type;
      }

      const result = await BannerService.getAll(query);

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getBannerById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BannerService.getById(req.params.id);
      if (!result)
        return res.status(404).json(new ApiError(404, "banner not found"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateBannerById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      const image = getUploadedImageUrl(req);
      if (!mongoose.Types.ObjectId.isValid(id))
        return res
          .status(400)
          .json(new ApiError(400, "Invalid banner ID"));

      const record = await BannerService.getById(id);
      if (!record) {
        return res.status(404).json(new ApiError(404, "Banner not found."));
      }

      // validate incoming enum/cta fields for update
      if (req.body.isActive && !allowedStates.includes(req.body.isActive))
        return res
          .status(400)
          .json(new ApiError(400, "Invalid isActive value."));

      // ✅ validate type
      if (req.body.type && !allowedTypes.includes(req.body.type))
        return res
          .status(400)
          .json(new ApiError(400, "Invalid type value (home | recharge)."));

      if (req.body.cta1 && typeof req.body.cta1 !== "object")
        return res
          .status(400)
          .json(new ApiError(400, "Invalid cta1 format."));

      let imageUrl;
      if (req?.body?.image && record.image)
        imageUrl = await extractImageUrl(
          req?.body?.image,
          record.image as string
        );

      const result = await BannerService.updateById(req.params.id, {
        ...req.body,
        image: imageUrl || image || record.image,
      });
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update banner"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteBannerById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await BannerService.deleteById(req.params.id);
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete banner"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
