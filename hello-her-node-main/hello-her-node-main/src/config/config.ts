import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const toBool = (value: string | undefined): boolean => value === "true";

export const config = {
  env: process.env.NODE_ENV || "production",
  port: Number(process.env.PORT) || 8080,
  baseUrl: process.env.APP_BASE_URL!,
  frontendUrl: process.env.FRONTEND_URL!,

  cors: {
    enabled: toBool(process.env.CORS_ENABLED),
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [],
  },

  db: {
    url: process.env.DB_URL!,
    name: process.env.DB_NAME!,
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    secure: toBool(process.env.EMAIL_SECURE),
  },

  s3: {
    region: process.env.S3_REGION!,
    recordingRegion: process.env.S3_REGION_WITH_CODE, // ✅ NEW
    bucket: process.env.S3_BUCKET!,
    baseUrl: process.env.S3_BASE_URL!,
    enabled: toBool(process.env.S3_ENABLED),
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },

  agora: {
    appId: process.env.AGORA_APP_ID!,
    appCertificate: process.env.AGORA_APP_CERTIFICATE!,
    customerId: process.env.AGORA_CUSTOMER_ID!,
    customerCertificate: process.env.AGORA_CUSTOMER_CERTIFICATE!,
    cloudRecordingBase: process.env.AGORA_RECORDING_BASE_URL!,
  },

  call: {
    perMinutePricePaiseDefault: Number(process.env.CALL_PER_MINUTE_PRICE_PAISE_DEFAULT),
    lowBalanceThresholdPaise: Number(process.env.CALL_LOW_BALANCE_THRESHOLD_PAISE || 1000),
    billingIntervalSeconds: Number(process.env.CALL_BILLING_INTERVAL_SECONDS),
  },

  security: {
    ips: process.env.BLOCKED_IPS?.split(",") || [],
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
    rateLimitEnabled: toBool(process.env.RATE_LIMIT_ENABLED),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  },
  twillio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    fromPhone: process.env.TWILIO_PHONE_NUMBER ?? ''
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }
};
