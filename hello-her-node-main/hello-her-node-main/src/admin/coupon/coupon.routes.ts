import express from "express";
import { CouponController } from "./coupon.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();

// Admin-protected write ops
router.post("/", authenticateToken, asyncHandler(CouponController.createCoupon));
router.put("/:id", authenticateToken, asyncHandler(CouponController.updateCouponById));
router.delete("/:id", authenticateToken, asyncHandler(CouponController.deleteCouponById));

// Reads
router.get("/", asyncHandler(CouponController.getAllCoupons));
router.get("/public", asyncHandler(CouponController.getAllPublicCoupons));
router.get("/validate/by-code", asyncHandler(CouponController.validateByCode)); // optional
router.get("/:id", asyncHandler(CouponController.getCouponById));

export default router;
