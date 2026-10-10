import mongoose, { Schema, model, Document } from "mongoose";

export interface IAgreement extends Document {
  version: number;                     // auto incremented version
  title?: string;                       // agreement title
  pdfUrl: string;                      // uploaded agreement pdf (S3 URL)
  isActive: boolean;                   // only one active agreement
  createdAt: Date;
  updatedAt: Date;
}

const agreementSchema = new Schema<IAgreement>(
  {
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      trim: true,
    },
    pdfUrl: {
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

// Increment version on update
agreementSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.version += 1;
  }
  next();
});

const AgreementModel = model<IAgreement>("Agreement", agreementSchema);
export default AgreementModel;