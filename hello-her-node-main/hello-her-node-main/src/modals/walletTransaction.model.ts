import mongoose, { Document, Schema } from "mongoose";

export type WalletTransactionType =
  | "recharge"
  | "debit_call_minute"
  | "debit_call_second"
  | "refund_call"
  | "adjustment"
  | "earning_call"
  | "earning_call_end"
  | "admin_commission_end"
  | "withdrawal_request"
  | "withdrawal_paid"
  | "debit_call_auto"
  | "earning_call_auto"
  | "withdrawal"
  | "debit_call_end"
  | "paid_profile"

  // Chat-related transactions
  | "debit_chat"
  | "earning_chat"
  | "admin_commission_chat";

export interface IWalletTransaction extends Document {
  entityId: mongoose.Types.ObjectId; // can be user or provider
  entityType: "user" | "provider" | "admin" | "ServiceProvider";
  amount: number; // positive = credit, negative = debit
  status: "pending" | "success" | "failed" | "completed" | "rejected";
  type: WalletTransactionType;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "entityType", // dynamic reference
    },
    entityType: {
      type: String,
      required: true,
      enum: ["User", "ServiceProvider", "Admin", "ServiceProvider"],
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "recharge",
        "debit_call_minute",
        "debit_call_second",
        "refund_call",
        "adjustment",
        "earning_call",
        "earning_call_end",
        "admin_commission_end",
        "withdrawal_request",
        "paid_profile",
        "debit_call_auto",
        "earning_call_auto",
        "withdrawal",
        "debit_call_end",
        "penalty",
        // Chat-related transaction types
        "debit_chat",
        "earning_chat",
        "admin_commission_chat"
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "completed", "rejected"],
      default: "success",
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  "WalletTransaction",
  walletTransactionSchema
);
