import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { config } from "../../config/config";
import bcrypt from "bcrypt";
import Otp from "../../modals/otp.model";
import ServiceProvider, {
  ProviderImageSource,
} from "../../modals/serviceProvider.model";
import { BankAccount } from "../../modals/bankAccount.model";
import { Bank } from "../../modals/bank.model";
import { Withdrawal } from "../../modals/withdraw.model";
import { WalletTransaction } from "../../modals/walletTransaction.model";
import Commission from "../../modals/commission.model";
import { IBankAccount } from "../../modals/bankAccount.model";
import { generateAccessToken } from "../../utils/token";
import { CommonService } from "../../services/common.services";
import Message from "../../modals/message.model";
import { User } from "../../modals/user.model";
import { CallSession } from "../../modals/callSession.model";
import ChatRequest from "../../modals/chatRequest.model";
import { TrustScore } from "../../modals/trustScore.model";
import { applyAvailabilityPenalties } from "../../services/availabilityPenalty.service";
import { sendLoginOtpSms } from "../../services/msg91.service";
import { Chat } from "../../modals/chat.model";

const providerService = new CommonService(ServiceProvider);
const bankAccountService = new CommonService(BankAccount);
const withdrawalService = new CommonService(Withdrawal);
const walletTxnService = new CommonService(WalletTransaction);

// Constants for allowed values
const ALLOWED_KYC_STATUSES = ["approve", "reject", "request_reverify", "pending"];
const ALLOWED_FACE_VERIFICATION_STATUSES = ["verified", "pending", "unverified", "reverify"];
const ALLOWED_WARNING_LEVELS = ["clear", "level1", "level2", "level3", "ignored_calls", "low_online_hours"];
const OTP_FALLBACK_PHONE_NUMBERS = new Set([
  "9638527410", // Rashmi - service provider
  "9648756737", // Ronit Test - user
]);
const OTP_FALLBACK_CODE = "123456";

export class ProviderController {
  private static normalizePhoneNumber(phoneNumber: unknown): string {
    return typeof phoneNumber === "string" ? phoneNumber.trim() : "";
  }

  private static normalizeImageSource(
    value: unknown
  ): ProviderImageSource | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "avatar") return "avatar";
    if (
      ["profilepicture", "profile_picture", "profile-picture", "profile"].includes(
        normalized
      )
    ) {
      return "profilePicture";
    }
    return undefined;
  }

  private static extractImageUrl(input: unknown): string | undefined {
    if (!input) return undefined;
    if (typeof input === "string") {
      const normalized = input.trim();
      return normalized || undefined;
    }
    if (Array.isArray(input)) {
      const first = input[0] as any;
      if (typeof first === "string") {
        const normalized = first.trim();
        return normalized || undefined;
      }
      if (first && typeof first.url === "string") {
        const normalized = first.url.trim();
        return normalized || undefined;
      }
      return undefined;
    }
    if (typeof input === "object") {
      const maybeObj = input as { url?: unknown };
      if (typeof maybeObj.url === "string") {
        const normalized = maybeObj.url.trim();
        return normalized || undefined;
      }
    }
    return undefined;
  }

  private static resolveProviderImageInputs(body: any): {
    profilePicture?: string;
    avatar?: string;
  } {
    return {
      profilePicture:
        ProviderController.extractImageUrl(body?.profilePicture) ||
        ProviderController.extractImageUrl(body?.profile) ||
        undefined,
      avatar: ProviderController.extractImageUrl(body?.avatar) || undefined,
    };
  }

  private static resolveActiveImageUrl(provider: {
    profilePicture?: string | null;
    avatar?: string | null;
    activeImageType?: ProviderImageSource;
  }): string | null {
    if (provider.activeImageType === "avatar") {
      return provider.avatar || provider.profilePicture || null;
    }
    return provider.profilePicture || provider.avatar || null;
  }

  private static sanitizeProvider(provider: any) {
    if (!provider) return provider;
    const plainProvider =
      typeof provider?.toObject === "function" ? provider.toObject() : { ...provider };
    const normalizedActiveImageType: ProviderImageSource =
      plainProvider.activeImageType === "avatar" ||
        plainProvider.activeImageType === "profilePicture"
        ? plainProvider.activeImageType
        : plainProvider.avatar && !plainProvider.profilePicture
          ? "avatar"
          : "profilePicture";
    plainProvider.activeImageType = normalizedActiveImageType;
    plainProvider.avatar =
      plainProvider.avatar || plainProvider.profilePicture || null;
    plainProvider.activeImageUrl = ProviderController.resolveActiveImageUrl(
      plainProvider
    );

    // If bank account is populated, expose easy-to-use top-level bank fields
    const bankAccountRecord = Array.isArray(plainProvider.bankAccount)
      ? plainProvider.bankAccount[0]
      : plainProvider.bankAccount;

    if (bankAccountRecord && typeof bankAccountRecord === "object") {
      const rawBankName = bankAccountRecord.bankName as any;
      if (rawBankName && typeof rawBankName === "object") {
        plainProvider.bankName = (rawBankName as any).name || rawBankName.toString();
      } else {
        plainProvider.bankName = rawBankName;
      }
      plainProvider.accountNumber = bankAccountRecord.accountNumber;
      plainProvider.ifscCode = bankAccountRecord.ifscCode;
      plainProvider.panNumber = bankAccountRecord.panNumber;
      plainProvider.upiId = bankAccountRecord.upiId;
    }

    delete plainProvider.password;
    delete plainProvider.__v;
    return plainProvider;
  }

  public static async notifyProviderOnline(
    provider: any,
    io: any,
    getSocketUser: (userId: string) => { userId: string; socketId: string } | undefined
  ) {
    const providerIdStr = provider._id.toString();
    const providerObjId = new mongoose.Types.ObjectId(providerIdStr);

    const connectedUserIds = Array.isArray(provider.connectedUsers)
      ? provider.connectedUsers.map((id: any) => id.toString())
      : [];

    // 1. All users from previous calls (both incoming and outgoing)
    const callOutboundUserIds = await CallSession.distinct("callee", {
      $or: [{ caller: providerObjId }, { caller: providerIdStr }],
      calleeModel: { $ne: "ServiceProvider" },
    });
    const callInboundUserIds = await CallSession.distinct("caller", {
      $or: [{ callee: providerObjId }, { callee: providerIdStr }],
      callerModel: { $ne: "ServiceProvider" },
    });

    // 2. All users from chat requests
    const chatRequestUserIds = await ChatRequest.distinct("userId", {
      $or: [{ providerId: providerObjId }, { providerId: providerIdStr }],
    });

    // 3. All users from chat messages
    let msgSenderUserIds: any[] = [];
    let msgReceiverUserIds: any[] = [];
    try {
      const Message = (await import("../../modals/message.model")).default;
      msgSenderUserIds = await Message.distinct("senderId", {
        $or: [{ receiverId: providerObjId }, { receiverId: providerIdStr }],
      });
      msgReceiverUserIds = await Message.distinct("receiverId", {
        $or: [{ senderId: providerObjId }, { senderId: providerIdStr }],
      });
    } catch (e) {
      console.error("Error querying Message in notifyProviderOnline:", e);
    }

    // 4. All users from chat sessions
    let chatSessionUserIds: any[] = [];
    try {
      const { ChatSession } = await import("../../modals/chatSession.model");
      chatSessionUserIds = await ChatSession.distinct("userId", {
        $or: [{ providerId: providerObjId }, { providerId: providerIdStr }],
      });
    } catch (e) {
      console.error("Error querying ChatSession in notifyProviderOnline:", e);
    }

    // 5. All users who favorited this provider
    let favUserIds: any[] = [];
    try {
      favUserIds = await User.distinct("_id", {
        favorites: { $in: [providerObjId, providerIdStr] },
      });
    } catch (e) {
      console.error("Error querying favorites in notifyProviderOnline:", e);
    }

    const recipientIds = new Set<string>();
    connectedUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    callOutboundUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    callInboundUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    chatRequestUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    msgSenderUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    msgReceiverUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    chatSessionUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));
    favUserIds.forEach((id: any) => id && recipientIds.add(id.toString()));

    // Exclude users blocked by this provider
    const blockedUserIds = Array.isArray(provider.blockedUsers)
      ? provider.blockedUsers.map((id: any) => id?.toString()).filter(Boolean)
      : [];
    blockedUserIds.forEach((id: string) => recipientIds.delete(id));

    // Don't send notification to provider themselves
    recipientIds.delete(providerIdStr);

    const validRecipientIds = Array.from(recipientIds).filter(
      (id) => id && mongoose.Types.ObjectId.isValid(id) && id !== providerIdStr
    );

    if (validRecipientIds.length === 0) {
      console.log("[PROVIDER] No past connected users found for provider:", providerIdStr);
      return;
    }

    const providerName = provider.alias || provider.name || "Listener";
    const providerImage =
      provider.activeImageUrl ||
      provider.profilePicture ||
      provider.avatar ||
      "";

    console.log("[PROVIDER] Provider marked online, notifying connected clients:", {
      providerId: providerIdStr,
      recipientCount: validRecipientIds.length,
    });

    const notifyPayload = {
      providerId: providerIdStr,
      providerName,
      providerImage,
      status: "online",
    };

    validRecipientIds.forEach((recipientId) => {
      const clientSocket = getSocketUser ? getSocketUser(recipientId) : undefined;
      if (clientSocket && io) {
        io.to(clientSocket.socketId).emit("provider_online", notifyPayload);
      }
    });

    const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
    await Promise.allSettled(
      validRecipientIds.map((recipientId) =>
        createAndEmitNotification({
          type: "provider_online",
          title: `${providerName} is now online`,
          message: `${providerName} is now online. Tap to call!`,
          recipientId,
          recipientType: "user",
          senderId: providerIdStr,
          senderType: "provider",
          metadata: notifyPayload,
          io,
          getSocketUser,
        }),
      ),
    );
  }

  static async createProvider(req: Request, res: Response, next: NextFunction) {
    try {
      // -----------------------
      // Extract basic fields from form-data
      // -----------------------
      const phoneNumber = ProviderController.normalizePhoneNumber(req.body.phoneNumber);
      const name = typeof req.body.name === "string" ? req.body.name.trim() : req.body.name;
      const email =
        typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : req.body.email;
      const password =
        typeof req.body.password === "string" ? req.body.password.trim() : "";
      const alias = req.body.alias;
      const bio = req.body.bio;
      const age = req.body.age ? parseInt(req.body.age, 10) : undefined;
      if (!phoneNumber) throw new ApiError(400, "Phone number is required");
      if (!name) throw new ApiError(400, "Name is required");
      if (!age || isNaN(age)) throw new ApiError(400, "Age must be a number");
      if (password && password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
      }

      // NEW: incentive (optional, number >= 0)
      let incentive: number | undefined;
      if (req.body.incentive !== undefined && req.body.incentive !== null && req.body.incentive !== "") {
        const parsed = Number(req.body.incentive);
        if (isNaN(parsed) || parsed < 0) {
          throw new ApiError(400, "Incentive must be a non-negative number");
        }
        incentive = parsed;
      }

      // NEW: kycStatus (optional, defaults to "pending" in model)
      let kycStatus: "approve" | "reject" | "request_reverify" | "pending" | undefined;
      if (req.body.kycStatus) {
        if (!ALLOWED_KYC_STATUSES.includes(req.body.kycStatus)) {
          throw new ApiError(400, `KYC Status must be one of: ${ALLOWED_KYC_STATUSES.join(", ")}`);
        }
        kycStatus = req.body.kycStatus as "approve" | "reject" | "request_reverify" | "pending";
      }

      // NEW: flagSuspicious (optional boolean)
      let flagSuspicious: boolean | undefined;
      if (req.body.flagSuspicious !== undefined) {
        flagSuspicious = req.body.flagSuspicious === true || req.body.flagSuspicious === "true";
      }

      // NEW: remark (optional string)
      const remark = req.body.remark ? req.body.remark.trim() : undefined;

      // NEW: blockRemark (optional string)
      const blockRemark = req.body.blockRemark ? req.body.blockRemark.trim() : undefined;

      // Languages should now be dynamic Language IDs (ObjectId strings)
      let languages: mongoose.Types.ObjectId[] = [];
      if (req.body.languages) {
        const rawLanguages = Array.isArray(req.body.languages)
          ? req.body.languages
          : (req.body.languages as string)
            .split(",")
            .map((l: string) => l.trim())
            .filter(Boolean);

        languages = rawLanguages.map((lang: string) => {
          if (!mongoose.Types.ObjectId.isValid(lang)) {
            throw new ApiError(400, `Invalid language ID: ${lang}`);
          }
          return new mongoose.Types.ObjectId(lang);
        });
      }

      if (languages.length === 0)
        throw new ApiError(400, "At least one language is required");
      const hashedPassword = password
        ? await bcrypt.hash(password, 10) // saltRounds = 10
        : undefined;

      // -----------------------
      // Check OTP verification
      // -----------------------
      //   const otpDoc = await Otp.findOne({ phoneNumber, verified: true });
      //   if (!otpDoc) throw new ApiError(400, "Phone not verified via OTP");

      // -----------------------
      // Check if provider exists
      // -----------------------
      // const existing = await ServiceProvider.findOne({ phoneNumber });
      // if (existing) throw new ApiError(400, "Phone number already exists");

      // ✅ Check in BOTH Provider + User collections
      const [existingProvider, existingUser] = await Promise.all([
        ServiceProvider.findOne({ phoneNumber, isDeleted: false }),
        User.findOne({ phoneNumber, isDeleted: false }),
      ]);

      if (existingProvider || existingUser) {
        throw new ApiError(400, "Phone number already exists");
      }

      // -----------------------
      // Handle uploaded files (S3 middleware writes to req.body[field] = [{ url }])
      // -----------------------
      const requestedImageSource = ProviderController.normalizeImageSource(
        req.body?.activeImageType
      );
      if (req.body?.activeImageType !== undefined && !requestedImageSource) {
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'"
        );
      }
      const { profilePicture, avatar } =
        ProviderController.resolveProviderImageInputs(req.body);
      const activeImageType: ProviderImageSource =
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
          "Profile picture image URL is required for profilePicture mode"
        );
      }
      const aadharPhotoUrl =
        req?.body?.aadharPhoto?.[0]?.url ||
        undefined;
      const faceVerificationPictureUrl =
        req?.body?.faceVerificationPicture?.[0]?.url ||
        undefined;

      // Audio sample uploaded via S3 middleware (required)
      const audioSampleUrl = req?.body?.audioSample?.[0]?.url || undefined;
      if (!audioSampleUrl) throw new ApiError(400, "Audio sample is required");

      // -----------------------
      // Create provider using CommonService
      // -----------------------
      const serviceProvider = await providerService.create({
        phoneNumber,
        email,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        name,
        alias,
        age,
        languages,
        bio,
        profilePicture: profilePicture || null,
        avatar: avatar || null,
        activeImageType,
        aadharPhoto: aadharPhotoUrl,
        faceVerificationPicture: faceVerificationPictureUrl,
        audioSample: audioSampleUrl,
        ...(incentive !== undefined ? { incentive } : {}),
        ...(kycStatus !== undefined ? { kycStatus } : {}),
        ...(flagSuspicious !== undefined ? { flagSuspicious } : {}),
        ...(remark !== undefined ? { remark } : {}),
        ...(blockRemark !== undefined ? { blockRemark } : {}),
      });
      const spId = (serviceProvider as any)._id as mongoose.Types.ObjectId;

      // -----------------------
      // Optional bank account creation
      // -----------------------
      // Support both dot-notated form data (bankAccount.bankName) and nested JSON body (bankAccount: { bankName, ... })
      const bankAccountBody = req.body?.bankAccount || {};
      const bankName =
        bankAccountBody?.bankName ||
        req.body["bankAccount.bankName"] ||
        req.body.bankName;
      const ifscCode =
        bankAccountBody?.ifscCode ||
        req.body["bankAccount.ifscCode"] ||
        req.body.ifscCode;
      const accountNumber =
        bankAccountBody?.accountNumber ||
        req.body["bankAccount.accountNumber"] ||
        req.body.accountNumber;
      const panNumber =
        bankAccountBody?.panNumber ||
        req.body["bankAccount.panNumber"] ||
        req.body.panNumber;
      const upiId =
        bankAccountBody?.upiId ||
        req.body["bankAccount.upiId"] ||
        req.body.upiId;
      const hasBankFields =
        bankName ||
        ifscCode ||
        accountNumber ||
        panNumber ||
        upiId;

      if (hasBankFields) {
        const bankAccountData: IBankAccount = {
          providerId: spId,
          // bankName now references Bank._id
          bankName: bankName && mongoose.Types.ObjectId.isValid(bankName)
            ? new mongoose.Types.ObjectId(bankName)
            : bankName as any,
          ifscCode,
          accountNumber,
          panNumber,
          upiId,
          isKycVerified: false,
        } as IBankAccount;

        const bankAccount = await bankAccountService.create(bankAccountData);

        // Link bank account back to provider
        await providerService.updateById(spId.toString(), {
          bankAccount: bankAccount._id,
        });
      }

      // -----------------------
      // Generate JWT
      // -----------------------
      const token = generateAccessToken({
        id: spId.toString(),
        phoneNumber,
        role: "ServiceProvider",
      });

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            {
              serviceProvider: ProviderController.sanitizeProvider(serviceProvider),
              token,
            },
            "Provider created successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint to run availability penalty evaluation (can be run by cron)
   */
  static async applyAvailabilityPenalties(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get("socketio");
      const getSocketUser = req.app.get("getSocketUser");
      const { date, minCallsPerDay, minOnlineHoursPerDay, penaltyAmountRs } = req.body || {};

      await applyAvailabilityPenalties({
        date: date ? new Date(date) : undefined,
        minCallsPerDay: minCallsPerDay ?? undefined,
        minOnlineHoursPerDay: minOnlineHoursPerDay ?? undefined,
        penaltyAmountRs: penaltyAmountRs ?? undefined,
        io,
        getSocketUser,
      });

      return res.status(200).json(new ApiResponse(200, {}, "Availability penalties applied"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all blocked users
  */
  static async getAllBlockedUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Populate bankAccount array and filter only blocked users
      const additionalStages = [
        {
          $lookup: {
            from: "bankaccounts", // default Mongoose collection name
            localField: "bankAccount",
            foreignField: "_id",
            as: "bankAccount",
          },
        },
        {
          $match: {
            isDeleted: false,
            $or: [
              { isBlocked: true },
              { isBlocked: "true" },
            ],
          },
        },
        {
          $project: {
            phoneNumber: 1,
            email: 1,
            name: 1,
            alias: 1,
            age: 1,
            languages: 1,
            bio: 1,
            profilePicture: 1,
            avatar: { $ifNull: ["$avatar", "$profilePicture"] },
            activeImageType: { $ifNull: ["$activeImageType", "profilePicture"] },
            activeImageUrl: {
              $cond: [
                {
                  $eq: [{ $ifNull: ["$activeImageType", "profilePicture"] }, "avatar"],
                },
                { $ifNull: ["$avatar", "$profilePicture"] },
                { $ifNull: ["$profilePicture", "$avatar"] },
              ],
            },
            aadharPhoto: 1,
            audioNote: 1,
            isOnline: 1,
            totalEarnings: 1,
            todayEarnings: 1,
            bankAccount: 1,
            withdrawals: 1,
            blockedUsers: 1,
            role: 1,
            providerId: 1,
            isActive: 1,
            isBlocked: 1,
            incentive: 1,
            kycStatus: 1,
            flagSuspicious: 1,
            remark: 1,
            blockRemark: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const { result, pagination } = await providerService.getAll(
        req.query,
        additionalStages
      );

      res.status(200).json(
        new ApiResponse(200, { result, pagination }, "Blocked users fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all providers
   */
  static async getAllProviders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Build match stage with defaults and query parameter filters
      const matchStage: any = {
        // isActive:true,
        isDeleted: false, // Exclude Deleted Providers from Lists
      };

      matchStage.isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : true;

      // Add query parameter filters
      if (req.query.isBlocked !== undefined) {
        matchStage.isBlocked = req.query.isBlocked === "true";
      }

      if (req.query.isOnline !== undefined) {
        matchStage.isOnline = req.query.isOnline === "true";
      }

      if (req.query.kycStatus !== undefined) {
        matchStage.kycStatus = req.query.kycStatus;
      }

      if (req.query.flagSuspicious !== undefined) {
        matchStage.flagSuspicious = req.query.flagSuspicious === "true";
      }

      // if (req.query.isActive !== undefined) {
      //   matchStage.isActive = req.query.isActive === "false";
      // }
      // ✅ Only include active providers by default (if not explicitly provided in query params)
      // matchStage.isActive = req.query.isActive !== undefined
      //   ? req.query.isActive === "true"
      //   : true;

      // Populate bankAccount array via aggregation lookup and ensure isBlocked is included
      const additionalStages = [
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "languages",
            localField: "languages",
            foreignField: "_id",
            as: "languageObjects",
          },
        },
        {
          $lookup: {
            from: "ratings",
            localField: "_id",
            foreignField: "provider",
            as: "ratings",
          },
        },
        {
          $lookup: {
            from: "bankaccounts", // Mongoose default collection name for BankAccount
            localField: "bankAccount",
            foreignField: "_id",
            as: "bankAccount",
          },
        },
        {
          $lookup: {
            from: "banks",
            localField: "bankAccount.bankName",
            foreignField: "_id",
            as: "bankDetails",
          },
        },
        {
          $project: {
            ratings: 1,
            phoneNumber: 1,
            email: 1,
            name: 1,
            alias: 1,
            age: 1,
            languages: {
              $map: {
                input: "$languageObjects",
                as: "lang",
                in: "$$lang.label"
              }
            },
            bio: 1,
            profilePicture: 1,
            avatar: { $ifNull: ["$avatar", "$profilePicture"] },
            activeImageType: { $ifNull: ["$activeImageType", "profilePicture"] },
            activeImageUrl: {
              $cond: [
                {
                  $eq: [{ $ifNull: ["$activeImageType", "profilePicture"] }, "avatar"],
                },
                { $ifNull: ["$avatar", "$profilePicture"] },
                { $ifNull: ["$profilePicture", "$avatar"] },
              ],
            },
            aadharPhoto: 1,
            audioNote: 1,
            isOnline: 1,
            // Realtime call tracking
            isOnCall: 1,
            currentCallStartedAt: 1,
            totalEarnings: 1,
            todayEarnings: 1,
            // bankAccount: 1,
            withdrawals: 1,
            blockedUsers: 1,
            role: 1,
            providerId: 1,
            isActive: 1,
            isBlocked: 1,
            incentive: 1,
            kycStatus: 1,
            flagSuspicious: 1,
            remark: 1,
            blockRemark: 1,
            createdAt: 1,
            updatedAt: 1,
            totalRatings: 1,
            averageRating: 1,
            bankAccount: {
              $map: {
                input: "$bankAccount",
                as: "acc",
                in: {
                  _id: "$$acc._id",
                  ifscCode: "$$acc.ifscCode",
                  accountNumber: "$$acc.accountNumber",
                  panNumber: "$$acc.panNumber",
                  isKycVerified: "$$acc.isKycVerified",
                  bankName: {
                    $let: {
                      vars: {
                        bank: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$bankDetails",
                                as: "b",
                                cond: { $eq: ["$$b._id", "$$acc.bankName"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: "$$bank.name",
                    },
                  },
                },
              },
            },
          },
        },
      ];

      const { result, pagination } = await providerService.getAll(
        req.query,
        additionalStages
      );

      res.status(200).json(new ApiResponse(200, { result, pagination }));
    } catch (error) {
      next(error);
    }
  }

  static async getAllProvidersLeaderboard(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const additionalStages = [
        {
          $match: {
            isDeleted: false,
            isActive: true,
            isBlocked: false,
          },
        },
        {
          $project: {
            phoneNumber: 1,
            email: 1,
            name: 1,
            alias: 1,
            age: 1,
            languages: 1,
            bio: 1,
            profilePicture: 1,
            avatar: { $ifNull: ["$avatar", "$profilePicture"] },
            activeImageType: { $ifNull: ["$activeImageType", "profilePicture"] },
            activeImageUrl: {
              $cond: [
                {
                  $eq: [{ $ifNull: ["$activeImageType", "profilePicture"] }, "avatar"],
                },
                { $ifNull: ["$avatar", "$profilePicture"] },
                { $ifNull: ["$profilePicture", "$avatar"] },
              ],
            },
            audioNote: 1,
            isOnline: 1,
            totalEarnings: 1,
            todayEarnings: 1,
            role: 1,
            providerId: 1,
            incentive: 1,
            totalRatings: 1,
            averageRating: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const result = await providerService.getAll(
        {
          ...req.query,
          sortKey: "totalEarnings",
          sortDir: "desc",
        },
        additionalStages
      );

      res.status(200).json(
        new ApiResponse(
          200,
          result,
          "Providers earning leaderboard fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async getAllInactiveProviders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Populate bankAccount array via aggregation lookup and filter only inactive providers
      const additionalStages = [
        {
          $lookup: {
            from: "bankaccounts", // default Mongoose collection name
            localField: "bankAccount",
            foreignField: "_id",
            as: "bankAccount",
          },
        },
        {
          $match: {
            $or: [
              { isActive: false },
              { isActive: "false" },
            ],
            isDeleted: false,
          },
        },
        {
          $project: {
            phoneNumber: 1,
            email: 1,
            name: 1,
            alias: 1,
            age: 1,
            languages: 1,
            bio: 1,
            profilePicture: 1,
            avatar: { $ifNull: ["$avatar", "$profilePicture"] },
            activeImageType: { $ifNull: ["$activeImageType", "profilePicture"] },
            activeImageUrl: {
              $cond: [
                {
                  $eq: [{ $ifNull: ["$activeImageType", "profilePicture"] }, "avatar"],
                },
                { $ifNull: ["$avatar", "$profilePicture"] },
                { $ifNull: ["$profilePicture", "$avatar"] },
              ],
            },
            aadharPhoto: 1,
            audioNote: 1,
            isOnline: 1,
            totalEarnings: 1,
            todayEarnings: 1,
            bankAccount: 1,
            withdrawals: 1,
            blockedUsers: 1,
            role: 1,
            providerId: 1,
            isActive: 1,
            isBlocked: 1,
            incentive: 1,
            kycStatus: 1,
            blockRemark: 1,
            flagSuspicious: 1,
            remark: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const { result, pagination } = await providerService.getAll(
        req.query,
        additionalStages
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { result, pagination },
            "Inactive providers fetched successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async getInactiveProviderById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Provider ID is required");

      const provider = await ServiceProvider.findOne({
        _id: id,
        isActive: false,
        isDeleted: false,
      })
        .select("-password -__v")
        .populate({
          path: "bankAccount",
          populate: { path: "bankName", model: "Bank" },
        })
        .populate({
          path: "withdrawals",
          populate: { path: "walletTransaction" },
        });

      if (!provider) {
        throw new ApiError(404, "Inactive provider not found");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            ProviderController.sanitizeProvider(provider),
            "Inactive provider fetched successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * ✅ Activate an INACTIVE provider (set isActive → true)
   */
  static async updateInactiveProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, "Provider ID is required");

      // ✅ Only allow updates on INACTIVE providers
      const existingProvider = await ServiceProvider.findOne({
        _id: id,
        isActive: false,
        isDeleted: false,
      });

      if (!existingProvider) {
        throw new ApiError(
          404,
          "Inactive provider not found or already active"
        );
      }

      const { name, email, alias, age, languages, bio } = req.body;

      const updateData: any = { name, email, alias, bio };

      if (typeof age === "number") updateData.age = age;

      if (languages) {
        updateData.languages = Array.isArray(languages)
          ? languages
          : [languages];
      }

      // NEW: incentive update (non-negative number)
      if (req.body.incentive !== undefined) {
        const parsedIncentive = Number(req.body.incentive);
        if (Number.isNaN(parsedIncentive) || parsedIncentive < 0) {
          throw new ApiError(400, "Incentive must be a non-negative number");
        }
        updateData.incentive = parsedIncentive;
      }

      const passwordInput =
        typeof req.body.password === "string" ? req.body.password.trim() : "";
      if (passwordInput) {
        if (passwordInput.length < 8) {
          throw new ApiError(400, "Password must be at least 8 characters");
        }
        updateData.password = await bcrypt.hash(passwordInput, 10);
      }

      // ✅ Update profile/avatar/aadhar/faceVerification if provided
      const requestedImageSource = ProviderController.normalizeImageSource(
        req.body?.activeImageType ?? req.body?.type
      );
      if (
        (req.body?.activeImageType !== undefined || req.body?.type !== undefined) &&
        !requestedImageSource
      ) {
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'"
        );
      }

      const { profilePicture: updatedProfilePicture, avatar: updatedAvatar } =
        ProviderController.resolveProviderImageInputs(req.body);

      if (updatedProfilePicture) {
        updateData.profilePicture = updatedProfilePicture;
      }
      if (updatedAvatar) {
        updateData.avatar = updatedAvatar;
      }
      if (req.body.aadharPhoto?.[0]?.url)
        updateData.aadharPhoto = req.body.aadharPhoto[0].url;
      if (req.body.faceVerificationPicture?.[0]?.url)
        updateData.faceVerificationPicture = req.body.faceVerificationPicture[0].url;

      // Update audio sample if provided
      if (req.body.audioSample?.[0]?.url)
        updateData.audioSample = req.body.audioSample[0].url;

      // Update audio note if provided
      if (req.body.audioNote?.[0]?.url)
        updateData.audioNote = req.body.audioNote[0].url;

      // ✅ Update face verification status if provided
      if (req.body.faceVerificationStatus) {
        if (ALLOWED_FACE_VERIFICATION_STATUSES.includes(req.body.faceVerificationStatus)) {
          updateData.faceVerificationStatus = req.body.faceVerificationStatus;
        }
      }

      // ✅ Update warning level if provided
      if (req.body.warning) {
        if (ALLOWED_WARNING_LEVELS.includes(req.body.warning)) {
          updateData.warning = req.body.warning;
        } else {
          throw new ApiError(400, "Invalid warning level");
        }
      }

      // ✅ Update KYC Status if provided
      if (req.body.kycStatus) {
        if (!ALLOWED_KYC_STATUSES.includes(req.body.kycStatus)) {
          throw new ApiError(400, `KYC Status must be one of: ${ALLOWED_KYC_STATUSES.join(", ")}`);
        }
        updateData.kycStatus = req.body.kycStatus as "approve" | "reject" | "request_reverify" | "pending";
      }

      // ✅ Update flagSuspicious if provided
      if (req.body.flagSuspicious !== undefined) {
        updateData.flagSuspicious = req.body.flagSuspicious === true || req.body.flagSuspicious === "true";
      }

      // ✅ Update remark if provided
      if (req.body.remark !== undefined) {
        updateData.remark = req.body.remark ? req.body.remark.trim() : null;
      }

      // ✅ Update blockRemark if provided
      if (req.body.blockRemark !== undefined) {
        updateData.blockRemark = req.body.blockRemark ? req.body.blockRemark.trim() : null;
      }

      // ✅ Normalize booleans (but we will FORCE isActive = true later)
      const booleanFields = ["isOnline", "isBlocked"]; // ⬅️ removed isActive here
      booleanFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          const value = req.body[field];
          updateData[field] =
            value === "true" || value === "active" || value === true;
        }
      });

      const nextProfilePicture =
        updatedProfilePicture !== undefined
          ? updatedProfilePicture
          : existingProvider.profilePicture || null;
      const nextAvatar =
        updatedAvatar !== undefined
          ? updatedAvatar
          : (existingProvider as any).avatar || null;
      if (requestedImageSource) {
        const requestedImageUrl =
          requestedImageSource === "avatar" ? nextAvatar : nextProfilePicture;
        if (!requestedImageUrl) {
          throw new ApiError(
            400,
            `Cannot activate ${requestedImageSource}. Please set its image URL first.`
          );
        }
        updateData.activeImageType = requestedImageSource;
      } else {
        const currentSource =
          (existingProvider as any).activeImageType || "profilePicture";
        if (currentSource === "avatar" && !nextAvatar && nextProfilePicture) {
          updateData.activeImageType = "profilePicture";
        } else if (
          currentSource === "profilePicture" &&
          !nextProfilePicture &&
          nextAvatar
        ) {
          updateData.activeImageType = "avatar";
        }
      }

      // 🔥 Always activate the provider in this controller
      updateData.isActive = true;

      // Remove undefined/null/'null' fields to avoid unintentionally clearing existing values
      Object.keys(updateData).forEach((k) => {
        if (
          updateData[k] === undefined ||
          updateData[k] === null ||
          updateData[k] === "null"
        )
          delete updateData[k];
      });

      // ✅ Update provider
      await providerService.updateById(id, updateData);

      // ✅ Update linked bank account if provided
      const bankFields = {
        bankName: req.body.bankName,
        ifscCode: req.body.ifscCode,
        accountNumber: req.body.accountNumber,
        panNumber: req.body.panNumber,
        upiId: req.body.upiId,
      };

      const hasBankUpdate = Object.values(bankFields).some(
        (val) => val && val !== "No id Selected" && val !== ""
      );

      if (hasBankUpdate) {
        const bankUpdate: any = {};
        if (bankFields.bankName && bankFields.bankName !== "No id Selected")
          bankUpdate.bankName = mongoose.Types.ObjectId.isValid(bankFields.bankName)
            ? new mongoose.Types.ObjectId(bankFields.bankName)
            : bankFields.bankName;
        if (bankFields.ifscCode && bankFields.ifscCode !== "No id Selected")
          bankUpdate.ifscCode = bankFields.ifscCode;
        if (bankFields.accountNumber && bankFields.accountNumber !== "No id Selected")
          bankUpdate.accountNumber = bankFields.accountNumber;
        if (bankFields.panNumber && bankFields.panNumber !== "No id Selected")
          bankUpdate.panNumber = bankFields.panNumber;
        if (bankFields.upiId && bankFields.upiId !== "No id Selected")
          bankUpdate.upiId = bankFields.upiId;

        const bankAccountId = Array.isArray(existingProvider.bankAccount)
          ? existingProvider.bankAccount[0]
          : existingProvider.bankAccount;

        if (bankAccountId) {
          await bankAccountService.updateById(
            bankAccountId.toString(),
            bankUpdate
          );
        } else {
          const createdBankAccount = await bankAccountService.create({
            providerId: new mongoose.Types.ObjectId(id),
            ...bankUpdate,
            isKycVerified: false,
          } as any);

          await ServiceProvider.findByIdAndUpdate(id, {
            $push: { bankAccount: createdBankAccount._id },
          });
        }
      }

      // Re-fetch provider with populated bankAccount for accurate response
      const updatedProvider = await providerService.getById(id, true);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            ProviderController.sanitizeProvider(updatedProvider),
            "Inactive provider updated & activated successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get provider stats (calls, messages, earnings, withdrawal requests) with date range filtering
   */
  static async getProviderStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Valid provider ID is required");
      }

      const providerId = new mongoose.Types.ObjectId(id);

      // Fetch provider
      const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        throw new ApiError(404, "Provider not found");
      }

      // Calculate date range (default: last 7 days)
      let dateStart: Date;
      let dateEnd: Date;

      if (startDate && endDate) {
        // Use provided dates
        dateStart = new Date(startDate as string);
        dateEnd = new Date(endDate as string);

        // Validate dates
        if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
          throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
        }

        // Set times (start at beginning of day, end at end of day)
        dateStart.setHours(0, 0, 0, 0);
        dateEnd.setHours(23, 59, 59, 999);
      } else {
        // Default: last 7 days from today
        dateEnd = new Date();
        dateEnd.setHours(23, 59, 59, 999);

        dateStart = new Date();
        dateStart.setDate(dateStart.getDate() - 7);
        dateStart.setHours(0, 0, 0, 0);
      }

      // Count total calls where provider is caller or callee within date range
      const totalCalls = await CallSession.countDocuments({
        $and: [
          {
            $or: [
              { caller: providerId },
              { callee: providerId },
            ],
          },
          {
            createdAt: {
              $gte: dateStart,
              $lte: dateEnd,
            },
          },
        ],
      });

      // Count total messages sent or received by provider within date range
      const totalMessages = await Message.countDocuments({
        $and: [
          {
            $or: [
              { senderId: providerId },
              { receiverId: providerId },
            ],
          },
          {
            createdAt: {
              $gte: dateStart,
              $lte: dateEnd,
            },
          },
        ],
      });

      // Fetch chat request documents for this provider (all statuses), with user details
      const chatRequests = await ChatRequest.find({
        providerId,
      })
        .populate("userId", "name email phone age gender")
        .sort({ createdAt: -1 })
        .lean();

      // Count pending chat requests (for UI badges, etc.)
      const pendingChatRequests = await ChatRequest.countDocuments({
        providerId,
        status: "pending",
      });

      // Get total earnings from provider
      const totalEarnings = provider.totalEarnings || 0;

      // Get total withdrawal request amount (sum all withdrawals) within date range
      const withdrawalStats = await Withdrawal.aggregate([
        {
          $match: {
            providerId: providerId,
            createdAt: {
              $gte: dateStart,
              $lte: dateEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalWithdrawalRequested: { $sum: "$amount" },
            pendingWithdrawals: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
              },
            },
            approvedWithdrawals: {
              $sum: {
                $cond: [{ $eq: ["$status", "approved"] }, "$amount", 0],
              },
            },
            rejectedWithdrawals: {
              $sum: {
                $cond: [{ $eq: ["$status", "rejected"] }, "$amount", 0],
              },
            },
          },
        },
      ]);

      const withdrawalData = withdrawalStats[0] || {
        totalWithdrawalRequested: 0,
        pendingWithdrawals: 0,
        approvedWithdrawals: 0,
        rejectedWithdrawals: 0,
      };

      // ✅ Get average trust score for this provider
      const trustScoreAgg = await TrustScore.aggregate([
        {
          $match: {
            providerId: providerId,
          },
        },
        {
          $group: {
            _id: "$providerId",
            avgTrustScore: { $avg: "$trustScore" },
            totalUsers: { $sum: 1 },
          },
        },
      ]);

      const trustScoreStats = trustScoreAgg[0] || {
        avgTrustScore: 0,
        totalUsers: 0,
      };

      // Determine provider activity zone based on calls today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const callsToday = await CallSession.countDocuments({
        $and: [
          {
            $or: [
              { caller: providerId },
              { callee: providerId },
            ],
          },
          {
            createdAt: {
              $gte: todayStart,
            },
          },
        ],
      });

      const zone =
        callsToday === 0
          ? "Inactive Zone"
          : callsToday <= 5
            ? "Active Zone"
            : "Super Active Zone";

      const stats: any = {
        dateRange: {
          startDate: dateStart,
          endDate: dateEnd,
        },
        id: provider._id,
        providerId: provider.providerId,
        providerName: provider.name,
        providerAlias: provider.alias,
        email: provider.email,
        age: provider.age,
        bio: provider.bio,
        isOnline: provider.isOnline,
        joinDate: provider.createdAt,
        averageRating: provider.averageRating,
        totalRatings: provider.totalRatings,
        incentive: provider.incentive,
        todayEarnings: provider.todayEarnings,
        totalEarnings,
        faceVerificationPicture: provider.faceVerificationPicture || null,
        faceVerificationStatus: provider.faceVerificationStatus,
        audioSample: provider.audioSample || null,
        audioNote: provider.audioNote || null,
        // Realtime call fields
        isOnCall: provider.isOnCall || false,
        currentCallStartedAt: provider.currentCallStartedAt || null,
        currentCallDuration:
          provider.isOnCall && provider.currentCallStartedAt
            ? Date.now() - provider.currentCallStartedAt.getTime()
            : null,
        currentCallWith: null,
        // Include provider warning level and last login (lastActive) date
        warning: provider.warning || null,
        lastLoginDate: provider.lastActive || null,
        totalCalls,
        totalMessages,
        chatRequests,
        pendingChatRequests,
        totalWithdrawalRequested: withdrawalData.totalWithdrawalRequested,
        pendingWithdrawals: withdrawalData.pendingWithdrawals,
        approvedWithdrawals: withdrawalData.approvedWithdrawals,
        rejectedWithdrawals: withdrawalData.rejectedWithdrawals,
        avgTrustScore: Math.round(trustScoreStats.avgTrustScore), // ✅ Rounded percentage
        trustScoreUserCount: trustScoreStats.totalUsers,
        zone,
      };

      // If provider is on call, attempt to find the active CallSession to identify the other participant
      if (provider.isOnCall) {
        try {
          const activeSession = await CallSession.findOne({
            status: "connected",
            billingProcessed: { $ne: true },
            $or: [{ caller: providerId }, { callee: providerId }],
          }).exec();

          if (activeSession) {
            const amCaller = activeSession.caller && activeSession.caller.equals(providerId);
            const otherId = amCaller ? activeSession.callee : activeSession.caller;
            const otherRole = amCaller ? activeSession.calleeModel : activeSession.callerModel;
            stats.currentCallWith = {
              id: otherId ? otherId.toString() : null,
              role: otherRole || null,
              channel: activeSession.channel || null,
              sessionId: activeSession._id.toString(),
            };
          }
        } catch (err) {
          console.error("Failed to fetch active call for provider stats:", err);
        }
      }

      return res.status(200).json(
        new ApiResponse(200, stats, "Provider stats fetched successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get provider by ID (with bank account + withdrawals)
   */
  /**
   * Get current authenticated provider
   */
  static async getCurrentProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerId = (req as any).user?.id;
      if (!providerId) throw new ApiError(401, "Unauthorized");

      const provider = await ServiceProvider.findOne({
        _id: providerId,
        isDeleted: false,
      })
        .select("-password -__v")
        .populate({
          path: "bankAccount",
          populate: { path: "bankName", model: "Bank" },
        })
        .populate({
          path: "withdrawals",
          populate: { path: "walletTransaction" },
        });

      if (!provider) throw new ApiError(404, "Provider not found");

      const commission = await Commission.findOne().lean();
      const providerData = ProviderController.sanitizeProvider(provider);

      // Determine provider activity zone based on calls today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const callsToday = await CallSession.countDocuments({
        $and: [
          {
            $or: [
              { caller: providerId },
              { callee: providerId },
            ],
          },
          {
            createdAt: {
              $gte: todayStart,
            },
          },
        ],
      });

      const zone =
        callsToday === 0
          ? "Inactive Zone"
          : callsToday <= 5
            ? "Active Zone"
            : "Super Active Zone";

      // ✅ Get average trust score for this provider
      const trustScoreAgg = await TrustScore.aggregate([
        {
          $match: {
            providerId: new mongoose.Types.ObjectId(providerId),
          },
        },
        {
          $group: {
            _id: "$providerId",
            avgTrustScore: { $avg: "$trustScore" },
            totalUsers: { $sum: 1 },
          },
        },
      ]);

      const trustScoreStats = trustScoreAgg[0] || {
        avgTrustScore: 0,
        totalUsers: 0,
      };

      const payload = {
        ...providerData,
        perMinutePricePaise: commission?.perMinutePricePaise ?? 0,
        zone,
        avgTrustScore: Math.round(trustScoreStats.avgTrustScore), // ✅ Rounded percentage
        trustScoreUserCount: trustScoreStats.totalUsers,
      };

      return res
        .status(200)
        .json(new ApiResponse(200, payload));
    } catch (error) {
      next(error);
    }
  }

  static async getProviderById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerId = req.params.id;
      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        throw new ApiError(400, "Invalid provider ID");
      }

      const provider = await ServiceProvider.findOne({
        _id: providerId,
        isDeleted: false,
      })
        .select("-password -__v")
        .populate({
          path: "bankAccount",
          populate: { path: "bankName", model: "Bank" },
        })
        .populate({
          path: "withdrawals",
          populate: { path: "walletTransaction" },
        });

      if (!provider) throw new ApiError(404, "Provider not found");

      const commission = await Commission.findOne().lean();
      const providerData = ProviderController.sanitizeProvider(provider);

      // Populate languageObject array with language details
      let languageObject: string[] = [];
      if (Array.isArray(provider.languages) && provider.languages.length > 0) {
        const Language = mongoose.model("Language");
        // Fetch all languages by ID
        const langs = await Language.find({ _id: { $in: provider.languages } }).lean();
        languageObject = langs.map(l => l.label);
      }

      const payload = {
        ...providerData,
        perMinutePrice: (commission?.perMinutePricePaise ?? 0) / 100,
        languageObject,
      };

      return res
        .status(200)
        .json(new ApiResponse(200, payload));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get provider info (same as getProviderById) plus the requesting user's chat request status
   */
  static async getProviderByIdWithChatRequestStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      const providerId = req.params.id;
      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        throw new ApiError(400, "Invalid provider ID");
      }

      const provider = await ServiceProvider.findOne({
        _id: providerId,
        isDeleted: false,
      })
        .select("-password -__v")
        .populate({
          path: "bankAccount",
          populate: { path: "bankName", model: "Bank" },
        })
        .populate({
          path: "withdrawals",
          populate: { path: "walletTransaction" },
        });

      if (!provider) throw new ApiError(404, "Provider not found");

      const commission = await Commission.findOne().lean();
      const providerData = ProviderController.sanitizeProvider(provider);

      const chatRequest = await ChatRequest.findOne({
        userId,
        providerId,
      }).lean();

      const uniqueConversationCount = await ChatRequest.countDocuments({
        providerId,
        status: "accepted",
      });

      const trustScoreAgg = await TrustScore.aggregate([
        {
          $match: {
            providerId: new mongoose.Types.ObjectId(providerId),
          },
        },
        {
          $group: {
            _id: "$providerId",
            avgTrustScore: { $avg: "$trustScore" },
            totalUsers: { $sum: 1 },
          },
        },
      ]);
      // Populate languageObject array with language details
      let languageObject: string[] = [];
      if (Array.isArray(provider.languages) && provider.languages.length > 0) {
        const Language = mongoose.model("Language");
        // Fetch all languages by ID
        const langs = await Language.find({ _id: { $in: provider.languages } }).lean();
        languageObject = langs.map(l => l.label);
      }

      const trustScoreStats = trustScoreAgg[0] || {
        avgTrustScore: 0,
        totalUsers: 0,
      };

      const payload = {
        ...providerData,
        perMinutePrice: (commission?.perMinutePricePaise ?? 0) / 100,
        chatRequestStatus: chatRequest?.status ?? "pending",
        uniqueConversationCount,
        avgTrustScore: Math.round(trustScoreStats.avgTrustScore), // ✅ Round to nearest whole percentage
        trustScoreUserCount: trustScoreStats.totalUsers,
        languageObject,
      };

      return res
        .status(200)
        .json(new ApiResponse(200, payload));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update provider info and/or bank details
   */
  static async updateProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user;
      const userRole = user.role;
      const paramId = req.params.id;

      console.log("Update Provider called with user:", user, "params:", req.params, "body:", req.body);

      // Provider trying to update someone else
      if (userRole !== "admin" && paramId && paramId !== user.id) {
        throw new ApiError(403, "You are not allowed to update this provider");
      }

      // Admin must provide id
      if (userRole === "admin" && !paramId) {
        throw new ApiError(400, "Provider id is required for admin");
      }

      // Decide final provider id
      const providerId =
        userRole === "admin" ? paramId : user.id;

      const existingProvider = await ServiceProvider.findById(providerId);
      if (!existingProvider) {
        throw new ApiError(404, "Provider not found");
      }

      // Debug: snapshot of the current stored provider (non-sensitive fields)
      console.log("[DEBUG] Existing provider before update:", {
        id: existingProvider._id.toString(),
        isActive: existingProvider.isActive,
        isBlocked: existingProvider.isBlocked,
        blockedUsersCount: Array.isArray(existingProvider.blockedUsers)
          ? existingProvider.blockedUsers.length
          : 0,
        warning: existingProvider.warning,
      });

      const previousIsOnline = !!existingProvider.isOnline;
      let shouldNotifyProviderOnline = false;

      const { name, email, alias, age, languages, bio, phoneNumber } = req.body;

      const updateData: any = { name, email, alias, bio, phoneNumber };

      // ✅ ADD HERE
      if ("fcmToken" in req.body) {
        updateData.fcmToken = req.body.fcmToken;
      }

      // ✅ Track if warning level is being updated to a strike level (for notification)
      let warningLevelUpdated = false;
      let newWarningLevel: string | null = null;

      console.log("[DEBUG] updateProvider - age input:", age);
      if (typeof age === "number") {
        updateData.age = age;
        console.log("[DEBUG] updateProvider - age set:", updateData.age);
      }

      if (languages) {
        console.log("[DEBUG] updateProvider - languages input:", languages);
        const rawLanguages = Array.isArray(languages) ? languages : [languages];
        updateData.languages = rawLanguages.map((lang: string) => {
          if (!mongoose.Types.ObjectId.isValid(lang)) {
            console.error("[ERROR] Invalid language ID:", lang);
            throw new ApiError(400, `Invalid language ID: ${lang}`);
          }
          return new mongoose.Types.ObjectId(lang);
        });
        console.log("[DEBUG] updateProvider - languages set:", updateData.languages);
      }

      // Incentive (non-negative)
      if (req.body.incentive !== undefined) {
        console.log("[DEBUG] updateProvider - incentive input:", req.body.incentive);
        const incentive = Number(req.body.incentive);
        if (Number.isNaN(incentive) || incentive < 0) {
          console.error("[ERROR] Incentive invalid:", incentive);
          throw new ApiError(400, "Incentive must be a non-negative number");
        }
        updateData.incentive = incentive;
        console.log("[DEBUG] updateProvider - incentive set:", updateData.incentive);
      }

      // Password update
      const passwordInput =
        typeof req.body.password === "string" ? req.body.password.trim() : "";
      console.log("[DEBUG] updateProvider - password input:", passwordInput);
      if (passwordInput) {
        if (userRole !== "admin" && passwordInput.length < 8) {
          console.error("[ERROR] Password too short:", passwordInput);
          throw new ApiError(400, "Password must be at least 8 characters");
        }
        updateData.password = await bcrypt.hash(passwordInput, 10);
        console.log("[DEBUG] updateProvider - password hashed:", updateData.password);
      }

      // Media uploads
      const requestedImageSource = ProviderController.normalizeImageSource(
        req.body?.activeImageType ?? req.body?.type
      );
      console.log("[DEBUG] updateProvider - requestedImageSource:", requestedImageSource);
      if (
        (req.body?.activeImageType !== undefined || req.body?.type !== undefined) &&
        !requestedImageSource
      ) {
        console.error("[ERROR] Invalid activeImageType:", req.body?.activeImageType, req.body?.type);
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'"
        );
      }

      const { profilePicture: updatedProfilePicture, avatar: updatedAvatar } =
        ProviderController.resolveProviderImageInputs(req.body);
      console.log("[DEBUG] updateProvider - resolved images:", { updatedProfilePicture, updatedAvatar });
      if (updatedProfilePicture) {
        updateData.profilePicture = updatedProfilePicture;
        console.log("[DEBUG] updateProvider - profilePicture set:", updateData.profilePicture);
      }
      if (updatedAvatar) {
        updateData.avatar = updatedAvatar;
        console.log("[DEBUG] updateProvider - avatar set:", updateData.avatar);
      }

      if (req.body.aadharPhoto?.[0]?.url) {
        updateData.aadharPhoto = req.body.aadharPhoto[0].url;
        console.log("[DEBUG] updateProvider - aadharPhoto set:", updateData.aadharPhoto);
      }

      if (req.body.faceVerificationPicture?.[0]?.url) {
        updateData.faceVerificationPicture = req.body.faceVerificationPicture[0].url;
        console.log("[DEBUG] updateProvider - faceVerificationPicture set:", updateData.faceVerificationPicture);
      }

      // Update audio sample if provided
      if (req.body.audioSample?.[0]?.url) {
        updateData.audioSample = req.body.audioSample[0].url;
        console.log("[DEBUG] updateProvider - audioSample set:", updateData.audioSample);
      }

      // Update audio note if provided
      if (req.body.audioNote?.[0]?.url) {
        updateData.audioNote = req.body.audioNote[0].url;
        console.log("[DEBUG] updateProvider - audioNote set:", updateData.audioNote);
      }

      // Update face verification status if provided
      if (req.body.faceVerificationStatus) {
        console.log("[DEBUG] updateProvider - faceVerificationStatus input:", req.body.faceVerificationStatus);
        if (ALLOWED_FACE_VERIFICATION_STATUSES.includes(req.body.faceVerificationStatus)) {
          updateData.faceVerificationStatus = req.body.faceVerificationStatus;
          console.log("[DEBUG] updateProvider - faceVerificationStatus set:", updateData.faceVerificationStatus);
        }
      }

      // ✅ Update warning level if provided
      if (req.body.warning) {
        console.log("[DEBUG] updateProvider - warning input:", req.body.warning);
        if (ALLOWED_WARNING_LEVELS.includes(req.body.warning)) {
          updateData.warning = req.body.warning;
          console.log("[DEBUG] updateProvider - warning set:", updateData.warning);
          // Track if warning level is updated to a strike level (not "clear")
          if (req.body.warning !== "clear") {
            warningLevelUpdated = true;
            newWarningLevel = req.body.warning;
            console.log("[DEBUG] updateProvider - warningLevelUpdated:", warningLevelUpdated, "newWarningLevel:", newWarningLevel);
          }
        } else {
          console.error("[ERROR] Invalid warning level:", req.body.warning);
          throw new ApiError(400, "Invalid warning level");
        }
      }

      // ✅ Update KYC Status if provided (admin only)
      if (req.body.kycStatus) {
        console.log("[DEBUG] updateProvider - kycStatus input:", req.body.kycStatus);
        if (userRole !== "admin") {
          console.error("[ERROR] Non-admin tried to update KYC Status");
          throw new ApiError(403, "Only admins can update KYC Status");
        }
        if (!ALLOWED_KYC_STATUSES.includes(req.body.kycStatus)) {
          console.error("[ERROR] Invalid KYC Status:", req.body.kycStatus);
          throw new ApiError(400, `KYC Status must be one of: ${ALLOWED_KYC_STATUSES.join(", ")}`);
        }
        updateData.kycStatus = req.body.kycStatus as "approve" | "reject" | "request_reverify" | "pending";
        console.log("[DEBUG] updateProvider - kycStatus set:", updateData.kycStatus);
      }

      // ✅ Update flagSuspicious if provided (admin only)
      if (req.body.flagSuspicious !== undefined) {
        console.log("[DEBUG] updateProvider - flagSuspicious input:", req.body.flagSuspicious);
        if (userRole !== "admin") {
          console.error("[ERROR] Non-admin tried to flag suspicious");
          throw new ApiError(403, "Only admins can flag suspicious providers");
        }
        updateData.flagSuspicious = req.body.flagSuspicious === true || req.body.flagSuspicious === "true";
        console.log("[DEBUG] updateProvider - flagSuspicious set:", updateData.flagSuspicious);
      }

      // ✅ Update remark if provided (admin only)
      if (req.body.remark !== undefined) {
        console.log("[DEBUG] updateProvider - remark input:", req.body.remark);
        if (userRole !== "admin") {
          console.error("[ERROR] Non-admin tried to add remark");
          throw new ApiError(403, "Only admins can add remarks");
        }
        updateData.remark = req.body.remark ? req.body.remark.trim() : null;
        console.log("[DEBUG] updateProvider - remark set:", updateData.remark);
      }

      // ✅ Update blockRemark if provided (admin only)
      if (req.body.blockRemark !== undefined) {
        console.log("[DEBUG] updateProvider - blockRemark input:", req.body.blockRemark);
        if (userRole !== "admin") {
          console.error("[ERROR] Non-admin tried to add block remark");
          throw new ApiError(403, "Only admins can add block remarks");
        }
        updateData.blockRemark = req.body.blockRemark ? req.body.blockRemark.trim() : null;
        console.log("[DEBUG] updateProvider - blockRemark set:", updateData.blockRemark);
      }

      /**
       * ==========================
       * BOOLEAN NORMALIZATION
       * ==========================
       */

      const booleanFields =
        userRole === "admin"
          ? ["isActive", "isOnline", "isBlocked"]
          : ["isActive", "isOnline"];

      booleanFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          console.log(`[DEBUG] updateProvider - boolean field ${field} input:`, req.body[field]);
          updateData[field] =
            req.body[field] === true ||
            req.body[field] === "true" ||
            req.body[field] === 1 ||
            req.body[field] === "1";
          console.log(`[DEBUG] updateProvider - boolean field ${field} set:`, updateData[field]);
          if (field === "isOnline") {
            shouldNotifyProviderOnline = updateData[field] === true;
          }
        }
      });

      const nextProfilePicture =
        updatedProfilePicture !== undefined
          ? updatedProfilePicture
          : existingProvider.profilePicture || null;
      const nextAvatar =
        updatedAvatar !== undefined
          ? updatedAvatar
          : (existingProvider as any).avatar || null;
      console.log("[DEBUG] updateProvider - nextProfilePicture:", nextProfilePicture);
      console.log("[DEBUG] updateProvider - nextAvatar:", nextAvatar);
      if (requestedImageSource) {
        const requestedImageUrl =
          requestedImageSource === "avatar" ? nextAvatar : nextProfilePicture;
        console.log("[DEBUG] updateProvider - requestedImageUrl:", requestedImageUrl);
        if (!requestedImageUrl) {
          console.error("[ERROR] Cannot activate image type:", requestedImageSource);
          throw new ApiError(
            400,
            `Cannot activate ${requestedImageSource}. Please set its image URL first.`
          );
        }
        updateData.activeImageType = requestedImageSource;
        console.log("[DEBUG] updateProvider - activeImageType set:", updateData.activeImageType);
      } else {
        const currentSource =
          (existingProvider as any).activeImageType || "profilePicture";
        console.log("[DEBUG] updateProvider - currentSource:", currentSource);
        if (currentSource === "avatar" && !nextAvatar && nextProfilePicture) {
          updateData.activeImageType = "profilePicture";
          console.log("[DEBUG] updateProvider - fallback activeImageType set: profilePicture");
        } else if (
          currentSource === "profilePicture" &&
          !nextProfilePicture &&
          nextAvatar
        ) {
          updateData.activeImageType = "avatar";
          console.log("[DEBUG] updateProvider - fallback activeImageType set: avatar");
        }
      }

      /**
       * ==========================
       * UPDATE PROVIDER
       * ==========================
       */

      // Debug: show which fields will be updated (before cleaning)
      console.log("[DEBUG] updateProvider - payload before cleanup:", updateData);

      // Remove undefined/null/'null' fields to avoid unintentionally clearing existing values
      Object.keys(updateData).forEach((k) => {
        if (
          updateData[k] === undefined ||
          updateData[k] === null ||
          updateData[k] === "null"
        )
          delete updateData[k];
      });

      // Debug: confirm what is finally being saved
      console.log("[DEBUG] updateProvider - payload after cleanup:", updateData);

      await providerService.updateById(providerId, updateData);

      // Re-fetch provider with populated bankAccount for accurate response
      const populatedProvider = await providerService.getById(providerId, true);

      console.log("[DEBUG] updateProvider - database update result:", {
        providerId,
        updatedFields: Object.keys(updateData),
        updatedAt: populatedProvider?.updatedAt,
        bankAccount: populatedProvider?.bankAccount,
      });

      if (shouldNotifyProviderOnline && populatedProvider) {
        try {
          const io = req.app.get("socketio");
          const getSocketUser = req.app.get("getSocketUser");
          await ProviderController.notifyProviderOnline(
            populatedProvider,
            io,
            getSocketUser
          );
          console.log("[DEBUG] updateProvider - notified provider online");
        } catch (notifError) {
          console.error("Error creating provider online notification:", notifError);
          // Don't fail the request if notification fails
        }
      }

      /**
       * ==========================
       * BANK ACCOUNT UPDATE
       * ==========================
       */

      // Extract bank fields from request body (support both flat and nested formats)
      const bankAccountBody = req.body?.bankAccount || {};
      const bankFields = {
        bankName:
          bankAccountBody?.bankName ||
          req.body?.["bankAccount.bankName"] ||
          req.body?.bankName,
        ifscCode:
          bankAccountBody?.ifscCode ||
          req.body?.["bankAccount.ifscCode"] ||
          req.body?.ifscCode,
        accountNumber:
          bankAccountBody?.accountNumber ||
          req.body?.["bankAccount.accountNumber"] ||
          req.body?.accountNumber,
        panNumber:
          bankAccountBody?.panNumber ||
          req.body?.["bankAccount.panNumber"] ||
          req.body?.panNumber,
        upiId:
          bankAccountBody?.upiId ||
          req.body?.["bankAccount.upiId"] ||
          req.body?.upiId,
      };

      console.log("[DEBUG] updateProvider - bankFields extracted:", bankFields);

      // Check if any bank field has a value (and filter out empty strings)
      const hasBankUpdate = Object.values(bankFields).some(
        (val) => val && val !== "No id Selected" && val !== ""
      );

      const existingBankAccountId = Array.isArray(existingProvider.bankAccount)
        ? existingProvider.bankAccount[0]
        : existingProvider.bankAccount;

      if (hasBankUpdate && existingBankAccountId) {
        const bankUpdate: any = {};

        // Only add fields that have actual values
        if (bankFields.bankName && bankFields.bankName !== "No id Selected")
          bankUpdate.bankName = mongoose.Types.ObjectId.isValid(bankFields.bankName)
            ? new mongoose.Types.ObjectId(bankFields.bankName)
            : bankFields.bankName;

        if (bankFields.ifscCode && bankFields.ifscCode !== "No id Selected")
          bankUpdate.ifscCode = bankFields.ifscCode;

        if (bankFields.accountNumber && bankFields.accountNumber !== "No id Selected")
          bankUpdate.accountNumber = bankFields.accountNumber;

        if (bankFields.panNumber && bankFields.panNumber !== "No id Selected")
          bankUpdate.panNumber = bankFields.panNumber;

        if (bankFields.upiId && bankFields.upiId !== "No id Selected")
          bankUpdate.upiId = bankFields.upiId;

        await bankAccountService.updateById(
          existingBankAccountId.toString(),
          bankUpdate
        );
      } else if (hasBankUpdate) {
        // Create new bank account if it doesn't exist or is empty
        const newBankAccount: any = {};

        if (bankFields.bankName && bankFields.bankName !== "No id Selected")
          newBankAccount.bankName = mongoose.Types.ObjectId.isValid(bankFields.bankName)
            ? new mongoose.Types.ObjectId(bankFields.bankName)
            : bankFields.bankName;

        if (bankFields.ifscCode && bankFields.ifscCode !== "No id Selected")
          newBankAccount.ifscCode = bankFields.ifscCode;

        if (bankFields.accountNumber && bankFields.accountNumber !== "No id Selected")
          newBankAccount.accountNumber = bankFields.accountNumber;

        if (bankFields.panNumber && bankFields.panNumber !== "No id Selected")
          newBankAccount.panNumber = bankFields.panNumber;

        if (bankFields.upiId && bankFields.upiId !== "No id Selected")
          newBankAccount.upiId = bankFields.upiId;

        newBankAccount.providerId = providerId;

        const createdBankAccount = await bankAccountService.create(newBankAccount);
        if (createdBankAccount) {
          // Update provider with new bank account reference
          await ServiceProvider.findByIdAndUpdate(providerId, {
            bankAccount: createdBankAccount._id,
          });
        }
      }

      /**
       * ==========================
       * RESPONSE
       * ==========================
       */

      // 🔔 Create notification for warning/strike if warning level was updated to a strike level
      if (warningLevelUpdated && newWarningLevel) {
        try {
          const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
          const io = req.app.get("socketio");
          const getSocketUser = req.app.get("getSocketUser");

          const warningTitles: { [key: string]: string } = {
            "level1": "⚠️ Strike Level 1 - Warning",
            "level2": "⚠️ Strike Level 2 - Final Warning",
            "level3": "🚨 Strike Level 3 - Critical Warning",
            "ignored_calls": "⚠️ Ignored Calls Warning",
            "low_online_hours": "⚠️ Low Online Hours Warning",
          };

          // Build dynamic messages using values optionally supplied in req.body
          const formatMinutes = (mins: number) => {
            if (!Number.isFinite(mins) || mins <= 0) return null;
            const h = Math.floor(mins / 60);
            const m = Math.max(0, Math.round(mins % 60));
            if (h > 0 && m > 0) return `${h} hrs ${m} mins`;
            if (h > 0) return `${h} hrs`;
            return `${m} mins`;
          };

          const ignoredMax = Number(req.body.maxCallsAllowed ?? req.body.ignoredMaxCalls ?? 3);
          const ignoredCount = Number(req.body.ignoredCount ?? req.body.ignoredCalls ?? NaN);

          const requiredOnlineMinutes = Number(req.body.requiredOnlineMinutes ?? req.body.minOnlineMinutes ?? 180); // default 3 hrs
          const actualOnlineMinutes = Number(req.body.actualOnlineMinutes ?? req.body.actualMinutes ?? NaN);
          const actualOnlineReadable = Number.isFinite(actualOnlineMinutes) && actualOnlineMinutes > 0 ? formatMinutes(actualOnlineMinutes) : null;
          const requiredOnlineReadable = formatMinutes(requiredOnlineMinutes) || "3 hrs";

          const warningMessages: { [key: string]: string } = {
            "level1": "You have received a Strike Level 1. Please review your account behavior and policies.",
            "level2": "You have received a Strike Level 2. One more strike may result in account suspension.",
            "level3": "You have received a Strike Level 3. Your account is under critical review and may be suspended.",
            "ignored_calls": ignoredCount && !Number.isNaN(ignoredCount)
              ? `You have ignored more than ${ignoredMax} calls today (Required: Max ${ignoredMax}, Ignored: ${ignoredCount}). Please improve your availability to avoid penalties.`
              : `You have ignored more than ${ignoredMax} calls today (Required: Max ${ignoredMax}). Please improve your availability to avoid penalties.`,
            "low_online_hours": actualOnlineReadable
              ? `Your online time today is below the required ${requiredOnlineReadable} (Your time: ${actualOnlineReadable}). Continued low activity may result in penalties.`
              : `Your online time today is below the required ${requiredOnlineReadable}. Continued low activity may result in penalties.`,
          };

          const strikeNumberMap: { [key: string]: number } = {
            "level1": 1,
            "level2": 2,
            "level3": 3,
            "ignored_calls": 0,
            "low_online_hours": 0,
          };

          await createAndEmitNotification({
            type: "warning_strike",
            title: warningTitles[newWarningLevel] || "Warning Updated",
            message: warningMessages[newWarningLevel] || `Your warning level has been updated to ${newWarningLevel}.`,
            recipientId: providerId,
            recipientType: "provider",
            metadata: {
              warningLevel: newWarningLevel,
              strikeNumber: strikeNumberMap[newWarningLevel] ?? 0,
            },
            io,
            getSocketUser,
          });
        } catch (notifError) {
          console.error("Error creating warning notification:", notifError);
          // Don't fail the request if notification fails
        }
      }

      // 🔔 Profile update notification disabled for listener

      return res.status(200).json(
        new ApiResponse(
          200,
          ProviderController.sanitizeProvider(populatedProvider),
          "Provider updated successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async toggleActiveImageSource(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authUser = (req as any).user;
      const userRole = authUser?.role;
      const authUserId = authUser?.id;
      if (!authUserId) throw new ApiError(401, "Unauthorized");
      if (!["ServiceProvider", "admin"].includes(userRole)) {
        throw new ApiError(403, "Unauthorized access");
      }

      const requestedSource = ProviderController.normalizeImageSource(
        req.body?.activeImageType ?? req.body?.type
      );
      if (!requestedSource) {
        throw new ApiError(
          400,
          "activeImageType must be either 'profilePicture' or 'avatar'"
        );
      }

      const providerId =
        userRole === "admin"
          ? req.body?.providerId || req.params?.id
          : authUserId;
      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        throw new ApiError(400, "Valid provider ID is required");
      }

      const provider = await ServiceProvider.findOne({
        _id: providerId,
        isDeleted: false,
      });
      if (!provider) throw new ApiError(404, "Provider not found");

      const requestedImageUrl =
        requestedSource === "avatar"
          ? (provider as any).avatar
          : provider.profilePicture;
      if (!requestedImageUrl) {
        throw new ApiError(
          400,
          `Cannot activate ${requestedSource}. Please set its image URL first.`
        );
      }

      (provider as any).activeImageType = requestedSource;
      await provider.save();

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            activeImageType: (provider as any).activeImageType,
            imageUrl: ProviderController.resolveActiveImageUrl(provider as any),
          },
          "Active profile image updated successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete provider
   */
  static async deleteProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = req.params.id;
      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        throw new ApiError(400, "Invalid provider ID");
      }

      await providerService.deleteById(providerId);
      res
        .status(200)
        .json(new ApiResponse(200, {}, "Provider deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Provider requests withdrawal
   */
  static async requestWithdrawal(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authUser = (req as any).user;
      const role = authUser?.role;
      const requestedProviderId = req.body.providerId;
      const providerId =
        role === "ServiceProvider" ? authUser.id : requestedProviderId;

      if (!["ServiceProvider", "admin"].includes(role)) {
        throw new ApiError(403, "Unauthorized access");
      }

      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        throw new ApiError(400, "Valid provider ID is required");
      }

      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, "Invalid withdrawal amount");
      }

      // const provider = await ServiceProvider.findById(providerId);
      const provider = await ServiceProvider.findOne({
        _id: providerId,
        isDeleted: false,
        isActive: true,
      });
      if (!provider) throw new ApiError(404, "Provider not found");

      // ✅ Create withdrawal record
      const providerBankAccountId = Array.isArray((provider as any).bankAccount)
        ? ((provider as any).bankAccount[0] as mongoose.Types.ObjectId)
        : ((provider as any).bankAccount as
          | mongoose.Types.ObjectId
          | undefined);
      const withdrawal = await withdrawalService.create({
        providerId: provider._id as mongoose.Types.ObjectId,
        amount,
        status: "pending",
        bankAccount: providerBankAccountId,
      });

      // ✅ Log wallet transaction
      await walletTxnService.create({
        entityId: provider._id as mongoose.Types.ObjectId,
        entityType: "ServiceProvider" as any,
        amount: -Math.abs(amount),
        type: "withdrawal_request",
        status: "pending",
        meta: { withdrawalId: withdrawal._id },
      });

      res
        .status(201)
        .json(
          new ApiResponse(201, withdrawal, "Withdrawal requested successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get provider wallet transactions (with pagination, sorting, and filters)
   */
  static async getWalletTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerId = req.params.id;
      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        throw new ApiError(400, "Invalid provider ID");
      }

      // Build filter
      const filter = {
        entityId: new mongoose.Types.ObjectId(providerId),
        entityType: "ServiceProvider",
      };

      // Use CommonService.getAll (it supports pagination, filters, and additionalStages)
      const { result, pagination } = await walletTxnService.getAll(
        { ...req.query, filter }, // pass query params for pagination
        [] // no extra aggregation stages needed here
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { result, pagination },
            "Wallet transactions fetched successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
 * Get logged-in provider wallet transactions
 */
  // static async getMyWalletTransactions(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const user = (req as any).user;

  //     // ✅ Ensure provider is logged in
  //     if (!user || user.role !== "ServiceProvider") {
  //       throw new ApiError(403, "Unauthorized access");
  //     }

  //     const providerId = user.id;
  //     const query: any = { ...req.query };
  //     query.entityId = providerId;

  //     // Calculate total earnings (sum of positive amounts) for the provider
  //     const earningsAgg = await WalletTransaction.aggregate([
  //       {
  //         $match: {
  //           entityId: new mongoose.Types.ObjectId(providerId),
  //           entityType: "ServiceProvider",
  //           status: "success",
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           total: {
  //             $sum: {
  //               $cond: [{ $gt: ["$amount", 0] }, "$amount", 0],
  //             },
  //           },
  //         },
  //       },
  //     ]);
  //     const totalEarnings = earningsAgg?.[0]?.total || 0;

  //     const result = await walletTxnService.getAll(query);
  //     return res.status(200).json(
  //       new ApiResponse(
  //         200,
  //         { totalEarnings, ...result },
  //         "Wallet transactions fetched successfully"
  //       )
  //     );
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async getMyWalletTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user;

      // ✅ Ensure provider is logged in
      if (!user || user.role !== "ServiceProvider") {
        throw new ApiError(403, "Unauthorized access");
      }

      const providerId = user.id;
      const query: any = { ...req.query };
      query.entityId = providerId;

      // ✅ Get provider earnings directly
      const provider = await ServiceProvider.findById(providerId).select("totalEarnings");

      // ✅ Total earnings (only positive amounts → in ₹)
      const earningsAgg = await WalletTransaction.aggregate([
        {
          $match: {
            entityId: new mongoose.Types.ObjectId(providerId),
            entityType: "ServiceProvider",
            status: "success",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [{ $gt: ["$amount", 0] }, "$amount", 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: { $divide: ["$total", 100] }, // ✅ paise → ₹
          },
        },
      ]);

      const totalEarnings = provider?.totalEarnings || 0;
      // const totalEarnings = earningsAgg?.[0]?.total || 0;

      // ✅ Fetch transactions
      const result = await walletTxnService.getAll(query);

      // ✅ Convert ALL transaction amounts → ₹
      if (result?.result?.length) {
        result.result = result.result.map((txn: any) => ({
          ...txn,
          amount: txn.amount / 100, // 🔥 FIX
        }));
      }

      // ✅ Fetch minimum withdrawal amount
      const commissionDoc = await Commission.findOne();
      const minimumWithdrawalAmount = commissionDoc?.minimumWithdrawalAmount || 100;

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            totalEarnings,
            minimumWithdrawalAmount,
            ...result,
          },
          "Wallet transactions fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete (soft delete) service provider account
   */
  static async deleteMyAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user;

      if (!user || user.role !== "ServiceProvider") {
        throw new ApiError(403, "Unauthorized access");
      }

      const providerId = user.id;

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        throw new ApiError(404, "Provider not found");
      }

      if (provider.isDeleted) {
        return res.status(200).json(
          new ApiResponse(200, {}, "Provider already deleted")
        );
      }

      // 🔒 Soft delete
      provider.isDeleted = true;
      provider.isActive = false;
      provider.isBlocked = true;
      provider.deletedAt = new Date();

      await provider.save();

      return res.status(200).json(
        new ApiResponse(
          200,
          {},
          "Your account has been deleted successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const phoneNumber = ProviderController.normalizePhoneNumber(
        req.body?.phoneNumber
      );
      const password = String(req.body?.password ?? "").trim();
      const otp = String(req.body?.otp ?? "").trim();

      if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
      }

      // ✅ Find provider first
      const provider = await ServiceProvider.findOne({ phoneNumber }).select(
        "+password"
      );
      if (!provider) {
        throw new ApiError(404, "Provider not found");
      }

      if (provider.isDeleted) {
        throw new ApiError(403, "Your account has been deleted");
      }

      if (!provider.isActive) {
        throw new ApiError(403, "Your account is not active");
      }

      // ❌ Blocked check
      if (provider.isBlocked) {
        throw new ApiError(
          403,
          "You can't login because your account is blocked."
        );
      }

      const hasPasswordInput = Boolean(password);
      const hasOtpInput = Boolean(otp);

      // Password is optional, but at least one auth factor is required.
      if (!hasPasswordInput && !hasOtpInput) {
        if (!provider.password) {
          throw new ApiError(
            400,
            "OTP is required for this account. Request OTP and try again."
          );
        }
        throw new ApiError(400, "Password or OTP is required");
      }

      let isAuthenticated = false;
      const authErrors: string[] = [];

      // Try password first (if provided)
      if (hasPasswordInput) {
        if (!provider.password) {
          authErrors.push(
            "Password login is not enabled for this account. Use OTP login."
          );
        } else {
          const isMatch = await bcrypt.compare(password, provider.password);
          if (isMatch) {
            isAuthenticated = true;
          } else {
            authErrors.push("Invalid password");
          }
        }
      }

      // If password auth did not pass, try OTP (if provided)
      if (!isAuthenticated && hasOtpInput) {
        const isFallbackOtp =
          OTP_FALLBACK_PHONE_NUMBERS.has(phoneNumber) && otp === OTP_FALLBACK_CODE;

        if (isFallbackOtp) {
          isAuthenticated = true;
        } else {
          const otpDoc = await Otp.findOne({ phoneNumber, otp, verified: false });
          if (!otpDoc || otpDoc.expiresAt < new Date()) {
            authErrors.push("Invalid or expired OTP");
          } else {
            await Otp.deleteOne({ _id: otpDoc._id });
            isAuthenticated = true;
          }
        }
      }

      if (!isAuthenticated) {
        if (hasPasswordInput && !hasOtpInput) {
          throw new ApiError(400, authErrors[0] || "Invalid password");
        }
        if (!hasPasswordInput && hasOtpInput) {
          throw new ApiError(400, authErrors[0] || "Invalid or expired OTP");
        }
        throw new ApiError(400, "Invalid password or OTP");
      }

      // ✅ Generate token
      const token = jwt.sign(
        {
          id: provider._id,
          phoneNumber: provider.phoneNumber,
          role: "ServiceProvider",
        },
        config.jwt.secret,
        { expiresIn: "7d" }
      );

      // Update lastActive timestamp
      try {
        provider.lastActive = new Date();
        await provider.save();
      } catch (e) {
        // non-fatal
        console.error("Failed to update lastActive:", e);
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            provider: ProviderController.sanitizeProvider(provider),
            token,
          },
          "Login successful"
        )
      );
    } catch (error) {
      next(error);
    }
  }


  /**
   * Request OTP for login
   */
  static async requestOtpForLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const phoneNumber = ProviderController.normalizePhoneNumber(
        req.body?.phoneNumber
      );
      if (!phoneNumber) throw new ApiError(400, "Phone number is required");

      const provider = await ServiceProvider.findOne({ phoneNumber });
      if (!provider) throw new ApiError(404, "Provider not found");
      if (provider.isDeleted) {
        throw new ApiError(403, "Your account has been deleted");
      }
      if (!provider.isActive || provider.isBlocked) {
        throw new ApiError(403, "Your account is not allowed to request OTP");
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await Otp.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber, otp: otpCode, expiresAt, verified: false },
        { upsert: true, new: true }
      );

      await sendLoginOtpSms(phoneNumber, otpCode); // send sms
      console.log(`OTP for ${phoneNumber}: ${otpCode}`);

      const responseData: Record<string, string> = { phoneNumber };
      if (config.env === "development") {
        responseData.otpCode = otpCode;
      }

      return res
        .status(200)
        .json(new ApiResponse(200, responseData, "OTP sent successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async blockUser(req: Request | any, res: Response, next: NextFunction) {
    try {
      const providerId = req.user.id;
      const { userId } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });

      // if (!provider.blockedUsers.includes(userId)) {
      //   provider.blockedUsers.push(userId);
      //   await provider.save();
      // }

      if (!provider.blockedUsers.some(id => id.toString() === userId)) {
        provider.blockedUsers.push(new mongoose.Types.ObjectId(userId));
        await provider.save();
      }

      return res.status(200).json({
        success: true,
        message: "User blocked successfully",
        blockedUsers: provider.blockedUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  // Unblock a user
  static async unblockUser(req: Request | any, res: Response, next: NextFunction) {
    try {
      const providerId = req.user.id;
      const { userId } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });

      provider.blockedUsers = provider.blockedUsers.filter((id) => id.toString() !== userId);
      await provider.save();

      return res.status(200).json({
        success: true,
        message: "User unblocked successfully",
        blockedUsers: provider.blockedUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addConnection(req: Request | any, res: Response, next: NextFunction) {
    try {
      const providerId = req.user?.id;
      const { userId } = req.body;

      if (!providerId) {
        return res.status(400).json({ success: false, message: "Provider must be logged in" });
      }
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid userId" });
      }

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

      if (!provider.connectedUsers.includes(userId)) {
        provider.connectedUsers.push(new mongoose.Types.ObjectId(userId));
        await provider.save();
      }

      return res.status(200).json({
        success: true,
        message: "User added to connections",
        connectedUsers: provider.connectedUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove a user from provider's connections
  static async removeConnection(req: Request | any, res: Response, next: NextFunction) {
    try {
      const providerId = req.user?.id;
      const { userId } = req.body;

      if (!providerId) {
        return res.status(400).json({ success: false, message: "Provider must be logged in" });
      }
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid userId" });
      }

      const provider = await ServiceProvider.findById(providerId);
      if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

      provider.connectedUsers = provider.connectedUsers.filter(
        (id: any) => id.toString() !== userId
      );
      await provider.save();

      return res.status(200).json({
        success: true,
        message: "User removed from connections",
        connectedUsers: provider.connectedUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBlockedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user || user.role !== "ServiceProvider") {
        throw new ApiError(403, "Unauthorized access");
      }

      const provider = await ServiceProvider.findById(user.id)
        .populate({
          path: "blockedUsers",
          select: "name phoneNumber email profilePicture",
        });

      if (!provider) {
        throw new ApiError(404, "Provider not found");
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          { blockedUsers: provider.blockedUsers },
          "Blocked users fetched successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all connected users (populated)
  static async getMyConnections(req: Request | any, res: Response, next: NextFunction) {
    try {
      const providerId = req.user?.id;
      if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ success: false, message: "Invalid provider ID" });
      }
      const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        return res.status(404).json({ success: false, message: "Provider not found" });
      }
      const userService = new CommonService(User);
      // Fetch all users whose _id is in provider.connectedUsers
      const users = await userService.getAll(
        { ...req.query, _id: { $in: provider.connectedUsers } },
        [
          { $project: { _id: 1, name: 1, email: 1, profilePicture: 1, avatar: 1 } }
        ]
      );
      return res.status(200).json({
        success: true,
        ...users
      });
    } catch (error) {
      next(error);
    }
  }
}
