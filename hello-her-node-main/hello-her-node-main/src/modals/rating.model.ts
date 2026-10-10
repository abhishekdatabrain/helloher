import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRating extends Document {
  user: Types.ObjectId;              // who rated
  provider: Types.ObjectId;          // who was rated
  rating: number;                    // 1–5
  review?: string;                   // optional comment
  createdAt?: Date;
  updatedAt?: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

// 🔒 One rating per user per provider
ratingSchema.index({ user: 1, provider: 1 }, { unique: true });

export const Rating = mongoose.model<IRating>("Rating", ratingSchema);
