import { Request, Response } from "express";
import { Rating } from "../../modals/rating.model";
import { CommonService } from "../../services/common.services";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Types } from "mongoose";

const ratingService = new CommonService(Rating);

const ratingPopulateStages = [
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user",
    },
  },
  {
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "serviceproviders",
      localField: "provider",
      foreignField: "_id",
      as: "provider",
    },
  },
  {
    $unwind: {
      path: "$provider",
      preserveNullAndEmptyArrays: true,
    },
  },
];

export class RatingController {

  // Get rating by ID
  static async getRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rating = await ratingService.getById(id);
      res.status(200).json(new ApiResponse(200, rating, "Rating fetched successfully"));
    } catch (error: any) {
      throw new ApiError(404, error.message || "Rating not found");
    }
  }

  // Get all ratings
  static async getAllRatings(req: Request, res: Response) {
    try {
      const query = req.query; // can include page, limit, filters
      const result = await ratingService.getAll(query, ratingPopulateStages);
      res.status(200).json(new ApiResponse(200, result, "Ratings fetched successfully"));
    } catch (error: any) {
      throw new ApiError(500, error.message || "Failed to fetch ratings");
    }
  }

  // Get all ratings for a specific provider
  static async getRatingsByProvider(req: Request, res: Response) {
    try {
      const { providerId } = req.params;
      const query = {
        ...req.query,
        provider: new Types.ObjectId(providerId),
      };
      const result = await ratingService.getAll(query, ratingPopulateStages);
      res.status(200).json(new ApiResponse(200, result, "Provider ratings fetched successfully"));
    } catch (error: any) {
      throw new ApiError(500, error.message || "Failed to fetch provider ratings");
    }
  }

  // Create a new rating
  static async createRating(req: Request, res: Response) {
    try {
      const rawProviderId = req.body.provider || req.body.providerId || req.params.id;
      if (!rawProviderId || !Types.ObjectId.isValid(rawProviderId)) {
        throw new ApiError(400, "Valid Listener/Provider ID is required");
      }
      const provider = new Types.ObjectId(rawProviderId);

      const rawUserId = req.body.user || req.body.userId || (req as any).user?._id;
      if (!rawUserId || !Types.ObjectId.isValid(rawUserId)) {
        throw new ApiError(400, "Valid User ID is required");
      }
      const user = new Types.ObjectId(rawUserId);

      const ratingNum = Number(req.body.rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
      }

      const reviewText = req.body.review ? String(req.body.review).trim() : "";

      const createdRating = await ratingService.create({
        user,
        provider,
        rating: ratingNum,
        review: reviewText,
      });

      res.status(201).json(new ApiResponse(201, createdRating, "Rating created successfully"));
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ApiError(400, "This user has already rated this provider");
      }
      throw new ApiError(500, error.message || "Failed to create rating");
    }
  }

  // Update an existing rating
  static async updateRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedRating = await ratingService.updateById(id, updateData);
      res.status(200).json(new ApiResponse(200, updatedRating, "Rating updated successfully"));
    } catch (error: any) {
      throw new ApiError(404, error.message || "Failed to update rating");
    }
  }

  // Delete a rating
  static async deleteRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedRating = await ratingService.deleteById(id);
      res.status(200).json(new ApiResponse(200, deletedRating, "Rating deleted successfully"));
    } catch (error: any) {
      throw new ApiError(404, error.message || "Failed to delete rating");
    }
  }
}
