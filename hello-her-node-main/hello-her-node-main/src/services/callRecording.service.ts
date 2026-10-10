import { AgoraRecordingService } from "./agoraRecording.service";
import { CallSession } from "../modals/callSession.model";
import ApiError from "../utils/ApiError";
import { config } from "../config/config";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";

export class CallRecordingService {
  // 🎬 Start recording
  static async startRecording(sessionId: string) {
    console.log("[CallRecordingService.startRecording] Starting for sessionId:", sessionId);
    console.log("[CallRecordingService.startRecording] Agora config:", {
      appId: config.agora.appId,
      customerId: config.agora.customerId ? "[SET]" : "[MISSING]",
    });

    const callSession = await CallSession.findById(sessionId);
    if (!callSession) throw new Error("CallSession not found");
    console.log("[CallRecordingService.startRecording] CallSession found:", { channel: callSession.channel, recordingResourceId: callSession.recordingResourceId });

    // Prevent "task conflict" if the recording has already been started for this session
    if (callSession.recordingSid && callSession.recordingResourceId) {
      console.log("[CallRecordingService.startRecording] Recording already started for this session. Returning existing sid:", callSession.recordingSid);
      return {
        resourceId: callSession.recordingResourceId,
        sid: callSession.recordingSid,
        alreadyStarted: true
      };
    }

    // Acquire resourceId if not exists
    if (!callSession.recordingResourceId) {
      console.log("[CallRecordingService.startRecording] Acquiring resourceId");
      try {
        const data = await AgoraRecordingService.acquireResource(callSession.channel, "123456");
        callSession.recordingResourceId = data.resourceId;
        await callSession.save();
        console.log("[CallRecordingService.startRecording] ResourceId acquired:", callSession.recordingResourceId);
      } catch (error: any) {
        console.error("[CallRecordingService.startRecording] Acquire error", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new ApiError(error.response?.status || 500, error.response?.data?.reason || "Acquire recording resource failed");
      }
    } else {
      console.log("[CallRecordingService.startRecording] Using existing resourceId:", callSession.recordingResourceId);
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
      console.error("[CallRecordingService.startRecording] Start error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Specific handling for task conflict (Agora returns 400 when start is called twice on same channel/uid)
      if (error.response?.status === 400 && error.response?.data?.reason?.toLowerCase().includes("task conflict")) {
        throw new ApiError(400, "Recording is already running for this channel. Wait a moment or ensure previous recordings are stopped.");
      }

      throw new ApiError(error.response?.status || 500, error.response?.data?.reason || "Start recording failed");
    }

    callSession.recordingSid = startData.sid;
    await callSession.save();
    console.log("[CallRecordingService.startRecording] Recording started successfully, sid:", startData.sid);

    return startData;
  }

  // 🛑 Stop recording
  static async stopRecording(sessionId: string) {
    console.log("[CallRecordingService.stopRecording] Stopping for sessionId:", sessionId);
    const callSession = await CallSession.findById(sessionId);
    if (!callSession) throw new Error("CallSession not found");
    console.log("[CallRecordingService.stopRecording] CallSession found:", { recordingResourceId: callSession.recordingResourceId, recordingSid: callSession.recordingSid });

    if (!callSession.recordingResourceId || !callSession.recordingSid) {
      throw new ApiError(400, "Recording hasn't started yet");
    }

    let stopData;
    try {
      stopData = await AgoraRecordingService.stopRecording(callSession.channel, "123456", callSession.recordingResourceId, callSession.recordingSid);
    } catch (error: any) {
      console.error("[CallRecordingService.stopRecording] Stop error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new ApiError(error.response?.status || 500, error.response?.data?.reason || "Stop recording failed");
    }

    // Ensure full visibility into Agora response
    console.log("[CallRecordingService.stopRecording] Raw Agora Stop Response:", JSON.stringify(stopData, null, 2));

    // Convert fileName to full S3 URL
    const s3BaseUrl = config.s3.baseUrl?.replace(/\/+$/, "") || `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com`;
    let finalUrls: string[] = [];

    const fileList = stopData?.serverResponse?.fileList;
    if (fileList) {
      // In Mix mode (mode/mix), fileList is usually a STRING representing the path to the M3U8/MP4 file
      if (typeof fileList === "string") {
        finalUrls.push(`${s3BaseUrl}/${fileList}`);
      }
      // In Individual mode (mode/individual), fileList is an ARRAY of objects
      else if (Array.isArray(fileList) && fileList.length > 0) {
        finalUrls = fileList.map((f: any) => `${s3BaseUrl}/${f.fileName}`);
      }
    }

    if (finalUrls.length === 0) {
      console.warn("⚠️ [CallRecordingService.stopRecording] Agora returned empty or invalid fileList! No media was uploaded to S3.");
    }

    const { billing, ...existingMetaWithoutBilling } = callSession.recordingMeta || {};

    // Store recording URL(s) and preserve existing billing metadata
    callSession.recordingUrl = finalUrls;
    callSession.recordingMeta = {
      ...existingMetaWithoutBilling,
      BillingInfo: existingMetaWithoutBilling.BillingInfo,
    };
    await callSession.save();
    console.log("[CallRecordingService.stopRecording] Recording stopped successfully, recordingUrls:", callSession.recordingUrl);

    return stopData;
  }

  static async getAllRecordings(filter: { userId?: string; providerId?: string }) {
    const query: any = {};
    if (filter.userId) query.caller = filter.userId;
    if (filter.providerId) query.callee = filter.providerId;
    return CallSession.find(query).sort({ createdAt: -1 });
  }

  static async getRecordingById(sessionId: string) {
    return CallSession.findById(sessionId);
  }

  static async deleteRecording(sessionId: string) {
    await CallSession.findByIdAndUpdate(sessionId, {
      $set: { recordingUrl: null, recordingMeta: {} },
    });
  }
}
