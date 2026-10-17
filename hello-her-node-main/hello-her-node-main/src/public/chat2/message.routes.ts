import { Router } from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { MessageController } from "./message.controller";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

router.post(
  "/",
  authenticateToken,
  dynamicUpload([{ name: "media", maxCount: 10 }]),
  s3UploaderMiddleware("chat-media"),
  asyncHandler(MessageController.createMessage)
);

router.get("/all", authenticateToken, asyncHandler(MessageController.getAllMessages));
router.get("/user/conversations", authenticateToken, asyncHandler(MessageController.getUserConversations));
router.get("/provider/conversations", authenticateToken, asyncHandler(MessageController.getProviderConversations));
router.get("/chat/:userId/:providerId", authenticateToken, asyncHandler(MessageController.getChatBetweenUsers));
router.get("/:id", authenticateToken, asyncHandler(MessageController.getMessageById));
router.put("/mark-read", authenticateToken, asyncHandler(MessageController.markMessagesAsRead));
router.put("/mark-delivered", authenticateToken, asyncHandler(MessageController.markMessagesAsDelivered));
router.get("/", authenticateToken, asyncHandler(MessageController.getUniqueConversations));
  
export default router;
