import axios from "axios";

const normalizeMobileForMsg91 = (phoneNumber: string) => {
  const digits = typeof phoneNumber === "string" ? phoneNumber.replace(/\D/g, "") : "";

  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.startsWith("91")) return digits;
  return digits;
};

const getMsg91Config = () => ({
  authKey: process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTHKEY || "",
  templateId: process.env.MSG91_TEMPLATE_ID || "",
  senderId: process.env.MSG91_SENDER_ID || process.env.MSG91_SENDER || "",
  templateUrl: process.env.MSG91_TEMPLATE_URL || "https://api.msg91.com/api/v5/flow/",
});

export const sendLoginOtpSms = async (phoneNumber: string, otp: string) => {
  const { authKey, templateId, senderId, templateUrl } = getMsg91Config();

  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is not configured");
  }

  if (!templateId) {
    throw new Error("MSG91_TEMPLATE_ID is not configured");
  }

  const mobile = normalizeMobileForMsg91(phoneNumber);
  if (!mobile) {
    throw new Error("Invalid phone number for MSG91");
  }

  const payload = {
    template_id: templateId,
    sender: senderId,
    mobiles: mobile,
    mobile,
    otp,
    var1: otp,
  };

  const response = await axios.post(templateUrl, payload, {
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return response.data;
};
