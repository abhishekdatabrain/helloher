import { ILocalizedField } from "./ground.model";
import mongoose, { Schema, Document, Types } from "mongoose";

export enum AcademyStatus {
  ACTIVE = "active",
  CLOSED = "closed",
  INACTIVE = "inactive",
}

// Restrict available sports
export enum SportType {
  TENNIS = "tennis",
  CRICKET = "cricket",
  PADDLES = "paddles",
  FOOTBALL = "football",
  VOLLEYBALL = "volleyball",
  BASKETBALL = "basketball",
}

// Allowed weekdays in English (for validation)
export enum WeekDays {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

// Define IAcademy interface
export interface IAcademy extends Document {
  name: ILocalizedField;
  status: AcademyStatus;
  sports: ILocalizedField[];
  coaches: Types.ObjectId[];
  grounds: Types.ObjectId[];
  description: ILocalizedField;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl: string;
  startTime: string;
  workingDays: ILocalizedField[];
}

// Schema
const AcademySchema = new Schema<IAcademy>(
  {
    name: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: Schema.Types.Mixed,
      required: true,
    },
    sports: [],
    coaches: [
      {
        type: Schema.Types.ObjectId,
        ref: "Coach",
      },
    ],
    grounds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Ground",
      },
    ],
    status: {
      type: String,
      default: AcademyStatus.ACTIVE,
      enum: Object.values(AcademyStatus),
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    imageUrl: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    workingDays: [],
  },
  { timestamps: true }
);

export const Academy = mongoose.model<IAcademy>("Academy", AcademySchema);
