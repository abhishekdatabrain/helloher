import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import Otp from "../../modals/otp.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";
import { User } from "../../modals/user.model";
import jwt from "jsonwebtoken";
import { config } from "../../config/config";
import { sendLoginOtpSms } from "../../services/msg91.service";

const otpService = new CommonService(Otp);
const OTP_FALLBACK_PHONE_NUMBERS = new Set([
  "9638527410", // Rashmi - service provider
  "9648756737", // Ronit Test - user
]);
const OTP_FALLBACK_CODE = "123456";

export class OtpController {
  private static normalizePhoneNumber(phoneNumber: unknown): string {
    return typeof phoneNumber === "string" ? phoneNumber.trim() : "";
  }

  static generateOtp = asyncHandler(async (req: Request, res: Response) => {
    const phoneNumber = OtpController.normalizePhoneNumber(req.body?.phoneNumber);
    if (!phoneNumber) throw new ApiError(400, "Phone number required");

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phoneNumber },
      { phoneNumber, otp: otpCode, expiresAt, verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendLoginOtpSms(phoneNumber, otpCode); // send sms
    console.log(`OTP for ${phoneNumber}: ${otpCode}`);

    const responseData: Record<string, string> = { phoneNumber };
    if (config.env === "development") {
      responseData.otpCode = otpCode;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, responseData, "OTP sent"));
  });

  // static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  //   const { phoneNumber, otp } = req.body;
  //   if (!phoneNumber || !otp) throw new ApiError(400, "Phone number & OTP required");

  //   const otpDoc = await Otp.findOne({ phoneNumber, otp });
  //   if (!otpDoc || otpDoc.expiresAt < new Date()) throw new ApiError(400, "Invalid or expired OTP");

  //   otpDoc.verified = true;
  //   await otpDoc.save();

  //   return res.status(200).json(new ApiResponse(200, { phoneNumber }, "OTP verified"));
  // });

  static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const phoneNumber = OtpController.normalizePhoneNumber(req.body?.phoneNumber);
    const otp = String(req.body?.otp ?? "").trim();

    if (!phoneNumber || !otp)
      throw new ApiError(400, "Phone number & OTP required");

    const isFallbackOtp =
      OTP_FALLBACK_PHONE_NUMBERS.has(phoneNumber) && otp === OTP_FALLBACK_CODE;

    if (!isFallbackOtp) {
      const otpDoc = await Otp.findOne({ phoneNumber, otp, verified: false });
      if (!otpDoc || otpDoc.expiresAt < new Date())
        throw new ApiError(400, "Invalid or expired OTP");

      otpDoc.verified = true;
      await otpDoc.save();
    }
    const user = await User.findOne({ phoneNumber, isDeleted: false }).select("-password -__v");

    // if (!user) {
    //   return res
    //     .status(200) 
    //     .json(new ApiResponse(200, { exist: false }, "OTP verified"));
    // }

    if (!user) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { exist: false, phoneNumber },
          "OTP verified, proceed to register"
        )
      );
    }

    if (user.isDeleted)
      throw new ApiError(403, "Your account has been deleted");

    if (user.isBlocked)
      throw new ApiError(
        403,
        "You can't login because your account is blocked.",
      );

    // ✅ CASE 2: EXISTING USER → LOGIN HERE
    const token = jwt.sign(
      { id: user._id, phoneNumber: user.phoneNumber, role: user.role },
      config.jwt.secret,
      { expiresIn: "7d" }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { user, token, exist: true },
        "OTP verified & login successful",
      ),
    );
  });

  // static getAllOtp = asyncHandler(async (req: Request, res: Response) => {
  //   // const otpList = await otpService.getAll({}, { sort: { createdAt: -1 } });
  //   const otpList = await otpService.getAll([
  //     { $sort: { createdAt: -1 } }
  //   ]);
  //   return res.status(200).json(new ApiResponse(200, { otpList }, "All OTPs fetched successfully"));
  // });

  // static async getAllOtp (req:Request, res:Response, next:NextFunction)
  static getAllOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "All OTPs fetched successfully"));
  });


  //  static async loginWithOtp(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       const { phoneNumber, otp } = req.body;
  //       if (!phoneNumber || !otp)
  //         throw new ApiError(400, "Phone number and OTP are required");

  //       const otpDoc = await Otp.findOne({ phoneNumber, otp, verified: false });
  //       if (!otpDoc || otpDoc.expiresAt < new Date())
  //         throw new ApiError(400, "Invalid or expired OTP");

  //       otpDoc.verified = true;
  //       // await otpDoc.save();
  //       await Otp.deleteOne({ _id: otpDoc._id });

  //       let exist = false;
  //       let user = await User.findOne({ phoneNumber });

  //       if (user?.isDeleted) {
  //         throw new ApiError(403, "Your account has been deleted");
  //       }
  //       if (!user) {
  //         user = new User({
  //           phoneNumber,
  //           isVerified: true,
  //         });

  //         await user.save({ validateBeforeSave: false });
  //       } else {
  //         exist = true;
  //       }

  //       if (user.isDeleted) {
  //         throw new ApiError(403, "Your account has been deleted");
  //       }

  //       if (user.isBlocked) {
  //         throw new ApiError(
  //           403,
  //           "You can't login because your account is blocked."
  //         );
  //       }

  //       // Generate JWT
  //       const token = jwt.sign(
  //         { id: user._id, phoneNumber: user.phoneNumber, role: user.role },
  //         config.jwt.secret,
  //         { expiresIn: "7d" }
  //       );

  //       return res
  //         .status(200)
  //         .json(new ApiResponse(200, { user, token, exist }, "Login successful"));
  //     } catch (err) {
  //       next(err);
  //     }
  //   }
}
