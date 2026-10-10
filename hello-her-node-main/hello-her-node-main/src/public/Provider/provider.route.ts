import { Router } from "express";
import { ProviderController } from "./provider.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";

const providerRouter = Router();

providerRouter.post(
  "/",
  dynamicUpload([
    { name: "profilePicture", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "faceVerificationPicture", maxCount: 1 },
    { name: "audioSample", maxCount: 1 },
  ]),
  s3UploaderMiddleware("serviceProvider"),
  asyncHandler(ProviderController.createProvider)
);
providerRouter.put(
  "/:id?",
  authenticateToken,
  dynamicUpload([
    { name: "profilePicture", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "faceVerificationPicture", maxCount: 1 },
    { name: "audioSample", maxCount: 1 },
    { name: "audioNote", maxCount: 1 },
  ]),
  s3UploaderMiddleware("provider"),
  asyncHandler(ProviderController.updateProvider)
);

providerRouter.patch(
  "/:id?",
  authenticateToken,
  dynamicUpload([
    { name: "profilePicture", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "faceVerificationPicture", maxCount: 1 },
    { name: "audioSample", maxCount: 1 },
    { name: "audioNote", maxCount: 1 },
  ]),
  s3UploaderMiddleware("provider"),
  asyncHandler(ProviderController.updateProvider)
);

providerRouter.post(
  "/requestOtp",
  asyncHandler(ProviderController.requestOtpForLogin)
);

providerRouter.post(
  "/login",
  asyncHandler(ProviderController.login)
);

// Allows a provider to switch their active image (profilePicture vs avatar) using their auth token
providerRouter.patch(
  "/profile/image-source",
  authenticateToken,
  asyncHandler(ProviderController.toggleActiveImageSource)
);

// Legacy endpoint (supports admin toggling for another provider via :id or providerId in body)
providerRouter.patch(
  "/profile/image-source/:id?",
  authenticateToken,
  asyncHandler(ProviderController.toggleActiveImageSource)
);

providerRouter.get(
  "/me",
  authenticateToken,
  asyncHandler(ProviderController.getCurrentProvider)
);

providerRouter.get(
  "/",
  authenticateToken,
  asyncHandler(ProviderController.getAllProviders)
);
providerRouter.get(
  "/leaderboard",
  asyncHandler(ProviderController.getAllProvidersLeaderboard)
);

providerRouter.get(
  "/blocked",
  authenticateToken,
  isAdmin,
  asyncHandler(ProviderController.getAllBlockedUsers)
);

// providerRouter.get(
//   "/inactive",
//   authenticateToken,
//   asyncHandler(ProviderController.getAllInactiveProviders)
// );

// providerRouter.get(
//   "/inactive/:id",
//   authenticateToken,
//   asyncHandler(ProviderController.getInactiveProviderById)
// );

// providerRouter.put(
//   "/inactive/:id",
//   dynamicUpload([
//     { name: "profilePicture", maxCount: 1 },
//     { name: "aadharPhoto", maxCount: 1 },
//     { name: "faceVerificationPicture", maxCount: 1 },
//     { name: "audioSample", maxCount: 1 },
//   ]),
//   s3UploaderMiddleware("provider"), asyncHandler(ProviderController.updateInactiveProvider)
// );

providerRouter.delete(
  "/me/delete",
  authenticateToken,
  asyncHandler(ProviderController.deleteMyAccount)
);

providerRouter.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(ProviderController.deleteProvider)
);

// Withdrawals and transactions
providerRouter.post(
  "/withdrawal",
  authenticateToken,
  asyncHandler(ProviderController.requestWithdrawal)
);

providerRouter.get(
  "/me/wallet-transactions",
  authenticateToken,
  asyncHandler(ProviderController.getMyWalletTransactions)
);

providerRouter.get(
  "/:id/wallet-transactions",
  authenticateToken,
  isAdmin,
  asyncHandler(ProviderController.getWalletTransactions)
);

providerRouter.post("/block-user", authenticateToken, asyncHandler(ProviderController.blockUser));
providerRouter.post("/unblock-user", authenticateToken, asyncHandler(ProviderController.unblockUser));
providerRouter.post("/add-connection", authenticateToken, asyncHandler(ProviderController.addConnection));
providerRouter.post("/remove-connection", authenticateToken, asyncHandler(ProviderController.removeConnection));
providerRouter.get("/blocked-users", authenticateToken, asyncHandler(ProviderController.getMyBlockedUsers));

providerRouter.get("/connections", authenticateToken, asyncHandler(ProviderController.getMyConnections));

providerRouter.get("/stats/:id", authenticateToken, asyncHandler(ProviderController.getProviderStats));

providerRouter.get(
  "/:id/chat-request-status",
  authenticateToken,
  asyncHandler(ProviderController.getProviderByIdWithChatRequestStatus)
);

providerRouter.get("/:id", authenticateToken, asyncHandler(ProviderController.getProviderById));

providerRouter.post(
  "/apply-availability-penalty",
  authenticateToken,
  isAdmin,
  asyncHandler(ProviderController.applyAvailabilityPenalties)
);


export default providerRouter;
