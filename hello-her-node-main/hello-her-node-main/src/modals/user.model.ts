import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/config";
import mongoose, { Document, Schema } from "mongoose";

export type ProfileImageSource = "profilePicture" | "avatar";

// 🔒 Interface
export interface IUser extends Document {
  name: string;
  email: string;
  googleId?: string;
  password?: string;
  phoneNumber?: string;
  dateOfBirth: Date | null;
  gender?: "male" | "female" | "other";
  role?: string;
  status: "active" | "pending";
  profilePicture?: string | null;
  avatar?: string | null;
  activeImageType?: ProfileImageSource;
  rating?: string;
  availability?: boolean;
  bio?: string;
  fcmToken?: string;
  ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  preferences?: {
    language?: string[];
    notifications?: {
      messages?: boolean;
      mentions?: boolean;
      calls?: boolean;
    };
  };
  isBlocked?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  isAdmin?: boolean;
  otp?: number;
  otpExpires?: Date;
  isVerified?: boolean;
  // Chat-related fields
  isOnline?: boolean;
  lastSeen?: Date;
  socketId?: string;
  chatSettings?: {
    allowDirectMessages?: boolean;
    showOnlineStatus?: boolean;
    messageNotifications?: boolean;
  };
  // ✅ Recharge/Payment tracking
  isPaid?: boolean;
  rechargeExpiryDate?: Date;
  /** flag set when user has an active paid profile picture subscription */
  isPaidProfilePicture?: boolean;
  generateJWT(): string;
  comparePassword?(candidatePassword: string): Promise<boolean>;
  wallet?: mongoose.Types.ObjectId;
  favorites?: mongoose.Types.ObjectId[];
}

// 📄 Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
      // validate: [validator.isEmail, "Invalid email"],
    },
    fcmToken: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    role: {
      type: String,
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: function () {
        return this.role === "user" ? "active" : "pending";
      },
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
    rating: {
      type: String,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    ageRange: {
      type: String,
      enum: ["18-24", "25-34", "35-44", "45-54", "55+"],
      default: null,
    },
    preferences: {
      type: {
        language: [{ type: String, default: [] }],
        notifications: {
          messages: { type: Boolean, default: true },
          mentions: { type: Boolean, default: true },
          calls: { type: Boolean, default: true },
        },
      },
      default: {
        language: ["English"],
        notifications: { messages: true, mentions: true, calls: true },
      },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: Schema.Types.ObjectId,
      ref: "Otp",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Chat-related fields
    isOnline: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
    },
    chatSettings: {
      allowDirectMessages: {
        type: Boolean,
        default: true,
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
      messageNotifications: {
        type: Boolean,
        default: true,
      },
    },
    password: {
      type: String,
      // required: true,
      // minlength: 6,
      // select: false,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      unique: true,
      sparse: true,
    },
    // ✅ Recharge/Payment tracking
    isPaid: {
      type: Boolean,
      default: false,
    },
    rechargeExpiryDate: {
      type: Date,
      default: null,
    },
    // ✅ Paid profile picture flag (becomes true when paid profile purchased/approved)
    isPaidProfilePicture: {
      type: Boolean,
      default: false,
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("activeImageUrl").get(function (this: IUser) {
  if (this.activeImageType === "avatar") {
    return this.avatar || this.profilePicture || null;
  }
  return this.profilePicture || this.avatar || null;
});

// 🔐 Password Hashing Middleware
userSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password!, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// 🔍 Password Comparison Method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password!);
};

// 🪪 JWT Method
userSchema.methods.generateJWT = function (): string {
  return jwt.sign({ id: this._id, email: this.email }, config.jwt.secret, {
    expiresIn: "7d",
  });
};

// ✅ Helper method to check if user's recharge is still active
userSchema.methods.isRechargeActive = function (): boolean {
  if (!this.isPaid || !this.rechargeExpiryDate) {
    return false;
  }
  // Check if recharge expiry date is in the future
  return new Date() < new Date(this.rechargeExpiryDate);
};

// ✅ Pre-save hook to validate and update isPaid based on recharge expiry
userSchema.pre("save", function (next) {
  // If rechargeExpiryDate is set and it's in the past, mark as not paid
  if (this.rechargeExpiryDate) {
    if (new Date() > new Date(this.rechargeExpiryDate)) {
      this.isPaid = false;
    }
  }
  next();
});

// ✅ Export
export const User = mongoose.model<IUser>("User", userSchema);
