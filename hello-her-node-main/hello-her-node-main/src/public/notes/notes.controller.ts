import { Request, Response, NextFunction } from "express";
import Notes, { INotes } from "../../modals/notes.model";
import { CommonService } from "../../services/common.services";

const notesService = new CommonService<INotes>(Notes);

export default class NotesController {

    // Create Note
    static async createNote(req: Request | any, res: Response, next: NextFunction) {
        try {
            const providerId = req.user?.id;
            if (!providerId) {
                return res.status(400).json({ success: false, message: "providerId is required (must be logged in as provider)" });
            }
            const data = {
                userId: req.body.userId || null,
                providerId,
                title: req.body.title,
                content: req.body.content,
            };
            const note = await notesService.create(data);
            return res.status(201).json({
                success: true,
                message: "Note created successfully",
                data: note,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get All Notes (optionally filter by providerId)
    static async getNotes(req: Request | any, res: Response, next: NextFunction) {
        try {
            const notes = await notesService.getAll(
                req.query,
                [
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "userInfo"
                        }
                    },
                    {
                        $unwind: {
                            path: "$userInfo",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            providerId: 1,
                            userId: 1,
                            title: 1,
                            content: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            userInfo: {
                                _id: "$userInfo._id",
                                name: "$userInfo.name",
                                email: "$userInfo.email",
                                profilePicture: "$userInfo.profilePicture",
                                avatar: "$userInfo.avatar"
                            }
                        }
                    }
                ]
            );
            return res.status(200).json({
                success: true,
                ...notes,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all notes for the logged-in service provider
    static async getNotesForProvider(req: Request | any, res: Response, next: NextFunction) {
        try {
            const providerId = req.user?.id;
            if (!providerId) {
                return res.status(400).json({ success: false, message: "providerId is required (must be logged in as provider)" });
            }
            const notes = await notesService.getAll(
                { providerId },
                [
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "userInfo"
                        }
                    },
                    {
                        $unwind: {
                            path: "$userInfo",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            providerId: 1,
                            title: 1,
                            content: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            userInfo: {
                                _id: "$userInfo._id",
                                name: "$userInfo.name",
                                email: "$userInfo.email",
                                profilePicture: "$userInfo.profilePicture",
                                avatar: "$userInfo.avatar"
                            }
                        }
                    }
                ]
            );
            return res.status(200).json({
                success: true,
                ...notes,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Note By ID
    static async getNoteById(req: Request, res: Response, next: NextFunction) {
        try {
            const note = await notesService.getById(req.params.id);

            return res.status(200).json({
                success: true,
                data: note,
            });
        } catch (error) {
            next(error);
        }
    }

    // Update Note
    static async updateNote(req: Request, res: Response, next: NextFunction) {
        try {
            const providerId = (req as any).user?.id;

            if (!providerId) {
                return res.status(400).json({ success: false, message: "Provider must be logged in" });
            }

            const note = await notesService.getById(req.params.id);

            if (!note || !note.providerId.equals(providerId)) {
                return res.status(404).json({ success: false, message: "Note not found for this provider" });
            }
            const updated = await notesService.updateById(req.params.id, req.body);
            return res.status(200).json({
                success: true,
                message: "Note updated successfully",
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete Note
    static async deleteNote(req: Request, res: Response, next: NextFunction) {
        try {
            await notesService.deleteById(req.params.id);

            return res.status(200).json({
                success: true,
                message: "Note deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}