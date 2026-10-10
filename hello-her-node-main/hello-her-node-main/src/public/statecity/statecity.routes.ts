import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { StateCityController } from "./statecity.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const {
  // Country
  createCountry,
  getAllCountries,
  getCountryById,
  updateCountryById,
  deleteCountryById,

  // State
  createState,
  getAllStates,
  getStateById,
  updateStateById,
  deleteStateById,

  // City
  createCity,
  getAllCity,
  getCityById,
  updateCityById,
  deleteCityById,

  // Combined
  createStateCity,
  getAllStateCitys,
} = StateCityController;

const router = express.Router();

// ==============================
// 🌍 Country Routes
// ==============================
router.post(
  "/country",
  authenticateToken,
  isAdmin,
  asyncHandler(createCountry)
);
router.get(
  "/country",
  authenticateToken,
  isAdmin,
  asyncHandler(getAllCountries)
);
router.get(
  "/country/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(getCountryById)
);
router.put(
  "/country/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(updateCountryById)
);
router.delete(
  "/country/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteCountryById)
);

// ==============================
// 📍 State Routes
// ==============================
router.post("/state", authenticateToken, isAdmin, asyncHandler(createState));
router.get("/state", authenticateToken, isAdmin, asyncHandler(getAllStates));
router.get(
  "/state/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(getStateById)
);
router.put(
  "/state/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(updateStateById)
);
router.delete(
  "/state/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteStateById)
);

// ==============================
// 🏙️ City Routes
// ==============================
router.post("/city", authenticateToken, isAdmin, asyncHandler(createCity));
router.get("/city", authenticateToken, isAdmin, asyncHandler(getAllCity));
router.get("/city/:id", authenticateToken, isAdmin, asyncHandler(getCityById));
router.put(
  "/city/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(updateCityById)
);
router.delete(
  "/city/:id",
  authenticateToken,
  isAdmin,
  asyncHandler(deleteCityById)
);

// ==============================
// 🌐 Combined Route (Optional)
// ==============================
router.post("/", authenticateToken, isAdmin, asyncHandler(createStateCity));
router.get("/", authenticateToken, isAdmin, asyncHandler(getAllStateCitys));

export default router;
