import mongoose, { Schema, Document, model } from "mongoose";

/**
 * Helpdesk Submission Types
 */
export type HelpdeskType = "query" | "feedback" | "issue";

/**
 * Helpdesk Status
 */
export type HelpdeskStatus = "open" | "in-progress" | "resolved" | "closed";

/**
 * Helpdesk Priority
 */
export type HelpdeskPriority = "low" | "medium" | "high" | "urgent";

// User roles that can create a helpdesk ticket
export type HelpdeskCreatorRole = "admin" | "user" | "ground" | "ServiceProvider";

/**
 * Issue Categories for issues
 */
export type IssueCategoryType =
  | "payment_issue"
  | "booking_issue"
  | "quality_issue"
  | "behavior_issue"
  | "technical_issue"
  | "other";

/**
 * Helpdesk Schema & Interface
 */
export interface IHelpdesk extends Document {
  // Type of submission
  type: HelpdeskType;

  // Common fields for all types
  name: string;
  email: string;
  phone: string;
  message: string;

  // Creator info (optional if ticket created without auth)
  requestedBy?: mongoose.Types.ObjectId;
  role?: HelpdeskCreatorRole;

  // Fields specific to issue type
  issueCategory?: IssueCategoryType;
  screenshots?: string[]; // Array of AWS S3 image URLs

  // Status & Response (handled by admin)
  status: HelpdeskStatus;
  adminResponse?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;

  // Metadata
  isRead: boolean;
  priority?: HelpdeskPriority;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const HelpdeskSchema = new Schema<IHelpdesk>(
  {
    type: {
      type: String,
      enum: ["query", "feedback", "issue"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
    // Creator info (optional)
    requestedBy: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "user", "ground", "ServiceProvider"],
      index: true,
    },
    // Issue-specific fields
    issueCategory: {
      type: String,
      enum: [
        "payment_issue",
        "booking_issue",
        "quality_issue",
        "behavior_issue",
        "technical_issue",
        "other",
      ],
    },
    screenshots: {
      type: [String], // Array of S3 URLs
      default: [],
    },
    // Status & Response
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    adminResponse: String,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    respondedAt: Date,
    // Metadata
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low",
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for filtering
HelpdeskSchema.index({ type: 1, status: 1 });
HelpdeskSchema.index({ type: 1, priority: 1 });

export const Helpdesk =
  mongoose.models.Helpdesk || model<IHelpdesk>("Helpdesk", HelpdeskSchema);
