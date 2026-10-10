export type DueDisconnectReason = "TIMEOUT" | "INSUFFICIENT_BALANCE";

export interface DueCallSession {
  heartbeatExpiresAt?: Date | null;
  autoEndAt?: Date | null;
}

export interface DueDisconnectDecision {
  deadline: Date;
  reason: DueDisconnectReason;
}

export interface BillableDuration {
  endedAt: Date;
  totalSeconds: number;
  unbilledSeconds: number;
}

export interface DueSessionCandidate {
  sessionId: string;
}

export interface DueSessionFinalization {
  channel?: string;
  processed: boolean;
  reason?: DueDisconnectReason;
}

/**
 * Selects one deterministic end reason when more than one call deadline has
 * expired. The earliest deadline wins; an exact tie favors the wallet limit.
 */
export const selectDueDisconnect = (
  session: DueCallSession,
  dueAt: Date,
): DueDisconnectDecision | null => {
  const candidates: DueDisconnectDecision[] = [];

  if (
    session.heartbeatExpiresAt instanceof Date &&
    session.heartbeatExpiresAt.getTime() <= dueAt.getTime()
  ) {
    candidates.push({
      deadline: session.heartbeatExpiresAt,
      reason: "TIMEOUT",
    });
  }

  if (
    session.autoEndAt instanceof Date &&
    session.autoEndAt.getTime() <= dueAt.getTime()
  ) {
    candidates.push({
      deadline: session.autoEndAt,
      reason: "INSUFFICIENT_BALANCE",
    });
  }

  candidates.sort((left, right) => {
    const byDeadline = left.deadline.getTime() - right.deadline.getTime();
    if (byDeadline !== 0) return byDeadline;
    if (left.reason === right.reason) return 0;
    return left.reason === "INSUFFICIENT_BALANCE" ? -1 : 1;
  });

  return candidates[0] ?? null;
};

/** Shared by the worker scan and the transactional claim. */
export const buildDueCallFilter = (dueAt: Date): Record<string, unknown> => ({
  status: "connected",
  billingProcessed: { $ne: true },
  $or: [
    { heartbeatExpiresAt: { $lte: dueAt } },
    { autoEndAt: { $lte: dueAt } },
  ],
});

/**
 * Freezes billing at the requested end instant and clamps corrupt/legacy
 * durations so a delayed worker tick cannot overbill a call.
 */
export const calculateBillableDuration = (
  startedAt: Date,
  requestedEndedAt: Date,
  wallClockNow: Date,
  billedDuration: number,
): BillableDuration => {
  const endedAt = new Date(
    Math.max(
      startedAt.getTime(),
      Math.min(requestedEndedAt.getTime(), wallClockNow.getTime()),
    ),
  );
  const totalSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
  );

  return {
    endedAt,
    totalSeconds,
    unbilledSeconds: Math.max(0, totalSeconds - billedDuration),
  };
};

/**
 * De-duplicates scan results and reports only the MongoDB claim winner. This
 * keeps terminal warnings single-shot even with overlapping app instances.
 */
export const enforceUniqueDueSessions = async (
  candidates: DueSessionCandidate[],
  finalize: (
    sessionId: string,
  ) => Promise<DueSessionFinalization>,
  onProcessed: (
    sessionId: string,
    finalization: DueSessionFinalization,
  ) => void,
): Promise<void> => {
  const sessionIds = new Set(
    candidates.map((candidate) => candidate.sessionId),
  );

  for (const sessionId of sessionIds) {
    const finalization = await finalize(sessionId);
    if (finalization.processed && finalization.reason) {
      onProcessed(sessionId, finalization);
    }
  }
};

/** Prevents overlapping cycles within one Node.js process. */
export const createNonOverlappingRunner = (
  task: () => Promise<void>,
): (() => Promise<boolean>) => {
  let running = false;

  return async () => {
    if (running) return false;

    running = true;
    try {
      await task();
      return true;
    } finally {
      running = false;
    }
  };
};
