import crypto from "crypto";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { config } from "../config/config";
import { Wallet } from "../modals/wallet.model";
import {
  CallSession,
  ICallBillingSnapshot,
  ICallSession,
} from "../modals/callSession.model";
import { User } from "../modals/user.model";
import ServiceProvider from "../modals/serviceProvider.model";
import Admin from "../modals/admin.model";
import CommissionModel from "../modals/commission.model";
import { WalletTransaction } from "../modals/walletTransaction.model";
import { logBillingEvent } from "../utils/billingLogger";
import { CallRecordingService } from "./callRecording.service";
import {
  buildDueCallFilter,
  calculateBillableDuration,
  DueDisconnectReason,
  selectDueDisconnect,
} from "./callBillingWorker.core";

export type MarkConnectedResult =
  | {
    outcome: "connected" | "already_connected";
    session: ICallSession;
    transitioned: boolean;
  }
  | {
    outcome: "not_connectable";
    session: ICallSession;
    transitioned: false;
  }
  | {
    outcome: "not_found";
    session: null;
    transitioned: false;
  };

export interface DueBillingFinalizationResult {
  processed: boolean;
  sessionId: string;
  channel?: string;
  reason?: DueDisconnectReason;
  deadline?: Date;
  result: any;
}

interface FinalizeBillingOptions {
  disconnectReason?: string;
  dueAt?: Date;
  effectiveEndedAt?: Date;
  legacyProcessingBefore?: Date;
  getSocketUser?: (
    userId: string,
  ) => { userId: string; socketId: string } | undefined;
  io?: Server;
}

interface InternalBillingOutcome {
  claimed: boolean;
  deadline?: Date;
  reason?: DueDisconnectReason | string;
  result: any;
  session: ICallSession | null;
}

/**
 * Accurate two-digit floor rounding for currency (paise)
 * Ensures no floating-point precision errors in monetary calculations
 * @param value - The value to round down to 2 decimal places
 * @returns Floored value with at most 2 decimal digits
 */
function floorToTwoDigits(value: number): number {
  return Math.floor(value * 100) / 100;
}

function addSeconds(base: Date, seconds: number): Date {
  return new Date(base.getTime() + seconds * 1000);
}

function createBillingSnapshot(
  commissionDoc: any,
  fallbackPerMinutePricePaise: number,
): ICallBillingSnapshot {
  const requestedRate = Number(fallbackPerMinutePricePaise);
  const perMinutePricePaise = floorToTwoDigits(
    Number.isFinite(requestedRate) && requestedRate >= 0
      ? requestedRate
      : Number(commissionDoc?.perMinutePricePaise ?? 600),
  );

  return {
    capturedAt: new Date(),
    commissionSlabs: Array.isArray(commissionDoc?.commissionSlabs)
      ? commissionDoc.commissionSlabs.map((slab: any) => ({
        minSeconds: Number(slab.minSeconds),
        maxSeconds: Number(slab.maxSeconds),
        providerSharePaise: floorToTwoDigits(slab.providerSharePaise),
        adminSharePaise: floorToTwoDigits(slab.adminSharePaise),
      }))
      : [],
    globalCommissionPercentage: Number(
      commissionDoc?.globalCommissionPercentage ?? 0,
    ),
    perMinutePricePaise,
    useGlobalCommission:
      commissionDoc?.useGlobalCommission ??
      !Array.isArray(commissionDoc?.commissionSlabs),
  };
}

export class CallService {
  // ✅ Check if user has enough balance
  static async ensureSufficientBalance(
    userId: string,
    requiredPaise: number,
  ): Promise<boolean> {
    const wallet = await Wallet.findOne({ user: userId });
    return (wallet?.balance ?? 0) >= requiredPaise;
  }

  // ✅ Generate unique Agora channel
  static generateChannelName(): string {
    return `ch_${crypto.randomBytes(6).toString("hex")}`;
  }

  // 📞 Initiate a call
  // static async initiateCall(params: {
  //   callerId: string;
  //   callerType: "User" | "ServiceProvider";
  //   calleeId: string;
  //   calleeType: "User" | "ServiceProvider";
  //   perMinutePricePaise?: number;
  // }): Promise<{ allowed: boolean; reason?: string; session?: ICallSession }> {
  //   const commissionDoc = await CommissionModel.findOne();
  //   let perMinute = params.perMinutePricePaise ?? commissionDoc?.perMinutePricePaise ?? config.call.perMinutePricePaiseDefault;

  //   // 🔹 Fetch provider rate if applicable
  //   if (params.calleeType === "ServiceProvider") {
  //     const calleeProvider = await ServiceProvider.findById(params.calleeId).select("isOnline perMinutePricePaise");
  //     if (!calleeProvider || !calleeProvider.isOnline)
  //       return { allowed: false, reason: "CALLEE_OFFLINE" };
  //     perMinute = calleeProvider.perMinutePricePaise ?? perMinute;
  //   }
  //   if (params.callerType === "ServiceProvider") {
  //     const callerProvider = await ServiceProvider.findById(params.callerId).select("isOnline perMinutePricePaise");
  //     if (!callerProvider) return { allowed: false, reason: "CALLER_NOT_FOUND" };
  //     perMinute = callerProvider.perMinutePricePaise ?? perMinute;
  //   }

  //   // 🔹 Ensure the user has sufficient balance
  //   const billedUserId = params.callerType === "User" ? params.callerId : params.calleeId;
  //   const shouldCheckBalance = params.callerType === "User" || params.calleeType === "User";
  //   if (shouldCheckBalance) {
  //     const hasMinBalance = await this.ensureSufficientBalance(
  //       billedUserId,
  //       Math.max(perMinute, config.call.lowBalanceThresholdPaise)
  //     );
  //     if (!hasMinBalance) return { allowed: false, reason: "LOW_BALANCE" };
  //   }

  //   // 🔹 Create call session
  //   const session = await CallSession.create({
  //     channel: this.generateChannelName(),
  //     caller: new mongoose.Types.ObjectId(params.callerId),
  //     callerModel: params.callerType,
  //     callee: new mongoose.Types.ObjectId(params.calleeId),
  //     calleeModel: params.calleeType,
  //     perMinutePricePaise: perMinute,
  //     status: "initiated",
  //   });

  //   return { allowed: true, session };
  // }

  // 📞 Initiate a call
  static async initiateCall(params: {
    callerId: string;
    callerType: "User" | "ServiceProvider";
    calleeId: string;
    calleeType: "User" | "ServiceProvider";
    channel?: string;
  }): Promise<{ allowed: boolean; reason?: string; session?: ICallSession }> {
    // 🔹 Always fetch current global commission config
    const commissionDoc = await CommissionModel.findOne();
    const perMinute =
      commissionDoc?.perMinutePricePaise ??
      config.call.perMinutePricePaiseDefault;
    const billingSnapshot = createBillingSnapshot(
      commissionDoc,
      perMinute,
    );

    // 🔹 Ensure callee (if provider) is online
    if (params.calleeType === "ServiceProvider") {
      const calleeProvider = await ServiceProvider.findById(
        params.calleeId,
      ).select("isOnline");
      if (!calleeProvider || !calleeProvider.isOnline)
        return { allowed: false, reason: "CALLEE_OFFLINE" };
    }

    // 🔹 Ensure the user has sufficient balance
    const billedUserId =
      params.callerType === "User" ? params.callerId : params.calleeId;
    const shouldCheckBalance =
      params.callerType === "User" || params.calleeType === "User";
    if (shouldCheckBalance) {
      const hasMinBalance = await this.ensureSufficientBalance(
        billedUserId,
        Math.max(perMinute, config.call.lowBalanceThresholdPaise),
      );
      if (!hasMinBalance) return { allowed: false, reason: "LOW_BALANCE" };
    }

    // 🔹 Create new session
    const session = await CallSession.create({
      channel: params.channel || this.generateChannelName(),
      caller: new mongoose.Types.ObjectId(params.callerId),
      callerModel: params.callerType,
      callee: new mongoose.Types.ObjectId(params.calleeId),
      calleeModel: params.calleeType,
      perMinutePricePaise: perMinute,
      billingSnapshot,
      status: "initiated",
    });

    return { allowed: true, session };
  }

  // ✅ Mark call as connected
  // static async markConnected(sessionId: string) {
  //   return CallSession.findByIdAndUpdate(
  //     sessionId,
  //     { status: "connected", connectedAt: new Date(), startedAt: new Date() },
  //     { new: true },
  //   );
  // }

  // ✅ Mark call as connected + auto start recording
  static async markConnected(sessionId: string): Promise<MarkConnectedResult> {
    const sessionDoc = await CallSession.findById(sessionId).exec();
    if (!sessionDoc) {
      return {
        outcome: "not_found",
        session: null,
        transitioned: false,
      };
    }

    // A repeated accept for an actually-live call is idempotent. Importantly,
    // it must not reset startedAt or extend any billing deadline.
    if (sessionDoc.status === "connected" && !sessionDoc.billingProcessed) {
      await this.ensureRecordingStarted(sessionDoc);
      return {
        outcome: "already_connected",
        session: sessionDoc,
        transitioned: false,
      };
    }

    if (
      sessionDoc.billingProcessed ||
      !["initiated", "ringing"].includes(sessionDoc.status)
    ) {
      return {
        outcome: "not_connectable",
        session: sessionDoc,
        transitioned: false,
      };
    }

    const billedUserId =
      sessionDoc.callerModel === "User"
        ? sessionDoc.caller
        : sessionDoc.callee;
    const wallet = await Wallet.findOne({ user: billedUserId }).exec();
    const balance = wallet?.balance ?? 0;
    const billingSnapshot =
      sessionDoc.billingSnapshot ??
      createBillingSnapshot(
        await CommissionModel.findOne().exec(),
        sessionDoc.perMinutePricePaise ??
        config.call.perMinutePricePaiseDefault,
      );
    const perSecondRate =
      billingSnapshot.perMinutePricePaise / 60;
    const maxAllowedSeconds =
      perSecondRate > 0 ? Math.floor(balance / perSecondRate) : 0;
    const now = new Date();

    // Compare-and-set is the state-machine gate. A delayed REST request or a
    // socket race can no longer resurrect a finalized call.
    const transitionedSession = await CallSession.findOneAndUpdate(
      {
        _id: sessionId,
        status: { $in: ["initiated", "ringing"] },
        billingProcessed: { $ne: true },
      },
      {
        $set: {
          status: "connected",
          billingSnapshot,
          connectedAt: now,
          startedAt: now,
          lastHeartbeat: now,
          lastBilledAt: now,
          maxAllowedSeconds,
          heartbeatExpiresAt: addSeconds(now, 20),
          lowBalanceWarnAt: addSeconds(
            now,
            Math.max(0, maxAllowedSeconds - 60),
          ),
          autoEndAt: addSeconds(now, maxAllowedSeconds),
        },
      },
      { new: true },
    ).exec();

    if (!transitionedSession) {
      const currentSession = await CallSession.findById(sessionId).exec();
      if (!currentSession) {
        return {
          outcome: "not_found",
          session: null,
          transitioned: false,
        };
      }

      if (
        currentSession.status === "connected" &&
        !currentSession.billingProcessed
      ) {
        await this.ensureRecordingStarted(currentSession);
        return {
          outcome: "already_connected",
          session: currentSession,
          transitioned: false,
        };
      }

      return {
        outcome: "not_connectable",
        session: currentSession,
        transitioned: false,
      };
    }

    console.log(
      `[CallService] markConnected set maxAllowedSeconds=${maxAllowedSeconds} for session ${sessionId}`,
    );
    await this.ensureRecordingStarted(transitionedSession);

    return {
      outcome: "connected",
      session: transitionedSession,
      transitioned: true,
    };
  }

  private static async ensureRecordingStarted(
    session: ICallSession,
  ): Promise<void> {
    const sessionId = session._id.toString();
    const operationStartedAt = new Date();
    const claimedSession = await CallSession.findOneAndUpdate(
      {
        _id: sessionId,
        status: "connected",
        billingProcessed: { $ne: true },
        $or: [
          { recordingState: { $in: ["idle", "failed", "stopped"] } },
          {
            recordingState: { $exists: false },
            isRecording: { $ne: true },
          },
        ],
      },
      {
        $set: {
          recordingState: "starting",
          recordingStateUpdatedAt: operationStartedAt,
        },
      },
      { new: true },
    ).exec();

    // A different app instance already owns the start, or recording is active.
    if (!claimedSession) return;

    try {
      await CallRecordingService.startRecording(sessionId);

      const activated = await CallSession.findOneAndUpdate(
        {
          _id: sessionId,
          status: "connected",
          billingProcessed: { $ne: true },
          recordingState: "starting",
        },
        {
          $set: {
            isRecording: true,
            recordingState: "active",
            recordingStateUpdatedAt: new Date(),
          },
        },
        { new: true },
      ).exec();

      if (activated) {
        console.log("🎬 Recording auto-started for session:", sessionId);
        return;
      }

      // Billing won while Agora start was in flight. Persist cleanup before
      // attempting the compensating stop so a crash remains recoverable.
      await CallSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            isRecording: true,
            recordingState: "active",
            recordingStateUpdatedAt: new Date(),
            recordingCleanupPending: true,
            cleanupNextAttemptAt: new Date(),
          },
        },
      );
      await this.processPostBillingCleanup(sessionId);
    } catch (err) {
      console.error("❌ Failed to auto-start recording:", err);
      const currentSession = await CallSession.findById(sessionId)
        .select("status billingProcessed recordingSid recordingResourceId")
        .lean();
      const isTerminal = Boolean(currentSession?.billingProcessed);
      await CallSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            recordingState: "failed",
            recordingStateUpdatedAt: new Date(),
            ...(isTerminal &&
              currentSession?.recordingSid &&
              currentSession?.recordingResourceId
              ? {
                recordingCleanupPending: true,
                cleanupNextAttemptAt: new Date(),
              }
              : {}),
          },
        },
      );
    }
  }

  /**
   * Safely end a call by channel.
   */
  static async endCallSafe(
    channel: string,
    reason: string,
    io?: Server,
    getSocketUser?: (userId: string) => { userId: string; socketId: string } | undefined,
  ) {
    const session = await CallSession.findOne({
      channel,
      status: { $in: ["initiated", "ringing", "connected"] },
      billingProcessed: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .exec();
    if (!session) return null;

    return this.finalizeBilling(session._id.toString(), io, getSocketUser, reason);
  }

  /**
   * Stop Agora recording for a session (best-effort, idempotent).
   */
  static async stopRecording(sessionId: string): Promise<boolean> {
    const staleOperationBefore = new Date(Date.now() - 60_000);
    const session = await CallSession.findById(sessionId).exec();
    if (!session) return true;

    if (!session.recordingResourceId || !session.recordingSid) {
      if (
        session.recordingState === "starting" &&
        session.recordingStateUpdatedAt &&
        session.recordingStateUpdatedAt > staleOperationBefore
      ) {
        throw new Error(
          `Recording start is still in progress for session ${sessionId}`,
        );
      }

      await CallSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            isRecording: false,
            recordingState: "stopped",
            recordingStateUpdatedAt: new Date(),
          },
        },
      );
      return true;
    }

    const claimed = await CallSession.findOneAndUpdate(
      {
        _id: sessionId,
        $or: [
          { recordingState: { $ne: "stopping" } },
          {
            recordingState: "stopping",
            recordingStateUpdatedAt: { $lte: staleOperationBefore },
          },
        ],
      },
      {
        $set: {
          recordingState: "stopping",
          recordingStateUpdatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();
    if (!claimed) {
      throw new Error(
        `Recording stop is already in progress for session ${sessionId}`,
      );
    }

    try {
      await CallRecordingService.stopRecording(sessionId);
      await CallSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            isRecording: false,
            recordingState: "stopped",
            recordingStateUpdatedAt: new Date(),
          },
        },
      );
      console.log("[Recording] stop requested for session:", sessionId);
      return true;
    } catch (err) {
      console.error("[Recording] stop failed:", err);
      await CallSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            isRecording: true,
            recordingState: "active",
            recordingStateUpdatedAt: new Date(),
          },
        },
      );
      throw err;
    }
  }

  /**
   * Helper: mark provider as on-call for a given session
   * Emits `provider:oncall` via provided `io` if available.
   */
  static async startProviderOnCallBySession(sessionId: string, io?: Server) {
    try {
      const session = await CallSession.findOne({
        _id: sessionId,
        status: "connected",
        billingProcessed: { $ne: true },
      }).exec();
      if (!session) return null;

      const providerId = (session.callerModel === "ServiceProvider"
        ? session.caller
        : session.callee) as mongoose.Types.ObjectId;

      const provider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        {
          $set: {
            isOnCall: true,
            currentCallStartedAt:
              session.startedAt ?? session.connectedAt ?? new Date(),
            currentCallSessionId: session._id,
          },
        },
        { new: true },
      ).exec();
      if (!provider) return null;

      // Close the small cross-collection race where billing might finish after
      // the active-session read but before the provider save.
      const stillActive = await CallSession.exists({
        _id: sessionId,
        status: "connected",
        billingProcessed: { $ne: true },
      });
      if (!stillActive) {
        await this.endProviderOnCallBySession(sessionId, io);
        return provider;
      }

      if (io) {
        const otherParticipant = (session.callerModel === "ServiceProvider")
          ? { id: session.callee?.toString(), role: session.calleeModel }
          : { id: session.caller?.toString(), role: session.callerModel };

        io.emit("provider:oncall", {
          providerId: provider._id.toString(),
          status: true,
          startedAt: provider.currentCallStartedAt,
          currentCallWith: otherParticipant,
          channel: session.channel || null,
        });
      }

      return provider;
    } catch (err) {
      console.error("startProviderOnCallBySession error:", err);
      throw err;
    }
  }

  /**
   * Helper: clear provider on-call state for a given session
   */
  static async endProviderOnCallBySession(sessionId: string, io?: Server) {
    try {
      const session = await CallSession.findById(sessionId).exec();
      if (!session) return null;

      const providerId = (session.callerModel === "ServiceProvider"
        ? session.caller
        : session.callee) as mongoose.Types.ObjectId;

      const provider = await ServiceProvider.findById(providerId).exec();
      if (!provider) return null;

      const activeSession = await CallSession.findOne({
        _id: { $ne: session._id },
        status: "connected",
        billingProcessed: { $ne: true },
        $or: [{ caller: providerId }, { callee: providerId }],
      })
        .sort({ startedAt: -1, createdAt: -1 })
        .exec();

      if (activeSession) {
        const reconciled = await ServiceProvider.findByIdAndUpdate(
          providerId,
          {
            $set: {
              isOnCall: true,
              currentCallStartedAt:
                activeSession.startedAt ??
                activeSession.connectedAt ??
                new Date(),
              currentCallSessionId: activeSession._id,
            },
          },
          { new: true },
        ).exec();

        if (io && reconciled) {
          io.emit("provider:oncall", {
            providerId: providerId.toString(),
            status: true,
            startedAt: reconciled.currentCallStartedAt,
            channel: activeSession.channel,
          });
        }
        return reconciled;
      }

      // Session ownership prevents late cleanup from an old call from
      // clearing a newer call that connected concurrently.
      const currentCallSessionId = provider.currentCallSessionId ?? null;
      const cleared = await ServiceProvider.findOneAndUpdate(
        {
          _id: providerId,
          currentCallSessionId,
        },
        {
          $set: {
            isOnCall: false,
            currentCallStartedAt: null,
            currentCallSessionId: null,
          },
        },
        { new: true },
      ).exec();

      if (io && cleared) {
        io.emit("provider:oncall", {
          providerId: provider._id.toString(),
          status: false,
        });
      }

      return cleared ?? provider;
    } catch (err) {
      console.error("endProviderOnCallBySession error:", err);
      throw err;
    }
  }

  /**
   * Runs retryable work that cannot be part of the MongoDB money transaction
   * (Agora and realtime/provider presence). Pending flags are durable, while a
   * short lease prevents two app instances from doing the same cleanup.
   */
  static async processPostBillingCleanup(
    sessionId: string,
    io?: Server,
  ): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 45_000);
    const session = await CallSession.findOneAndUpdate(
      {
        _id: sessionId,
        billingProcessed: true,
        $or: [
          { recordingCleanupPending: true },
          { providerCleanupPending: true },
        ],
        $and: [
          {
            $or: [
              { cleanupNextAttemptAt: null },
              { cleanupNextAttemptAt: { $lte: now } },
            ],
          },
          {
            $or: [
              { cleanupLeaseUntil: null },
              { cleanupLeaseUntil: { $lte: now } },
            ],
          },
        ],
      },
      { $set: { cleanupLeaseUntil: leaseUntil } },
      { new: true },
    ).exec();

    if (!session) {
      const remaining = await CallSession.exists({
        _id: sessionId,
        $or: [
          { recordingCleanupPending: true },
          { providerCleanupPending: true },
        ],
      });
      return !remaining;
    }

    const errors: string[] = [];

    if (session.recordingCleanupPending) {
      try {
        await this.stopRecording(sessionId);
        await CallSession.updateOne(
          { _id: sessionId, cleanupLeaseUntil: leaseUntil },
          { $set: { recordingCleanupPending: false } },
        );
      } catch (err) {
        errors.push(
          `recording: ${String((err as any)?.message ?? err)}`,
        );
      }
    }

    if (session.providerCleanupPending) {
      try {
        await this.endProviderOnCallBySession(sessionId, io);
        await CallSession.updateOne(
          { _id: sessionId, cleanupLeaseUntil: leaseUntil },
          { $set: { providerCleanupPending: false } },
        );
      } catch (err) {
        errors.push(`provider: ${String((err as any)?.message ?? err)}`);
      }
    }

    if (errors.length === 0) {
      await CallSession.updateOne(
        { _id: sessionId, cleanupLeaseUntil: leaseUntil },
        {
          $set: {
            cleanupAttempts: 0,
            cleanupLastError: null,
            cleanupLeaseUntil: null,
            cleanupNextAttemptAt: null,
          },
        },
      );
      return true;
    }

    const attempts = Number(session.cleanupAttempts ?? 0) + 1;
    const retryDelayMs = Math.min(
      5 * 60_000,
      5_000 * 2 ** Math.min(attempts - 1, 6),
    );
    await CallSession.updateOne(
      { _id: sessionId, cleanupLeaseUntil: leaseUntil },
      {
        $set: {
          cleanupAttempts: attempts,
          cleanupLastError: errors.join("; ").slice(0, 1_000),
          cleanupLeaseUntil: null,
          cleanupNextAttemptAt: new Date(Date.now() + retryDelayMs),
        },
      },
    );
    return false;
  }

  // 👉 Finalize billing for a call session (called from /endCall and worker to clean up)
  static async finalizeBilling(
    sessionId: string,
    io?: Server,
    getSocketUser?: (
      userId: string,
    ) => { userId: string; socketId: string } | undefined,
    disconnectReason?: string,
    effectiveEndedAt?: Date,
  ) {
    const outcome = await this.finalizeBillingInternal(sessionId, {
      disconnectReason,
      // Freeze the requested end time across automatic transaction retries so
      // retry latency can never add billable seconds.
      effectiveEndedAt: effectiveEndedAt ?? new Date(),
      getSocketUser,
      io,
    });

    if (!outcome.claimed && outcome.session?.billingProcessed) {
      logBillingEvent({
        component: "Billing",
        status: "idempotent",
        event: "Billing finalization",
        sessionId,
        result: "Already processed; duplicate charge prevented",
      });
    }

    return outcome.result;
  }

  /**
   * Atomically rechecks worker deadlines and finalizes only if one is still
   * expired. This makes a late heartbeat safe and keeps multi-process workers
   * from emitting duplicate disconnect events.
   */
  static async finalizeDueBilling(
    sessionId: string,
    dueAt: Date,
    io?: Server,
    getSocketUser?: (
      userId: string,
    ) => { userId: string; socketId: string } | undefined,
  ): Promise<DueBillingFinalizationResult> {
    const outcome = await this.finalizeBillingInternal(sessionId, {
      dueAt,
      getSocketUser,
      io,
    });

    return {
      processed: outcome.claimed,
      sessionId,
      channel: outcome.session?.channel,
      reason: outcome.reason as DueDisconnectReason | undefined,
      deadline: outcome.deadline,
      result: outcome.result,
    };
  }

  static async finalizeLegacyProcessingBilling(
    sessionId: string,
    staleBefore: Date,
    effectiveEndedAt: Date,
    io?: Server,
  ): Promise<boolean> {
    const outcome = await this.finalizeBillingInternal(sessionId, {
      disconnectReason: "PROCESSING_RECOVERY",
      effectiveEndedAt,
      legacyProcessingBefore: staleBefore,
      io,
    });
    return outcome.claimed;
  }

  /**
   * The state claim and every money write live in the same MongoDB
   * transaction. A crash therefore commits either all billing state or none
   * of it; no permanent `processing` lock is left behind.
   */
  private static async finalizeBillingInternal(
    sessionId: string,
    options: FinalizeBillingOptions,
  ): Promise<InternalBillingOutcome> {
    const sessionMongoose = await mongoose.startSession();
    let outcome: InternalBillingOutcome | undefined;

    try {
      outcome = await sessionMongoose.withTransaction(
        async (): Promise<InternalBillingOutcome> => {
          const claimFilter: Record<string, any> = {
            _id: sessionId,
            billingProcessed: { $ne: true },
            ...(options.dueAt
              ? buildDueCallFilter(options.dueAt)
              : options.legacyProcessingBefore
                ? {
                  status: "processing",
                  updatedAt: { $lt: options.legacyProcessingBefore },
                }
                : {
                  status: {
                    $in: ["initiated", "ringing", "connected"],
                  },
                }),
          };

          const lockedSession = await CallSession.findOneAndUpdate(
            claimFilter,
            { $set: { status: "processing" } },
            { new: false, session: sessionMongoose },
          ).exec();

          if (!lockedSession) {
            const existingSession = await CallSession.findById(sessionId)
              .session(sessionMongoose)
              .exec();
            return {
              claimed: false,
              result: existingSession,
              session: existingSession,
            };
          }

          const session = await CallSession.findById(sessionId)
            .session(sessionMongoose)
            .exec();
          if (!session) {
            throw new Error(
              `Call session ${sessionId} disappeared after billing claim`,
            );
          }

          const markCleanupPending = () => {
            session.recordingCleanupPending = true;
            session.providerCleanupPending = true;
            session.cleanupAttempts = 0;
            session.cleanupLastError = null;
            session.cleanupLeaseUntil = null;
            session.cleanupNextAttemptAt = new Date();
          };

          const wallClockNow = new Date();
          let effectiveReason = options.disconnectReason;
          let billingEndedAt = options.effectiveEndedAt ?? wallClockNow;
          let deadline: Date | undefined;

          if (options.dueAt) {
            const decision = selectDueDisconnect(
              lockedSession,
              options.dueAt,
            );
            if (!decision) {
              // The claim filter and decision use the same predicate. Throwing
              // here aborts instead of ever committing `processing` alone.
              throw new Error(
                `No expired billing deadline found for claimed session ${sessionId}`,
              );
            }
            deadline = decision.deadline;
            billingEndedAt = decision.deadline;
            effectiveReason = decision.reason;
          }

          if (billingEndedAt.getTime() > wallClockNow.getTime()) {
            billingEndedAt = wallClockNow;
          }

          // If call never connected, finalize it without any wallet movement.
          if (
            ["initiated", "ringing"].includes(lockedSession.status) ||
            (lockedSession.status === "processing" &&
              !lockedSession.startedAt &&
              !lockedSession.connectedAt)
          ) {
            session.status = "missed";
            session.endedAt = billingEndedAt;
            session.totalSeconds = 0;
            session.billingProcessed = true;
            session.disconnectReason =
              effectiveReason || "CALL_ENDED_BEFORE_CONNECT";
            markCleanupPending();
            await session.save({ session: sessionMongoose });

            return {
              claimed: true,
              deadline,
              reason: effectiveReason,
              result: session,
              session,
            };
          }

          const startedAt = session.startedAt ?? billingEndedAt;
          const duration = calculateBillableDuration(
            startedAt,
            billingEndedAt,
            wallClockNow,
            Number(session.billedDuration ?? 0),
          );
          billingEndedAt = duration.endedAt;
          const { totalSeconds, unbilledSeconds } = duration;

          if (totalSeconds < 5) {
            session.status = "failed";
            session.endedAt = billingEndedAt;
            session.totalSeconds = totalSeconds;
            session.billingProcessed = true;
            session.disconnectReason = effectiveReason || "SHORT_CALL";
            markCleanupPending();
            await session.save({ session: sessionMongoose });

            return {
              claimed: true,
              deadline,
              reason: effectiveReason,
              result: {
                sessionId,
                status: "failed",
                totalSeconds,
                reason: "SHORT_CALL",
              },
              session,
            };
          }

          let billingSnapshot = session.billingSnapshot;
          if (!billingSnapshot) {
            // Backward-compatible fallback for calls created before snapshots
            // were introduced. The session's price still remains authoritative.
            const legacyCommissionDoc = await CommissionModel.findOne()
              .session(sessionMongoose)
              .exec();
            billingSnapshot = createBillingSnapshot(
              legacyCommissionDoc,
              session.perMinutePricePaise ?? 600,
            );
            session.billingSnapshot = billingSnapshot;
          }

          const perMinutePricePaise = floorToTwoDigits(
            billingSnapshot.perMinutePricePaise,
          );
          let providerPerMin = 0;
          let adminPerMin = 0;

          if (billingSnapshot.useGlobalCommission) {
            const globalPct =
              (billingSnapshot.globalCommissionPercentage ?? 0) / 100;
            providerPerMin = floorToTwoDigits(
              perMinutePricePaise * (1 - globalPct),
            );
            adminPerMin = floorToTwoDigits(
              perMinutePricePaise * globalPct,
            );
          } else {
            const matchingSlab = billingSnapshot.commissionSlabs.find(
              (slab) =>
                totalSeconds >= slab.minSeconds &&
                totalSeconds < slab.maxSeconds,
            );
            if (!matchingSlab) {
              throw new Error(
                `No commission slab found for totalSeconds=${totalSeconds}`,
              );
            }
            providerPerMin = floorToTwoDigits(
              matchingSlab.providerSharePaise,
            );
            adminPerMin = floorToTwoDigits(matchingSlab.adminSharePaise);
          }

          const userId = (
            session.callerModel === "User" ? session.caller : session.callee
          ) as mongoose.Types.ObjectId;
          const providerId = (
            session.callerModel === "ServiceProvider"
              ? session.caller
              : session.callee
          ) as mongoose.Types.ObjectId;
          const adminId = process.env.ADMIN_USER_ID;
          const adminDoc = adminId
            ? await Admin.findById(adminId).session(sessionMongoose).exec()
            : null;

          const totalPaise = floorToTwoDigits(
            (perMinutePricePaise / 60) * totalSeconds,
          );
          let providerShare = floorToTwoDigits(
            (providerPerMin / 60) * totalSeconds,
          );
          let adminShare = floorToTwoDigits(
            (adminPerMin / 60) * totalSeconds,
          );
          if (providerShare + adminShare > totalPaise) {
            adminShare = floorToTwoDigits(
              Math.max(0, totalPaise - providerShare),
            );
          }

          const unbilledPaise = floorToTwoDigits(
            (perMinutePricePaise / 60) * unbilledSeconds,
          );
          const requestedUnbilledProviderShare = floorToTwoDigits(
            (providerPerMin / 60) * unbilledSeconds,
          );
          let requestedUnbilledAdminShare = floorToTwoDigits(
            (adminPerMin / 60) * unbilledSeconds,
          );
          if (
            requestedUnbilledProviderShare +
            requestedUnbilledAdminShare >
            unbilledPaise
          ) {
            requestedUnbilledAdminShare = floorToTwoDigits(
              Math.max(
                0,
                unbilledPaise - requestedUnbilledProviderShare,
              ),
            );
          }

          let chargedPaise = 0;
          let unbilledProviderShare = 0;
          let unbilledAdminShare = 0;
          let insufficientBalance = false;

          if (unbilledSeconds > 0) {
            let userWallet = await Wallet.findOne({ user: userId })
              .session(sessionMongoose)
              .exec();
            if (!userWallet) {
              userWallet = new Wallet({ user: userId, balance: 0 });
            }

            const availableBalance = Math.max(
              0,
              floorToTwoDigits(Number(userWallet.balance ?? 0)),
            );
            chargedPaise = floorToTwoDigits(
              Math.min(availableBalance, unbilledPaise),
            );
            insufficientBalance = chargedPaise < unbilledPaise;
            const settlementRatio =
              unbilledPaise > 0 ? chargedPaise / unbilledPaise : 0;
            unbilledProviderShare = floorToTwoDigits(
              requestedUnbilledProviderShare * settlementRatio,
            );
            unbilledAdminShare = floorToTwoDigits(
              requestedUnbilledAdminShare * settlementRatio,
            );
            if (
              unbilledProviderShare + unbilledAdminShare >
              chargedPaise
            ) {
              unbilledAdminShare = floorToTwoDigits(
                Math.max(0, chargedPaise - unbilledProviderShare),
              );
            }

            if (chargedPaise > 0) {
              userWallet.balance -= chargedPaise;
              await userWallet.save({ session: sessionMongoose });
              await WalletTransaction.create(
                [
                  {
                    entityId: userId,
                    entityType: "User",
                    amount: -chargedPaise,
                    type: "debit_call_end",
                    status: "success",
                    meta: {
                      sessionId,
                      requestedPaise: unbilledPaise,
                      partialSettlement: insufficientBalance,
                    },
                  },
                ],
                { session: sessionMongoose },
              );
            }

            if (unbilledProviderShare > 0) {
              let providerWallet = await Wallet.findOne({ user: providerId })
                .session(sessionMongoose)
                .exec();
              if (!providerWallet) {
                providerWallet = new Wallet({ user: providerId, balance: 0 });
              }
              providerWallet.balance += unbilledProviderShare;
              await providerWallet.save({ session: sessionMongoose });

              await ServiceProvider.findByIdAndUpdate(
                providerId,
                {
                  $inc: {
                    totalEarnings: unbilledProviderShare,
                    todayEarnings: unbilledProviderShare,
                  },
                },
                { session: sessionMongoose },
              );
              await WalletTransaction.create(
                [
                  {
                    entityId: providerId,
                    entityType: "ServiceProvider",
                    amount: unbilledProviderShare,
                    type: "earning_call_end",
                    status: "success",
                    meta: {
                      sessionId,
                      partialSettlement: insufficientBalance,
                    },
                  },
                ],
                { session: sessionMongoose },
              );
            }

            if (adminDoc && unbilledAdminShare > 0) {
              adminDoc.wallet =
                (adminDoc.wallet ?? 0) + unbilledAdminShare;
              await adminDoc.save({ session: sessionMongoose });
              await WalletTransaction.create(
                [
                  {
                    entityId: adminDoc._id,
                    entityType: "Admin",
                    amount: unbilledAdminShare,
                    type: "admin_commission_end",
                    status: "success",
                    meta: {
                      sessionId,
                      partialSettlement: insufficientBalance,
                    },
                  },
                ],
                { session: sessionMongoose },
              );
            }

            session.billedDuration =
              Number(session.billedDuration ?? 0) + unbilledSeconds;
          }

          const billingInfo = {
            perMinutePricePaise,
            totalSeconds,
            providerPerMin,
            adminPerMin,
            providerShare,
            adminShare,
            totalPaise,
            requestedUnbilledPaise: unbilledPaise,
            uncoveredPaise: floorToTwoDigits(
              Math.max(0, unbilledPaise - chargedPaise),
            ),
            unbilledProviderShare,
            unbilledAdminShare,
            unbilledPaise: chargedPaise,
          };
          const { billing: _legacyBilling, ...existingRecordingMeta } =
            session.recordingMeta || {};
          session.recordingMeta = {
            ...existingRecordingMeta,
            BillingInfo: billingInfo,
            commissionConfig: billingSnapshot,
          };
          session.status = insufficientBalance
            ? "insufficient_balance"
            : "ended";
          session.endedAt = billingEndedAt;
          session.totalSeconds = totalSeconds;
          session.billingProcessed = true;
          if (effectiveReason) {
            session.disconnectReason = effectiveReason;
          } else if (insufficientBalance) {
            session.disconnectReason = "INSUFFICIENT_BALANCE";
          }
          markCleanupPending();
          await session.save({ session: sessionMongoose });

          return {
            claimed: true,
            deadline,
            reason: effectiveReason,
            result: {
              sessionId,
              status: session.status,
              totalSeconds,
              perMinutePricePaise,
              providerPerMin,
              adminPerMin,
              billed: {
                userDebitedPaise: chargedPaise,
                providerCreditedPaise: unbilledProviderShare,
                adminCreditedPaise: unbilledAdminShare,
              },
              totals: {
                userTotalPaise: totalPaise,
                providerTotalPaise: providerShare,
                adminTotalPaise: adminShare,
              },
              uncoveredPaise: floorToTwoDigits(
                Math.max(0, unbilledPaise - chargedPaise),
              ),
            },
            session,
          };
        },
      );
    } catch (err) {
      console.error(
        `[Billing] ❌ Transactional finalization failed for ${sessionId}:`,
        err,
      );
      throw err;
    } finally {
      await sessionMongoose.endSession();
    }

    if (!outcome) {
      throw new Error(
        `Billing transaction completed without an outcome for ${sessionId}`,
      );
    }

    if (outcome.claimed) {
      await CallService.processPostBillingCleanup(
        sessionId,
        options.io,
      ).catch((cleanupError) => {
        console.error(
          `[Billing] Immediate cleanup failed for session ${sessionId}:`,
          cleanupError,
        );
      });

      if (
        options.dueAt &&
        options.io &&
        options.getSocketUser &&
        outcome.session
      ) {
        const participantIds = new Set([
          outcome.session.caller.toString(),
          outcome.session.callee.toString(),
        ]);
        for (const participantId of participantIds) {
          const socketUser = options.getSocketUser(participantId);
          if (socketUser) {
            options.io.to(socketUser.socketId).emit("call_ended", {
              sessionId,
              reason: outcome.reason,
            });
          }
        }
      }

      console.log(
        `[Billing] ✅ Session ${sessionId} finalized transactionally`,
      );
    }

    return outcome;
  }


  // Modify endCall to use finalizeBilling
  static async endCall(
    sessionId: string,
    io?: Server,
    getSocketUser?: (
      userId: string,
    ) => { userId: string; socketId: string } | undefined,
  ) {
    return this.finalizeBilling(sessionId, io, getSocketUser);
  }

  // 💸 Auto-disconnect check
  static async shouldAutoDisconnect(userId: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ user: userId });
    return (wallet?.balance ?? 0) < config.call.lowBalanceThresholdPaise;
  }

  // ⚡ Partial billing logic
  // static async partialBill(session: any, seconds: number) {
  //   const round2 = (n: number) => Math.round(n * 100) / 100;

  //   // 🔹 Fetch commission config
  //   const commissionDoc = await CommissionModel.findOne();
  //   const perMinutePricePaise = commissionDoc?.perMinutePricePaise ?? 600;
  //   const totalPaise = round2((perMinutePricePaise / 60) * seconds);

  //   // Total time so far
  //   const totalSoFar = (session.billedDuration || 0) + seconds;

  //   // 🔹 Find matching slab
  //   const matchingSlab = commissionDoc?.commissionSlabs.find(
  //     (s) => totalSoFar > s.minSeconds && totalSoFar <= s.maxSeconds
  //   );

  //   const providerPerMin = matchingSlab?.providerSharePaise ?? 0;
  //   const adminPerMin = matchingSlab?.adminSharePaise ?? 0;

  //   const providerShare = round2((providerPerMin / 60) * seconds);
  //   const adminShare = round2((adminPerMin / 60) * seconds);

  //   // ---------------- Identify user and provider ----------------
  //   const userId = (session.callerModel === "User"
  //     ? session.caller
  //     : session.callee) as mongoose.Types.ObjectId;

  //   const providerId = (session.callerModel === "ServiceProvider"
  //     ? session.caller
  //     : session.callee) as mongoose.Types.ObjectId;

  //   const provider = await ServiceProvider.findById(providerId).lean();

  //   // ---------------- Debit user wallet ----------------
  //   await Wallet.updateOne({ user: userId }, { $inc: { balance: -totalPaise } });

  //   // ---------------- Credit provider wallet ----------------
  //   if (provider) {
  //     await Wallet.updateOne({ user: providerId }, { $inc: { balance: providerShare } });
  //     await ServiceProvider.findByIdAndUpdate(providerId, {
  //       $inc: { totalEarnings: providerShare, todayEarnings: providerShare },
  //     });
  //   }

  //   // ---------------- Credit admin wallet ----------------
  //   const adminDoc = await Admin.findById("6879f604cfe8425a6b907423"); // replace with real admin ID
  //   if (adminDoc) {
  //     adminDoc.wallet = (adminDoc.wallet ?? 0) + adminShare;
  //     await adminDoc.save();
  //   }

  //   // ---------------- Update billed duration ----------------
  //   await session.updateOne({ $inc: { billedDuration: seconds } });

  //   console.log(
  //     `✅ Auto-billed ${seconds}s (${totalPaise} paise): admin=${adminShare}, provider=${providerShare}`
  //   );
  // }

  // call.service.ts

  static async partialBill(session: any, seconds: number) {
    // Billing is performed ONLY on /end now.
    // No operation here to avoid any chance of duplicate or partial billing.
    return;
  }

  // static async partialBill(session: any, seconds: number) {
  //   const round2 = (n: number) => Math.round(n * 100) / 100;

  //   // 1️⃣ Fetch commission data
  //   const commissionDoc = await CommissionModel.findOne();
  //   if (!commissionDoc) throw new Error("Commission settings not found");

  //   const perMinutePricePaise = commissionDoc.perMinutePricePaise ?? 600;
  //   const totalSoFar = (session.billedDuration || 0) + seconds;

  //   // 2️⃣ Find applicable slab
  //   const matchingSlab = commissionDoc.commissionSlabs.find(
  //     (s) => totalSoFar > s.minSeconds && totalSoFar <= s.maxSeconds
  //   );

  //   const providerPerMin = matchingSlab?.providerSharePaise ?? 0;
  //   const adminPerMin = matchingSlab?.adminSharePaise ?? 0;

  //   // 3️⃣ Calculate shares
  //   const totalPaise = round2((perMinutePricePaise / 60) * seconds);
  //   const providerShare = round2((providerPerMin / 60) * seconds);
  //   const adminShare = round2((adminPerMin / 60) * seconds);

  //   // ---------------- Identify user and provider ----------------
  //   const userId =
  //     session.callerModel === "User"
  //       ? session.caller
  //       : session.callee;

  //   const providerId =
  //     session.callerModel === "ServiceProvider"
  //       ? session.caller
  //       : session.callee;

  //   // ---------------- Debit user's wallet ----------------
  //   await Wallet.updateOne(
  //     { user: userId },
  //     { $inc: { balance: -totalPaise } }
  //   );

  //   // ---------------- Credit provider earnings ----------------
  //   const provider = await ServiceProvider.findById(providerId);
  //   if (provider) {
  //     provider.totalEarnings += providerShare;
  //     provider.todayEarnings += providerShare;
  //     await provider.save();
  //   }

  //   // ---------------- Credit admin wallet ----------------
  //   const adminDoc = await Admin.findOne({ role: "admin" }); // or use fixed ID if you prefer
  //   if (adminDoc) {
  //     adminDoc.wallet = (adminDoc.wallet ?? 0) + adminShare;
  //     await adminDoc.save();
  //   }

  //   // ---------------- Update session duration ----------------
  //   session.billedDuration = totalSoFar;
  //   await session.save();

  //   console.log(
  //     `✅ Auto-billed ${seconds}s (${totalPaise} paise): admin=${adminShare}, provider=${providerShare}`
  //   );
  // }
}
