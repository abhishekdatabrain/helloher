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
  const message: admin.messaging.Message = {
    token,
    data,
    android: {
      priority: "high",
      // notification: {
      //   channelId: "calls",
      //   priority: "max",
      //   defaultSound: true,
      //   defaultVibrateTimings: true,
      // },
    },
    apns: {
      headers: {
        "apns-priority": "5",
        "apns-push-type": "background",
      },
      payload: {
        aps: {
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

