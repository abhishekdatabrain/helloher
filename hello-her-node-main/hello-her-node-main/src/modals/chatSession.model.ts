import mongoose, { Schema, Document } from "mongoose";

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  lastChargedMinute: number;
  lastActivityAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },

  providerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "ServiceProvider",
  },

  lastChargedMinute: {
    type: Number,
    default: 0,
  },

  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
});

chatSessionSchema.index({ userId: 1, providerId: 1 }, { unique: true });

export const ChatSession = mongoose.model<IChatSession>(
  "ChatSession",
  chatSessionSchema
);