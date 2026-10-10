import { Router } from "express";
import {
  createAvatar,
  getAllAvatars,
  getAllPublicAvatars,
  getAvatarById,
  updateAvatar,
  deleteAvatar,
} from "./avatar.controller";

import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

/**
 * Upload config for avatar image
 * field: imageUrl
 */
const avatarUpload = [
  dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
  s3UploaderMiddleware("avatars"),
];

// CREATE
router.post(
  "/",
  authenticateToken,
  isAdmin,
  ...avatarUpload,
  asyncHandler(createAvatar)
);

// GET ALL
router.get("/", asyncHandler(getAllAvatars));
router.get("/public", asyncHandler(getAllPublicAvatars));

// GET BY ID
router.get("/:id", asyncHandler(getAvatarById));

// UPDATE
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  ...avatarUpload,
  asyncHandler(updateAvatar)
);

// DELETE
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteAvatar)
);

export default router;
