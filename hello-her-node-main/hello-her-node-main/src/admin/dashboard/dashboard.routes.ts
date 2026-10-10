import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/",  DashboardController.getDashboard);
router.get("/v3",  DashboardController.getDashboardV3);

router.get("/analytics", authenticateToken, DashboardController.getAnalytics);

export default router;
