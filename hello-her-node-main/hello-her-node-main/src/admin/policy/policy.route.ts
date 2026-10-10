import express from "express";
import { PolicyController } from "./policy.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  updatePolicyById,
  deletePolicyById,
} = PolicyController;

const router = express.Router();

router
  .get("/", asyncHandler(getAllPolicies))
  .post("/", authenticateToken, asyncHandler(createPolicy))
  .get("/:id", authenticateToken, asyncHandler(getPolicyById))
  .put("/:id", authenticateToken, asyncHandler(updatePolicyById))
  .delete("/:id", authenticateToken, asyncHandler(deletePolicyById));

export default router;
