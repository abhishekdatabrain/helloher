import { encrypt, decrypt } from "../utils/crypto";
import mongoose from "mongoose";

export function safelyDecryptMessage(text: string, messageId: string | mongoose.Types.ObjectId): string {
    if (text && typeof text === "string") {
      try {
        return decrypt(text);
      } catch (err) {
        console.error("Decrypt error for message", messageId, err);
        return "Encrypted message";
      }
    }
    return "";
  }
  