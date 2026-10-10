import slugify from "slugify";
import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * 🌍 Localized field interface
 */
export interface ILocalizedField {
  en: string;
  ar?: string;
}

export interface ICategory extends Document {
  name: ILocalizedField;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  isParent: boolean;
  description?: ILocalizedField;
  status: CategoryStatus;
  parentCategory?: Types.ObjectId;
}

/**
 * Enum for category visibility status
 */
export enum CategoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

/**
 * Schema for localized fields
 */
const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * Category Schema
 */
const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: localizedFieldSchema, required: true, unique: false },
    description: { type: localizedFieldSchema },
    slug: { type: String, unique: true, index: true },
    status: {
      type: String,
      default: CategoryStatus.INACTIVE,
      enum: Object.values(CategoryStatus),
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      validate: {
        validator: function (v: Types.ObjectId) {
          return mongoose
            .model("Category")
            .findById(v)
            .then((category) => !category?.parentCategory);
        },
        message: "Parent category cannot be a subcategory",
      },
    },
    isParent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Middleware to generate slug from English name
 */
CategorySchema.pre<ICategory>("save", function (next) {
  if (this.isModified("name.en")) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});

/**
 * Model export with hot-reload safety
 */
export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
