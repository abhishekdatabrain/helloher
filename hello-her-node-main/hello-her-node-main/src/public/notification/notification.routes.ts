import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const notificationRouter = Router();

// Get my notifications (authenticated user/provider)
notificationRouter.get(
  "/me",
  authenticateToken,
  asyncHandler(NotificationController.getMyNotifications)
);

// Get notification stats
notificationRouter.get(
  "/stats",
  authenticateToken,
  asyncHandler(NotificationController.getNotificationStats)
);

// Mark notification as read
notificationRouter.put(
  "/:id/read",
  authenticateToken,
  asyncHandler(NotificationController.markAsRead)
);

// Mark all notifications as read
notificationRouter.put(
  "/read-all",
  authenticateToken,
  asyncHandler(NotificationController.markAllAsRead)
);

notificationRouter.delete(
  "/delete-all",
  authenticateToken,
  asyncHandler(NotificationController.deleteAllNotifications)
);

// Delete notification
notificationRouter.delete(
  "/:id",
  authenticateToken,
  asyncHandler(NotificationController.deleteNotification)
);

// Admin routes
notificationRouter.get(
  "/all",
  authenticateToken,
  isAdmin,
  asyncHandler(NotificationController.getAllNotifications)
);

notificationRouter.post(
  "/",
  authenticateToken,
  isAdmin,
  asyncHandler(NotificationController.createNotification)
);

export default notificationRouter;


