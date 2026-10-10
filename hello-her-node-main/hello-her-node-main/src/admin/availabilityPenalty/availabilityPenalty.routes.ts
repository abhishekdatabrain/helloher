import { Router } from "express";
import { AvailabilityPenaltyController } from "./availabilityPenalty.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, isAdmin, asyncHandler(AvailabilityPenaltyController.getSettings));
router.post("/", authenticateToken, isAdmin, asyncHandler(AvailabilityPenaltyController.createSetting));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(AvailabilityPenaltyController.updateSetting));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(AvailabilityPenaltyController.deleteSetting));
router.post("/manual-penalty", authenticateToken, isAdmin, asyncHandler(AvailabilityPenaltyController.applyManualPenalty));

export default router;
