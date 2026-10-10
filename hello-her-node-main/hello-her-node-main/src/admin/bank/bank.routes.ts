import { Router } from "express";
import {
  createBank,
  getAllBanks,
  getBankById,
  updateBank,
  deleteBank,
  //   addBulkBanks ,
} from "./bank.controller";

import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// CREATE
router.post(
  "/",
  authenticateToken,
  isAdmin,
  asyncHandler(createBank)
);

// GET ALL
router.get("/", asyncHandler(getAllBanks));

// GET BY ID
router.get("/:id", asyncHandler(getBankById));

// UPDATE
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(updateBank)
);

// DELETE
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteBank)
);

// router.post(
//   "/bulk",
//   authenticateToken,
//   isAdmin,
//   asyncHandler(addBulkBanks)
// );
export default router;