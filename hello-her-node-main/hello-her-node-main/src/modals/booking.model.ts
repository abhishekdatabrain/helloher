import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  createdAt: Date;
  updatedAt: Date;
  paymentId?: string;
  cancelledAt?: Date;
  totalAmount: number;
  finalAmount: number;
  rescheduled?: boolean;
  discountAmount: number;
  numberOfGuests: number;
  meta?: Record<string, any>;
  notes: Record<string, any>;
  cancellationReason?: string;
  userId: mongoose.Types.ObjectId;
  slots: mongoose.Types.ObjectId[];
  couponId: mongoose.Types.ObjectId;
  groundId: mongoose.Types.ObjectId;
  paymentDetails: Record<string, any>;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "completed" | "rescheduled" | "cancelled";
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groundId: {
      type: Schema.Types.ObjectId,
      ref: "Ground",
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    slots: [
      {
        type: Schema.Types.ObjectId,
        ref: "Slot",
        required: true,
      },
    ],
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: { type: Number },
    finalAmount: {
      type: Number,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    rescheduled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "rescheduled", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },

    notes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
