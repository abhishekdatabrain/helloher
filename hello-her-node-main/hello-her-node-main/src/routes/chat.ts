// import { Router } from "express";
// import { ChatController } from "../controllers/chatController"; // adjust path if needed
// import { authenticateToken } from "../middlewares/authMiddleware"; // optional
// import { asyncHandler } from "../utils/asyncHandler";

// const router = Router();

// // Send a message
// router.post(
//   "/message",
//   authenticateToken,
//   asyncHandler(ChatController.sendMessage)
// );

// // Get messages between two users
// router.get(
//   "/messages/:userId",
//   authenticateToken, // optional
//   asyncHandler(ChatController.getMessages)
// );

// // Get inbox (last messages + unread count)
// router.get(
//   "/inbox",
//   authenticateToken, // optional
//   asyncHandler(ChatController.getInbox)
// );

// export default router;

// // 68db6c7d6b3e228be854fb4e -- bryuss id (user)    -- Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoidXNlciIsImlkIjoiNjhkYjZjN2Q2YjNlMjI4YmU4NTRmYjRlIiwiZW1haWwiOiJicnVjZUBleGFtcGxlLmNvbSIsImlhdCI6MTc1OTIxODE5NywiZXhwIjoxNzU5ODIyOTk3fQ.gRdqEDXFEZD45NFhahWdGLiWgNyswzuoxZc4_aG6vGY
// // 68db773ecf1a72306afcf2ea -- manish (provider)   -- Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGI3NzNlY2YxYTcyMzA2YWZjZjJlYSIsInJvbGUiOiJTZXJ2aWNlUHJvdmlkZXIiLCJwaG9uZU51bWJlciI6Ijg0ODQ4MzM1Mjg0MiIsImlhdCI6MTc1OTIxMzcxMiwiZXhwIjoxNzU5ODE4NTEyfQ.C8OPQwMVDLd7r39pIgtNwh7FsCDAGUqXbGbHOTFfdzs
