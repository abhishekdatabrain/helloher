import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { Testimonial } from "../../modals/testimonial.model";
import { CommonService } from "../../services/common.services";
import { extractImageUrl } from "../../admin/banner/banner.controller";

const testimonialService = new CommonService(Testimonial);

// ✅ Create testimonial
export const createTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, feedback, rating, isVerified, isActive } = req.body;
    if (!name || !feedback || !rating) {
      return next(new ApiError(400, "Required fields are missing"));
    }
    const image = req?.body?.image?.[0]?.url;
    if (!image)
      return res
        .status(403)
        .json(new ApiError(403, "Testimonial Image is Required."));

    const testimonial = await Testimonial.create({
      name,
      image,
      rating,
      feedback,
      isActive: isActive === "active",
      isVerified: isVerified === "active",
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, testimonial, "Testimonial created successfully")
      );
  } catch (err) {
    next(err);
  }
};

// ✅ Get all testimonials
export const getAllTestimonials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testimonials = await testimonialService.getAll(req.query);
    return res
      .status(200)
      .json(
        new ApiResponse(200, testimonials, "Testimonials fetched successfully")
      );
  } catch (err) {
    next(err);
  }
};
export const getAllPublicTestimonials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await testimonialService.getAll({
      ...req.query,
      isActive: true,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Testimonials fetched successfully"));
  } catch (err) {
    next(err);
  }
};

// ✅ Get testimonial by ID
export const getTestimonialById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testimonial = await testimonialService.getById(req.params.id, false);

    if (!testimonial) {
      return next(new ApiError(404, "Testimonial not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, testimonial, "Testimonial fetched successfully")
      );
  } catch (err) {
    next(err);
  }
};

// ✅ Update testimonial
export const updateTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const image = req?.body?.image?.[0]?.url;
    const { isVerified, isActive } = req.body;

    const record = await testimonialService.getById(id);
    if (!record) {
      return res.status(404).json(new ApiError(404, "Testimonial not found."));
    }

    let imageUrl;
    if (req?.body?.image && record.image)
      imageUrl = await extractImageUrl(
        req?.body?.image,
        record.image as string
      );

    const updates = {
      ...req.body,
      image: imageUrl || image,
      isActive: isActive === "active",
      isVerified: isVerified === "active",
    };

    const testimonial = await Testimonial.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!testimonial) {
      return next(new ApiError(404, "Testimonial not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, testimonial, "Testimonial updated successfully")
      );
  } catch (err) {
    next(err);
  }
};

// ✅ Delete testimonial
export const deleteTestimonial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deleted = await Testimonial.findByIdAndDelete(id);

    if (!deleted) {
      return next(new ApiError(404, "Testimonial not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deleted, "Testimonial deleted successfully"));
  } catch (err) {
    next(err);
  }
};
