import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  senderModel: "User" | "ServiceProvider";
  receiverId: Types.ObjectId;
  receiverModel: "User" | "ServiceProvider";
  text?: string;
  media?: string;
  read: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    refPath: "senderModel",
    required: true,
  },
  senderModel: {
    type: String,
    enum: ["User", "ServiceProvider"], // sender can be User or Provider
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    refPath: "receiverModel",
    required: true,
  },
  receiverModel: {
    type: String,
    enum: ["User", "ServiceProvider"], // receiver can be User or Provider
    required: true,
  },
  text: String,
  media: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// export const Chat = model<IMessage>("Chat", messageSchema);
// export type { IMessage };
export const Chat = model<IMessage>("Chat", messageSchema);
