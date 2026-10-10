import { Router } from "express";
import {
  createAgreement,
  getAllAgreements,
  getAgreementById,
  updateAgreement,
  deleteAgreement,
} from "./agreement.controller";

import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

router.post("/", authenticateToken, isAdmin,
  dynamicUpload([{ name: "pdfUrl", maxCount: 1 }]),
  s3UploaderMiddleware("agreements"),
  asyncHandler(createAgreement)
);

// ✅ Get All
router.get("/", asyncHandler(getAllAgreements));

// ✅ Get By Id
router.get("/:id", authenticateToken, isAdmin, asyncHandler(getAgreementById));

// ✅ Update Agreement (optional PDF re-upload)
router.put("/:id", authenticateToken, isAdmin,
  dynamicUpload([{ name: "pdfUrl", maxCount: 1 }]),
  s3UploaderMiddleware("agreements"),
  asyncHandler(updateAgreement)
);

// ✅ Delete
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteAgreement)
);

export default router;