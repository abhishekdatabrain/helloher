import { Router } from "express";
import {
    createPaidProfileOrder,
    verifyPaidProfilePayment,
    getMyPaidProfiles,
} from "./paidProfile.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/order", authenticateToken, asyncHandler(createPaidProfileOrder));
router.post("/verify", authenticateToken, asyncHandler(verifyPaidProfilePayment));
router.get("/me", authenticateToken, asyncHandler(getMyPaidProfiles));

export default router;
