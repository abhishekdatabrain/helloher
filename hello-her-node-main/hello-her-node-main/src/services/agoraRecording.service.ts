import axios from "axios";
import { config } from "../config/config";

const AGORA_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Maps standard AWS S3 region strings to Agora Cloud Recording numeric region codes.
 * Fallback to 0 (US_EAST_1) if region is omitted or unknown.
 */
export function getAgoraRegionCode(region: string): number {
  if (!region) return 0;
  const regionMap: Record<string, number> = {
    "us-east-1": 0,
    "us-east-2": 1,
    "us-west-1": 2,
    "us-west-2": 3,
    "eu-west-1": 4,
    "eu-west-2": 5,
    "eu-west-3": 6,
    "eu-central-1": 7,
    "ap-southeast-1": 8,
    "ap-southeast-2": 9,
    "ap-northeast-1": 10,
    "ap-northeast-2": 11,
    "sa-east-1": 12,
    "ca-central-1": 13,
    "ap-south-1": 14,
    "cn-north-1": 15,
    "cn-northwest-1": 16,
    "us-gov-west-1": 17,
  };
  return regionMap[region.toLowerCase()] ?? 0;
}

export class AgoraRecordingService {
  static base() {
    return `${config.agora.cloudRecordingBase}`;
  }

  static getAuthHeader() {
    const auth = Buffer.from(
      `${config.agora.customerId}:${config.agora.customerCertificate}`
    ).toString("base64");
    return { Authorization: `Basic ${auth}` };
  }

  // Acquire resourceId
  static async acquireResource(channel: string, uid: string) {
    const url = `${this.base()}/acquire`;
    const { data } = await axios.post(
      url,
      { cname: channel, uid, clientRequest: { resourceExpiredHour: 24 } },
      {
        headers: { ...this.getAuthHeader(), "Content-Type": "application/json" },
        timeout: AGORA_REQUEST_TIMEOUT_MS,
      }
    );
    return data;
  }

  // Start recording
  static async startRecording(channel: string, uid: string, resourceId: string, token: string | undefined) {
    const url = `${this.base()}/resourceid/${resourceId}/mode/mix/start`;

    const awsRegion = config.s3.recordingRegion || config.s3.region || "us-east-1"; const regionCode = getAgoraRegionCode(awsRegion);

    const clientRequest: any = {
      recordingConfig: {
        maxIdleTime: 60,
        streamTypes: 0, // 2 = Audio & Video
        channelType: 1,
        audioProfile: 1,
        // transcodingConfig: {
        //   width: 640,
        //   height: 360,
        //   fps: 15,
        //   bitrate: 500,
        //   maxResolutionUid: "1",
        //   mixedVideoLayout: 1
        // }
      },
      storageConfig: {
        vendor: 11, // 11 = Self-built S3 compatible (MinIO)
        region: regionCode,
        bucket: config.s3.bucket,
        accessKey: config.s3.accessKeyId,
        secretKey: config.s3.secretAccessKey,
        // fileNamePrefix: ["callrecordings"],
        fileNamePrefix: ["billiyo", "callrecordings"],
        extensionParams: {
          endpoint: config.s3.baseUrl // e.g. "https://miniios3.aaademosites.com"
        }
      },
    };

    if (token) {
      clientRequest.token = token;
    }

    const { data } = await axios.post(
      url,
      {
        cname: channel,
        uid,
        clientRequest,
      },
      {
        headers: { ...this.getAuthHeader(), "Content-Type": "application/json" },
        timeout: AGORA_REQUEST_TIMEOUT_MS,
      }
    );
    return data;
  }

  // Stop recording
  static async stopRecording(channel: string, uid: string, resourceId: string, sid: string) {
    const url = `${this.base()}/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
    const { data } = await axios.post(
      url,
      { cname: channel, uid, clientRequest: { async_stop: false } },
      {
        headers: { ...this.getAuthHeader(), "Content-Type": "application/json" },
        timeout: AGORA_REQUEST_TIMEOUT_MS,
      }
    );
    return data;
  }
}
