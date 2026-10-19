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

// Test FCM push notification directly from Postman
notificationRouter.post(
  "/test-fcm",
  asyncHandler(async (req, res) => {
    const { token, title, body, data } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token is required in body" });
    }
    const { sendPushNotification } = await import("../../services/pushNotification.service");
    const response = await sendPushNotification({
      token,
      title: title || "Test Notification",
      body: body || "Hello from HelloHer Backend!",
      data: data || { type: "test" },
    });
    return res.status(200).json({ success: true, message: "Push sent successfully", response });
  })
);

export default notificationRouter;


