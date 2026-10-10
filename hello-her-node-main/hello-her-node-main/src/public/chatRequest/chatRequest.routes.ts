import { Router } from "express";
import { ChatRequestController } from "./chatRequest.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

// User sends chat request
router.post(
    "/",
    authenticateToken,
    asyncHandler(ChatRequestController.sendChatRequest)
);

// Provider gets pending requests
router.get(
    "/provider",
    authenticateToken,
    asyncHandler(ChatRequestController.getProviderChatRequests)
);

// User get requests
router.get(
    "/user",
    authenticateToken,
    asyncHandler(ChatRequestController.getUserChatRequests)
);
// Provider accepts request
router.patch(
    "/:id/accept",
    authenticateToken,
    asyncHandler(ChatRequestController.acceptChatRequest)
);

// Provider rejects request
router.patch(
    "/:id/reject",
    authenticateToken,
    asyncHandler(ChatRequestController.rejectChatRequest)
);

// Admin / debug
router.get(
    "/",
    authenticateToken,
    asyncHandler(ChatRequestController.getAllChatRequests)
);

export default router;