import { Schema, model, Document } from "mongoose";

export enum AvatarGender {
  MALE = "male",
  FEMALE = "female",
}

export interface IAvatar extends Document {
  name: string;
  imageUrl: string;
  isActive: boolean;
  gender: AvatarGender;
}

const avatarSchema = new Schema<IAvatar>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: Object.values(AvatarGender),
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Avatar = model<IAvatar>("Avatar", avatarSchema);
