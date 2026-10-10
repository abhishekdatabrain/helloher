import { Schema, model, Document } from "mongoose";

export interface IBank extends Document {
  name: string;
  isActive: boolean;
}

const bankSchema = new Schema<IBank>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Bank = model<IBank>("Bank", bankSchema);