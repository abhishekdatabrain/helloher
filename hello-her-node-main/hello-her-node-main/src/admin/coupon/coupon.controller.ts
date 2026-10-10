import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Coupon } from "../../modals/coupon.model"; // <- adjust to your path
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";

const CouponService = new CommonService(Coupon);

export class CouponController {
  static async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await CouponService.create(req.body);
      if (!created) {
        return res.status(400).json(new ApiError(400, "Failed to create Coupon"));
      }
      return res
        .status(201)
        .json(new ApiResponse(201, created, "Created successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getAllCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      // CommonService.getAll returns: { result: T[], pagination: {...} }
      const list = await CouponService.getAll(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, list, "Data fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  // Public coupons => active + not expired
  static async getAllPublicCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();

      // Request only active coupons; expiry filtering done post-fetch
      const list: { result: any[]; pagination: any } = await CouponService.getAll({
        ...req.query,
        isActive: true,
      });

      const filtered = (list.result || []).filter(
        (c: any) => c?.expiryDate && new Date(c.expiryDate) > now
      );

      // Recompute pagination counts for the filtered page payload
      const currentPage = Number(req.query.page ?? list.pagination?.currentPage ?? 1);
      const itemsPerPage = Number(req.query.limit ?? list.pagination?.itemsPerPage ?? 10);
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      const payload = {
        result: filtered,
        pagination: {
          currentPage,
          itemsPerPage,
          totalItems,
          totalPages,
        },
      };

      return res
        .status(200)
        .json(new ApiResponse(200, payload, "Data fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getCouponById(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = (req as any).user || {};
      // respect your old pattern: non-admins get populated=false if you want to limit
      const populate = role === "admin" ? true : false;
      const found = await CouponService.getById(req.params.id, populate);

      if (!found) {
        return res.status(404).json(new ApiError(404, "Coupon not found"));
      }
      return res
        .status(200)
        .json(new ApiResponse(200, found, "Data fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async updateCouponById(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await CouponService.updateById(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json(new ApiError(404, "Failed to update Coupon"));
      }
      return res
        .status(200)
        .json(new ApiResponse(200, updated, "Updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCouponById(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await CouponService.deleteById(req.params.id);
      if (!deleted) {
        return res.status(404).json(new ApiError(404, "Failed to delete Coupon"));
      }
      return res
        .status(200)
        .json(new ApiResponse(200, deleted, "Deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
  // Add inside export class CouponController { ... }
  static async validateByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const codeParam = (req.query as { code?: string }).code;
      const code = (codeParam || "").toUpperCase().trim();

      if (!code) {
        return res.status(400).json(new ApiError(400, "Coupon code is required"));
      }

      // Use CommonService to fetch exactly one active coupon by code
      const { result } = await CouponService.getAll({
        code,
        isActive: true,
        limit: 1,
        page: 1,
      });

      const coupon = result?.[0];
      if (!coupon) {
        return res.status(404).json(new ApiError(404, "Invalid coupon code"));
      }

      const now = new Date();
      if (coupon.expiryDate && new Date(coupon.expiryDate) <= now) {
        return res.status(400).json(new ApiError(400, "Coupon has expired"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, coupon, "Coupon is valid"));
    } catch (error) {
      next(error);
    }
  }

}
