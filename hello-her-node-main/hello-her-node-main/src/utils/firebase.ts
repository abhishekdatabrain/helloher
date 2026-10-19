import path from "path";
import { readFileSync, existsSync } from "fs";
import admin from "firebase-admin";

export function initFirebase(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const possiblePaths = [
    // Standard relative paths from dist/utils or src/utils
    path.resolve(__dirname, "../config/firebase-service-account.json"),
    path.resolve(__dirname, "../../src/config/firebase-service-account.json"),
    path.resolve(__dirname, "../../../src/config/firebase-service-account.json"),
    // From current working directory
    path.resolve(process.cwd(), "src/config/firebase-service-account.json"),
    path.resolve(process.cwd(), "dist/config/firebase-service-account.json"),
    path.resolve(process.cwd(), "hello-her-node-main/src/config/firebase-service-account.json"),
    path.resolve(process.cwd(), "hello-her-node-main/dist/config/firebase-service-account.json"),
    // Absolute production paths on Linux server
    "/var/www/helloher/hello-her-node-main/hello-her-node-main/src/config/firebase-service-account.json",
    "/var/www/helloher/hello-her-node-main/src/config/firebase-service-account.json",
    "/var/www/helloher/src/config/firebase-service-account.json",
  ];

  const serviceAccountPath = possiblePaths.find((p) => existsSync(p));

  if (!serviceAccountPath) {
    console.error(
      "❌ Firebase Admin initialization failed: firebase-service-account.json not found in paths:",
      possiblePaths
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully from:", serviceAccountPath);
    return app;
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
    return null;
  }
}

// Initial attempt on import
initFirebase();

export default admin;

