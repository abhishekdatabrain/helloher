import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { TrustScore } from "../../modals/trustScore.model";
import { CommonService } from "../../services/common.services";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";

const trustScoreService = new CommonService(TrustScore);

export class TrustScoreController {
  static async createTrustScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId, trustScore, review } = req.body;
      const user = (req as any).user;

      if (!user?.id) throw new ApiError(401, "Unauthorized");

      if (!providerId || trustScore === undefined)
        throw new ApiError(400, "providerId and trustScore are required");

      if (!mongoose.Types.ObjectId.isValid(providerId))
        throw new ApiError(400, "Invalid providerId");

      if (trustScore < 0 || trustScore > 100)
        throw new ApiError(400, "trustScore must be between 0 and 100");

      const newScore = await TrustScore.create({
        userId: new mongoose.Types.ObjectId(user.id), // ✅ FIXED
        providerId,
        trustScore,
        review: review ? String(review).trim() : "",
      });

      return res
        .status(201)
        .json(new ApiResponse(201, newScore, "Trust score created"));
    } catch (err: any) {
      if (err.code === 11000) {
        return next(new ApiError(409, "Duplicate entry"));
      }
      next(err);
    }
  }

  static async updateTrustScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { trustScore, review } = req.body;
      const user = (req as any).user;

      if (!mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Invalid trustScore id");

      const updateData: any = {};
      if (trustScore !== undefined) {
        if (trustScore < 0 || trustScore > 100)
          throw new ApiError(400, "trustScore must be between 0 and 100");
        updateData.trustScore = trustScore;
      }

      if (review !== undefined) {
        updateData.review = String(review).trim();
      }

      const updated = await TrustScore.findOneAndUpdate(
        { _id: id, userId: user.id }, // ✅ ownership check
        updateData,
        { new: true }
      );

      if (!updated)
        throw new ApiError(404, "Trust score not found or not authorized");

      return res
        .status(200)
        .json(new ApiResponse(200, updated, "Updated successfully"));
    } catch (err) {
      next(err);
    }
  }
  
  // ✅ Create or Update (UPSERT)
  // static async upsertTrustScore(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const { providerId, trustScore } = req.body;
  //     const user = (req as any).user;

  //     if (!user?.id) throw new ApiError(401, "Unauthorized");

  //     if (!providerId || trustScore === undefined)
  //       throw new ApiError(400, "providerId and trustScore are required");

  //     if (!mongoose.Types.ObjectId.isValid(providerId))
  //       throw new ApiError(400, "Invalid providerId");

  //     if (trustScore < 0 || trustScore > 100)
  //       throw new ApiError(400, "trustScore must be between 0 and 100");

  //     const userId = new mongoose.Types.ObjectId(user.id);

  //     // ✅ Upsert logic (create if not exist, else update)
  //     const result = await TrustScore.findOneAndUpdate(
  //       { userId, providerId },
  //       { trustScore },
  //       { new: true, upsert: true, setDefaultsOnInsert: true }
  //     );

  //     return res
  //       .status(200)
  //       .json(new ApiResponse(200, result, "Trust score saved successfully"));
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  // ✅ Get all trust scores (admin / optional filter)
  static async getAllTrustScores(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await trustScoreService.getAll(req.query);

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ✅ Get by ID
  static async getTrustScoreById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await trustScoreService.getById(req.params.id);

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ✅ Delete
  static async deleteTrustScore(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid trustScore ID");
      }

      const user = (req as any).user;
      const userId = user?.id || user?._id;
      const role = user?.role;

      const existing = await TrustScore.findById(id);
      if (!existing) {
        throw new ApiError(404, "Review / TrustScore not found");
      }

      // If not admin, verify ownership (provider or review author)
      if (role !== "admin") {
        const isProvider = existing.providerId?.toString() === userId?.toString();
        const isAuthor = existing.userId?.toString() === userId?.toString();
        if (!isProvider && !isAuthor) {
          throw new ApiError(403, "You are not authorized to delete this review");
        }
      }

      await TrustScore.findByIdAndDelete(id);

      return res
        .status(200)
        .json(new ApiResponse(200, existing, "Deleted successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ✅ Get average trust score of provider
  static async getProviderAverage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { providerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(providerId))
        throw new ApiError(400, "Invalid providerId");

      const result = await TrustScore.aggregate([
        {
          $match: {
            providerId: new mongoose.Types.ObjectId(providerId),
          },
        },
        {
          $group: {
            _id: "$providerId",
            avgTrustScore: { $avg: "$trustScore" },
            totalUsers: { $sum: 1 },
          },
        },
      ]);

      return res.status(200).json(
        new ApiResponse(
          200,
          result[0] || { avgTrustScore: 0, totalUsers: 0 },
          "Average trust score fetched"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // Helper to fetch reviews and trust scores for a provider
  static async fetchProviderReviewsData(providerId: string, query: any) {
    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      throw new ApiError(400, "Valid providerId is required");
    }

    const providerObjectId = new mongoose.Types.ObjectId(providerId);
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit as string, 10) || 10);
    const skip = (page - 1) * limit;

    const match: any = {
      providerId: providerObjectId,
    };

    if (query.onlyReviews === "true" || query.hasReview === "true") {
      match.review = { $exists: true, $ne: "" };
    }

    const [aggregateResult] = await TrustScore.aggregate([
      { $match: match },
      {
        $facet: {
          reviews: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "caller",
              },
            },
            {
              $unwind: {
                path: "$caller",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                callerName: {
                  $ifNull: ["$caller.name", "Anonymous Caller"],
                },
                callerAvatar: {
                  $ifNull: ["$caller.avatar", "$caller.profilePicture"],
                },
                review: { $ifNull: ["$review", ""] },
                trustScore: 1,
                rating: "$trustScore",
                createdAt: 1,
                updatedAt: 1,
                userId: "$caller._id",
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgTrustScore: { $avg: "$trustScore" },
              },
            },
          ],
        },
      },
    ]);

    const reviews = aggregateResult?.reviews || [];
    const summary = aggregateResult?.summary?.[0] || { totalReviews: 0, avgTrustScore: 0 };
    const totalReviews = summary.totalReviews || 0;
    const avgTrustScore = Number((summary.avgTrustScore || 0).toFixed(1));

    return {
      reviews,
      result: reviews,
      avgTrustScore,
      averageRating: avgTrustScore,
      totalReviews,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalReviews,
        totalPages: Math.ceil(totalReviews / limit) || 1,
      },
    };
  }

  // ✅ Get provider reviews & trust scores (Used by User app and Provider app)
  static async getProviderReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { providerId } = req.params;
      const data = await TrustScoreController.fetchProviderReviewsData(
        providerId,
        req.query
      );

      return res
        .status(200)
        .json(new ApiResponse(200, data, "Provider reviews fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ✅ Get logged-in provider's own reviews (Provider app convenience)
  static async getMyReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerId = (req as any).user?.id || (req as any).user?._id;
      if (!providerId) {
        throw new ApiError(401, "Unauthorized: Provider token required");
      }
      const data = await TrustScoreController.fetchProviderReviewsData(
        providerId,
        req.query
      );

      return res
        .status(200)
        .json(new ApiResponse(200, data, "My reviews fetched successfully"));
    } catch (err) {
      next(err);
    }
  }
}