import mongoose, { Schema, Document, Types } from "mongoose";
import { IWalletTransaction } from "./walletTransaction.model";

export interface IWallet extends Document {
  user: Types.ObjectId;
  balance: number;
  transactions: Types.ObjectId[]; // Use Types.ObjectId here
  createdAt?: Date;
  updatedAt?: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: Schema.Types.ObjectId,
      ref: "WalletTransaction"
    }],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
