import mongoose, { Document, Schema } from "mongoose";

export type CallStatus =
  | "initiated"
  | "ringing"
  | "connected"
  | "processing"
  | "ended"
  | "failed"
  | "missed"
  | "insufficient_balance"
  | "debit_call_auto"
  | "earning_call_auto";

export type CallRecordingState =
  | "idle"
  | "starting"
  | "active"
  | "stopping"
  | "stopped"
  | "failed";

export interface ICallBillingSnapshot {
  capturedAt: Date;
  commissionSlabs: Array<{
    minSeconds: number;
    maxSeconds: number;
    providerSharePaise: number;
    adminSharePaise: number;
  }>;
  globalCommissionPercentage: number;
  perMinutePricePaise: number;
  useGlobalCommission: boolean;
}

export interface ICallSession extends Document {
  channel: string; // Agora channel name
  caller: mongoose.Types.ObjectId;
  callerModel: "User" | "ServiceProvider";
  callee: mongoose.Types.ObjectId;
  calleeModel: "User" | "ServiceProvider";
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  lastHeartbeat?: Date;
  billingProcessed?: boolean;
  disconnectReason?: string;
  lowBalanceNotified?: boolean;
  lastBilledAt: Date,
  billedDuration: Number, // in seconds
  totalSeconds?: number;
  perMinutePricePaise: number; // billing rate in paise
  billingSnapshot?: ICallBillingSnapshot;
  maxAllowedSeconds?: number;
  heartbeatExpiresAt?: Date;
  lowBalanceWarnAt?: Date;
  autoEndAt?: Date;
  recordingUrl?: string[] | null;
  recordingMeta?: Record<string, any>;
  uid?: string;
  recordingResourceId?: string;  // Resource ID returned by Agora
  recordingSid?: string;         // Recording SID returned by Agora
  isRecording?: boolean;
  recordingState?: CallRecordingState;
  recordingStateUpdatedAt?: Date;
  recordingCleanupPending?: boolean;
  providerCleanupPending?: boolean;
  cleanupAttempts?: number;
  cleanupNextAttemptAt?: Date | null;
  cleanupLeaseUntil?: Date | null;
  cleanupLastError?: string | null;
  connectedAt?: Date;
  disconnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callSessionSchema = new Schema<ICallSession>(
  {
    channel: {
      type: String,
      required: true,
      index: true
    },
    caller: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "callerModel",
    },
    callerModel: {
      type: String,
      required: true,
      enum: ["User", "ServiceProvider"],
    },
    callee: {
      type: Schema.Types.ObjectId,
      refPath: "calleeModel",
      required: true
    },
    calleeModel: {
      type: String,
      required: true,
      enum: ["User", "ServiceProvider"],
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "ringing",
        "connected",
        "processing",
        "ended",
        "failed",
        "missed",
        "insufficient_balance",
        "debit_call_auto",
        "earning_call_auto",
      ],
      default: "initiated",
      index: true,
    },
    lastHeartbeat: { type: Date, default: null, index: true },
    billingProcessed: { type: Boolean, default: false },
    disconnectReason: { type: String, default: null },
    lowBalanceNotified: { type: Boolean, default: false },
    lastBilledAt: { type: Date, default: null },
    billedDuration: { type: Number, default: 0 }, // in seconds
    startedAt: Date,
    endedAt: Date,
    totalSeconds: {
      type: Number,
      default: 0
    },
    maxAllowedSeconds: {
      type: Number,
      default: 0
    },
    heartbeatExpiresAt: { type: Date, default: null, index: true },
    lowBalanceWarnAt: { type: Date, default: null, index: true },
    autoEndAt: { type: Date, default: null, index: true },
    perMinutePricePaise: {
      type: Number,
      required: false,
      min: 0
    },
    billingSnapshot: {
      type: new Schema(
        {
          capturedAt: { type: Date, required: true },
          commissionSlabs: [
            {
              _id: false,
              minSeconds: { type: Number, required: true },
              maxSeconds: { type: Number, required: true },
              providerSharePaise: { type: Number, required: true },
              adminSharePaise: { type: Number, required: true },
            },
          ],
          globalCommissionPercentage: { type: Number, required: true },
          perMinutePricePaise: { type: Number, required: true },
          useGlobalCommission: { type: Boolean, required: true },
        },
        { _id: false },
      ),
      default: undefined,
    },
    recordingUrl: {
      type: [String],
      default: []
    },
    recordingMeta: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isRecording: {
      type: Boolean,
      default: false,
      index: true,
    },
    recordingState: {
      type: String,
      enum: ["idle", "starting", "active", "stopping", "stopped", "failed"],
      default: "idle",
      index: true,
    },
    recordingStateUpdatedAt: { type: Date, default: null },
    recordingCleanupPending: { type: Boolean, default: false, index: true },
    providerCleanupPending: { type: Boolean, default: false, index: true },
    cleanupAttempts: { type: Number, default: 0 },
    cleanupNextAttemptAt: { type: Date, default: null, index: true },
    cleanupLeaseUntil: { type: Date, default: null },
    cleanupLastError: { type: String, default: null },
    uid: String,
    recordingResourceId: String,
    recordingSid: String,
    connectedAt: Date,
    disconnectedAt: Date,
  },
  { timestamps: true }
);

callSessionSchema.index({ status: 1, heartbeatExpiresAt: 1 });
callSessionSchema.index({ status: 1, lowBalanceWarnAt: 1 });
callSessionSchema.index({ status: 1, autoEndAt: 1 });
callSessionSchema.index({ status: 1, updatedAt: 1, billingProcessed: 1 });
callSessionSchema.index({
  status: 1,
  billingProcessed: 1,
  heartbeatExpiresAt: 1,
});
callSessionSchema.index({
  billingProcessed: 1,
  recordingCleanupPending: 1,
  providerCleanupPending: 1,
  cleanupNextAttemptAt: 1,
});
callSessionSchema.index({
  status: 1,
  billingProcessed: 1,
  autoEndAt: 1,
});
callSessionSchema.index({
  status: 1,
  billingProcessed: 1,
  lowBalanceNotified: 1,
  lowBalanceWarnAt: 1,
});

export const CallSession = mongoose.model<ICallSession>(
  "CallSession",
  callSessionSchema
);
