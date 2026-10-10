import mongoose, { Document, Schema } from "mongoose";

export type PaidProfileStatus =
    | "pending_payment"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "removed";

export interface IPaidProfile extends Document {
    userId: mongoose.Types.ObjectId;
    planId?: mongoose.Types.ObjectId;
    status: PaidProfileStatus;
    paidAt?: Date;
    startDate?: Date;
    endDate?: Date;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    meta?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const paidProfileSchema = new Schema<IPaidProfile>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
        planId: { type: Schema.Types.ObjectId, ref: "PaidProfilePlan", required: false },
        status: {
            type: String,
            enum: ["pending_payment", "pending_approval", "approved", "rejected", "removed"],
            default: "pending_payment",
        },
        paidAt: { type: Date },
        startDate: { type: Date },
        endDate: { type: Date },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export const PaidProfile = mongoose.model<IPaidProfile>("PaidProfile", paidProfileSchema);

// ----------------------
// Settings embedded model for toggling the feature
// ----------------------
export interface IPaidProfileSetting extends Document {
    key: string;
    enabled: boolean;
    meta?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const paidProfileSettingSchema = new Schema<IPaidProfileSetting>(
    {
        key: { type: String, required: true, unique: true },
        enabled: { type: Boolean, default: true },
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export const PaidProfileSetting = mongoose.model<IPaidProfileSetting>("PaidProfileSetting", paidProfileSettingSchema);
