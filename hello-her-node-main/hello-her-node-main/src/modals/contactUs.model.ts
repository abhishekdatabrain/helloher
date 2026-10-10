import mongoose, { Document, Schema, Model } from "mongoose";

// 1. Interface
export interface IContactUS extends Document {
  senderName: string;
  senderEmail: string;
  senderMobile: string;
  query: string;
  status: "resolved" | "pending" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

// 2. Schema
const ContactUsSchema: Schema<IContactUS> = new Schema(
  {
    senderName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderMobile: {
      type: String,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["resolved", "pending", "rejected"],
      default: "pending",
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
    versionKey: false,
  }
);

// 3. Model
export const ContactUS: Model<IContactUS> = mongoose.model<IContactUS>("ContactUS", ContactUsSchema);
