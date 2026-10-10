import { Schema, model, Document } from "mongoose";

export interface IBanner extends Document {
  image?: string;
  isActive: "active" | "inactive";
  type: "home" | "recharge";
  cta1?: { text?: string; url?: string; screen?: string };
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    image: { type: String, required: true },
    description: { type: String },
    isActive: { type: String, enum: ["active", "inactive"], default: "active" },
    type: {
      type: String,
      enum: ["home", "recharge"],
      required: true, 
    },
    cta1: {
      text: { type: String },
      url: { type: String },
      screen: { type: String },
    },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const BannerModel = model<IBanner>("Banner", bannerSchema);
export default BannerModel;
