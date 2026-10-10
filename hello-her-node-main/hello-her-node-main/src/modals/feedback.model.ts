import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
    type: "issue" | "query" | "experience";
    role: "user" | "provider";
    name: string;
    mobile?: string;
    email?: string;
    phone?: string;
    issueCategory?: string;
    message: string;
    screenshot?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const feedbackSchema = new Schema<IFeedback>(
    {
        type: {
            type: String,
            enum: ["issue", "query", "experience"],
            required: true,
        },
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
        phone: {
            type: String,
            trim: true,
            sparse: true,
        },
        issueCategory: {
            type: String,
            enum: [
                "payment",
                "technical",
                "account",
                "service",
                "other",
            ],
            sparse: true,
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

const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);

export default Feedback;
