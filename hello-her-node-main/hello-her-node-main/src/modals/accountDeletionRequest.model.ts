import mongoose, { Schema, Document } from "mongoose";

export interface IAccountDeletionRequest extends Document {
  phoneNumber: string;
  appType: "user" | "listener";
  userId?: mongoose.Types.ObjectId;
  providerId?: mongoose.Types.ObjectId;
  reason?: string;
  feedback?: string;
  status: "completed" | "pending" | "rejected";
  ipAddress?: string;
  userAgent?: string;
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountDeletionRequestSchema = new Schema<IAccountDeletionRequest>(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    appType: {
      type: String,
      enum: ["user", "listener"],
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "rejected"],
      default: "completed",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const AccountDeletionRequest = mongoose.model<IAccountDeletionRequest>(
  "AccountDeletionRequest",
  AccountDeletionRequestSchema
);

export default AccountDeletionRequest;
