import express from "express";
import { IssueController } from "./issue.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";

const router = express.Router();

// 🟢 Create issue (with optional screenshot)
router.post(
    "/",
    authenticateToken,
    dynamicUpload([{ name: "screenshot", maxCount: 1 }]),
    s3UploaderMiddleware("issues"),
    asyncHandler(IssueController.createIssue)
);

router.get("/", authenticateToken, asyncHandler(IssueController.getAllIssues));
router.get("/:id", authenticateToken, asyncHandler(IssueController.getIssueById));

// ✏️ Update issue (optional screenshot)
router.put(
    "/:id",
    authenticateToken,
    dynamicUpload([{ name: "screenshot", maxCount: 1 }]),
    s3UploaderMiddleware("issues"),
    asyncHandler(IssueController.updateIssue)
);

router.delete("/:id", authenticateToken, asyncHandler(IssueController.deleteIssue));

export default router;
