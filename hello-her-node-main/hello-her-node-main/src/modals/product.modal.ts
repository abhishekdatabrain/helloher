import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILocalizedField {
  en: string;
  ar?: string;
}

export interface IProduct extends Document {
  price: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  isActive: boolean;
  name: ILocalizedField;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  description?: ILocalizedField;
  features: Record<string, any>;
}

const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true },
  },
  { _id: false }
);

const productSchema: Schema<IProduct> = new Schema(
  {
    price: { type: Number, required: true },
    description: { type: localizedFieldSchema },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    name: { type: localizedFieldSchema, required: true },

    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },

    image: { type: String, required: true },
    features: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
