import { Router } from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { CallController } from "./call.controller";
import { CallRecordingController } from "./callRecording.controller";

import callRecordingRoutes from "./callRecording.routes";

const router = Router();

// 🟢 Call endpoints
router.post("/token", authenticateToken, asyncHandler(CallController.createToken));
router.post("/initiate", authenticateToken, asyncHandler(CallController.initiateCall));
router.post("/connected", authenticateToken, asyncHandler(CallController.markConnected));
router.post("/end", asyncHandler(CallController.endCall));

// 🌟 fetch calls belonging to authenticated user
router.get("/user", authenticateToken, asyncHandler(CallController.getUserCallLogs));

// 🌟 fetch calls for a specific user by user ID
router.get("/user/:id", authenticateToken, asyncHandler(CallController.getUserCallLogsById));

// 🌟 fetch calls belonging to authenticated service provider
router.get("/provider", authenticateToken, asyncHandler(CallController.getProviderCallLogs));

// 🌟 fetch calls between authenticated provider and a specific user
router.get("/provider/:userid", authenticateToken, asyncHandler(CallController.getProviderCallLogsWithUser));

router.get("/", asyncHandler(CallController.getAllCallLogs));
router.get("/active", asyncHandler(CallController.getAllActiveCall));

// 🔴 Call Recording endpoints (mounted under /recordings)
router.use("/recordings", callRecordingRoutes);

export default router;