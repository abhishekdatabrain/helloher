import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Avatar, IAvatar } from "../../modals/avatar.model";
import { CommonService } from "../../services/common.services";
import { extractImageUrl } from "../banner/banner.controller";

const avatarService = new CommonService<IAvatar>(Avatar);

const parseIsActive = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).toLowerCase().trim();
  if (["true", "1", "yes", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive"].includes(normalized)) return false;

  return undefined;
};

// CREATE AVATAR
export const createAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // multer + s3 middleware assign array to req.body.imageUrl
    const image =
      req?.body?.imageUrl?.[0]?.url ||
      (typeof req?.body?.imageUrl === "string" ? req.body.imageUrl : undefined);
    if (!image) {
      return res
        .status(403)
        .json(new ApiError(403, "Avatar image is required."));
    }

    const normalizedIsActive = parseIsActive(req.body?.isActive);
    const data: Partial<IAvatar> = {
      ...req.body,
      imageUrl: image,
      ...(normalizedIsActive !== undefined && { isActive: normalizedIsActive }),
    } as any;

    const avatar = await avatarService.create(data);
    return res
      .status(201)
      .json(new ApiResponse(201, avatar, "Avatar created successfully"));
  } catch (error) {
    next(error);
  }
};

// GET ALL AVATARS
export const getAllAvatars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await avatarService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Avatars fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET ALL PUBLIC AVATARS (ACTIVE ONLY)
export const getAllPublicAvatars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await avatarService.getAll({
      ...req.query,
      isActive: true,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Avatars fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET AVATAR BY ID
export const getAvatarById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const avatar = await avatarService.getById(req.params.id);
    return res
      .status(200)
      .json(new ApiResponse(200, avatar, "Avatar fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// UPDATE AVATAR
export const updateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const record = await avatarService.getById(req.params.id, false);
    const imageUrl = await extractImageUrl(
      req?.body?.imageUrl,
      record?.imageUrl as string
    );
    const normalizedIsActive = parseIsActive(req.body?.isActive);

    const updates: Partial<IAvatar> = {
      ...req.body,
      ...(req?.body?.imageUrl !== undefined && { imageUrl }),
      ...(normalizedIsActive !== undefined && { isActive: normalizedIsActive }),
    } as any;

    const avatar = await avatarService.updateById(req.params.id, updates);
    return res
      .status(200)
      .json(new ApiResponse(200, avatar, "Avatar updated successfully"));
  } catch (error) {
    next(error);
  }
};

// DELETE AVATAR
export const deleteAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const avatar = await avatarService.deleteById(req.params.id);
    return res
      .status(200)
      .json(new ApiResponse(200, avatar, "Avatar deleted successfully"));
  } catch (error) {
    next(error);
  }
};
