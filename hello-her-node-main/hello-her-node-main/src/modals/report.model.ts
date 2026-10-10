import mongoose, { Document, Schema } from "mongoose";

// Status Enum for reports
export type ReportStatus = "pending" | "approved" | "rejected";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId; // The provider who reports
  reportedUserId: mongoose.Types.ObjectId; // The user being reported
  message: string; // Report message from provider
  status: ReportStatus; // Default pending, updated by admin
  adminRemark?: string; // Optional remark from admin
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema: Schema<IReport> = new Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminRemark: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>("Report", ReportSchema);