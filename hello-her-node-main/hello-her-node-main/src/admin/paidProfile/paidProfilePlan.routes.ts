import { Router } from "express";
import { PaidProfilePlanController } from "./paidProfilePlan.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/", authenticateToken, isAdmin, asyncHandler(PaidProfilePlanController.createPlan));
router.get("/", authenticateToken, asyncHandler(PaidProfilePlanController.getAllPlans));
router.get("/:id", authenticateToken, isAdmin, asyncHandler(PaidProfilePlanController.getPlanById));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(PaidProfilePlanController.updatePlan));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(PaidProfilePlanController.deletePlan));

// Feature toggle endpoints
router.post("/feature/toggle", authenticateToken, isAdmin, asyncHandler(PaidProfilePlanController.toggleFeature));
router.get("/feature/status", authenticateToken, asyncHandler(PaidProfilePlanController.getFeatureStatus));

export default router;
