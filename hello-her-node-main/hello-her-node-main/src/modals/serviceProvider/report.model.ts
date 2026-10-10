import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IReport extends Document {
  reportedById: Types.ObjectId;
  reportedByModel: "User" | "ServiceProvider";
  accusedId: Types.ObjectId;
  accusedModel: "User" | "ServiceProvider";
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt?: Date;
  updatedAt?: Date;
}

const reportSchema: Schema<IReport> = new Schema(
  {
    // Who made the report
    reportedById: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "reportedByModel", // dynamically refers to either User or ServiceProvider
    },
    reportedByModel: {
      type: String,
      required: true,
      enum: ["User", "ServiceProvider"],
    },

    // Who/what is being reported
    accusedId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "accusedModel", // dynamically refers to either User or ServiceProvider
    },
    accusedModel: {
      type: String,
      required: true,
      enum: ["User", "ServiceProvider"],
    },

    reason: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report: Model<IReport> = mongoose.model<IReport>("Report", reportSchema);
export default Report;
