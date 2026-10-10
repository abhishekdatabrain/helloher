import mongoose from "mongoose";
import ServiceProvider from "../modals/serviceProvider.model";
import { CallSession } from "../modals/callSession.model";
import { Wallet } from "../modals/wallet.model";
import Admin from "../modals/admin.model";
import { WalletTransaction } from "../modals/walletTransaction.model";
import { createAndEmitNotification } from "./notificationHelper.service";
import { AvailabilityPenaltySetting } from "../modals/availabilityPenaltySetting.model";

interface PenaltyOptions {
    date?: Date; // day to evaluate (defaults to yesterday)
    minCallsPerDay?: number;
    minOnlineHoursPerDay?: number; // hours
    penaltyAmountRs?: number;
    adminId?: string; // owner/admin user to credit
    io?: any;
    getSocketUser?: any;
}

/**
 * Evaluate provider availability for a single day and apply penalties when rules are violated.
 * - If calls < minCallsPerDay → penaltyAmountRs deducted
 * - If online hours < minOnlineHoursPerDay → penaltyAmountRs deducted
 * Deducted amount is credited to Admin wallet (owner) and provider is notified.
 */
export async function applyAvailabilityPenalties(options: PenaltyOptions = {}) {
    let {
        date = new Date(),
        minCallsPerDay,
        minOnlineHoursPerDay,
        penaltyAmountRs,
        adminId = process.env.ADMIN_USER_ID,
        io,
        getSocketUser,
    } = options;

    // If settings not provided explicitly, try to read persistent settings
    let s: any = null;
    try {
        s = await AvailabilityPenaltySetting.findOne({ key: "availability_penalty" });
        if (s) {
            if (minCallsPerDay === undefined) minCallsPerDay = s.minCallsPerDay;
            if (minOnlineHoursPerDay === undefined) minOnlineHoursPerDay = s.minOnlineHoursPerDay;
            if (penaltyAmountRs === undefined) penaltyAmountRs = s.penaltyAmountRs;
            if (s.enabled === false) {
                return { success: true, skipped: true, reason: "disabled_in_settings" };
            }
        }
    } catch (err) {
        console.warn("Could not load AvailabilityPenaltySetting, falling back to defaults", err);
    }

    // final fallbacks
    if (minCallsPerDay === undefined) minCallsPerDay = 5;
    if (minOnlineHoursPerDay === undefined) minOnlineHoursPerDay = 3;
    if (penaltyAmountRs === undefined) penaltyAmountRs = 10;

    // evaluate day range (00:00 to next 00:00 local time)
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const providers = await ServiceProvider.find({ isDeleted: false, isActive: true }).select("_id");

    const adminDoc = adminId ? await Admin.findById(adminId) : await Admin.findOne();

    for (const p of providers) {
        const providerId = (p as any)._id as mongoose.Types.ObjectId;

        // Count calls where provider was a participant and startedAt in the day
        const callsCount = await CallSession.countDocuments({
            $and: [
                { status: { $in: ["connected", "ended"] } },
                {
                    $or: [
                        { caller: providerId, callerModel: "ServiceProvider" },
                        { callee: providerId, calleeModel: "ServiceProvider" },
                    ],
                },
                { startedAt: { $gte: dayStart, $lt: dayEnd } },
            ],
        });

        // Sum connected seconds for provider during the day
        const sessions = await CallSession.find({
            $and: [
                { status: { $in: ["connected", "ended"] } },
                {
                    $or: [
                        { caller: providerId, callerModel: "ServiceProvider" },
                        { callee: providerId, calleeModel: "ServiceProvider" },
                    ],
                },
                { startedAt: { $gte: dayStart, $lt: dayEnd } },
            ],
        }).select("startedAt endedAt totalSeconds");

        let totalSeconds = 0;
        for (const s of sessions) {
            if (s.totalSeconds && typeof s.totalSeconds === "number" && s.totalSeconds > 0) {
                totalSeconds += s.totalSeconds as any;
            } else if (s.startedAt && s.endedAt) {
                totalSeconds += Math.max(0, Math.floor(((s.endedAt as Date).getTime() - (s.startedAt as Date).getTime()) / 1000));
            }
        }

        const minSeconds = Math.floor(minOnlineHoursPerDay * 3600);
        let violations: string[] = [];
        if (callsCount < minCallsPerDay) violations.push(`calls:${callsCount}`);
        if (totalSeconds < minSeconds) violations.push(`onlineHours:${(totalSeconds / 3600).toFixed(2)}`);

        if (violations.length === 0) continue;

        const penaltyCount = violations.length; // one penalty per rule violated
        const penaltyTotalRs = penaltyCount * penaltyAmountRs;
        const penaltyPaise = Math.round(penaltyTotalRs * 100);

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Deduct from provider wallet
            let providerWallet = await Wallet.findOne({ user: providerId }).session(session);
            if (!providerWallet) {
                providerWallet = new Wallet({ user: providerId, balance: 0 });
            }
            providerWallet.balance = (providerWallet.balance ?? 0) - penaltyPaise;
            await providerWallet.save({ session });

            await WalletTransaction.create([
                {
                    entityId: providerId,
                    entityType: "ServiceProvider",
                    amount: -penaltyPaise,
                    type: "penalty",
                    status: "success",
                    meta: {
                        reason: "availability_penalty",
                        date: dayStart.toISOString(),
                        violations,
                        penaltyPerViolationRs: penaltyAmountRs,
                        penaltyCount,
                        penaltyTotalRs,
                        settingsSnapshot: {
                            minCallsPerDay,
                            minOnlineHoursPerDay,
                            penaltyAmountRs,
                            settingId: s?._id?.toString(),
                        },
                    },
                },
            ], { session });

            // Credit admin/owner
            if (adminDoc) {
                adminDoc.wallet = (adminDoc.wallet ?? 0) + penaltyPaise;
                await adminDoc.save({ session });

                await WalletTransaction.create([
                    {
                        entityId: adminDoc._id,
                        entityType: "Admin",
                        amount: penaltyPaise,
                        type: "penalty",
                        status: "success",
                        meta: {
                            reason: "provider_availability_penalty",
                            providerId: providerId.toString(),
                            date: dayStart.toISOString(),
                            violations,
                            penaltyPerViolationRs: penaltyAmountRs,
                            penaltyCount,
                            penaltyTotalRs,
                            settingsSnapshot: {
                                minCallsPerDay,
                                minOnlineHoursPerDay,
                                penaltyAmountRs,
                                settingId: s?._id?.toString(),
                            },
                        },
                    },
                ], { session });
            }

            // Notification to provider
            try {
                await createAndEmitNotification({
                    type: "wallet_recharged",
                    title: "Availability Penalty",
                    message: `You were charged ₹${penaltyTotalRs} for low availability on ${dayStart.toDateString()}. Reasons: ${violations.join(", ")}`,
                    recipientId: providerId.toString(),
                    recipientType: "provider",
                    senderId: adminDoc ? adminDoc._id.toString() : undefined,
                    senderType: adminDoc ? "admin" : undefined,
                    metadata: {
                        violations,
                        penaltyTotalRs,
                        date: dayStart.toISOString(),
                        settingsSnapshot: {
                            minCallsPerDay,
                            minOnlineHoursPerDay,
                            penaltyAmountRs,
                            settingId: s?._id?.toString(),
                        },
                    },
                    io,
                    getSocketUser,
                });
            } catch (notifErr) {
                // don't rollback for notification failure
                console.error("Notification error (penalty):", notifErr);
            }

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            console.error("Error applying availability penalty for provider:", providerId, err);
        } finally {
            session.endSession();
        }
    }

    return { success: true };
}

/**
 * Apply a manual penalty to a specific provider by deducting from their totalEarnings.
 * - Deducts penaltyAmountRs from provider's totalEarnings
 * - Credits the amount to Admin wallet
 * - Creates wallet transactions for both
 * - Notifies the provider
 */
export async function applyManualPenalty(options: {
    providerId: string;
    penaltyAmountRs: number;
    reason: string;
    adminId?: string;
    io?: any;
    getSocketUser?: any;
}) {
    const { providerId, penaltyAmountRs, reason, adminId = process.env.ADMIN_USER_ID, io, getSocketUser } = options;

    const penaltyPaise = Math.round(penaltyAmountRs);

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Get provider
        const provider = await ServiceProvider.findById(providerId).session(session);
        if (!provider) throw new Error("Provider not found");

        // Deduct from provider's totalEarnings
        provider.totalEarnings = (provider.totalEarnings ?? 0) - penaltyPaise;
        await provider.save({ session });

        // Create transaction for provider (debit)
        await WalletTransaction.create([{
            entityId: providerId,
            entityType: "ServiceProvider",
            amount: -penaltyPaise,
            type: "penalty",
            status: "success",
            meta: {
                reason: "manual_penalty",
                penaltyAmountRs,
                adminReason: reason,
                appliedBy: adminId,
            },
        }], { session });

        // Credit admin
        const adminDoc = adminId ? await Admin.findById(adminId).session(session) : await Admin.findOne().session(session);
        if (adminDoc) {
            adminDoc.wallet = (adminDoc.wallet ?? 0) + penaltyPaise;
            await adminDoc.save({ session });

            // Create transaction for admin (credit)
            await WalletTransaction.create([{
                entityId: adminDoc._id,
                entityType: "Admin",
                amount: penaltyPaise,
                type: "penalty",
                status: "success",
                meta: {
                    reason: "provider_manual_penalty",
                    providerId,
                    penaltyAmountRs,
                    adminReason: reason,
                    appliedBy: adminId,
                },
            }], { session });
        }

        // Notification to provider
        try {
            await createAndEmitNotification({
                type: "manual_penalty",
                title: "Manual Penalty Applied",
                message: `A penalty of ₹${penaltyAmountRs} has been applied to your account. Reason: ${reason}`,
                recipientId: providerId,
                recipientType: "provider",
                senderId: adminDoc ? adminDoc._id.toString() : undefined,
                senderType: adminDoc ? "admin" : undefined,
                metadata: {
                    penaltyAmountRs,
                    reason,
                    appliedBy: adminId,
                },
                io,
                getSocketUser,
            });
        } catch (notifErr) {
            console.error("Notification error (manual penalty):", notifErr);
        }

        await session.commitTransaction();
        return { success: true, penaltyApplied: penaltyAmountRs };
    } catch (err) {
        await session.abortTransaction();
        console.error("Error applying manual penalty:", err);
        throw err;
    } finally {
        session.endSession();
    }
}

export default { applyAvailabilityPenalties, applyManualPenalty };
