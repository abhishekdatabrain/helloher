import mongoose, { Document, Schema, Model } from "mongoose";

export interface IBankAccount extends Document {
  providerId: mongoose.Types.ObjectId;
  bankName?: mongoose.Types.ObjectId; // ref to Bank
  ifscCode?: string;
  accountNumber?: string;
  upiId?: string;
  // aadharPhoto?: string;
  panNumber?: string;
  isKycVerified: boolean;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    bankName: { type: Schema.Types.ObjectId, ref: "Bank", required: true },
    ifscCode: String,
    accountNumber: String,
    upiId: String,
    // aadharPhoto: String,
    panNumber: String,
    isKycVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BankAccount: Model<IBankAccount> =
  mongoose.models.BankAccount || mongoose.model<IBankAccount>("BankAccount", bankAccountSchema);
