import { Router } from "express";
import { CommissionController  } from "./commission.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/", authenticateToken, asyncHandler(CommissionController .createCommission));
router.get("/", authenticateToken, asyncHandler(CommissionController .getCommission));
router.put("/", authenticateToken, asyncHandler(CommissionController .updateCommission));
router.get("/slab/", authenticateToken, asyncHandler(CommissionController .getAllSlab));
router.post("/slab/", authenticateToken, asyncHandler(CommissionController .addSlab));
router.get("/slab/:slabId", authenticateToken, asyncHandler(CommissionController .getSlabById));
router.delete("/slab/:slabId", authenticateToken, asyncHandler(CommissionController .deleteSlab));
router.put("/slab/:slabId", authenticateToken, asyncHandler(CommissionController .updateSlab));

export default router;
