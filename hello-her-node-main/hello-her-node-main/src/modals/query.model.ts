import mongoose, { Schema, Document } from "mongoose";

export type QueryStatus = "pending" | "under_review" | "resolved" | "escalated" | "closed";

export interface IQuery extends Document {
    role: "user" | "provider";
    name: string;
    email: string;
    status: QueryStatus;
    phone: string;
    message: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const querySchema = new Schema<IQuery>(
    {
        role: {
            type: String,
            enum: ["user", "provider"],
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["pending", "under_review", "resolved", "escalated", "closed"],
            default: "pending",
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Query = mongoose.model<IQuery>("Query", querySchema);

export default Query;
