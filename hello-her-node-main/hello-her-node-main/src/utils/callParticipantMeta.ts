import { User } from "../modals/user.model";
import ServiceProvider from "../modals/serviceProvider.model";

export type CallParticipantType = "User" | "ServiceProvider";

type ImageSource = {
  profilePicture?: string | null;
  avatar?: string | null;
  activeImageType?: "profilePicture" | "avatar";
};

export interface CallParticipantMeta {
  callerName: string;
  callerAlias?: string;
  callerImageUrl: string | null;
}

export const resolveActiveImageUrl = (entity: ImageSource): string | null => {
  if (entity.activeImageType === "avatar") {
    return entity.avatar || entity.profilePicture || null;
  }

  return entity.profilePicture || entity.avatar || null;
};

export const getCallParticipantMeta = async (
  callerId: string,
  callerType: CallParticipantType | string,
): Promise<CallParticipantMeta> => {
  const isProvider =
    typeof callerType === "string" &&
    ["serviceprovider", "provider"].includes(callerType.trim().toLowerCase());

  if (isProvider) {
    const callerProvider = await ServiceProvider.findById(callerId).select(
      "name alias profilePicture avatar activeImageType",
    );

    if (callerProvider) {
      const alias = callerProvider.alias ? callerProvider.alias.trim() : "";
      const name = callerProvider.name ? callerProvider.name.trim() : "";
      return {
        callerName: alias || name || callerId,
        callerAlias: alias || name,
        callerImageUrl: resolveActiveImageUrl(callerProvider),
      };
    }
  } else {
    const callerUser = await User.findById(callerId).select(
      "name profilePicture avatar activeImageType",
    );

    if (callerUser) {
      const name = callerUser.name ? callerUser.name.trim() : "";
      return {
        callerName: name || callerId,
        callerImageUrl: resolveActiveImageUrl(callerUser),
      };
    }
  }

  // Fallback: Check other collection if not found in primary
  const callerProvider = await ServiceProvider.findById(callerId).select(
    "name alias profilePicture avatar activeImageType",
  );
  if (callerProvider) {
    const alias = callerProvider.alias ? callerProvider.alias.trim() : "";
    const name = callerProvider.name ? callerProvider.name.trim() : "";
    return {
      callerName: alias || name || callerId,
      callerAlias: alias || name,
      callerImageUrl: resolveActiveImageUrl(callerProvider),
    };
  }

  const callerUser = await User.findById(callerId).select(
    "name profilePicture avatar activeImageType",
  );
  if (callerUser) {
    const name = callerUser.name ? callerUser.name.trim() : "";
    return {
      callerName: name || callerId,
      callerImageUrl: resolveActiveImageUrl(callerUser),
    };
  }

  return {
    callerName: callerId,
    callerImageUrl: null,
  };
};
