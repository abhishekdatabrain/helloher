import admin, { initFirebase } from "../utils/firebase";

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<string> => {
  if (!admin.apps.length) {
    initFirebase();
  }

  // Ensure all data values are strings for strict FCM compatibility
  const stringData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      stringData[key] = typeof value === "string" ? value : String(value);
    }
  }

  const message: admin.messaging.Message = {
    token,
    // 1. Top-level notification (Exact same as Firebase Console)
    ...(title ? {
      notification: {
        title,
        body: body || "",
      },
    } : {}),
    data: stringData,
    // 2. Android settings
    android: {
      priority: "high",
      ...(title ? {
        notification: {
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      } : {}),
    },
    // 3. iOS APNs settings
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          ...(title ? {
            alert: {
              title,
              body: body || "",
            },
          } : {}),
          sound: "default",
          contentAvailable: true,
        },
      },
    },
  };

  const response = await admin.messaging().send(message);
  console.log("✅ Push sent successfully:", response);
  return response;
};

