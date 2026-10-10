call.service.ts
import crypto from "crypto";
import mongoose from "mongoose";
import { config } from "../config/config";
import { Wallet } from "../modals/wallet.model";
import { WalletTransaction } from "../modals/walletTransaction.model";
import { CallSession, ICallSession } from "../modals/callSession.model";
import { User } from "../modals/user.model";
import ServiceProvider from "../modals/serviceProvider.model";
import Admin from "../modals/admin.model";

export class CallService {
  // ✅ Check if user has enough balance
  static async ensureSufficientBalance(userId: string, requiredPaise: number): Promise<boolean> {
    const wallet = await Wallet.findOne({ user: userId });
    return (wallet?.balance ?? 0) >= requiredPaise;
  }

  // ✅ Generate unique Agora channel
  static generateChannelName(): string {
    return `ch_${crypto.randomBytes(6).toString("hex")}`;
  }

  // 📞 Initiate a call
  static async initiateCall(params: {
    callerId: string;
    callerType: "User" | "ServiceProvider";
    calleeId: string;
    calleeType: "User" | "ServiceProvider";
    perMinutePricePaise?: number;
  }): Promise<{ allowed: boolean; reason?: string; session?: ICallSession }> {
    let perMinute = params.perMinutePricePaise ?? config.call.perMinutePricePaiseDefault;

    // 🔹 Fetch provider per-minute rate if applicable
    if (params.calleeType === "ServiceProvider") {
      const calleeProvider = await ServiceProvider.findById(params.calleeId).select("isOnline perMinutePricePaise");
      if (!calleeProvider || !calleeProvider.isOnline) return { allowed: false, reason: "CALLEE_OFFLINE" };
      perMinute = calleeProvider.perMinutePricePaise ?? perMinute;
    }
    if (params.callerType === "ServiceProvider") {
      const callerProvider = await ServiceProvider.findById(params.callerId).select("isOnline perMinutePricePaise");
      if (!callerProvider) return { allowed: false, reason: "CALLER_NOT_FOUND" };
      perMinute = callerProvider.perMinutePricePaise ?? perMinute;
    }

    // 🔹 Ensure the user has sufficient balance
    const billedUserId = params.callerType === "User" ? params.callerId : params.calleeId;
    const shouldCheckBalance = params.callerType === "User" || params.calleeType === "User";
    if (shouldCheckBalance) {
      const hasMinBalance = await this.ensureSufficientBalance(
        billedUserId,
        Math.max(perMinute, config.call.lowBalanceThresholdPaise)
      );
      if (!hasMinBalance) return { allowed: false, reason: "LOW_BALANCE" };
    }

    // 🔹 Create call session
    const session = await CallSession.create({
      channel: this.generateChannelName(),
      caller: new mongoose.Types.ObjectId(params.callerId),
      callerModel: params.callerType,
      callee: new mongoose.Types.ObjectId(params.calleeId),
      calleeModel: params.calleeType,
      perMinutePricePaise: perMinute,
      status: "initiated",
    });

    return { allowed: true, session };
  }

  // ✅ Mark call as connected
  static async markConnected(sessionId: string) {
    return CallSession.findByIdAndUpdate(
      sessionId,
      { status: "connected", connectedAt: new Date(), startedAt: new Date() },
      { new: true }
    );
  }

  // inside CallService class - replace existing endCall
  static async endCall(sessionId: string) {
    const session = await CallSession.findById(sessionId);
    if (!session) return null;

    const now = new Date();
    const startedAt = session.startedAt ?? now;
    const totalSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));

    // ------------------------
    // Helper: round to 2 decimals
    const round2 = (n: number) => Math.round(n * 100) / 100;

    // Per-second rate (float), then ROUND THIS RATE to 2 decimals first (as you requested)
    const ratePerSecond = session.perMinutePricePaise / 60; // paise/sec (float)
    const ratePerSecondRounded = round2(ratePerSecond);     // e.g. 16.666... -> 16.67

    // total (using rounded rate)
    const totalPaiseFloat = ratePerSecondRounded * totalSeconds; // may have 2 decimal places
    const totalPaiseRounded = round2(totalPaiseFloat);          // e.g. 16.67*45 = 750.15

    // determine participant ids
    const userId = (session.callerModel === "User" ? session.caller : session.callee) as mongoose.Types.ObjectId;
    const providerId = (session.callerModel === "ServiceProvider" ? session.caller : session.callee) as mongoose.Types.ObjectId;

    // fetch provider if present
    const provider = await ServiceProvider.findById(providerId).select("commissionPercentage totalEarnings todayEarnings").lean() as any | null;

    const providerCommissionRate = provider?.commissionPercentage ?? 0; // percentage, e.g. 10

    // provider share (float) — provider gets providerCommissionRate% of total
    const providerShareFloat = (totalPaiseFloat * (providerCommissionRate / 100));
    const providerShareRounded = round2(providerShareFloat); // e.g. 75.015 -> 75.01

    // admin gets remainder (use total rounded minus provider rounded to ensure sums match)
    let adminShareRounded = round2(totalPaiseRounded - providerShareRounded);

    // Defensive: if rounding produced a tiny negative value, clamp to 0 and adjust provider
    if (adminShareRounded < 0) {
      adminShareRounded = 0;
    }

    // Save billing breakdown to session.recordingMeta (audit)
    session.status = "ended";
    session.endedAt = now;
    session.totalSeconds = totalSeconds;
    session.recordingMeta = {
      ...(session.recordingMeta || {}),
      billing: {
        perMinutePricePaise: session.perMinutePricePaise,
        ratePerSecond,
        ratePerSecondRounded,
        totalPaiseFloat,
        totalPaiseRounded,
        providerCommissionRate,
        providerShareFloat,
        providerShareRounded,
        adminShareRounded
      }
    };
    await session.save();

    // ------------------------
    // 1) Debit user wallet by totalPaiseRounded (paise, decimal allowed)
    await WalletTransaction.create({
      entityId: userId,
      entityType: "User",
      amount: -totalPaiseRounded,
      type: "debit_call_second",
      status: "success",
      meta: { sessionId: session._id, seconds: totalSeconds, ratePerSecondRounded }
    });
    await Wallet.updateOne({ user: userId }, { $inc: { balance: -totalPaiseRounded } }, { upsert: true });

    // ------------------------
    // 2) Credit provider (if exists)
    if (provider) {
      // Wallet transaction for provider
      await WalletTransaction.create({
        entityId: providerId,
        entityType: "ServiceProvider",
        amount: providerShareRounded,
        type: "earning_call",
        status: "success",
        meta: { sessionId: session._id, seconds: totalSeconds, ratePerSecondRounded }
      });

      // Update provider wallet record (Wallet collection) if you keep provider wallet there
      await Wallet.updateOne({ user: providerId }, { $inc: { balance: providerShareRounded } }, { upsert: true });

      // Also update provider doc earnings (persisting paise with 2 decimals)
      await ServiceProvider.findByIdAndUpdate(providerId, {
        $inc: {
          totalEarnings: providerShareRounded,
          todayEarnings: providerShareRounded
        }
      });
    }

    // ------------------------
    // 3) Credit Admin (use Admin collection, not User)
    let adminDoc = null;
    const configuredAdminId = process.env.ADMIN_USER_ID; // use env if set
    if (configuredAdminId && mongoose.Types.ObjectId.isValid(configuredAdminId)) {
      adminDoc = await Admin.findById(configuredAdminId);
    }
    if (!adminDoc) {
      adminDoc = await Admin.findOne({}).select("+wallet"); // fallback to first admin
    }
    if (adminDoc) {
      // Update admin wallet in Admin collection (paise with decimals)
      adminDoc.wallet = (adminDoc.wallet ?? 0) + adminShareRounded;
      await adminDoc.save();

      // Create an admin WalletTransaction with entityType "Admin"
      await WalletTransaction.create({
        entityId: adminDoc._id,
        entityType: "Admin",
        amount: adminShareRounded,
        type: "earning_call",
        status: "success",
        meta: { sessionId: session._id, seconds: totalSeconds, provider: providerId }
      });
    } else {
      console.warn("[CallService.endCall] No admin doc found to credit adminShareRounded:", adminShareRounded);
    }

    // ------------------------
    // Return a clear breakdown (paise values with two decimal places)
    return {
      totalSeconds,
      totalPaise: totalPaiseRounded,
      providerShare: provider ? providerShareRounded : 0,
      adminShare: adminShareRounded,
      debug: {
        ratePerSecond,
        ratePerSecondRounded,
        totalPaiseFloat,
        providerShareFloat
      }
    };
  }


  // 💸 Auto-disconnect check
  static async shouldAutoDisconnect(userId: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ user: userId });
    return (wallet?.balance ?? 0) < config.call.lowBalanceThresholdPaise;
  }

  static async partialBill(session: any, seconds: number) {
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const ratePerSecond = session.perMinutePricePaise / 60;
    const ratePerSecondRounded = round2(ratePerSecond);
    const totalPaise = round2(ratePerSecondRounded * seconds);

    // find user, provider, admin
    const userId = (session.callerModel === "User" ? session.caller : session.callee) as mongoose.Types.ObjectId;
    const providerId = (session.callerModel === "ServiceProvider" ? session.caller : session.callee) as mongoose.Types.ObjectId;
    const provider = await ServiceProvider.findById(providerId).lean();
    const providerCommissionRate = provider?.commissionPercentage ?? 0;

    const providerShare = round2(totalPaise * (providerCommissionRate / 100));
    const adminShare = round2(totalPaise - providerShare);

    // ---------------- Debit user wallet ----------------
    await WalletTransaction.create({
      entityId: userId,
      entityType: "User",
      amount: -totalPaise,
      type: "debit_call_auto",
      status: "success",
      meta: { sessionId: session._id, seconds, ratePerSecondRounded },
    });
    await Wallet.updateOne({ user: userId }, { $inc: { balance: -totalPaise } });

    // ---------------- Credit provider ----------------
    if (provider) {
      await WalletTransaction.create({
        entityId: providerId,
        entityType: "ServiceProvider",
        amount: providerShare,
        type: "earning_call_auto",
        status: "success",
        meta: { sessionId: session._id, seconds },
      });
      await Wallet.updateOne({ user: providerId }, { $inc: { balance: providerShare } });
      await ServiceProvider.findByIdAndUpdate(providerId, {
        $inc: { totalEarnings: providerShare, todayEarnings: providerShare },
      });
    }

    // ---------------- Credit admin ----------------
    const adminDoc = await Admin.findById("6879f604cfe8425a6b907423"); // your real admin ID
    if (adminDoc) {
      adminDoc.wallet = (adminDoc.wallet ?? 0) + adminShare;
      await adminDoc.save();

      await WalletTransaction.create({
        entityId: adminDoc._id,
        entityType: "Admin",
        amount: adminShare,
        type: "earning_call_auto",
        status: "success",
        meta: { sessionId: session._id, seconds, provider: providerId },
      });
    }

    console.log(`✅ Auto-billed ${seconds}s (${totalPaise} paise): admin=${adminShare}, provider=${providerShare}`);
  }
}


























callBillingWorker.ts
import { CallSession } from "../modals/callSession.model";
import { CallService } from "./call.service"; // reuse your existing rate logic
import mongoose from "mongoose";

const BILL_INTERVAL_MS = 5000;

export async function startCallBillingWorker() {
  console.log("📞 Call billing worker started (every 5 seconds)");

  setInterval(async () => {
    try {
      const now = new Date();

      // Find all active connected calls
      const activeCalls = await CallSession.find({ status: "connected" });

      for (const session of activeCalls) {
        const lastBilledAt = session.lastBilledAt || session.connectedAt;
        if(!lastBilledAt || !session.connectedAt){
            console.log(`⏳ Skipping session ${session._id} — not connected yet`);
            continue;
        }
        const secondsElapsed = Math.floor((now.getTime() - lastBilledAt.getTime()) / 1000);

        // Only bill if at least 5 seconds passed
        if (secondsElapsed >= 5) {
          const totalBilledSoFar = session.billedDuration || 0;
          const newDuration = Number(totalBilledSoFar) + Number(secondsElapsed);

          console.log(`💰 Billing ${secondsElapsed}s for session ${session._id}`);

          // ⚙️ Call helper to bill partial seconds
          await CallService.partialBill(session, secondsElapsed);

          // Update session billing meta
          session.lastBilledAt = now;
          session.billedDuration = newDuration;
          await session.save();
        }
      }
    } catch (err) {
      console.error("⚠️ Error in billing worker:", err);
    }
  }, BILL_INTERVAL_MS);
}
