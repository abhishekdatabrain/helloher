import express from "express";
import { QueryController } from "./query.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();

router.post("/",  asyncHandler(QueryController.createQuery));
router.get("/", authenticateToken, asyncHandler(QueryController.getAllQueries));
router.get("/:id", authenticateToken, asyncHandler(QueryController.getQueryById));
router.put("/:id", authenticateToken, asyncHandler(QueryController.updateQuery));
router.delete("/:id", authenticateToken, asyncHandler(QueryController.deleteQuery));

export default router;
