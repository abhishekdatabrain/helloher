import { Router } from "express";
import { OtpController } from "./otp.controller";

const otpRouter = Router();

otpRouter.post("/send", OtpController.generateOtp);
otpRouter.post("/verify", OtpController.verifyOtp);
otpRouter.get("/", OtpController.getAllOtp);
export default otpRouter;
