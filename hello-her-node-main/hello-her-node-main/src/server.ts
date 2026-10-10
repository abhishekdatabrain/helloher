import "colors";
import app from "./app";
import { config } from "dotenv";
import { createServer } from "http";
import { logger } from "./config/logger";
import connectDB from "./config/database";
import { Server as HttpServer } from "http";
import { watchEnvFile } from "./config/envWatcher";
import { configureSocket } from "./config/socket.io";
import { config as manualConfig } from "./config/config"
import { startCallBillingWorker } from "./services/callBillingWorker"
import { startAvailabilityPenaltyScheduler } from "./scheduler/availabilityPenaltyScheduler";
import { startPaidProfileScheduler } from "./scheduler/paidProfileScheduler";
import "./utils/firebase";
import mongoose from "mongoose";
// import bcrypt from "bcrypt"
// const newPassword = "Adminhello@123";

// async function generateHash() {
//   const hash = await bcrypt.hash(newPassword, 10);

//   console.log("Password:", newPassword);
//   console.log("Hash:", hash);
// }

// generateHash();
// Load environment variables
config();
watchEnvFile();
// startCallBillingWorker(); // Start auto billing loop
mongoose.connection.once("open", () => {
  console.log("✅ MongoDB connected");
  startCallBillingWorker(
    app.get("socketio"),
    app.get("getSocketUser"),
  ); // start auto billing background worker
});

const port = manualConfig.port;
const dbUrl = manualConfig.db.url;

// Validate necessary environment variables
if (!port || !dbUrl) {
  logger.error("Missing required environment variables. Exiting...");
  process.exit(1);
}

// Create HTTP server from Express app
const httpServer: HttpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
configureSocket(httpServer, app);

// Graceful shutdown
const shutdown = (): void => {
  logger.info("Shutting down the server...");
  httpServer.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds if it doesn't shut down properly
  setTimeout(() => {
    logger.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10000).unref(); // Prevent blocking the event loop
};

// Handle unexpected errors
process.on("uncaughtException", (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit the process to avoid inconsistent state
});

process.on("unhandledRejection", (reason: any) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
  process.exit(1); // Exit the process to avoid inconsistent state
});

// Gracefully handle SIGTERM and SIGINT signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Connect to the database and start the server
const startServer = async (): Promise<void> => {
  try {
    await connectDB(); // Establish database connection
    httpServer.listen(port, () => {
      logger.info(
        `Server is running at http://localhost:${port}`.blue,
      );

      // Initialize schedulers after server starts
      setTimeout(() => {
        try {
          // Get socket.io instance and helper from express app
          const io = app.get("socketio");
          const getSocketUser = app.get("getSocketUser");

          // Start availability penalty scheduler (runs daily at 00:00)
          startAvailabilityPenaltyScheduler(io, getSocketUser);
          // Start paid profile expiration scheduler (runs daily at 00:00)
          startPaidProfileScheduler();
        } catch (schedulerError: any) {
          logger.error(`Failed to initialize schedulers: ${schedulerError.message}`);
          // Don't exit - server can still function without scheduler
        }
      }, 1000);
    });
  } catch (err: any) {
    logger.error(`Failed to start the server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
