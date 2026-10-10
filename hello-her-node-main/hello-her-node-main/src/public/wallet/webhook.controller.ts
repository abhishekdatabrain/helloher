import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Wallet } from "../../modals/wallet.model";
import { WalletTransaction } from "../../modals/walletTransaction.model";
import Admin from "../../modals/admin.model";
import ApiResponse from "../../utils/ApiResponse";

export const razorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const signature = req.headers["x-razorpay-signature"] as string;

        // Validate signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(req.body) // raw body required!
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        const event = req.body.event;

        if (event === "payment.captured") {
            const payment = req.body.payload.payment.entity;

            // Check if transaction already exists
            let txn = await WalletTransaction.findOne({
                "meta.razorpay_payment_id": payment.id
            });

            if (txn && txn.status === "success") {
                // Already processed
                return res.status(200).json({ success: true, message: "Payment already processed" });
            }

            // If txn not found, find by order_id (pending transaction)
            if (!txn) {
                txn = await WalletTransaction.findOne({
                    "meta.razorpay_order_id": payment.order_id
                });
            }

            if (!txn) {
                return res.status(404).json({ success: false, message: "Transaction not found" });
            }

            // Update transaction status
            txn.status = "success";
            txn.meta = { ...txn.meta, razorpay_payment_id: payment.id };
            await txn.save();

            // Credit user's wallet
            const wallet = await Wallet.findOneAndUpdate(
                { user: txn.entityId },
                { $inc: { balance: txn.amount } },
                { new: true }
            );

            // Update admin total recharge
            const adminId = process.env.ADMIN_USER_ID;
            if (adminId) {
                await Admin.findByIdAndUpdate(adminId, {
                    $inc: { totalRechargeAmountRecived: txn.amount }
                });
            }

            return res.status(200).json({ success: true });
        }

        // Ignore other events
        return res.status(200).json({ success: true, message: "Event ignored" });

    } catch (error) {
        next(error);
    }
};
