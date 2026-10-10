import mongoose, { Document, Schema } from "mongoose";

export interface IOtp extends Document {
  otp: string;
  email?: string;
  expiresAt: Date;
  verified: boolean;
  phoneNumber: string;
}

const otpSchema = new Schema<IOtp>(
  {
    phoneNumber: {
      type: String,
      require: false
    },
    otp: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false
    },
    expiresAt: {
      type: Date,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

otpSchema.pre("validate", function (next) {
  if (!this.phoneNumber && !this.email) {
    this.invalidate(
      "phoneNumber",
      "Either phoneNumber or email must be provided"
    );
  }
  next();
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

const Otp = mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
