import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProgress extends Document {
  playerId: Types.ObjectId;
  slotId: Types.ObjectId;
  date: Date;
  notes: string;
  rating?: number; // e.g., 1-10 scale
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    date: { type: Date, required: true },
    notes: { type: String, required: true },
    rating: { type: Number, min: 1, max: 10 },
  },
  { timestamps: true }
);

export const Progress = mongoose.model<IProgress>("Progress", ProgressSchema);
