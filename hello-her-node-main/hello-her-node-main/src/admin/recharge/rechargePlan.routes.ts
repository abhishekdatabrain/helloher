import express from "express";
import { RechargePlanController } from "./rechargePlan.controller"
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();

router.post("/",  authenticateToken,asyncHandler(RechargePlanController.createPlan));
router.get("/", asyncHandler(RechargePlanController.getAllPlans));
router.get("/:id", asyncHandler(RechargePlanController.getPlanById));
router.put("/:id", authenticateToken, asyncHandler(RechargePlanController.updatePlan));
router.delete("/:id", authenticateToken, asyncHandler(RechargePlanController.deletePlan));

export default router;
