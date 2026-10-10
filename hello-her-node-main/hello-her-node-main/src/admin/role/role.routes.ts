import express from "express";
import { RoleController } from "./role.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const { createRole, getAllRoles, getRoleById, updateRoleById, deleteRoleById } =
  RoleController;

const router = express.Router();

router
  .get("/",  asyncHandler(getAllRoles))
  .post("/", authenticateToken, asyncHandler(createRole))
  .get("/:id", asyncHandler(getRoleById))
  .put("/:id", authenticateToken, asyncHandler(updateRoleById))
  .delete("/:id", authenticateToken, asyncHandler(deleteRoleById));

export default router;
