import { Router } from "express";
import { UserController } from "./user.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { isAdmin, authenticateToken } from "../../middlewares/authMiddleware";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const userRouter = Router();

userRouter.post("/", asyncHandler(UserController.register));
// userRouter.post("/login", asyncHandler(UserController.login));

// 🔐 Google OAuth Login
// userRouter.post("/login/google", asyncHandler(UserController.loginWithGoogle));

//otp
// userRouter.post("/requestOtp", asyncHandler(UserController.requestOtpForLogin)); // Request OTP
// userRouter.post("/login", asyncHandler(UserController.loginWithOtp)); // Login with OTP

// Profile
userRouter.put("/", authenticateToken, asyncHandler(UserController.update));
userRouter.put(
  "/profile",
  authenticateToken,
  dynamicUpload([{ name: "profilePicture", maxCount: 1 }]),
  s3UploaderMiddleware("profile"),
  asyncHandler(UserController.uploadProfilePicture),
);
userRouter.patch(
  "/profile/image-source",
  authenticateToken,
  asyncHandler(UserController.toggleActiveImageSource),
);

userRouter.get("/", authenticateToken, asyncHandler(UserController.getCurrent));

userRouter.get(
  "/all",
  authenticateToken,
  asyncHandler(UserController.getAllUsers),
);
userRouter.put(
  "/all/:id",
  authenticateToken,
  asyncHandler(UserController.update),
);

userRouter.get(
  "/all/:id",
  authenticateToken,
  asyncHandler(UserController.getUserById),
);

// ⭐ Favorites
userRouter.post(
  "/favorite",
  authenticateToken,
  asyncHandler(UserController.addFavorite),
);
userRouter.delete(
  "/favorite/:providerId",
  authenticateToken,
  asyncHandler(UserController.removeFavorite),
);
userRouter.post(
  "/favorite/remove",
  authenticateToken,
  asyncHandler(UserController.removeFavorite),
);
userRouter.get(
  "/favorites",
  authenticateToken,
  asyncHandler(UserController.getFavorites),
);
userRouter.get(
  "/favorite/status/:providerId",
  authenticateToken,
  asyncHandler(UserController.checkFavoriteStatus),
);

userRouter.get(
  "/:id",
  authenticateToken,
  asyncHandler(UserController.getUserById),
);

userRouter.delete(
  "/me/delete",
  authenticateToken,
  asyncHandler(UserController.deleteMyAccount),
);
userRouter.delete(
  "/delete/:id",
  authenticateToken,
  asyncHandler(UserController.deleteAccountById),
);

export default userRouter;
