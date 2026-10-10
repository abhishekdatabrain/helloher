import mongoose, { Document, Schema } from "mongoose";

export interface ICoupon extends Document {
  couponName: string;          // <- NEW: Human-friendly coupon name
  code: string;                // Unique coupon code
  discountPercentage: number;  // e.g., 10 means 10% off
  maxDiscountAmount: number;   // Maximum discount in Rs
  expiryDate: Date;            // Coupon expiration date
  description: string;
  isActive: boolean;           // Can disable coupons without deleting them
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    couponName: {
      type: String,
      required: [true, "Coupon name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount must be at least 1%"],
      max: [100, "Discount cannot exceed 100%"],
    },
    maxDiscountAmount: {
      type: Number,
      required: [true, "Maximum discount amount is required"],
      min: [1, "Max discount must be at least 1 Rs"],
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
