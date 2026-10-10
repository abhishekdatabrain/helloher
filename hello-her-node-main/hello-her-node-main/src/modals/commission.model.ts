import mongoose, { Schema, Document } from "mongoose";

export interface ICommission extends Document {
  perMinutePricePaise: number;

  /** If true, use only `globalCommissionPercentage` and ignore slab percentages */
  useGlobalCommission: boolean;

  /** 0–100; used only when `useGlobalCommission` is true */
  globalCommissionPercentage: number;

  /** Minimum withdrawal amount */
  minimumWithdrawalAmount: number;

  commissionSlabs: {
    minSeconds: number;
    maxSeconds: number;
    providerSharePaise: number;
    adminSharePaise: number;
    /** 0–100; ignored if `useGlobalCommission` is true */
    commissionPercentage?: number;
  }[];
}

const CommissionSlabSchema = new Schema(
  {
    minSeconds: { type: Number, required: true },
    maxSeconds: { type: Number, required: true },
    providerSharePaise: { type: Number, required: true },
    adminSharePaise: { type: Number, required: true },
    commissionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: true }
);

const CommissionSchema = new Schema<ICommission>(
  {
    perMinutePricePaise: { type: Number, default: 600, min: 0 },

    useGlobalCommission: { type: Boolean, default: false },

    globalCommissionPercentage: { type: Number, min: 0, max: 100, default: 0 },

    minimumWithdrawalAmount: { type: Number, default: 100 },

    commissionSlabs: [CommissionSlabSchema],
  },
  { timestamps: true }
);

export default mongoose.model<ICommission>("Commission", CommissionSchema);
