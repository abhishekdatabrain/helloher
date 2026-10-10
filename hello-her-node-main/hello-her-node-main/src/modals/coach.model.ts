import mongoose, { Schema, Document } from "mongoose";

export enum CoachStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
}

export interface ILocalizedField {
    en: string;
    ar?: string;
}

export interface ICoach extends Document {
    email: string;
    experience: number;
    phoneNumber: string;
    bio: ILocalizedField;
    name: ILocalizedField;
    profileImage?: string;
    address: ILocalizedField;
    createdAt: Date;
    updatedAt: Date;
    status: CoachStatus;
    totalSessions: number;
}

const localizedFieldSchema = new Schema<ILocalizedField>(
    {
        en: { type: String, required: true },
        ar: { type: String },
    },
    { _id: false }
);

const CoachSchema = new Schema<ICoach>(
    {
        profileImage: String,
        bio: { type: localizedFieldSchema, required: true },
        experience: { type: Number, default: 0 },
        name: { type: localizedFieldSchema, required: true },
        email: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        address: {
            type: localizedFieldSchema,
            required: true,
        },
        totalSessions: { type: Number, default: 0 },
        status: {
            type: String,
            default: CoachStatus.ACTIVE,
            enum: Object.values(CoachStatus),
        },
    },
    { timestamps: true }
);

// Indexes
CoachSchema.index({ "name.en": "text", "name.ar": "text", "bio.en": "text", "bio.ar": "text" });
CoachSchema.index({ "location.city": 1, "location.state": 1 });
CoachSchema.index({ status: 1 });

export const Coach = mongoose.model<ICoach>("Coach", CoachSchema);
