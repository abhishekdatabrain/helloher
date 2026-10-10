import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Otp from "../../modals/otp.model";
import ApiError from "../../utils/ApiError";
import { config } from "../../config/config";
import ApiResponse from "../../utils/ApiResponse";
import { Wallet } from "../../modals/wallet.model";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import { extractImageUrl } from "../../admin/banner/banner.controller";
import { User, IUser, ProfileImageSource } from "../../modals/user.model";
import Language from "../../modals/language.model";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(config.google.clientId);

// const otpService = new CommonService(Otp);
const userService = new CommonService(User);

interface CustomRequest extends Request {
  user?: IUser;
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const normalizeImageSource = (
  value: unknown,
): ProfileImageSource | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "avatar") return "avatar";
  if (
    [
      "profilepicture",
      "profile_picture",
      "profile-picture",
      "profile",
    ].includes(normalized)
  ) {
    return "profilePicture";
  }
  return undefined;
};

const getImageUrlFromInput = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstValue = value[0] as { url?: unknown };
    if (typeof firstValue?.url === "string" && firstValue.url.trim()) {
      return firstValue.url.trim();
    }
  }

  if (
    value &&
    typeof value === "object" &&
    "url" in (value as Record<string, unknown>)
  ) {
    const imageUrl = (value as { url?: unknown }).url;
    if (typeof imageUrl === "string" && imageUrl.trim()) {
      return imageUrl.trim();
    }
  }

  return undefined;
};

const validateImageUrlInput = (
  url: string | undefined,
  fieldName: string,
): void => {
  if (!url) return;
  if (OBJECT_ID_PATTERN.test(url)) {
    throw new ApiError(
      400,
      `${fieldName} must be an image URL, not an _id reference`,
    );
  }
};

const resolveActiveImageUrl = (user: {
  profilePicture?: string | null;
  avatar?: string | null;
  activeImageType?: ProfileImageSource;
}): string | null => {
  if (user.activeImageType === "avatar") {
    return user.avatar || user.profilePicture || null;
  }
  return user.profilePicture || user.avatar || null;
};

const toUserResponse = (user: any) => {
  if (!user) return user;
  const normalizedUser =
    typeof user.toObject === "function" ? user.toObject() : user;
  // ✅ Convert paise → rupees
  if (
    normalizedUser.wallet &&
    typeof normalizedUser.wallet.balance === "number"
  ) {
    normalizedUser.wallet.balance = normalizedUser.wallet.balance / 100;
  }
  return {
    ...normalizedUser,
    activeImageUrl: resolveActiveImageUrl(normalizedUser),
  };
};

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { bio, name, email, ageRange, dateOfBirth, preferences, gender } = req.body;
      const phoneNumber =
        typeof req.body?.phoneNumber === "string"
          ? req.body.phoneNumber.trim()
          : "";
      console.log("[DEBUG][register] parsed inputs", {
        phoneNumber,
        bio,
        name,
        email,
        ageRange,
        dateOfBirth,
        preferences,
        gender,
      });
      const avatar = getImageUrlFromInput(req.body?.avatar);
      const profilePicture = getImageUrlFromInput(req.body?.profilePicture);
      const requestedImageSource = normalizeImageSource(
        req.body?.activeImageType,
      );

      validateImageUrlInput(profilePicture, "profilePicture");
      validateImageUrlInput(avatar, "avatar");

      if (req.body?.activeImageType !== undefined && !requestedImageSource) {
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'",
        );
      }

      // ✅ Required fields (NO password)
      if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
      }

      const normalizedEmail =
        typeof email === "string" && email.trim()
          ? email.trim().toLowerCase()
          : undefined;

      const authHeader = req.header("Authorization");
      const adminToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
      let isAdminRequest = false;

      if (adminToken) {
        try {
          const decoded = jwt.verify(adminToken, config.jwt.secret) as {
            id: string;
            role?: string;
          };
          isAdminRequest = decoded?.role === "admin";
        } catch {
          isAdminRequest = false;
        }
      }

      // // ✅ Check if user already exists (only by phone number)
      // const existingUser = await User.findOne({
      //   phoneNumber, isDeleted: false
      // });
      // if (existingUser) {
      //   throw new ApiError(409, "Phone number already exists");
      // }

      // ✅ Check in BOTH collections
      const [existingUser, existingProvider] = await Promise.all([
        User.findOne({ phoneNumber, isDeleted: false }),
        mongoose
          .model("ServiceProvider")
          .findOne({ phoneNumber, isDeleted: false }),
      ]);

      if (existingUser || existingProvider) {
        throw new ApiError(409, "Phone number already exists");
      }

      // ✅ Ensure phone number is OTP verified
      let otpDoc: any = null;
      if (!isAdminRequest) {
        otpDoc = await Otp.findOne({
          phoneNumber,
          verified: true,
        });

        if (!otpDoc) {
          throw new ApiError(400, "Phone number not verified via OTP");
        }
      }

      // ✅ Create user (NO password field)
      const activeImageType: ProfileImageSource =
        requestedImageSource ||
        (avatar && !profilePicture ? "avatar" : "profilePicture");

      if (activeImageType === "avatar" && !avatar) {
        throw new ApiError(400, "Avatar image URL is required for avatar mode");
      }
      if (
        activeImageType === "profilePicture" &&
        !profilePicture &&
        requestedImageSource
      ) {
        throw new ApiError(
          400,
          "Profile picture image URL is required for profilePicture mode",
        );
      }

      const langIds = preferences?.language || [];

      const languageDocs = await mongoose
        .model("Language")
        .find({ _id: { $in: langIds } })
        .select("_id");

      const languageIds = languageDocs.map((el) => el._id);

      // console.log("languageDocs", languageDocs);
      // console.log("languageIds", languageIds);
      const newUser = await User.create({
        phoneNumber,
        email: normalizedEmail || undefined,
        name,
        dateOfBirth: dateOfBirth || null,
        preferences: {
          language: languageIds,
        },
        bio,
        ageRange: ageRange || null,
        gender: gender || "other",
        profilePicture: profilePicture || null,
        avatar: avatar || null,
        activeImageType,
        isVerified: true,
      });

      console.log("New User created with ID:", newUser);

      // ✅ Create wallet
      const wallet = await Wallet.create({
        user: newUser._id,
        balance: 0,
      });

      newUser.wallet = wallet._id;
      await newUser.save();

      if (otpDoc?._id) {
        await Otp.deleteOne({ _id: otpDoc._id });
      }
      // ✅ Generate JWT token
      const token = jwt.sign(
        {
          id: newUser._id,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
        },
        config.jwt.secret,
        { expiresIn: "7d" },
      );

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            user: toUserResponse(newUser),
            token,
          },
          "User registered successfully",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  // static async requestOtpForLogin(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const { phoneNumber } = req.body;
  //     if (!phoneNumber) throw new ApiError(400, "Phone number is required");

  //     const user = await User.findOne({ phoneNumber });
  //     if (user?.isDeleted) {
  //       throw new ApiError(403, "Your account has been deleted");
  //     }
  //     // const user = await User.findOne({ phoneNumber });
  //     // if (!user) throw new ApiError(404, "User not found");

  //     // Generate OTP
  //     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  //     await Otp.findOneAndUpdate(
  //       { phoneNumber },
  //       { phoneNumber, otp: otpCode, expiresAt, verified: false },
  //       { upsert: true, new: true, setDefaultsOnInsert: true }
  //     );

  //     console.log(`OTP for login ${phoneNumber}: ${otpCode}`);
  //     // TODO: Send OTP via SMS service

  //     return res
  //       .status(200)
  //       .json(new ApiResponse(200, { otpCode }, "OTP sent successfully"));
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  // // 🔑 Step 2: Login with OTP
  // static async loginWithOtp(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { phoneNumber, otp } = req.body;
  //     if (!phoneNumber || !otp)
  //       throw new ApiError(400, "Phone number and OTP are required");

  //     const otpDoc = await Otp.findOne({ phoneNumber, otp, verified: false });
  //     if (!otpDoc || otpDoc.expiresAt < new Date())
  //       throw new ApiError(400, "Invalid or expired OTP");

  //     otpDoc.verified = true;
  //     // await otpDoc.save();
  //     await Otp.deleteOne({ _id: otpDoc._id });

  //     let exist = false;
  //     let user = await User.findOne({ phoneNumber });

  //     if (user?.isDeleted) {
  //       throw new ApiError(403, "Your account has been deleted");
  //     }
  //     if (!user) {
  //       user = new User({
  //         phoneNumber,
  //         isVerified: true,
  //       });

  //       await user.save({ validateBeforeSave: false });
  //     } else {
  //       exist = true;
  //     }

  //     if (user.isDeleted) {
  //       throw new ApiError(403, "Your account has been deleted");
  //     }

  //     if (user.isBlocked) {
  //       throw new ApiError(
  //         403,
  //         "You can't login because your account is blocked."
  //       );
  //     }

  //     // Generate JWT
  //     const token = jwt.sign(
  //       { id: user._id, phoneNumber: user.phoneNumber, role: user.role },
  //       config.jwt.secret,
  //       { expiresIn: "7d" }
  //     );

  //     return res
  //       .status(200)
  //       .json(new ApiResponse(200, { user, token, exist }, "Login successful"));
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  // 👤 Get current user

  static async getCurrent(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Unauthorized");
      console.log("user id is", userId);

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      })
        .select("-password")
        .populate({ path: "wallet", select: "balance" });

      if (!user) throw new ApiError(404, "User not found");

      return res
        .status(200)
        .json(
          new ApiResponse(200, toUserResponse(user), "Current user fetched"),
        );
    } catch (err) {
      next(err);
    }
  }

  // ✏️ Update user
  static async update(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id || req.user?.id;
      if (!userId) throw new ApiError(400, "User ID required");

      const {
        name,
        email,
        password,
        dateOfBirth,
        bio,
        preferences,
        role,
        gender,
        isBlocked,
        ageRange,
        avatar,
        profilePicture,
        fcmToken,
      } = req.body;
      const requestedImageSource = normalizeImageSource(
        req.body?.activeImageType,
      );

      if (req.body?.activeImageType !== undefined && !requestedImageSource) {
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'",
        );
      }

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      }).select("+password");
      if (!user) throw new ApiError(404, "User not found");

      // Update basic fields
      if ("name" in req.body) user.name = name;
      if ("email" in req.body) user.email = email;
      if ("phoneNumber" in req.body) user.phoneNumber = req.body.phoneNumber;
      if ("dateOfBirth" in req.body) user.dateOfBirth = dateOfBirth;
      if ("bio" in req.body) user.bio = bio;
      if ("role" in req.body) user.role = role;
      if ("isBlocked" in req.body) user.isBlocked = isBlocked;
      if ("ageRange" in req.body) user.ageRange = ageRange;
      if ("gender" in req.body) user.gender = gender;
      if ("avatar" in req.body) {
        const avatarUrl = getImageUrlFromInput(avatar);
        validateImageUrlInput(avatarUrl, "avatar");
        user.avatar = avatarUrl || null;
      }
      if ("profilePicture" in req.body) {
        const profilePictureUrl = getImageUrlFromInput(profilePicture);
        validateImageUrlInput(profilePictureUrl, "profilePicture");
        user.profilePicture = profilePictureUrl || null;
      }

      if ("fcmToken" in req.body) {
        user.fcmToken = fcmToken;
      }

      // Use local variable to safely update preferences
      let updatedPreferences = user.preferences || {
        language: [],
        notifications: {},
      };

      if (preferences) {
        if ("language" in preferences) {
          updatedPreferences.language = preferences.language ?? [];
        }
        if ("notifications" in preferences) {
          updatedPreferences.notifications = {
            ...updatedPreferences.notifications,
            ...preferences.notifications,
          };
        }
      }

      user.preferences = updatedPreferences;

      // Update password if provided
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      if (requestedImageSource) {
        const requestedImageUrl =
          requestedImageSource === "avatar" ? user.avatar : user.profilePicture;
        if (!requestedImageUrl) {
          throw new ApiError(
            400,
            `Cannot activate ${requestedImageSource}. Please set its image URL first.`,
          );
        }
        user.activeImageType = requestedImageSource;
      } else {
        const currentSource = user.activeImageType || "profilePicture";
        if (currentSource === "avatar" && !user.avatar && user.profilePicture) {
          user.activeImageType = "profilePicture";
        } else if (
          currentSource === "profilePicture" &&
          !user.profilePicture &&
          user.avatar
        ) {
          user.activeImageType = "avatar";
        }
      }

      await user.save();

      // 🔔 Create notification for profile update
      try {
        const { createAndEmitNotification } =
          await import("../../services/notificationHelper.service");
        const io = req.app.get("socketio");
        const getSocketUser = req.app.get("getSocketUser");

        await createAndEmitNotification({
          type: "profile_updated",
          title: "Profile Updated",
          message: "Your profile has been updated successfully.",
          recipientId: userId,
          recipientType: "user",
          metadata: {
            updatedFields: Object.keys(req.body),
          },
          io,
          getSocketUser,
        });
      } catch (notifError) {
        console.error(
          "Error creating profile update notification:",
          notifError,
        );
        // Don't fail the request if notification fails
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            toUserResponse(user),
            "User updated successfully",
          ),
        );
    } catch (err) {
      next(err);
    }
  }

  // 🖼 Upload profile picture
  static async uploadProfilePicture(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const profilePicture = req?.body?.profilePicture?.[0]?.url;
      if (!profilePicture) throw new ApiError(400, "No file uploaded");
      validateImageUrlInput(profilePicture, "profilePicture");

      const user = await userService.getById(userId);
      if (!user) throw new ApiError(404, "User not found");

      let imageUrl;
      if (req?.body?.image && user.profilePicture)
        imageUrl = await extractImageUrl(req.body.image, user.profilePicture);

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: imageUrl || profilePicture },
        { new: true },
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            profilePicture: updatedUser?.profilePicture || null,
            avatar: updatedUser?.avatar || null,
            activeImageType: updatedUser?.activeImageType || "profilePicture",
            imageUrl: updatedUser ? resolveActiveImageUrl(updatedUser) : null,
          },
          "Profile picture updated",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  static async toggleActiveImageSource(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const requestedSource = normalizeImageSource(
        req.body?.activeImageType ?? req.body?.type,
      );
      if (!requestedSource) {
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'",
        );
      }

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });
      if (!user) throw new ApiError(404, "User not found");

      const requestedImageUrl =
        requestedSource === "avatar" ? user.avatar : user.profilePicture;
      if (!requestedImageUrl) {
        throw new ApiError(
          400,
          `Cannot activate ${requestedSource}. Please set its image URL first.`,
        );
      }

      user.activeImageType = requestedSource;
      await user.save();

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            activeImageType: user.activeImageType,
            imageUrl: resolveActiveImageUrl(user),
          },
          "Active profile image updated successfully",
        ),
      );
    } catch (err) {
      next(err);
    }
  }

  // 🔍 Get user by ID
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params?.id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
      }

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      })
        .select("-password")
        .populate({ path: "wallet", select: "balance" });

      if (!user) throw new ApiError(404, "User not found");

      const userResponse = toUserResponse(user);
      if (
        Array.isArray(userResponse.language) &&
        userResponse.language.length > 0
      ) {
        const languageIds = userResponse.language.filter((lang: any) =>
          mongoose.Types.ObjectId.isValid(String(lang)),
        );
        if (languageIds.length > 0) {
          const languages = await Language.find({
            _id: { $in: languageIds },
            isActive: true,
          }).select("label");
          userResponse.languageNames = languages.map((lang) => lang.label);
        }
      }

      // Check if the logged-in user is a provider and if this user is blocked by or connected to them
      let isBlockedByProvider = false;
      let isConnectedToProvider = false;
      try {
        const authUser = (req as any).user;
        // Accept both 'provider' and 'ServiceProvider' (case-insensitive)
        if (
          authUser &&
          typeof authUser.role === "string" &&
          ["provider", "serviceprovider"].includes(authUser.role.toLowerCase())
        ) {
          const { default: ServiceProvider } =
            await import("../../modals/serviceProvider.model");
          const provider = await ServiceProvider.findById(authUser.id).select(
            "blockedUsers connectedUsers",
          );
          if (provider) {
            if (Array.isArray(provider.blockedUsers)) {
              isBlockedByProvider = provider.blockedUsers.some(
                (blockedId: any) => blockedId?.toString() === userId,
              );
            }
            if (Array.isArray(provider.connectedUsers)) {
              isConnectedToProvider = provider.connectedUsers.some(
                (connId: any) => connId?.toString() === userId,
              );
            }
          }
        }
      } catch (blockErr) {
        isBlockedByProvider = false;
        isConnectedToProvider = false;
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { ...userResponse, isBlockedByProvider, isConnectedToProvider },
            "User profile fetched successfully",
          ),
        );
    } catch (err) {
      next(err);
    }
  }

  // 👥 Get all users (optional filter)
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Pass all query params directly - getPipeline will handle filtering
      const users = await userService.getAll({
        ...req.query,
        role: "user",
        // isDeleted: false,
        // isAdmin: false,
      });
      const resultWithActiveImage = {
        ...users,
        result: users.result.map((user: any) => ({
          ...user,
          activeImageUrl: resolveActiveImageUrl(user),
        })),
      };
      return res
        .status(200)
        .json(new ApiResponse(200, resultWithActiveImage, "All users fetched"));
    } catch (err) {
      next(err);
    }
  }

  // 🗑 Delete account
  static async deleteAccountById(
    req: CustomRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      await User.deleteOne({ _id: userId });
      return res.status(200).json(new ApiResponse(200, {}, "Account deleted"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteMyAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;

      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      const dbUser = await User.findById(userId);

      if (!dbUser) {
        throw new ApiError(404, "User not found");
      }

      // Idempotent delete
      if (dbUser.isDeleted) {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Account already deleted"));
      }

      dbUser.isDeleted = true;
      dbUser.isBlocked = true;
      dbUser.isVerified = false;
      dbUser.isOnline = false;
      dbUser.deletedAt = new Date();

      await dbUser.save();

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Account deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // static async verifyOtp(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const phoneNumber =
  //       typeof req.body?.phoneNumber === "string"
  //         ? req.body.phoneNumber.trim()
  //         : "";
  //     const otp = String(req.body?.otp ?? "").trim();

  //     if (!phoneNumber || !otp)
  //       throw new ApiError(400, "Phone number & OTP required");

  //     const otpDoc = await Otp.findOne({ phoneNumber, otp, verified: false });
  //     if (!otpDoc || otpDoc.expiresAt < new Date())
  //       throw new ApiError(400, "Invalid or expired OTP");

  //     await Otp.deleteOne({ _id: otpDoc._id });

  //     return res
  //       .status(200)
  //       .json(new ApiResponse(200, { phoneNumber }, "OTP verified"));
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  // 🔐 Login with Google OAuth
  // static async loginWithGoogle(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction,
  // ) {
  //   try {
  //     const { idToken } = req.body;
  //     if (!idToken) throw new ApiError(400, "ID token is required");

  //     // Verify the token using Google's OAuth2Client

  //     const ticket = await client.verifyIdToken({
  //       idToken,
  //       audience: config.google.clientId,
  //     });

  //     const payload = ticket.getPayload();
  //     if (!payload) throw new ApiError(401, "Invalid token");

  //     const { email, name, picture, sub: googleId } = payload;

  //     const normalizedEmail =
  //       typeof email === "string" ? email.trim().toLowerCase() : undefined;

  //     if (!normalizedEmail)
  //       throw new ApiError(400, "Email not provided by Google");

  //     // Find or create user
  //     let user = await User.findOne({
  //       $or: [{ email: normalizedEmail }, { googleId }],
  //       isDeleted: false,
  //     });

  //     if (!user) {
  //       // Create new user from Google data
  //       user = await User.create({
  //         name: name || normalizedEmail.split("@")[0] || "User",
  //         email: normalizedEmail,
  //         googleId,
  //         profilePicture: picture || null,
  //         activeImageType: "profilePicture",
  //         phoneNumber: null,
  //         isVerified: true, // Google verified
  //         role: "user",
  //       });

  //     }
  //       // Create wallet for new user
  //       if (!user.wallet) {
  //         const wallet = await Wallet.create({
  //           user: user._id,
  //           balance: 0,
  //         });
  //         user.wallet = wallet._id;
  //       }
  //       // await user.save();

  //     if (!user.activeImageType) {
  //       user.activeImageType =
  //         user.avatar && !user.profilePicture ? "avatar" : "profilePicture";
  //     }

  //     if (!user.googleId) {
  //       user.googleId = googleId;
  //       // await user.save();
  //     }

  //     // Update last seen & online status
  //     user.lastSeen = new Date();
  //     user.isOnline = true;
  //     await user.save();

  //     // Generate JWT token
  //     const token = jwt.sign(
  //       {
  //         id: user._id,
  //         email: user.email,
  //         role: user.role,
  //       },
  //       config.jwt.secret,
  //       { expiresIn: "7d" },
  //     );

  //     return res.status(200).json(
  //       new ApiResponse(
  //         200,
  //         {
  //           user: {
  //             id: user._id,
  //             name: user.name,
  //             email: user.email,
  //             profilePicture: user.profilePicture,
  //             avatar: user.avatar || null,
  //             activeImageType: user.activeImageType,
  //             activeImageUrl: resolveActiveImageUrl(user),
  //             role: user.role,
  //           },
  //           token,
  //         },
  //         "Google login successful",
  //       ),
  //     );
  //   } catch (err) {
  //     next(err);
  //   }
  // }
}
