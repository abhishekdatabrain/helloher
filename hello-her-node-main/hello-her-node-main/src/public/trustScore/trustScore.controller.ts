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
      const { providerId, trustScore } = req.body;
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
      const { trustScore } = req.body;
      const user = (req as any).user;

      if (!mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Invalid trustScore id");

      if (trustScore < 0 || trustScore > 100)
        throw new ApiError(400, "trustScore must be between 0 and 100");

      const updated = await TrustScore.findOneAndUpdate(
        { _id: id, userId: user.id }, // ✅ ownership check
        { trustScore },
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
      const result = await trustScoreService.deleteById(req.params.id);

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Deleted successfully"));
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
}