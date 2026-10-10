import express from "express";
import { FaqController } from "./faq.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import faqCategoryRoutes from "./faqcategory.routes";

const {
  createFaq,
  getAllFaqs,
  getFaqById,
  updateFaqById,
  deleteFaqById,
  getFaqsByCategory,
} = FaqController;

const router = express.Router();

// FAQ Category routes
router.use("/category", faqCategoryRoutes);

// Public routes (Read operations)
router.get("/", asyncHandler(getAllFaqs));
router.get("/category/:categoryId", asyncHandler(getFaqsByCategory));
router.get("/:id", asyncHandler(getFaqById));

// Admin routes (Write operations)
router.post("/", authenticateToken, isAdmin, asyncHandler(createFaq));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(updateFaqById));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(deleteFaqById));

export default router;
