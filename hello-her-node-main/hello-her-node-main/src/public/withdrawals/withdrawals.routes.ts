import express from "express";
import { WithdrawalsController } from "./withdrawals.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const router = express.Router();

// All routes require provider to be authenticated
router.post("/", authenticateToken, asyncHandler(WithdrawalsController.requestWithdrawal));
router.get("/", authenticateToken, asyncHandler(WithdrawalsController.getAllWithdrawals));
router.get("/pending", authenticateToken, asyncHandler(WithdrawalsController.getAllPendingWithdrawals));
router.get("/approved", authenticateToken, asyncHandler(WithdrawalsController.getAllApprovedWithdrawals));
router.get("/rejected", authenticateToken, asyncHandler(WithdrawalsController.getAllRejectedWithdrawals));
router.put("/status/:id", asyncHandler(WithdrawalsController.updateWithdrawalStatus))
router.get("/:id", authenticateToken, asyncHandler(WithdrawalsController.getWithdrawalById));
router.put("/complete/:id", authenticateToken, asyncHandler(WithdrawalsController.markWithdrawalCompleted));
router.put("/:id", authenticateToken, asyncHandler(WithdrawalsController.updateWithdrawal));
router.delete("/:id", authenticateToken, asyncHandler(WithdrawalsController.deleteWithdrawal));
// ✅ Get withdrawals of logged-in provider
router.get(
    "/provider/my-withdrawals",
    authenticateToken,
    asyncHandler(WithdrawalsController.getMyWithdrawals)
);

export default router;
