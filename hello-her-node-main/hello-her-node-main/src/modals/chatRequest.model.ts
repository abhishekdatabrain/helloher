import mongoose, { Schema, Types, Document } from "mongoose";

export type ChatRequestStatus = "pending" | "accepted" | "rejected" | "requested";

export interface IChatRequest extends Document {
    userId: Types.ObjectId;
    providerId: Types.ObjectId;
    status: ChatRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

const chatRequestSchema = new Schema<IChatRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        providerId: {
            type: Schema.Types.ObjectId,
            ref: "ServiceProvider",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "requested"],
            default: "pending",
        },
    },
    { timestamps: true }
);

chatRequestSchema.index({ userId: 1, providerId: 1 }, { unique: true });

export default mongoose.model<IChatRequest>(
    "ChatRequest",
    chatRequestSchema
);