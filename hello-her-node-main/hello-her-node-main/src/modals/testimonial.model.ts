import mongoose, { Schema, Document } from "mongoose";

export interface ILocalizedString {
  en: string;
  ar: string;
  [key: string]: string | undefined;
}

export interface ITestimonial extends Document {
  image?: string;
  rating: number;
  isActive: boolean;
  isVerified: boolean;
  name: ILocalizedString;
  feedback: ILocalizedString;
}

const localizedStringSchema = new Schema<ILocalizedString>(
  {
    en: { type: String, required: true },
    ar: { type: String, required: true },
  },
  { _id: false }
);

const testimonialSchema = new Schema<ITestimonial>(
  {
    image: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    name: { type: localizedStringSchema, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: localizedStringSchema, required: true },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model<ITestimonial>(
  "Testimonial",
  testimonialSchema
);
