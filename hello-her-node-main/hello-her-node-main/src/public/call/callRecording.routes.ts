import { Router } from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { CallRecordingController } from "./callRecording.controller";


const router = Router();

router.post("/start", authenticateToken, asyncHandler(CallRecordingController.start));
router.post("/stop", authenticateToken, asyncHandler(CallRecordingController.stop));
router.get("/", authenticateToken, asyncHandler(CallRecordingController.getAll));
router.get("/:sessionId", authenticateToken, asyncHandler(CallRecordingController.getById));
router.delete("/:sessionId", authenticateToken, asyncHandler(CallRecordingController.delete));

export default router;


