import mongoose, { Schema, Document } from "mongoose";

export interface ITrustScore extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  trustScore: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const trustScoreSchema = new Schema<ITrustScore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
      index: true,
    },
    trustScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // optional range (you can change this)
    },
    review: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate entries (one user → one provider)
// trustScoreSchema.index({ userId: 1, providerId: 1 }, { unique: true });

export const TrustScore = mongoose.model<ITrustScore>(
  "TrustScore",
  trustScoreSchema
);