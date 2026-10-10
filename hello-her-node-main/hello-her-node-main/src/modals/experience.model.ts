import mongoose, { Schema, Document } from "mongoose";

export interface IExperience extends Document {
    role: "user" | "provider";
    userModel: string;
    userId: mongoose.Types.ObjectId | string;
    submittedByModel?: string;
    message: string;
    createdAt?: Date;
    updatedAt?: Date;
    submittedById?: mongoose.Types.ObjectId | string;
}

const experienceSchema = new Schema<IExperience>(
    {
        role: {
            type: String,
            enum: ["user", "provider"],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        submittedById: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "submittedByModel",
        },
        submittedByModel: {
            type: String,
            enum: ["User", "ServiceProvider", "Admin"],
        },
    },
    {
        timestamps: true,
        collection: "experiences"
    }
);

const Experience = mongoose.model<IExperience>("Experience", experienceSchema);

export default Experience;
