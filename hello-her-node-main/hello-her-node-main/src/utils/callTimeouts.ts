import { Server } from "socket.io";
import { CallSession } from "../modals/callSession.model";

export const AUTO_MISS_MS = 60 * 1000;

const sessionTimeouts = new Map<string, NodeJS.Timeout>();

export const clearAutoMissTimeout = (sessionId: string) => {
  const existing = sessionTimeouts.get(sessionId);
  if (existing) {
    clearTimeout(existing);
    sessionTimeouts.delete(sessionId);
  }
};

/**
 * Schedule an auto-miss timeout for a call session.
 * Cancels any existing timeout for the same session.
 */
export const scheduleAutoMissTimeout = async ({
  sessionId,
  io,
  getUser,
}: {
  sessionId: string;
  io: Server;
  getUser: (userId: string) => { userId: string; socketId: string } | undefined;
}) => {
  clearAutoMissTimeout(sessionId);

  const timeoutId = setTimeout(async () => {
    try {
      // Atomic state transition: a concurrent accept can no longer be
      // overwritten by a stale document save from this timeout callback.
      const session = await CallSession.findOneAndUpdate(
        {
          _id: sessionId,
          status: { $in: ["initiated", "ringing"] },
          billingProcessed: { $ne: true },
        },
        {
          $set: {
            status: "missed",
            endedAt: new Date(),
            totalSeconds: 0,
            billingProcessed: true,
            disconnectReason: "CALL_MISSED",
            recordingCleanupPending: true,
            providerCleanupPending: true,
            cleanupAttempts: 0,
            cleanupLastError: null,
            cleanupLeaseUntil: null,
            cleanupNextAttemptAt: new Date(),
          },
        },
        { new: true },
      ).exec();
      if (!session) return;

      const callerSocket = getUser(session.caller.toString());
      const calleeSocket = getUser(session.callee.toString());

      if (callerSocket) {
        io.to(callerSocket.socketId).emit("call_missed", { sessionId });
        io.to(callerSocket.socketId).emit("call_ended", {
          sessionId,
          reason: "missed",
        });
      }
      if (calleeSocket) {
        io.to(calleeSocket.socketId).emit("call_missed", { sessionId });
        io.to(calleeSocket.socketId).emit("call_ended", {
          sessionId,
          reason: "missed",
        });
      }

      console.log("[CALL] Auto-ended (missed)", sessionId);
    } catch (err) {
      console.error("Auto-end call error:", err);
    } finally {
      clearAutoMissTimeout(sessionId);
    }
  }, AUTO_MISS_MS);

  sessionTimeouts.set(sessionId, timeoutId);
};
