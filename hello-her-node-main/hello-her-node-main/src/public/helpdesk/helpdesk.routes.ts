import express from "express";
import { HelpdeskController } from "./helpdesk.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";

const router = express.Router();

const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketStats,
} = HelpdeskController;

// Public routes

// Create helpdesk ticket with optional image uploads for issue
router.post(
  "/",authenticateToken,
  dynamicUpload([
    { name: "screenshots", maxCount: 5 }, // Max 5 images per issue
  ]),
  s3UploaderMiddleware("helpdesk"),
  asyncHandler(createTicket)
);

// Get all tickets with filtering
router.get("/", asyncHandler(getAllTickets));

// Get ticket statistics
router.get("/stats", authenticateToken, isAdmin, asyncHandler(getTicketStats));

// Get ticket by ID
router.get("/:id", asyncHandler(getTicketById));

// Admin routes

// Update ticket (admin only)
router.put("/:id", authenticateToken, isAdmin, asyncHandler(updateTicket));

// Delete ticket (admin only)
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteTicket)
);

export default router;
