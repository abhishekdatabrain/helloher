import express from "express";
import NotesController from "./notes.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    asyncHandler(NotesController.createNote)
);

router.get(
    "/provider/me",
    authenticateToken,
    asyncHandler(NotesController.getNotesForProvider)
);

router.get(
    "/",
    authenticateToken,
    asyncHandler(NotesController.getNotes)
);

router.get(
    "/:id",
    authenticateToken,
    asyncHandler(NotesController.getNoteById)
);

router.put(
    "/:id",
    authenticateToken,
    asyncHandler(NotesController.updateNote)
);

router.delete(
    "/:id",
    authenticateToken,
    asyncHandler(NotesController.deleteNote)
);

export default router;