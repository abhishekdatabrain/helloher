import { Router } from "express";
import { 
    // rechargeWallet,
     verifyRechargePayment, createRechargeOrder } from "./wallet.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";


const router = Router();

// Recharge wallet using a recharge plan
// router.post("/recharge", authenticateToken, asyncHandler(rechargeWallet));

router.post("/recharge/order", authenticateToken, asyncHandler(createRechargeOrder));
router.post("/recharge/verify", authenticateToken, asyncHandler(verifyRechargePayment));

// Get user's wallet and transactions
// router.get("/", authenticateToken, asyncHandler(getWallet)); //fxn not added yet  

export default router;
