import express from "express";
import { FaqCategoryController } from "./faqcategory.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
} = FaqCategoryController;

const router = express.Router();

// Public routes (Read operations)
router.get("/", asyncHandler(getAllCategories));
router.get("/:id", asyncHandler(getCategoryById));

// Admin routes (Write operations)
router.post("/", authenticateToken, isAdmin, asyncHandler(createCategory));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(updateCategoryById));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(deleteCategoryById));

export default router;
