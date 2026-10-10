import mongoose, { Schema, Document } from "mongoose";

export interface ILocalizedField {
  en: string;
  ar?: string;
}

export interface IBrand extends Document {
  name: ILocalizedField;
  imageUrl?: string;
  description?: ILocalizedField;
  country?: ILocalizedField;
  establishedYear?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Schema for localized fields
const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true },
  },
  { _id: false }
);

// ✅ Brand schema
const brandSchema: Schema<IBrand> = new Schema(
  {
    imageUrl: { type: String },
    establishedYear: { type: Number },
    country: { type: localizedFieldSchema },
    isActive: { type: Boolean, default: true },
    description: { type: localizedFieldSchema },
    name: { type: localizedFieldSchema, required: true },
  },
  { timestamps: true }
);

export const Brand = mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);
