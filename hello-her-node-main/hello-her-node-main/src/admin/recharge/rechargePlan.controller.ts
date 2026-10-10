import { Request, Response, NextFunction } from "express";
import { RechargePlan } from "../../modals/RechargePlan.model";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { CommonService } from "../../services/common.services";
import mongoose, { Types } from "mongoose";

// 🔹 import your Coupon model (adjust path if different)
import { Coupon } from "../../modals/coupon.model"; // <- adjust path if needed

const planService = new CommonService(RechargePlan);

export class RechargePlanController {
  private static parseAmount(input: unknown): number | null {
    if (typeof input === "number" && Number.isFinite(input)) return input;
    if (typeof input === "string") {
      const match = input.match(/-?\d+(?:\.\d+)?/);
      if (!match) return null;
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private static parseDurationToMinutes(input: unknown): number | null {
    if (typeof input === "number" && Number.isFinite(input)) return input;
    if (typeof input !== "string") return null;

    const lower = input.trim().toLowerCase();
    const numberMatch = lower.match(/-?\d+(?:\.\d+)?/);
    if (!numberMatch) return null;
    const value = Number(numberMatch[0]);
    if (!Number.isFinite(value)) return null;

    if (/(hour|hr|hrs|h)\b/.test(lower)) return Math.round(value * 60);
    if (/(second|sec|s)\b/.test(lower)) return Math.max(1, Math.round(value / 60));
    return Math.round(value);
  }

  // 🆕 Normalize keywords from body (string or array) → cleaned string[]
  private static normalizeKeywords(input: unknown): string[] {
    if (input == null) return [];

    let raw: string[] = [];

    if (Array.isArray(input)) {
      raw = input.map((v) => String(v));
    } else if (typeof input === "string") {
      // support comma/semicolon separated lists: "voice, call, 10min"
      raw = input.split(/[,;]+/);
    } else {
      return [];
    }

    const cleaned = raw
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);

    // remove duplicates
    return Array.from(new Set(cleaned));
  }

  // 🔹 Validate + fetch coupon if provided; ensure active & not expired
  private static async validateAndGetCoupon(couponId?: unknown) {
    if (!couponId) return null;
    if (!mongoose.Types.ObjectId.isValid(String(couponId))) {
      throw new ApiError(400, "Invalid couponId");
    }

    const coupon = await Coupon.findById(couponId); // <-- no .lean()
    if (!coupon) throw new ApiError(404, "Coupon not found");

    const isActive = coupon.isActive === true;
    const rawExpiry: any = (coupon as any)?.expiryDate; // supports Date or ISO
    const notExpired = rawExpiry ? new Date(rawExpiry) >= new Date() : true;

    if (!isActive || !notExpired) {
      throw new ApiError(400, "Coupon is inactive or expired");
    }
    return coupon; // hydrated doc -> _id is Types.ObjectId
  }

  // 🔹 Compute discount (capped) + final
  private static computeDiscount(amount: number, coupon: any | null) {
    if (!coupon) return { discountApplied: 0, finalAmount: Math.max(0, +amount.toFixed(2)) };

    const pct = Number(coupon.discountPercentage ?? 0);
    const cap = Number(coupon.maxDiscountAmount ?? Infinity);
    const raw = (amount * pct) / 100;
    const discountApplied = Math.min(raw, cap);
    const finalAmount = Math.max(0, +(amount - discountApplied).toFixed(2));
    return { discountApplied: +discountApplied.toFixed(2), finalAmount };
  }

  /**
   * 🟢 Create a new recharge plan
   */
  static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        amount,
        timeDuration,
        description,
        couponId,
        rechargeName,  // 🆕
        keywords,      // 🆕
      } = req.body;

      const normalizedAmount = RechargePlanController.parseAmount(amount);
      const normalizedDuration =
        RechargePlanController.parseDurationToMinutes(timeDuration);

      // 🔹 rechargeName validation
      if (!rechargeName || typeof rechargeName !== "string" || rechargeName.trim().length === 0) {
        throw new ApiError(400, "Recharge name is required");
      }

      if (!description || typeof description !== "string" || description.trim().length === 0) {
        throw new ApiError(400, "Description is required");
      }
      if (normalizedAmount === null) {
        throw new ApiError(400, "Amount must be a valid number");
      }
      if (normalizedDuration === null) {
        throw new ApiError(
          400,
          "Time duration must be a valid number (minutes), e.g., '10', '10 min', '1h'"
        );
      }

      const normalizedKeywords = RechargePlanController.normalizeKeywords(keywords);

      // ✅ coupon (optional)
      const coupon = await RechargePlanController.validateAndGetCoupon(couponId);
      const { discountApplied, finalAmount } =
        RechargePlanController.computeDiscount(normalizedAmount, coupon);

      const plan = await planService.create({
        rechargeName: rechargeName.trim(),         // 🆕
        keywords: normalizedKeywords,              // 🆕
        amount: normalizedAmount,
        timeDuration: normalizedDuration,
        description: description.trim(),
        couponId: coupon ? (coupon._id as Types.ObjectId) : null,
        discountApplied,
        finalAmount,
      });

      return res
        .status(201)
        .json(
          new ApiResponse(201, plan, "Recharge plan created successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 📜 Get all recharge plans
   */
  static async getAllPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query || {};
      const additionalStages = [
        {
          $lookup: {
            from: "coupons",          // 👈 collection name for Coupon
            localField: "couponId",   // field in Plan
            foreignField: "_id",      // _id in Coupon
            as: "couponInfo",
          },
        },
        {
          $unwind: {
            path: "$couponInfo",
            preserveNullAndEmptyArrays: true, // keep plans even if no coupon
          },
        },
        // Replace couponId (ObjectId) with full coupon document
        {
          $addFields: {
            couponId: "$couponInfo",
          },
        },
        // cleanup
        {
          $project: {
            couponInfo: 0,
          },
        },
        // optional: sort latest first
        { $sort: { createdAt: -1 } },
      ];

      const result = await planService.getAll(query, additionalStages);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "All recharge plans fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🔍 Get a single recharge plan by ID
   */
  static async getPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "Plan ID is required");

      const plan = await RechargePlan.findById(id)
        .populate(
          "couponId",
          "code discountPercentage maxDiscountAmount expiryDate isActive"
        )
        .lean(); // returning to client -> lean is fine here

      if (!plan) throw new ApiError(404, "Recharge plan not found");

      return res
        .status(200)
        .json(
          new ApiResponse(200, plan, "Recharge plan fetched successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * ✏️ Update a recharge plan
   */
  static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        amount,
        timeDuration,
        description,
        couponId,
        rechargeName, // 🆕
        keywords,     // 🆕
      } = req.body;

      const existing = await RechargePlan.findById(id);
      if (!existing) throw new ApiError(404, "Recharge plan not found");

      const update: any = {};

      if (amount !== undefined) {
        const normalizedAmount = RechargePlanController.parseAmount(amount);
        if (normalizedAmount === null)
          throw new ApiError(400, "Amount must be a valid number");
        update.amount = normalizedAmount;
      }

      if (timeDuration !== undefined) {
        const normalizedDuration =
          RechargePlanController.parseDurationToMinutes(timeDuration);
        if (normalizedDuration === null) {
          throw new ApiError(
            400,
            "Time duration must be a valid number (minutes), e.g., '10', '10 min', '1h'"
          );
        }
        update.timeDuration = normalizedDuration;
      }

      if (description !== undefined) {
        if (
          typeof description !== "string" ||
          description.trim().length === 0
        )
          throw new ApiError(
            400,
            "Description must be a non-empty string"
          );
        update.description = description.trim();
      }

      // 🆕 rechargeName update (optional)
      if (rechargeName !== undefined) {
        if (
          typeof rechargeName !== "string" ||
          rechargeName.trim().length === 0
        ) {
          throw new ApiError(
            400,
            "Recharge name must be a non-empty string"
          );
        }
        update.rechargeName = rechargeName.trim();
      }

      // 🆕 keywords update (optional)
      if (keywords !== undefined) {
        const normalizedKeywords =
          RechargePlanController.normalizeKeywords(keywords);
        update.keywords = normalizedKeywords;
      }

      // If couponId is present in payload (even null), we update it
      let coupon: any = null;
      if (couponId !== undefined) {
        if (couponId === null || couponId === "") {
          update.couponId = null;
        } else {
          coupon = await RechargePlanController.validateAndGetCoupon(couponId); // hydrated
          update.couponId = coupon._id as Types.ObjectId; // <-- Types.ObjectId
        }
      } else {
        // not changing couponId – use the existing doc’s coupon for recompute
        if (existing.couponId) {
          coupon = await Coupon.findById(
            existing.couponId as unknown as Types.ObjectId
          );
        }
      }

      // Need a base amount to compute discounts
      const baseAmount = update.amount ?? existing.amount;
      const { discountApplied, finalAmount } =
        RechargePlanController.computeDiscount(baseAmount, coupon);
      update.discountApplied = discountApplied;
      update.finalAmount = finalAmount;

      const updatedPlan = await planService.updateById(id, update);
      if (!updatedPlan) throw new ApiError(404, "Recharge plan not found");

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedPlan,
            "Recharge plan updated successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🗑️ Delete a recharge plan
   */
  static async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "Plan ID is required");

      const deleted = await planService.deleteById(id);
      if (!deleted) throw new ApiError(404, "Recharge plan not found");

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            deleted,
            "Recharge plan deleted successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}
