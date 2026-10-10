import mongoose, { Document, Schema } from "mongoose";

export interface IPaidProfilePlan extends Document {
    name: string;
    amount: number; // in Rs
    durationDays: number; // e.g., 90 days
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const paidProfilePlanSchema = new Schema<IPaidProfilePlan>(
    {
        name: { type: String, required: true, trim: true, unique:true },
        amount: { type: Number, required: true, min: 1 },
        durationDays: { type: Number, required:true, min:1 },
        description: { type: String, default: "" },
    },
    { timestamps: true }
);

export const PaidProfilePlan = mongoose.model<IPaidProfilePlan>("PaidProfilePlan", paidProfilePlanSchema);
