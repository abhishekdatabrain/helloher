import { Request, Response, NextFunction } from "express";
import { PaidProfile, PaidProfileSetting } from "../../modals/paidProfile.model";
import { PaidProfilePlan } from "../../modals/paidProfilePlan.model";
import razorpay from "../../config/razorpay.config";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { WalletTransaction } from "../../modals/walletTransaction.model";
import crypto from "crypto";
import { IUser, User } from "../../modals/user.model";

// Helper function to check if paid profile feature is enabled
const isFeatureEnabled = async (): Promise<boolean> => {
    try {
        const setting = await PaidProfileSetting.findOne({ key: "paid_profile_enabled" });
        return setting?.enabled ?? true; // Default enabled if not set
    } catch (error) {
        console.error("Error checking feature status:", error);
        return true; // Default to enabled if error occurs
    }
};

interface AuthRequest extends Request {
    user?: IUser;
}

export const createPaidProfileOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { planId } = req.body;

        if (!userId) throw new ApiError(401, "Unauthorized");

        // Check if feature is enabled
        const featureEnabled = await isFeatureEnabled();
        if (!featureEnabled) {
            throw new ApiError(403, "Paid profile feature is currently disabled");
        }

        if (!planId) throw new ApiError(400, "planId is required");

        // Prevent multiple active subscriptions
        const existingActive = await PaidProfile.findOne({
            userId,
            status: "approved",
            endDate: { $gt: new Date() },
        });

        if (existingActive) {
            throw new ApiError(
                400,
                "You already have an active paid profile"
            );
        }

        const plan = await PaidProfilePlan.findById(planId);
        if (!plan) throw new ApiError(404, "Paid profile plan not found");

        const paidProfile = await PaidProfile.create({
            userId,
            planId: plan._id,
            status: "pending_payment",
        });


        const receiptId = `paid_profile_${userId
            .toString()
            .slice(-8)}_${Date.now().toString().slice(-5)}`;

        const order = await razorpay.orders.create({
            amount: Math.round(plan.amount * 100), // Rs → paise
            currency: "INR",
            receipt: receiptId,
            notes: {
                paidProfileId: paidProfile._id.toString(),
                userId: userId.toString(),
                planId: plan._id.toString(),
            },
        });

        paidProfile.razorpayOrderId = order.id;
        await paidProfile.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    paidProfileId: paidProfile._id,
                },
                "Order created"
            )
        );
    } catch (error) {
        next(error);
    }
};

export const verifyPaidProfilePayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ApiError(401, "Unauthorized");

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paidProfileId,
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !paidProfileId
        ) {
            throw new ApiError(400, "Invalid payment data");
        }

        // Prevent duplicate processing
        const existingTxn = await WalletTransaction.findOne({
            "meta.razorpay_payment_id": razorpay_payment_id,
        });
        if (existingTxn)
            throw new ApiError(409, "Payment already processed");

        // Verify signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature)
            throw new ApiError(400, "Payment verification failed");

        const paidProfile = await PaidProfile.findById(paidProfileId).exec();
        if (!paidProfile)
            throw new ApiError(404, "Paid profile not found");

        if (paidProfile.userId.toString() !== userId)
            throw new ApiError(403, "Not allowed");

        if (paidProfile.razorpayOrderId !== razorpay_order_id) {
            throw new ApiError(400, "Order mismatch");
        }
        if (paidProfile.razorpayPaymentId) {
            throw new ApiError(400, "Payment already verified");
        }

        if (paidProfile.status === "approved")
            throw new ApiError(400, "Profile already activated");

        const plan = await PaidProfilePlan.findById(paidProfile.planId);
        if (!plan)
            throw new ApiError(404, "Associated plan not found");

        // Activate immediately
        const startDate = new Date();
        const endDate = new Date(
            Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
        );

        paidProfile.paidAt = new Date();
        paidProfile.razorpayPaymentId = razorpay_payment_id;
        paidProfile.status = "approved";
        paidProfile.startDate = startDate;
        paidProfile.endDate = endDate;

        await paidProfile.save();

        // mark user flag true
        await User.findByIdAndUpdate(userId, { isPaidProfilePicture: true });

        // Wallet transaction record
        const amountPaise = Math.round(plan.amount * 100);

        const txn = await WalletTransaction.create({
            entityId: userId,
            entityType: "User",
            amount: -amountPaise,
            type: "paid_profile",
            status: "success",
            meta: {
                razorpay_order_id,
                razorpay_payment_id,
                paidProfileId,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { paidProfile, transaction: txn },
                "Payment verified and profile activated"
            )
        );
    } catch (error) {
        next(error);
    }
};


export const getMyPaidProfiles = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ApiError(401, "Unauthorized");

        const list = await PaidProfile.find({ userId })
            .sort({ createdAt: -1 });

        return res.status(200).json(
            new ApiResponse(200, { list }, "OK")
        );
    } catch (error) {
        next(error);
    }
};
