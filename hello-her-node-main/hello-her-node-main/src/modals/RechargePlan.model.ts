import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRechargePlan extends Document {
  rechargeName: string;       // name/title of the recharge plan
  keywords: string[];        // array of keywords/tags
  amount: number;           // original amount in Rs
  timeDuration: number;    // in minutes
  description: string;

  couponId?: Types.ObjectId | null; // reference to Coupon (optional)
  discountApplied?: number;         // computed, capped
  finalAmount?: number;             // amount - discountApplied, min 0

  createdAt: Date;
  updatedAt: Date;
}

const rechargePlanSchema = new Schema<IRechargePlan>(
  {
    // 🆕 Recharge name
    rechargeName: {
      type: String,
      required: [true, "Recharge name is required"],
      trim: true,
    },

    // 🆕 Keywords array
    keywords: {
      type: [String],           // array of strings
      default: [],
      validate: {
        validator: function (arr: string[]) {
          // ensure all items are non-empty strings (after trim)
          return arr.every(
            (kw) => typeof kw === "string" && kw.trim().length > 0
          );
        },
        message: "Each keyword must be a non-empty string",
      },
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1 Rs"],
    },
    timeDuration: {
      type: Number,
      required: [true, "Time duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    // 🆕 coupon fields
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discountApplied: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      min: [0, "Final amount cannot be negative"],
    },
  },
  { timestamps: true }
);

// Keep finalAmount consistent if not explicitly set
rechargePlanSchema.pre("save", function (next) {
  if (this.isModified("amount") || this.isModified("discountApplied") || this.finalAmount === undefined) {
    const amount = Number(this.amount ?? 0);
    const discount = Number(this.discountApplied ?? 0);
    const finalAmount = Math.max(0, +(amount - discount).toFixed(2));
    this.finalAmount = finalAmount;
  }
  next();
});

export const RechargePlan = mongoose.model<IRechargePlan>(
  "RechargePlan",
  rechargePlanSchema
);
