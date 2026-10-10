import mongoose, { Schema, Document, Types } from "mongoose";

export enum ApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface IApplication extends Document {
  userId: Types.ObjectId; // Player applying
  academyId: Types.ObjectId; // Academy applied to
  sport: string; // Sport applied for
  status: ApplicationStatus;
  verificationData?: any; // Any documents or verification info
  appliedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  adminNotes?: string;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    academyId: { type: Schema.Types.ObjectId, ref: "Academy", required: true },
    sport: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
    },
    verificationData: { type: Schema.Types.Mixed },
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);
