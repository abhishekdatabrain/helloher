import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import CommissionModel from "../../modals/commission.model";
import { CommonService } from "../../services/common.services";

const commissionService = new CommonService(CommissionModel);

/**
 * Helper to decide which commission % to use in business logic.
 * - If `useGlobalCommission` is true -> returns `globalCommissionPercentage`
 * - Else -> returns the slab's own `commissionPercentage` (or 0)
 */
export function getEffectiveCommissionPercent(doc: any, slab: any): number {
  if (doc?.useGlobalCommission) return Number(doc.globalCommissionPercentage || 0);
  return Number(slab?.commissionPercentage || 0);
}

export class CommissionController {
  // ------------------ CREATE ------------------
  static async createCommission(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await CommissionModel.findOne();
      if (existing)
        return res
          .status(400)
          .json(new ApiError(400, "Commission record already exists. Use update instead."));

      const perMinutePricePaise =
        req.body.perMinutePricePaise !== undefined ? req.body.perMinutePricePaise : 600;

      const useGlobalCommission =
        req.body.useGlobalCommission !== undefined ? !!req.body.useGlobalCommission : false;

      const globalCommissionPercentage =
        req.body.globalCommissionPercentage !== undefined
          ? Number(req.body.globalCommissionPercentage)
          : 0;

      if (globalCommissionPercentage < 0 || globalCommissionPercentage > 100) {
        return res
          .status(400)
          .json(new ApiError(400, "globalCommissionPercentage must be between 0 and 100"));
      }

      const minimumWithdrawalAmount =
        req.body.minimumWithdrawalAmount !== undefined
          ? Number(req.body.minimumWithdrawalAmount)
          : 100;

      // Slabs are passed as-is (no incentive logic)
      const commissionSlabs = Array.isArray(req.body.commissionSlabs)
        ? req.body.commissionSlabs
        : [];

      const result = await CommissionModel.create({
        perMinutePricePaise,
        useGlobalCommission,
        globalCommissionPercentage,
        minimumWithdrawalAmount,
        commissionSlabs,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, result, "Commission record created successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ------------------ GET SINGLE ------------------
  static async getCommission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CommissionModel.findOne();
      if (!result)
        return res.status(404).json(new ApiError(404, "No Commission data found"));

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Commission data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ------------------ UPDATE WHOLE DOCUMENT ------------------
  static async updateCommission(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        perMinutePricePaise,
        commissionSlabs,
        useGlobalCommission,
        globalCommissionPercentage,
        minimumWithdrawalAmount,
      } = req.body;

      const updateFields: any = {};

      if (perMinutePricePaise !== undefined) updateFields.perMinutePricePaise = perMinutePricePaise;

      if (useGlobalCommission !== undefined)
        updateFields.useGlobalCommission = !!useGlobalCommission;

      if (globalCommissionPercentage !== undefined) {
        const pct = Number(globalCommissionPercentage);
        if (Number.isNaN(pct) || pct < 0 || pct > 100) {
          return res
            .status(400)
            .json(new ApiError(400, "globalCommissionPercentage must be between 0 and 100"));
        }
        updateFields.globalCommissionPercentage = pct;
      }

      if (minimumWithdrawalAmount !== undefined) {
        const amt = Number(minimumWithdrawalAmount);
        if (Number.isNaN(amt) || amt < 0) {
          return res
            .status(400)
            .json(new ApiError(400, "minimumWithdrawalAmount must be a valid positive number"));
        }
        updateFields.minimumWithdrawalAmount = amt;
      }

      if (commissionSlabs !== undefined) {
        updateFields.commissionSlabs = commissionSlabs || [];
      }

      const result = await CommissionModel.findOneAndUpdate({}, updateFields, {
        new: true,
        upsert: true,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Commission data updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ------------------ ADD NEW SLAB ------------------
  static async addSlab(req: Request, res: Response, next: NextFunction) {
    try {
      const slabToInsert = req.body || {};
      const result = await CommissionModel.findOneAndUpdate(
        {},
        { $push: { commissionSlabs: slabToInsert } },
        { new: true, upsert: true }
      );
      return res
        .status(200)
        .json(new ApiResponse(200, result, "New commission slab added successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ------------------ GET SLAB BY ID ------------------
  static async getSlabById(req: Request, res: Response, next: NextFunction) {
    try {
      const { slabId } = req.params;
      if (!slabId) return res.status(400).json(new ApiError(400, "Slab ID is required"));

      const commissionDoc = await CommissionModel.findOne();
      if (!commissionDoc)
        return res.status(404).json(new ApiError(404, "Commission document not found"));

      const slab = commissionDoc.commissionSlabs.find((s: any) => s._id.toString() === slabId);

      if (!slab) return res.status(404).json(new ApiError(404, "Commission slab not found"));

      return res
        .status(200)
        .json(new ApiResponse(200, slab, "Commission slab fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ------------------ DELETE SLAB ------------------
  static async deleteSlab(req: Request, res: Response, next: NextFunction) {
    try {
      const { slabId } = req.params;
      if (!slabId) return res.status(400).json(new ApiError(400, "Slab ID is required"));

      const updatedDoc = await CommissionModel.findOneAndUpdate(
        {},
        { $pull: { commissionSlabs: { _id: slabId } } },
        { new: true }
      );

      if (!updatedDoc)
        return res.status(404).json(new ApiError(404, "Commission document not found"));

      return res
        .status(200)
        .json(new ApiResponse(200, updatedDoc, "Commission slab deleted successfully"));
    } catch (err) {
      next(err);
    }
  }

  // ------------------ GET ALL SLABS (WITH PAGINATION + SEARCH) ------------------
  static async getAllSlab(req: Request, res: Response, next: NextFunction) {
    try {
      const { result } = await commissionService.getAll();
      const commissionDoc = result?.[0];

      if (!commissionDoc)
        return res.status(404).json(new ApiError(404, "Commission document not found"));

      let slabs = commissionDoc.commissionSlabs || [];

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = req.query.search as string;
      const searchKey = req.query.searchkey as string;

      // 🔍 Optional filtering
      if (search && searchKey) {
        slabs = slabs.filter((slab: any) => {
          const value = slab[searchKey];
          if (value === undefined) return false;
          if (typeof value === "string") return value.toLowerCase().includes(search.toLowerCase());
          else if (typeof value === "number") return value.toString().includes(search.toString());
          return false;
        });
      }

      const totalItems = slabs.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const paginatedSlabs = slabs.slice(startIndex, startIndex + limit);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              result: paginatedSlabs,
              pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems,
                totalPages,
              },
              meta: {
                useGlobalCommission: commissionDoc.useGlobalCommission,
                globalCommissionPercentage: commissionDoc.globalCommissionPercentage,
                perMinutePricePaise: commissionDoc.perMinutePricePaise,
                minimumWithdrawalAmount: commissionDoc.minimumWithdrawalAmount,
              },
            },
            "All commission slabs fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  // ------------------ UPDATE SINGLE SLAB ------------------
  static async updateSlab(req: Request, res: Response, next: NextFunction) {
    try {
      const { slabId } = req.params;
      const payload = req.body || {};

      if (!slabId) return res.status(400).json(new ApiError(400, "Slab ID is required"));
      if (!payload || Object.keys(payload).length === 0)
        return res.status(400).json(new ApiError(400, "No update data provided"));

      if (payload.commissionPercentage !== undefined) {
        const pct = Number(payload.commissionPercentage);
        if (Number.isNaN(pct) || pct < 0 || pct > 100) {
          return res
            .status(400)
            .json(new ApiError(400, "commissionPercentage must be between 0 and 100"));
        }
      }

      const setFields = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [`commissionSlabs.$.${key}`, value])
      );

      const updatedDoc = await CommissionModel.findOneAndUpdate(
        { "commissionSlabs._id": slabId },
        { $set: setFields },
        { new: true }
      );

      if (!updatedDoc) return res.status(404).json(new ApiError(404, "Commission slab not found"));

      return res
        .status(200)
        .json(new ApiResponse(200, updatedDoc, "Commission slab updated successfully"));
    } catch (err) {
      next(err);
    }
  }
}
