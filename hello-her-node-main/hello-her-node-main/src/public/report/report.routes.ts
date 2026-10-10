import express from "express";
import ReportController from "./report.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();

// Create a new report (provider)
router.post(
  "/",
  authenticateToken,
  asyncHandler(ReportController.createReport)
);

// Get all reports (admin)
router.get(
  "/",
  authenticateToken,
  asyncHandler(ReportController.getReports)
);

// Get a report by ID
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(ReportController.getReportById)
);

// Update report (admin action: status and remark)
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(ReportController.updateReport)
);

// Delete a report
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(ReportController.deleteReport)
);

export default router;
