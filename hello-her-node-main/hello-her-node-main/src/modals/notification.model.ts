import mongoose, { Document, Schema } from "mongoose";

export type UserType = "user" | "provider" | "admin";

export interface INotification extends Document {
  type: string;
  title: string;
  message: string;
  notificationKey?: string;
  recipientId: mongoose.Types.ObjectId;
  recipientType: UserType;
  senderId?: mongoose.Types.ObjectId;
  senderType?: UserType;
  status: "unread" | "read";
  readAt?: Date;
  metadata?: {
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "profile_updated",
        "message_received",
        "call_received",
        "call_ended",
        "wallet_recharged",
        "warning_strike",
        "commission_mode_changed",
        "manual_penalty",
        "chat_request",
        "chat_request_accepted",
        "chat_request_rejected",
        "sos_request",
        "low_balance_call",
        "provider_online",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    notificationKey: {
      type: String,
      default: undefined,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "recipientTypeModel",
    },
    recipientType: {
      type: String,
      required: true,
      enum: ["user", "provider", "admin"],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      refPath: "senderTypeModel",
    },
    senderType: {
      type: String,
      enum: ["user", "provider", "admin"],
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ recipientId: 1, recipientType: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ notificationKey: 1 }, { unique: true, sparse: true });

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
