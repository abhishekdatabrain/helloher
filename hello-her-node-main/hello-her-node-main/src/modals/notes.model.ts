import mongoose, { Schema, Document } from "mongoose";

export interface INotes extends Document {
    userId?: mongoose.Types.ObjectId;
    providerId: mongoose.Types.ObjectId;
    title?: string;
    content: string;
}

const NotesSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceProvider",
            required: true,
        },
        title: {
            type: String,
            required: false,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<INotes>("Notes", NotesSchema);