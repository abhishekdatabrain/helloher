import express from "express";
import { ExperienceController } from "./experience.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();

router.post("/", authenticateToken, asyncHandler(ExperienceController.createExperience));
router.get("/", authenticateToken, asyncHandler(ExperienceController.getAllExperiences));
router.get("/:id", authenticateToken, asyncHandler(ExperienceController.getExperienceById));
router.put("/:id", authenticateToken, asyncHandler(ExperienceController.updateExperience));
router.delete("/:id", authenticateToken, asyncHandler(ExperienceController.deleteExperience));

export default router;
