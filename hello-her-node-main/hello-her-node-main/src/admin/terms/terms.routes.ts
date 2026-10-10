import express from "express";
import { TermsController } from "./terms.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const {
  createTerms,
  getAllTerms,
  getTermsById,
  updateTermsById,
  deleteTermsById,
} = TermsController;

const router = express.Router();
// router.use(authenticateToken);
router
  .get("/", asyncHandler(getAllTerms))
  .post("/", authenticateToken, asyncHandler(createTerms))
  .get("/:id", asyncHandler(getTermsById))
  .put("/:id", authenticateToken, asyncHandler(updateTermsById))
  .delete("/:id", authenticateToken, asyncHandler(deleteTermsById));

export default router;
