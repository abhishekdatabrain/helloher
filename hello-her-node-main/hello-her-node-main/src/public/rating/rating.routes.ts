import { Router } from "express";
import { RatingController } from "./rating.controller"
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const ratingRouter = Router();

ratingRouter.get("/", asyncHandler(RatingController.getAllRatings)); // GET all ratings
ratingRouter.get("/:id", asyncHandler(RatingController.getRating)); // GET rating by ID
ratingRouter.get("/provider/:providerId", asyncHandler(RatingController.getRatingsByProvider)); // GET all ratings of a provider
ratingRouter.post("/:id?", authenticateToken, asyncHandler(RatingController.createRating)); // Create
ratingRouter.put("/:id", authenticateToken, asyncHandler(RatingController.updateRating)); // Update
ratingRouter.delete("/:id", authenticateToken, asyncHandler(RatingController.deleteRating)); // Delete

export default ratingRouter;
