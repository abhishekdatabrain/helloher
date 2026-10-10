import { Router } from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { WalletTransactionController } from "./walletTransaction.controller";


// const router = express.Router();
const router = Router()
router.get("/", authenticateToken, asyncHandler(WalletTransactionController.getAllTransactions));
router.get("/user", authenticateToken, asyncHandler(WalletTransactionController.getAllUserRechargeTransactions));
router.get("/user/stats", authenticateToken, asyncHandler(WalletTransactionController.getUserStats));
router.get("/user/:id", authenticateToken, asyncHandler(WalletTransactionController.getUserTransactionsById));
router.get("/provider/:providerId", authenticateToken, asyncHandler(WalletTransactionController.getAllProviderTransactions));
// rest are not usable although their respective controllers are being builded 
router.post("/", authenticateToken, asyncHandler(WalletTransactionController.createTransaction));
router.get("/:id", authenticateToken, asyncHandler(WalletTransactionController.getTransactionById));
router.put("/:id", authenticateToken, asyncHandler(WalletTransactionController.updateTransaction));
router.delete("/:id", authenticateToken, asyncHandler(WalletTransactionController.deleteTransaction));
router.get("/me/user", authenticateToken, asyncHandler(WalletTransactionController.getMyUserTransactions));
router.get("/me/provider", authenticateToken, asyncHandler(WalletTransactionController.getMyProviderTransactions));

export default router;
