import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type MediaType = "image" | "video" | "audio" | "file";

export interface IMessageMedia {
  url: string;
  type: MediaType;
  mimeType?: string;
  size?: number;       // in bytes
  duration?: number;   // for audio/video (seconds)
}

export interface IMessage extends Document {
  text?: string;
  media?: IMessageMedia[];
  status: "sent" | "delivered" | "read";
  isRead: boolean;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  senderRole: "user" | "provider";
  createdAt: Date;
  updatedAt: Date;
}

const messageMediaSchema = new Schema<IMessageMedia>(
  {
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["image", "video", "audio", "file"],
      required: true,
    },
    mimeType: { type: String },
    size: { type: Number },
    duration: { type: Number },
  },
  { _id: false } // prevents auto _id for each media item
);

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, required: true },
    receiverId: { type: Schema.Types.ObjectId, required: true },
    senderRole: {
      type: String,
      enum: ["user", "provider"],
      required: true,
    },
    text: { type: String, trim: true },
    media: {
      type: [messageMediaSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      required: true,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

export default Message;
