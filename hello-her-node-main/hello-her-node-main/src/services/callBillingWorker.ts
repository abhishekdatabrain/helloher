import { Server } from "socket.io";
import { CallSession } from "../modals/callSession.model";
import { logBillingEvent } from "../utils/billingLogger";
import {
  buildDueCallFilter,
  createNonOverlappingRunner,
  enforceUniqueDueSessions,
} from "./callBillingWorker.core";
import { CallService } from "./call.service";
import { createAndEmitNotification } from "./notificationHelper.service";

const CHECK_INTERVAL_SEC = 15;
const PROCESSING_RECOVERY_MS = 30_000;

let workerStarted = false;

type SocketLookup = (
  userId: string,
) => { userId: string; socketId: string } | undefined;

type SessionRef = {
  _id: any;
  autoEndAt?: Date | null;
  billingProcessed?: boolean;
  callee: any;
  calleeModel: "User" | "ServiceProvider";
  caller: any;
  callerModel: "User" | "ServiceProvider";
  channel: string;
  startedAt?: Date | null;
  updatedAt?: Date;
};

/**
 * Repairs only locks created by the older, pre-transaction implementation.
 * New billing claims never commit `processing` as an intermediate state.
 */
async function recoverLegacyProcessingSessions(now: Date): Promise<void> {
  const staleBefore = new Date(now.getTime() - PROCESSING_RECOVERY_MS);
  const processingStuck = await CallSession.find({
    status: "processing",
    updatedAt: { $lt: staleBefore },
    billingProcessed: { $ne: true },
  })
    .select("_id channel billingProcessed startedAt updatedAt")
    .lean<SessionRef[]>();

  for (const session of processingStuck) {
    try {
      await CallService.finalizeLegacyProcessingBilling(
        session._id.toString(),
        staleBefore,
        session.updatedAt ?? now,
      );
    } catch (err) {
      console.error(
        `[BillingWorker] Recovery failed for processing session ${session._id}:`,
        err,
      );
    }
  }
}

/**
 * Heartbeat and wallet deadlines share one path so a session can be ended only
 * once per cycle. finalizeDueBilling rechecks the deadline transactionally;
 * only the cross-process winner returns processed=true and emits a warning.
 */
async function enforceDueSessions(
  now: Date,
  io?: Server,
  getSocketUser?: SocketLookup,
): Promise<void> {
  const dueSessions = await CallSession.find(buildDueCallFilter(now))
    .select("_id")
    .lean<Array<{ _id: any }>>();

  await enforceUniqueDueSessions(
    dueSessions.map((session) => ({ sessionId: session._id.toString() })),
    async (sessionId) => {
      try {
        return await CallService.finalizeDueBilling(
          sessionId,
          now,
          io,
          getSocketUser,
        );
      } catch (err) {
        console.error(
          `[BillingWorker] Failed to finalize due session ${sessionId}:`,
          err,
        );
        return { processed: false };
      }
    },
    (sessionId, finalization) => {
      logBillingEvent({
        component: "BillingWorker",
        status: "warning",
        event:
          finalization.reason === "TIMEOUT"
            ? "Heartbeat timeout"
            : "Automatic disconnect",
        sessionId,
        channel: finalization.channel,
        reason: finalization.reason,
      });
    },
  );
}

async function warnLowBalance(
  now: Date,
  io?: Server,
  getSocketUser?: SocketLookup,
): Promise<void> {
  const warningSessions = await CallSession.find({
    status: "connected",
    billingProcessed: { $ne: true },
    lowBalanceWarnAt: { $lte: now },
    lowBalanceNotified: { $ne: true },
    autoEndAt: { $gt: now },
  })
    .select(
      "_id channel caller callerModel callee calleeModel autoEndAt lowBalanceNotified",
    )
    .lean<SessionRef[]>();

  for (const session of warningSessions) {
    try {
      const billedUserId =
        session.callerModel === "User" ? session.caller : session.callee;
      const remainingSeconds = session.autoEndAt
        ? Math.max(
            0,
            Math.ceil(
              (session.autoEndAt.getTime() - now.getTime()) / 1000,
            ),
          )
        : null;

      // The unique notification key is the durable cross-process claim. If a
      // worker crashes before setting the session flag, the next cycle safely
      // finds the existing notification instead of sending another push.
      await createAndEmitNotification({
        recipientId: billedUserId.toString(),
        recipientType: "user",
        type: "low_balance_call",
        title: "Low Balance Warning",
        message: "Your wallet balance is low. Call may disconnect soon.",
        notificationKey: `low_balance_call:${session._id.toString()}`,
        io,
        getSocketUser,
        metadata: {
          sessionId: session._id.toString(),
          channel: session.channel,
          remainingSeconds,
        },
      });

      await CallSession.updateOne(
        {
          _id: session._id,
          status: "connected",
          billingProcessed: { $ne: true },
        },
        { $set: { lowBalanceNotified: true } },
      );
    } catch (err) {
      console.error(
        `[BillingWorker] Failed to send low balance notification for session ${session._id}:`,
        err,
      );
    }
  }
}

async function retryPendingCleanup(now: Date, io?: Server): Promise<void> {
  const pendingSessions = await CallSession.find({
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
  })
    .select("_id")
    .sort({ cleanupNextAttemptAt: 1, updatedAt: 1 })
    .limit(25)
    .lean<Array<{ _id: any }>>();

  await Promise.allSettled(
    pendingSessions.map((session) =>
      CallService.processPostBillingCleanup(
        session._id.toString(),
        io,
      ),
    ),
  );
}

const createBillingCycle = (io?: Server, getSocketUser?: SocketLookup) =>
  createNonOverlappingRunner(async () => {
    const now = new Date();

    // Ordering is intentional: terminal work wins over a low-balance warning.
    await recoverLegacyProcessingSessions(now);
    await enforceDueSessions(now, io, getSocketUser);
    await retryPendingCleanup(now, io);
    await warnLowBalance(now, io, getSocketUser);
  });

export function startCallBillingWorker(
  io?: Server,
  getSocketUser?: SocketLookup,
): void {
  if (workerStarted) {
    console.log("[BillingWorker] Already running, skipping duplicate start");
    return;
  }

  workerStarted = true;
  const runBillingCycle = createBillingCycle(io, getSocketUser);

  console.log(
    "[BillingWorker] Running recovery, heartbeat, and balance enforcement loop",
  );

  const tick = async () => {
    try {
      await runBillingCycle();
    } catch (err) {
      console.error("[BillingWorker] Tick failed:", err);
    } finally {
      setTimeout(tick, CHECK_INTERVAL_SEC * 1000);
    }
  };

  setTimeout(tick, CHECK_INTERVAL_SEC * 1000);
}
