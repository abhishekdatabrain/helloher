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
  callerType: CallParticipantType,
): Promise<CallParticipantMeta> => {
  if (callerType === "ServiceProvider") {
    const callerProvider = await ServiceProvider.findById(callerId).select(
      "name alias profilePicture avatar activeImageType",
    );

    return {
      callerName: callerProvider?.alias || callerProvider?.name || callerId,
      callerImageUrl: callerProvider
        ? resolveActiveImageUrl(callerProvider)
        : null,
    };
  }

  const callerUser = await User.findById(callerId).select(
    "name profilePicture avatar activeImageType",
  );

  return {
    callerName: callerUser?.name || callerId,
    callerImageUrl: callerUser ? resolveActiveImageUrl(callerUser) : null,
  };
};
