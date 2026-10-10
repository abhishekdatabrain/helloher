import { Router } from "express";
import { RevenueController } from "./revenue.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", authenticateToken, asyncHandler(RevenueController.getYearlyRevenue));

export default router;
