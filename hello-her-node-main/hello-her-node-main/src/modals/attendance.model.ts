import mongoose, { Schema, Document, Types } from "mongoose";

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  EXCUSED = "excused",
}

export interface IAttendance extends Document {
  slotId: Types.ObjectId;
  playerId: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ slotId: 1, playerId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
