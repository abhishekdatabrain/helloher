import mongoose, { Schema, Document, model } from "mongoose";

/**
 * Privacy Policy Status
 */
export type PrivacyPolicyStatus = "ACTIVE" | "INACTIVE";

/**
 * Privacy Policy Schema & Interface
 */
export interface IPrivacyPolicy extends Document {
  title: string;
  image?: string;
  content: string;
  status: PrivacyPolicyStatus;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PrivacyPolicySchema = new Schema<IPrivacyPolicy>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Privacy Policy",
    },
    image: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    seo: {
      metaTitle: {
        type: String,
        trim: true,
      },
      metaDescription: {
        type: String,
        trim: true,
      },
    },
  },
  { timestamps: true }
);

export const PrivacyPolicy =
  mongoose.models.PrivacyPolicy ||
  model<IPrivacyPolicy>("PrivacyPolicy", PrivacyPolicySchema);
