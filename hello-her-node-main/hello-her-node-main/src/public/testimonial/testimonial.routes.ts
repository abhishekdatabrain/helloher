import { Router } from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  getAllPublicTestimonials,
} from "../testimonial/testimonial.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

router.post(
  "/",
  authenticateToken,
  isAdmin,
  dynamicUpload([{ name: "image", maxCount: 1 }]),
  s3UploaderMiddleware("testimonial"),
  asyncHandler(createTestimonial)
);
router.get("/", asyncHandler(getAllTestimonials));
router.get("/public", asyncHandler(getAllPublicTestimonials))
router.get(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(getTestimonialById)
);
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  dynamicUpload([{ name: "image", maxCount: 1 }]),
  s3UploaderMiddleware("testimonial"),
  asyncHandler(updateTestimonial)
);
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteTestimonial)
);
export default router;
