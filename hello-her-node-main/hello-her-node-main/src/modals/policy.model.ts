import mongoose, { Schema, model, Document } from "mongoose";

export interface IPolicy extends Document {
  version: number;                 // auto incremented version
  content: string;                 // privacy policy as simple string
  createdBy: mongoose.Types.ObjectId; // admin id
  isActive: boolean;               // only one active policy
  createdAt: Date;
}

const policySchema = new Schema<IPolicy>(
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
      default: true,
    },
  },
  { timestamps: true }
);

policySchema.pre("save", function (next) {
  if (!this.isNew) {
    this.version += 1; // Increment version on every save
  }
  next();
});

const PolicyModel = model<IPolicy>("Policy", policySchema);
export default PolicyModel;
