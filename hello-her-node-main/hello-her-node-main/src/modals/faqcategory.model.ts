import mongoose, { Schema, Document, model } from "mongoose";

/**
 * FAQ Category Schema & Interface
 */
export interface IFaqCategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqCategorySchema = new Schema<IFaqCategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FaqCategory =
  mongoose.models.FaqCategory || model<IFaqCategory>("FaqCategory", FaqCategorySchema);
