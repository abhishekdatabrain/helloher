import admin from "../utils/firebase";

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
  const isCall = data?.type === "call_received";

  const message: admin.messaging.Message = {
    token,
    data,
    // Agar call nahi hai (jaise provider_online, messages) toh phone par OS notification banner dikhayenge
    ...(!isCall && title && body
      ? {
          notification: {
            title,
            body,
          },
        }
      : {}),
    android: {
      priority: "high",
      ...(!isCall && title && body
        ? {
            notification: {
              channelId: "calls",
              priority: "max",
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          }
        : {}),
    },
    apns: {
      headers: isCall
        ? {
            "apns-priority": "5",
            "apns-push-type": "background",
          }
        : {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
      payload: {
        aps: {
          ...(!isCall && title && body
            ? {
                alert: {
                  title,
                  body,
                },
              }
            : {}),
          contentAvailable: true,
          sound: "default",
        },
      },
    },
  };

  const response = await admin.messaging().send(message);
  console.log("✅ Push sent:", response);
  return response;
};

