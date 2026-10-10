import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITrainingSlot extends Document {
  academyId: Types.ObjectId;
  sport: string;
  coachId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  maxPlayers: number;
  assignedPlayers: Types.ObjectId[];  // player ids
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSlotSchema = new Schema<ITrainingSlot>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: "Academy", required: true },
    sport: { type: String, required: true },
    coachId: { type: Schema.Types.ObjectId, ref: "Coach", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxPlayers: { type: Number, default: 10 },
    assignedPlayers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const TrainingSlot = mongoose.model<ITrainingSlot>("TrainingSlot", TrainingSlotSchema);
