import { Request, Response, NextFunction } from "express";
import { Wallet } from "../../modals/wallet.model";
import { WalletTransaction } from "../../modals/walletTransaction.model";
import { RechargePlan } from "../../modals/RechargePlan.model";
import razorpay from "../../config/razorpay.config";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { IUser } from "../../modals/user.model";
import mongoose, { Types } from "mongoose";
import Admin from "../../modals/admin.model";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

interface CustomRequest extends Request {
    user?: IUser;
}

export const createRechargeOrder = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { planId } = req.body;

        if (!userId) throw new ApiError(401, "Unauthorized");
        if (!planId) throw new ApiError(400, "planId is required");

        const plan = await RechargePlan.findById(planId);
        if (!plan) throw new ApiError(404, "Recharge plan not found");

        // const order = await razorpay.orders.create({
        //     amount: plan.amount * 100, // paise
        //     currency: "INR",
        //     receipt: `wallet_${userId}_${Date.now()}`,
        // });
        let order: any;
        const receiptId = `wallet_${userId.toString().slice(-10)}_${Date.now().toString().slice(-5)}`;

        try {
            order = await razorpay.orders.create({
                amount: plan.amount * 100,
                currency: "INR",
                receipt: receiptId,
            });
            console.log("Razorpay order created:", order);
        } catch (err) {
            console.error("Razorpay error:", err);
            throw new ApiError(500, "Razorpay order creation failed");
        }

        // Ensure order exists
        if (!order || !order.id) throw new ApiError(500, "Invalid order from Razorpay");

        return res.status(200).json(
            new ApiResponse(200, {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                planId,
            }, "Razorpay order created")
        );
    } catch (error) {
        next(error);
    }
};

export const verifyRechargePayment = async (
    req: CustomRequest,
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
            planId,
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !planId
        ) {
            throw new ApiError(400, "Invalid payment data");
        }

        const existingTxn = await WalletTransaction.findOne({
            "meta.razorpay_payment_id": razorpay_payment_id,
        });

        if (existingTxn) {
            throw new ApiError(409, "Payment already processed");
        }


        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        if (!process.env.RAZORPAY_KEY_SECRET)
            throw new ApiError(500, "Payment config error");

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            throw new ApiError(400, "Payment verification failed");
        }

        // ✅ Payment verified — NOW update wallet
        const plan = await RechargePlan.findById(planId);
        if (!plan) throw new ApiError(404, "Recharge plan not found");

        // Check if this is the user's first recharge
        const previousRecharges = await WalletTransaction.countDocuments({
            entityId: userId,
            entityType: "User",
            type: "recharge",
            status: "success",
        });

        const isFirstRecharge = previousRecharges === 0;
        const extraAmount = isFirstRecharge ? 5000 : 0; // 50Rs = 5000 paise
        const totalAmount = (plan.amount * 100) + extraAmount;

        console.log("💰 [WALLET] Recharge verification", {
            userId,
            planId,
            planAmount: plan.amount,
            isFirstRecharge,
            extraAmount,
            totalAmount,
        });

        const wallet = await Wallet.findOneAndUpdate(
            { user: userId },
            { $inc: { balance: totalAmount } },
            { new: true }
        );
        if (!wallet) throw new ApiError(404, "Wallet not found");

        const transaction = await WalletTransaction.create({
            entityId: userId,
            entityType: "User",
            amount: totalAmount,
            type: "recharge",
            status: "success",
            meta: {
                planId,
                razorpay_order_id,
                razorpay_payment_id,
                isFirstRecharge,
                extraAmount,
            },
        });

        wallet.transactions.push(transaction._id as Types.ObjectId);
        await wallet.save();

        // 🏦 Update admin stats
        const adminId = process.env.ADMIN_USER_ID;
        if (adminId) {
            await Admin.findByIdAndUpdate(adminId, {
                $inc: { totalRechargeAmountRecived: plan.amount * 100 }
            });
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { wallet, transaction },
                "Wallet recharged successfully"
            )
        );
    } catch (error) {
        next(error);
    }
};


// 💳 Recharge wallet
// export const rechargeWallet = async (
//     req: CustomRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         const userId = req.user?.id;
//         const { planId } = req.body;

//         if (!userId) throw new ApiError(401, "Unauthorized");
//         if (!planId) throw new ApiError(400, "planId is required");

//         const plan = await RechargePlan.findById(planId);
//         if (!plan) throw new ApiError(404, "Recharge plan not found");

//         const wallet = await Wallet.findOne({ user: userId });
//         if (!wallet) throw new ApiError(404, "Wallet not found");

//         wallet.balance += plan.amount * 100;
//         await wallet.save();

//         const transaction = await WalletTransaction.create({
//             entityId: userId as unknown as mongoose.Types.ObjectId,
//             entityType: "User",
//             amount: plan.amount * 100,
//             type: "recharge",
//             meta: { planId, description: plan.description, timeDuration: plan.timeDuration },
//         });

//         wallet.transactions.push(transaction._id as Types.ObjectId);
//         await wallet.save();

//         // 🏦 Update admin's totalRechargeAmountRecived
//         const adminId = process.env.ADMIN_USER_ID;
//         if (adminId) {
//             await Admin.findByIdAndUpdate(
//                 adminId,
//                 { $inc: { totalRechargeAmountRecived: plan.amount } },
//                 { new: true }
//             );
//         }

//         // 🔔 Create notification for wallet recharge
//         try {
//             const { createAndEmitNotification } = await import("../../services/notificationHelper.service");
//             const io = req.app.get("socketio");
//             const getSocketUser = req.app.get("getSocketUser");

//             await createAndEmitNotification({
//                 type: "wallet_recharged",
//                 title: "Wallet Recharged",
//                 message: `Your wallet has been recharged with ₹${plan.amount}. New balance: ₹${(wallet.balance / 100).toFixed(2)}`,
//                 recipientId: userId,
//                 recipientType: "user",
//                 metadata: {
//                     amount: plan.amount,
//                     planId: planId.toString(),
//                     newBalance: wallet.balance / 100,
//                     transactionId: transaction._id.toString(),
//                 },
//                 io,
//                 getSocketUser,
//             });
//         } catch (notifError) {
//             console.error("Error creating wallet recharge notification:", notifError);
//             // Don't fail the request if notification fails
//         }

//         return res
//             .status(200)
//             .json(new ApiResponse(200, { wallet, transaction }, "Wallet recharged successfully"));
//     } catch (error) {
//         next(error);
//     }
// };
