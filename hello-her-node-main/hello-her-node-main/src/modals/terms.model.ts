import mongoose, { Schema, model, Document } from "mongoose";

export interface ITerms extends Document {
  version: number;                 // auto incremented version
  content: string;                 // terms & conditions content
  createdBy: mongoose.Types.ObjectId; // admin id
  isActive: boolean;               // only one active policy
  createdAt: Date;
}

const termsSchema = new Schema<ITerms>(
  {
    version: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const TermsModel = model<ITerms>("Terms", termsSchema);
export default TermsModel;
