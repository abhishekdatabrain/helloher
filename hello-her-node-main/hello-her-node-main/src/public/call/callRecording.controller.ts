import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { AgoraRecordingService } from "../../services/agoraRecording.service";
import { CallSession } from "../../modals/callSession.model";
import CommissionModel from "../../modals/commission.model";
import { config } from "../../config/config";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";

interface CustomRequest extends Request {
  user?: any;
}

export class CallRecordingController {
  // 🎬 Start recording
  static async start(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      console.log("[CallRecording.start] Request body:", { sessionId });

      if (!sessionId) throw new ApiError(400, "sessionId required");

      const callSession = await CallSession.findById(sessionId);
      if (!callSession) throw new ApiError(404, "CallSession not found");

      // Prevent "task conflict" if the recording has already been started for this session
      if (callSession.recordingSid && callSession.recordingResourceId) {
        return res.status(200).json(new ApiResponse(200, {
          resourceId: callSession.recordingResourceId,
          sid: callSession.recordingSid,
          alreadyStarted: true
        }, "Recording already started for this session"));
      }

      // Acquire resourceId if not exists
      if (!callSession.recordingResourceId) {
        try {
          const data = await AgoraRecordingService.acquireResource(callSession.channel, "123456");
          callSession.recordingResourceId = data.resourceId;
          await callSession.save();
        } catch (error: any) {
          throw new ApiError(error.response?.status || 500, error.response?.data?.reason || "Acquire recording resource failed");
        }
      }

      // Generate token if using App Certificate
      let token: string | undefined;
      if (config.agora.appCertificate) {
        const expireTime = Math.floor(Date.now() / 1000) + 3600 * 24; // 24 hours
        token = RtcTokenBuilder.buildTokenWithUid(
          config.agora.appId,
          config.agora.appCertificate,
          callSession.channel,
          123456, // Must match the UID we send
          RtcRole.SUBSCRIBER, // Bot is a subscriber
          expireTime
        );
      }

      let startData;
      try {
        startData = await AgoraRecordingService.startRecording(
          callSession.channel,
          "123456",
          callSession.recordingResourceId as string,
          token || ""
        );
      } catch (error: any) {
        // Specific handling for task conflict
        if (error.response?.status === 400 && error.response?.data?.reason?.toLowerCase().includes("task conflict")) {
          throw new ApiError(400, "Recording is already running for this channel. Wait a moment or ensure previous recordings are stopped.");
        }
        throw new ApiError(error.response?.status || 500, error.response?.data?.reason || "Start recording failed");
      }

      callSession.recordingSid = startData.sid;
      await callSession.save();

      return res.status(200).json(new ApiResponse(200, startData, "Recording started successfully"));
    } catch (err) {
      console.error("[CallRecording.start] Error:", err);
      next(err);
    }
  }

  // 🛑 Stop recording
  static async stop(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      console.log("[CallRecording.stop] Request body:", { sessionId });

      if (!sessionId) throw new ApiError(400, "sessionId required");

      const callSession = await CallSession.findById(sessionId);
      if (!callSession) throw new ApiError(404, "CallSession not found");

      if (!callSession.recordingResourceId || !callSession.recordingSid) {
        throw new ApiError(400, "Recording hasn't started yet");
      }

      let stopData;
      try {
        stopData = await AgoraRecordingService.stopRecording(callSession.channel, "123456", callSession.recordingResourceId, callSession.recordingSid);
      } catch (error: any) {
        throw new ApiError(error.response?.status || 500, error.response?.data?.reason || "Stop recording failed");
      }

      const s3Host = config.s3.baseUrl || "https://miniios3.aaademosites.com";
      const bucket = config.s3.bucket; // e.g., "billiyo"
      // Must mirror fileNamePrefix in agoraRecording.service.ts
      const prefixPath = "billiyo/callrecordings";

      const finalUrls: string[] = [];

      const pushUrl = (fileName: string | undefined | null) => {
        if (!fileName) return;
        const raw = fileName.split("/").pop();
        if (!raw) return;
        finalUrls.push(`${s3Host}/${bucket}/${prefixPath}/${raw}`);
      };

      const fileList = stopData?.serverResponse?.fileList;
      if (fileList) {
        if (typeof fileList === "string") {
          // fileList might already be a file name OR a JSON string array/object
          try {
            const parsed = JSON.parse(fileList);
            if (Array.isArray(parsed)) {
              parsed.forEach((f: any) => pushUrl(f?.fileName || f));
            } else if (parsed?.fileName) {
              pushUrl(parsed.fileName);
            } else {
              pushUrl(String(fileList));
            }
          } catch {
            pushUrl(fileList);
          }
        } else if (Array.isArray(fileList)) {
          fileList.forEach((f: any) => pushUrl(f?.fileName || f));
        } else if (typeof fileList === "object") {
          pushUrl((fileList as any).fileName);
        }
      }

      if (finalUrls.length === 0) {
        console.warn("⚠️ [CallRecording.stop] Agora returned empty or invalid fileList! No media was uploaded to S3.", {
          serverResponse: stopData?.serverResponse,
        });
      }

      // Store recording URL(s) and raw stop response for debugging
      const { billing, ...existingMetaWithoutBilling } = callSession.recordingMeta || {};
      const commissionConfig = existingMetaWithoutBilling.commissionConfig ?? (await CommissionModel.findOne()?.lean().exec());
      const existingBillingInfo = existingMetaWithoutBilling.BillingInfo;

      const normalizeMoney = (value: number) => Math.floor(value * 100) / 100;
      const effectiveStart = callSession.startedAt ?? callSession.connectedAt;
      const effectiveEnd = callSession.endedAt ?? new Date();
      const computedSeconds = effectiveStart ? Math.max(0, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 1000)) : 0;
      const rawTotalSeconds = Number(callSession.totalSeconds ?? callSession.billedDuration ?? computedSeconds);
      const totalSeconds = rawTotalSeconds > 0 ? rawTotalSeconds : computedSeconds;
      const perMinutePricePaise = callSession.perMinutePricePaise ?? commissionConfig?.perMinutePricePaise ?? 600;
      const matchingSlab = (commissionConfig?.commissionSlabs || []).find(
        (s: any) => totalSeconds > s.minSeconds && totalSeconds <= s.maxSeconds
      ) || {
        providerSharePaise: normalizeMoney(perMinutePricePaise * 0.7),
        adminSharePaise: normalizeMoney(perMinutePricePaise * 0.3),
      };

      const providerPerMin = normalizeMoney(matchingSlab.providerSharePaise);
      const adminPerMin = normalizeMoney(matchingSlab.adminSharePaise);
      const providerShare = normalizeMoney((providerPerMin / 60) * totalSeconds);
      const adminShare = normalizeMoney((adminPerMin / 60) * totalSeconds);
      const totalPaise = normalizeMoney((perMinutePricePaise / 60) * totalSeconds);
      const shouldUseExistingBilling = existingBillingInfo && existingBillingInfo.totalSeconds > 0 && existingBillingInfo.providerShare > 0 && existingBillingInfo.adminShare > 0;

      const billingInfo = shouldUseExistingBilling ? existingBillingInfo : {
        perMinutePricePaise,
        totalSeconds,
        providerPerMin,
        adminPerMin,
        providerShare,
        adminShare,
        totalPaise,
        unbilledProviderShare: 0,
        unbilledAdminShare: 0,
        unbilledPaise: 0,
      };

      callSession.recordingUrl = finalUrls;
      callSession.recordingMeta = {
        ...existingMetaWithoutBilling,
        stopResponse: stopData?.serverResponse || null,
        commissionConfig: existingMetaWithoutBilling.commissionConfig ?? commissionConfig?.toObject?.() ?? commissionConfig,
        BillingInfo: billingInfo,
      };
      await callSession.save();

      return res.status(200).json(new ApiResponse(200, stopData, "Recording stopped and uploaded"));
    } catch (err) {
      console.error("[CallRecording.stop] Error:", err);
      next(err);
    }
  }

  // 📁 Get all recordings
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, providerId } = req.query;
      const query: any = {};
      if (userId) query.caller = userId;
      if (providerId) query.callee = providerId;

      const recordings = await CallSession.find(query).sort({ createdAt: -1 });
      return res.status(200).json(new ApiResponse(200, recordings, "Recordings fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // 📄 Get recording by sessionId
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) throw new ApiError(400, "sessionId required");

      const recording = await CallSession.findById(sessionId);
      return res.status(200).json(new ApiResponse(200, recording, "Recording fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // 🗑 Delete recording
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) throw new ApiError(400, "sessionId required");

      await CallSession.findByIdAndUpdate(sessionId, {
        $set: { recordingUrl: null, recordingMeta: {} },
      });
      return res.status(200).json(new ApiResponse(200, null, "Recording deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
