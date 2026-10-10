import express from "express";
import { PrivacyPolicyController } from "./privacyPolicy.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const {
  createPrivacyPolicy,
  getAllPrivacyPolicies,
  getPrivacyPolicyById,
  updatePrivacyPolicyById,
  deletePrivacyPolicyById,
  getActivePrivacyPolicy,
} = PrivacyPolicyController;

const router = express.Router();

// Public routes (Read operations)
router.get("/active", asyncHandler(getActivePrivacyPolicy));
router.get("/", asyncHandler(getAllPrivacyPolicies));
router.get("/:id", asyncHandler(getPrivacyPolicyById));

// Admin routes (Write operations)
router.post("/", authenticateToken, isAdmin, asyncHandler(createPrivacyPolicy));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(updatePrivacyPolicyById));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(deletePrivacyPolicyById));

export default router;
