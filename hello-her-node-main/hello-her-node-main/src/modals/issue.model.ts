import mongoose, { Schema, Document } from "mongoose";

export type IssueStatus = "pending" | "under_review" | "resolved" | "escalated" | "closed";

export interface IIssue extends Document {
    role: "user" | "provider";
    name: string;
    mobile?: string;
    email?: string;
    status: IssueStatus;
    issueCategory: string;
    message: string;
    screenshot?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const issueSchema = new Schema<IIssue>(
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
        mobile: {
            type: String,
            trim: true,
            sparse: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
        },
        issueCategory: {
            type: String,
            required: true,
            enum: [
                "payment",
                "technical",
                "account",
                "service",
                "other",
            ],
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        screenshot: {
            type: String,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

const Issue = mongoose.model<IIssue>("Issue", issueSchema);

export default Issue;
