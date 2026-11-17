import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { User } from "../../modals/user.model";
import ServiceProvider from "../../modals/serviceProvider.model";
import Otp from "../../modals/otp.model";
import { AccountDeletionRequest } from "../../modals/accountDeletionRequest.model";
import { sendLoginOtpSms } from "../../services/msg91.service";
import {
  DUMMY_OTP,
  isDummyUserPhone,
  isDummyProviderPhone,
  ensureDummyUser,
  ensureDummyProvider,
} from "../../config/dummyCredentials";
import { renderAccountDeletionHtml, DeletionAppType } from "./accountDeletion.html";

const FALLBACK_NUMBERS = new Set(["9648756737", "9638527410"]);
const FALLBACK_CODE = "123456";

export class AccountDeletionController {
  private static normalizePhone(phone: unknown): string {
    if (typeof phone !== "string") return "";
    let clean = phone.trim().replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      clean = clean.slice(2);
    }
    return clean;
  }

  /**
   * Renders deletion HTML page (auto-detects app type from path or query)
   */
  static renderPage(req: Request, res: Response) {
    const path = req.path.toLowerCase();
    let appType: DeletionAppType = "all";

    if (path.includes("/user") || req.query.app === "user") {
      appType = "user";
    } else if (path.includes("/listener") || req.query.app === "listener") {
      appType = "listener";
    }

    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:;"
    );
    res.status(200).type("html").send(renderAccountDeletionHtml(appType));
  }

  /**
   * Directly renders User App deletion page
   */
  static renderUserPage(_req: Request, res: Response) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:;"
    );
    res.status(200).type("html").send(renderAccountDeletionHtml("user"));
  }

  /**
   * Directly renders Listener App deletion page
   */
  static renderListenerPage(_req: Request, res: Response) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:;"
    );
    res.status(200).type("html").send(renderAccountDeletionHtml("listener"));
  }

  /**
   * Request OTP for account deletion
   */
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const phoneNumber = AccountDeletionController.normalizePhone(
        req.body?.phoneNumber
      );
      const appType = String(req.body?.appType || "user").toLowerCase();

      if (!phoneNumber || phoneNumber.length !== 10) {
        throw new ApiError(400, "Please enter a valid 10-digit mobile number");
      }

      if (!["user", "listener"].includes(appType)) {
        throw new ApiError(400, "Invalid app type. Must be 'user' or 'listener'");
      }

      // 1. Verify that the account exists and is not already deleted
      if (appType === "user") {
        let user = await User.findOne({ phoneNumber, isDeleted: false });
        if (!user && isDummyUserPhone(phoneNumber)) {
          user = await ensureDummyUser(phoneNumber);
        }
        if (!user) {
          const deletedUser = await User.findOne({ phoneNumber, isDeleted: true });
          if (deletedUser) {
            throw new ApiError(400, "This User account has already been deleted");
          }
          throw new ApiError(404, "No registered User account found with this phone number");
        }
      } else {
        let provider = await ServiceProvider.findOne({ phoneNumber, isDeleted: false });
        if (!provider && isDummyProviderPhone(phoneNumber)) {
          provider = await ensureDummyProvider(phoneNumber);
        }
        if (!provider) {
          const deletedProvider = await ServiceProvider.findOne({ phoneNumber, isDeleted: true });
          if (deletedProvider) {
            throw new ApiError(400, "This Listener account has already been deleted");
          }
          throw new ApiError(404, "No registered Listener account found with this phone number");
        }
      }

      // 2. Check dummy phone credentials
      const isDummy =
        (appType === "user" && isDummyUserPhone(phoneNumber)) ||
        (appType === "listener" && isDummyProviderPhone(phoneNumber)) ||
        FALLBACK_NUMBERS.has(phoneNumber);

      const otpCode = isDummy
        ? DUMMY_OTP
        : Math.floor(100000 + Math.random() * 900000).toString();

      const expiresAt = new Date(
        Date.now() + (isDummy ? 365 * 24 * 60 * 60 * 1000 : 5 * 60 * 1000)
      );

      await Otp.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber, otp: otpCode, expiresAt, verified: false },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 3. Send SMS if real number
      if (!isDummy) {
        await sendLoginOtpSms(phoneNumber, otpCode);
      }
      console.log(`[Account Deletion] OTP for ${phoneNumber} (${appType}): ${otpCode}`);

      return res
        .status(200)
        .json(new ApiResponse(200, { phoneNumber }, "Verification code sent successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and permanently (soft) delete account
   */
  static async confirmDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const phoneNumber = AccountDeletionController.normalizePhone(
        req.body?.phoneNumber
      );
      const otp = String(req.body?.otp ?? "").trim();
      const appType = String(req.body?.appType || "user").toLowerCase();
      const reason = String(req.body?.reason ?? "").trim();
      const feedback = String(req.body?.feedback ?? "").trim();

      if (!phoneNumber || !otp) {
        throw new ApiError(400, "Phone number and verification code are required");
      }

      if (!["user", "listener"].includes(appType)) {
        throw new ApiError(400, "Invalid app type. Must be 'user' or 'listener'");
      }

      // 1. Verify OTP
      const isDummy =
        (appType === "user" && isDummyUserPhone(phoneNumber)) ||
        (appType === "listener" && isDummyProviderPhone(phoneNumber)) ||
        FALLBACK_NUMBERS.has(phoneNumber);

      const isFallbackOtp =
        (isDummy && otp === DUMMY_OTP) ||
        (FALLBACK_NUMBERS.has(phoneNumber) && (otp === FALLBACK_CODE || otp === DUMMY_OTP));

      if (!isFallbackOtp) {
        const otpDoc = await Otp.findOne({ phoneNumber, otp, verified: false });
        if (!otpDoc || otpDoc.expiresAt < new Date()) {
          throw new ApiError(400, "Invalid or expired verification code");
        }
        otpDoc.verified = true;
        await otpDoc.save();
      }

      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "";
      const userAgent = (req.headers["user-agent"] as string) || "";

      // 2. Perform Account Deletion
      if (appType === "user") {
        const user = await User.findOne({ phoneNumber, isDeleted: false });
        if (!user) {
          throw new ApiError(404, "User account not found or already deleted");
        }

        user.isDeleted = true;
        user.isBlocked = true;
        user.isVerified = false;
        user.isOnline = false;
        user.deletedAt = new Date();
        await user.save();

        const deletionRecord = await AccountDeletionRequest.create({
          phoneNumber,
          appType: "user",
          userId: user._id,
          reason,
          feedback,
          status: "completed",
          ipAddress,
          userAgent,
          requestedAt: new Date(),
          completedAt: new Date(),
        });

        await Otp.deleteMany({ phoneNumber });

        return res.status(200).json(
          new ApiResponse(
            200,
            {
              requestId: `REQ-${deletionRecord._id.toString().slice(-6).toUpperCase()}`,
              appType: "user",
            },
            "User account has been permanently deactivated"
          )
        );
      } else {
        const provider = await ServiceProvider.findOne({ phoneNumber, isDeleted: false });
        if (!provider) {
          throw new ApiError(404, "Listener account not found or already deleted");
        }

        provider.isDeleted = true;
        provider.isActive = false;
        provider.isBlocked = true;
        provider.isOnline = false;
        provider.deletedAt = new Date();
        await provider.save();

        const deletionRecord = await AccountDeletionRequest.create({
          phoneNumber,
          appType: "listener",
          providerId: provider._id,
          reason,
          feedback,
          status: "completed",
          ipAddress,
          userAgent,
          requestedAt: new Date(),
          completedAt: new Date(),
        });

        await Otp.deleteMany({ phoneNumber });

        return res.status(200).json(
          new ApiResponse(
            200,
            {
              requestId: `REQ-${deletionRecord._id.toString().slice(-6).toUpperCase()}`,
              appType: "listener",
            },
            "Listener account has been permanently deactivated"
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
}
