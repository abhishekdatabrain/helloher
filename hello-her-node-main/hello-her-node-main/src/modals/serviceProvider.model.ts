import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Interface for commission slabs
export interface ICommissionSlab {
  minSeconds: number;
  maxSeconds: number;
  adminSharePaise: number;
  providerSharePaise: number;
}

// Face Verification Status Enum
export type FaceVerificationStatus =
  | "verified"
  | "pending"
  | "unverified"
  | "reverify";

// Warning Level Enum
export type WarningLevel =
  | "clear"
  | "level1"
  | "level2"
  | "level3"
  | "ignored_calls"
  | "low_online_hours";

export type KycStatus = "approve" | "reject" | "request_reverify" | "pending";
export type ProviderImageSource = "profilePicture" | "avatar";

// Provider Interface
export interface IProvider extends Document {
  phoneNumber: string;
  email?: string;
  password?: string | null; // optional; provider can login with OTP
  name: string;
  alias?: string;
  age: number;
  languages: mongoose.Types.ObjectId[];
  bio?: string;
  faceVerificationPicture?: string;
  faceVerificationStatus: FaceVerificationStatus;
  audioSample: string; //for audio-based verification used in admin panel 
  audioNote?: string; //provider's audio notes that show up in provider details in app
  warning?: WarningLevel;
  profilePicture?: string | null;
  avatar?: string | null;
  activeImageType?: ProviderImageSource;
  aadharPhoto?: string;
  isOnline: boolean;
  // Realtime call tracking
  isOnCall?: boolean;
  fcmToken?: string;
  currentCallStartedAt?: Date | null;
  currentCallSessionId?: Types.ObjectId | null;
  socketId?: string | null;
  lastActive?: Date;
  totalEarnings: number;
  todayEarnings: number;
  bankAccount: Types.ObjectId[];
  withdrawals: Types.ObjectId[];
  blockedUsers: Types.ObjectId[];
  connectedUsers: Types.ObjectId[];
  averageRating: number;
  totalRatings: number;
  role: string;
  providerId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isBlocked: boolean;
  blockRemark?: string;
  incentive?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  kycStatus: "approve" | "reject" | "request_reverify" | "pending"; // defaults to "pending"
  flagSuspicious: boolean;
  remark?: string;
}

const providerSchema: Schema<IProvider> = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      trim: true,
      default: null,
      select: false,
      set: (value: unknown) => {
        if (typeof value !== "string") return value;
        const normalized = value.trim();
        return normalized || null;
      },
      validate: {
        validator: (value: string | null | undefined) =>
          value === null || value === undefined || value.length >= 8,
        message: "Password must be at least 8 characters",
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    alias: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    languages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Language",
        required: true,
      },
    ],
    bio: {
      type: String,
      maxlength: 500,
    },
    profilePicture: {
      type: String,
      trim: true,
      default: null,
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
    },
    activeImageType: {
      type: String,
      enum: ["profilePicture", "avatar"],
      default: "profilePicture",
    },
    faceVerificationPicture: {
      type: String,
    },
    audioSample: {
      type: String,
      required: true,
    },
    audioNote: {
      type: String,
    },
    faceVerificationStatus: {
      type: String,
      enum: ["verified", "pending", "unverified", "reverify"],
      default: "unverified",
    },
    warning: {
      type: String,
      enum: [
        "clear",
        "level1",
        "level2",
        "level3",
        "ignored_calls",
        "low_online_hours",
      ],
      default: "clear",
    },
    aadharPhoto: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    // Realtime: provider currently on a live call
    isOnCall: {
      type: Boolean,
      default: false,
    },
    // When current call started (null when not on call)
    currentCallStartedAt: {
      type: Date,
      default: null,
    },
    currentCallSessionId: {
      type: Schema.Types.ObjectId,
      ref: "CallSession",
      default: null,
      index: true,
    },
    // Persist active socket id for realtime events
    socketId: {
      type: String,
      default: null,
    },
    lastActive: {
      type: Date,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    todayEarnings: {
      type: Number,
      default: 0,
    },
    bankAccount: {
      type: [Schema.Types.ObjectId],
      ref: "BankAccount",
      default: [],
    },
    withdrawals: [{ type: Schema.Types.ObjectId, ref: "Withdrawal" }],
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    connectedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    role: {
      type: String,
      default: "provider",
    },
    providerId: {
      type: String,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRatings: {
      type: Number,
      min: 0,
      default: 0,
    },
    incentive: {
      type: Number,
      default: 0,
    },
    kycStatus: {
      type: String,
      enum: ["approve", "reject", "request_reverify", "pending"],
      default: "pending",
    },
    flagSuspicious: {
      type: Boolean,
      default: false,
    },
    remark: {
      type: String,
      maxlength: 500,
    },
    blockRemark: {
      type: String,
      maxlength: 500,
    },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Counter schema for generating sequential provider IDs
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Pre-save hook to assign a unique providerId like HH1, HH2, ... for new providers
providerSchema.pre<IProvider>("save", async function (next) {
  try {
    if (this.isNew && !this.providerId) {
      const counter = await Counter.findOneAndUpdate(
        { _id: "serviceProviderId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.providerId = `HH-${counter.seq}`;
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

const Provider: Model<IProvider> =
  mongoose.models.ServiceProvider ||
  mongoose.model<IProvider>("ServiceProvider", providerSchema);

export default Provider;
