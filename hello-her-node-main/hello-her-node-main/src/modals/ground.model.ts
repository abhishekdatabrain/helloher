import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Localized field for multi-language support
 */
export interface ILocalizedField {
  en: string;
  ar?: string;
}

/**
 * Ground interface
 */
export interface IGround extends Document {
  name: ILocalizedField;
  userId: Types.ObjectId;
  status: "active" | "inactive" | "maintenance";
  type: ILocalizedField;
  city: ILocalizedField;
  isNearByPlace: string;
  isHigherRanked: string;
  address: ILocalizedField;
  sponsored: ILocalizedField;
  startTime: string; // e.g., "08:00"
  endTime: string;   // e.g., "22:00"
  pitchType: ILocalizedField;
  description?: ILocalizedField;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  pricePerHour: number;
  images: string[];
  facilities: ILocalizedField[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Localized schema reusable for all fields
 */
const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true },
  },
  { _id: false }
);

const groundSchema = new Schema<IGround>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: localizedFieldSchema,
      required: true,
    },
    type: {
      type: localizedFieldSchema,
      required: true,
    },
    pitchType: {
      type: localizedFieldSchema,
      required: true,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "maintenance"],
    },
    isNearByPlace: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    isHigherRanked: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    address: {
      required: true,
      type: localizedFieldSchema,
    },
    city: {
      required: true,
      type: localizedFieldSchema,
    },
    sponsored: {
      type: localizedFieldSchema,
      required: true,
    },
    description: {
      type: localizedFieldSchema,
      default: { en: "" },
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // validates "HH:mm"
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [localizedFieldSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Geospatial index
groundSchema.index({ location: "2dsphere" });

export const Ground =
  mongoose.models.Ground || mongoose.model<IGround>("Ground", groundSchema);

export const deepUnflatten = (obj: any) => {
  const result = {};
  for (const flatKey in obj) {
    const keys = flatKey.replace(/\[/g, ".").replace(/\]/g, "").split(".");
    let current: any = result;

    keys.forEach((key: any, i) => {
      const isLast = i === keys.length - 1;
      const nextKey = keys[i + 1];
      if (/^\d+$/.test(key)) key = parseInt(key);
      if (isLast) {
        const val: any = obj[flatKey];
        current[key] =
          typeof val === "string" && !isNaN(Number(val)) ? Number(val) : val;
      } else {
        if (!current[key]) {
          current[key] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[key];
      }
    });
  }
  return result;
};