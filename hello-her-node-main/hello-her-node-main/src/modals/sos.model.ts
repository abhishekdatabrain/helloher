import mongoose, { Schema, Document } from "mongoose";

export interface ISos extends Document {
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const SosSchema: Schema = new Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISos>("Sos", SosSchema);