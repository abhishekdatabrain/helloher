import mongoose from "mongoose";
import { User } from "../modals/user.model";
import { Wallet } from "../modals/wallet.model";
import ServiceProvider from "../modals/serviceProvider.model";
import Language from "../modals/language.model";

export const DUMMY_OTP = "123456";

export const DUMMY_USER_PHONE_NUMBERS = new Set<string>([
  "9999990123", // Primary Dummy User
  "9648756737", // Existing Ronit Test User
]);

export const DUMMY_PROVIDER_PHONE_NUMBERS = new Set<string>([
  "8888880123", // Primary Dummy Listener
  "9638527410", // Existing Rashmi Provider
]);

export const isDummyUserPhone = (phoneNumber?: string | null): boolean => {
  if (!phoneNumber) return false;
  return DUMMY_USER_PHONE_NUMBERS.has(phoneNumber.trim());
};

export const isDummyProviderPhone = (phoneNumber?: string | null): boolean => {
  if (!phoneNumber) return false;
  return DUMMY_PROVIDER_PHONE_NUMBERS.has(phoneNumber.trim());
};

/**
 * Ensures a dummy User document exists in DB with an active wallet and balance
 */
export const ensureDummyUser = async (phoneNumber: string) => {
  const normalizedPhone = phoneNumber.trim();

  let user = await User.findOne({
    phoneNumber: normalizedPhone,
    isDeleted: false,
  }).select("-password -__v");

  if (user) {
    // If user exists but wallet is missing, create/link wallet
    if (!user.wallet) {
      let wallet = await Wallet.findOne({ user: user._id });
      if (!wallet) {
        wallet = await Wallet.create({
          user: user._id,
          balance: 50000, // 500.00 INR
        });
      }
      user.wallet = wallet._id as any;
      await user.save();
    }
    return user;
  }

  // Create new dummy user
  const newUser = await User.create({
    phoneNumber: normalizedPhone,
    name: "Demo User",
    gender: "other",
    bio: "Demo User for App Review and Testing",
    isVerified: true,
    activeImageType: "profilePicture",
    profilePicture:
      "https://miniios3.aaademosites.com/billiyo/avatars/fb281e37-8004-4094-8eae-fe5bc7c78a6c.png",
  });

  const wallet = await Wallet.create({
    user: newUser._id,
    balance: 50000, // 500.00 INR
  });

  newUser.wallet = wallet._id as any;
  await newUser.save();

  return await User.findById(newUser._id).select("-password -__v");
};

/**
 * Ensures a dummy ServiceProvider (Listener) document exists in DB
 * with approved KYC, active status, and online status.
 */
export const ensureDummyProvider = async (phoneNumber: string) => {
  const normalizedPhone = phoneNumber.trim();

  let provider = await ServiceProvider.findOne({
    phoneNumber: normalizedPhone,
    isDeleted: false,
  });

  if (provider) {
    if (!provider.isActive || provider.kycStatus !== "approve") {
      provider.isActive = true;
      provider.isBlocked = false;
      provider.kycStatus = "approve";
      provider.isOnline = true;
      await provider.save();
    }
    return provider;
  }

  // Find any active language ID to satisfy required schema
  let langId: mongoose.Types.ObjectId | null = null;
  try {
    const lang = await Language.findOne({ isActive: true }).select("_id");
    if (lang?._id) {
      langId = lang._id as any;
    }
  } catch (e) {
    console.warn("Could not find Language document for dummy provider:", e);
  }

  const newProvider = await ServiceProvider.create({
    phoneNumber: normalizedPhone,
    name: "Demo Listener",
    alias: "Sweet Angel",
    age: 24,
    bio: "Hello, I am a demo listener available for testing and audio calls.",
    languages: langId ? [langId] : [new mongoose.Types.ObjectId()],
    audioSample: "https://miniios3.aaademosites.com/hello-her/sample.mp3",
    audioNote: "Welcome to my profile, feel free to call me anytime!",
    faceVerificationStatus: "verified",
    kycStatus: "approve",
    isActive: true,
    isBlocked: false,
    isOnline: true,
    averageRating: 5,
    totalRatings: 10,
    activeImageType: "profilePicture",
    profilePicture:
      "https://miniios3.aaademosites.com/hello-her/provider/4de50b05-38c6-45d4-8372-2880bb11e3b1.jpg",
  });

  return newProvider;
};
