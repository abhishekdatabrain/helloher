import slugify from "slugify";
import mongoose, { Document, Schema, Model, model } from "mongoose";

export interface ILocalizedField {
  en: string;
  ar: string;
}

export interface IBlog extends Document {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  isActive: boolean;
  title: ILocalizedField;
  description: ILocalizedField;
  short_description: ILocalizedField;
  categoryId?: mongoose.Types.ObjectId;
}

const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true },
  },
  { _id: false }
);

const BlogSchema: Schema<IBlog> = new Schema(
  {
    isActive: { type: Boolean, default: false },
    slug: { type: String, trim: true, unique: true },
    imageUrl: { type: String, trim: true, default: "" },
    title: { type: localizedFieldSchema, required: true },
    description: { type: localizedFieldSchema, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    short_description: { type: localizedFieldSchema, required: true },
  },
  { timestamps: true }
);

BlogSchema.pre<IBlog>("save", function (next) {
  if (this.isNew && this.title?.en) {
    this.slug = slugify(this.title.en, { lower: true, strict: true });
  }
  next();
});

export const Blog: Model<IBlog> =
  mongoose.models.Blog || model<IBlog>("Blog", BlogSchema);
