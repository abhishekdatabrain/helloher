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
  isAdmin,
  asyncHandler(TrustScoreController.deleteTrustScore)
);

export default router;