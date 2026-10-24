import { Router } from "express";
import { TrustScoreController } from "./trustScore.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

// CREATE (every interaction)
router.post(
  "/",
  authenticateToken,
  asyncHandler(TrustScoreController.createTrustScore)
);

// UPDATE (edit specific entry)
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(TrustScoreController.updateTrustScore)
);

// ✅ Create / Update trust score (user)
// router.post(
//   "/",
//   authenticateToken,
//   asyncHandler(TrustScoreController.upsertTrustScore)
// );

// ✅ Get all (admin)
router.get(
  "/",
  authenticateToken,
  isAdmin,
  asyncHandler(TrustScoreController.getAllTrustScores)
);

// ✅ Get provider average trust score
router.get(
  "/provider/:providerId/average",
  asyncHandler(TrustScoreController.getProviderAverage)
);

// ✅ Get provider reviews & trust scores (Used by User app and Provider app)
router.get(
  "/provider/:providerId/reviews",
  asyncHandler(TrustScoreController.getProviderReviews)
);
router.get(
  "/provider/:providerId",
  asyncHandler(TrustScoreController.getProviderReviews)
);

// ✅ Get logged-in provider's own reviews (Provider app convenience)
router.get(
  "/my-reviews",
  authenticateToken,
  asyncHandler(TrustScoreController.getMyReviews)
);

// ✅ Get by ID
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(TrustScoreController.getTrustScoreById)
);

// ✅ Delete
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(TrustScoreController.deleteTrustScore)
);

export default router;