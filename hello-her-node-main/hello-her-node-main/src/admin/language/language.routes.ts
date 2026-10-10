import express from "express";
import LanguageController from "./language.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const {
  createLanguage,
  getLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
  getPublicLanguages,
} = LanguageController;

const router = express.Router();

// Public routes (Read)
router.get("/public", asyncHandler(getPublicLanguages));
router.get("/", asyncHandler(getLanguages));
router.get("/:id", asyncHandler(getLanguageById));

// Admin routes (Write)
router.post("/", authenticateToken, isAdmin, asyncHandler(createLanguage));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(updateLanguage));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(deleteLanguage));

export default router;