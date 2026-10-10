import { Router } from "express";
import SosController from "./sos.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// ➕ Create SOS (admin)
router.post(
    "/",
    authenticateToken,
    isAdmin,
    asyncHandler(SosController.createSos)
);

// 📄 Get all SOS (user)
router.get(
    "/",
    authenticateToken,
    asyncHandler(SosController.getAllSos)
);

// 🔍 Get SOS by ID (admin)
router.get(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(SosController.getSosById)
);

// ✏️ Update SOS (admin)
router.put(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(SosController.updateSos)
);


// 🚨 SOS notification request (provider)
router.post(
    "/request",
    authenticateToken,
    asyncHandler(SosController.requestSosNotification)
);

// ❌ Delete SOS (admin)
router.delete(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(SosController.deleteSos)
);

export default router;