import mongoose, { Document, Schema } from "mongoose";

export interface IWithdrawal extends Document {
  providerId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  isPaid:boolean;
  requestedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedBy?: mongoose.Types.ObjectId;
  adminNotes?: string;
  walletTransaction?: mongoose.Types.ObjectId; // Link to WalletTransaction
  bankAccount?: mongoose.Types.ObjectId; // Which account to pay into
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    isPaid:{type: Boolean, default: false},
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
    adminNotes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    walletTransaction: {
      type: Schema.Types.ObjectId,
      ref: "WalletTransaction",
    },
    bankAccount: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
    },
  },
  { timestamps: true }
);

export const Withdrawal =
  mongoose.models.Withdrawal ||
  mongoose.model<IWithdrawal>("Withdrawal", withdrawalSchema);