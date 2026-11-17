import { Router } from "express";
import { AccountDeletionController } from "./accountDeletion.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const accountDeletionRouter = Router();

// Web Page Views
accountDeletionRouter.get("/user", AccountDeletionController.renderUserPage);
accountDeletionRouter.get("/listener", AccountDeletionController.renderListenerPage);
accountDeletionRouter.get("/", AccountDeletionController.renderPage);

// API Endpoints
accountDeletionRouter.post("/request-otp", asyncHandler(AccountDeletionController.requestOtp));
accountDeletionRouter.post("/confirm", asyncHandler(AccountDeletionController.confirmDeletion));

export default accountDeletionRouter;
