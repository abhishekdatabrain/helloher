import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";
import { config } from "../../config/config";
import {
  Helpdesk,
  IHelpdesk,
  HelpdeskType,
  HelpdeskStatus,
  IssueCategoryType,
} from "../../modals/helpdesk.model";

const HelpdeskService = new CommonService(Helpdesk);

export class HelpdeskController {
  /**
   * Create new helpdesk ticket
   * Supports type: query, feedback, issue
   * For issue: issueCategory and screenshots are required
   */
  static async createTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { type, name, email, phone, message, issueCategory } = req.body;
      const userId = (req as any).user.id;
      const role = (req as any).user.role;
      console.log("Authenticated user:", { userId, role });

      console.log("Received helpdesk ticket creation request:", req.body);
      // Validation
      if (!type || !["query", "feedback", "issue"].includes(type)) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "Type is required and must be: query, feedback, or issue"
            )
          );
      }

      if (!name || !email || !phone || !message) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "name, email, phone, and message are required"
            )
          );
      }

      // Validate email format
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!emailRegex.test(email)) {
      //   return res
      //     .status(400)
      //     .json(new ApiError(400, "Invalid email format"));
      // }

      // For issue type: issueCategory is required
      if (type === "issue" && !issueCategory) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "issueCategory is required for issue type"
            )
          );
      }

      // Validate issueCategory if provided
      const validCategories = [
        "payment_issue",
        "booking_issue",
        "quality_issue",
        "behavior_issue",
        "technical_issue",
        "other",
      ];
      if (
        issueCategory &&
        !validCategories.includes(issueCategory)
      ) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              `Invalid issue category. Allowed: ${validCategories.join(", ")}`
            )
          );
      }

      const ticketData: Partial<IHelpdesk> = {
        type: type as HelpdeskType,
        name,
        email,
        phone,
        message,
        requestedBy: new mongoose.Types.ObjectId(userId),
        role: role,
        status: "open",
        isRead: false,
        priority: "low",
      };

      // Add issue-specific fields
      if (type === "issue") {
        ticketData.issueCategory = issueCategory as IssueCategoryType;

        // Get screenshots from uploaded files
        // Check both req.body.screenshots and req.files.screenshots
        let screenshotsData = (req as any).body?.screenshots || (req as any).files?.screenshots;

        if (screenshotsData) {
          if (Array.isArray(screenshotsData)) {
            // Extract URLs from screenshot objects
            ticketData.screenshots = screenshotsData
              .map((file: any) => {
                // Handle both object format {url: "..."} and string format
                if (typeof file === 'string') return file;
                if (file?.url) return file.url;
                if (file?.location) return file.location;
                return null;
              })
              .filter((url: any) => url !== null); // Remove null values
          } else {
            // Single file
            const url = typeof screenshotsData === 'string'
              ? screenshotsData
              : screenshotsData?.url || screenshotsData?.location;
            if (url) {
              ticketData.screenshots = [url];
            }
          }
        }
      }

      const result = await HelpdeskService.create(ticketData);
      if (!result) {
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create ticket"));
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            result,
            "Helpdesk ticket created successfully"
          )
        );
    } catch (err: any) {
      next(err);
    }
  }


  /**
   * Get all helpdesk tickets with filtering
   * Query params: type, status, priority, isRead, page, limit
   */
  static async getAllTickets(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { type, status, priority, isRead, role, page = 1, limit = 10 } =
        req.query;

      const pageNumber = Math.max(parseInt(String(page), 10), 1);
      const limitNumber = Math.max(parseInt(String(limit), 10), 1);
      const skip = (pageNumber - 1) * limitNumber;

      // Build filter query
      let filterQuery: any = {};

      if (type) {
        if (!["query", "feedback", "issue"].includes(String(type))) {
          return res
            .status(400)
            .json(
              new ApiError(
                400,
                "Invalid type. Allowed: query, feedback, issue"
              )
            );
        }
        filterQuery.type = type;
      }

      if (status) {
        if (
          !["open", "in-progress", "resolved", "closed"].includes(
            String(status)
          )
        ) {
          return res
            .status(400)
            .json(
              new ApiError(
                400,
                "Invalid status. Allowed: open, in-progress, resolved, closed"
              )
            );
        }
        filterQuery.status = status;
      }

      if (priority) {
        if (
          ![
            "low",
            "medium",
            "high",
            "urgent",
          ].includes(String(priority))
        ) {
          return res
            .status(400)
            .json(
              new ApiError(
                400,
                "Invalid priority. Allowed: low, medium, high, urgent"
              )
            );
        }
        filterQuery.priority = priority;
      }

      if (role) {
        const allowedRoles = ["user", "ServiceProvider"];
        if (!allowedRoles.includes(String(role))) {
          return res
            .status(400)
            .json(
              new ApiError(
                400,
                `Invalid role. Allowed: ${allowedRoles.join(", ")}`
              )
            );
        }
        filterQuery.role = role;
      }

      if (isRead !== undefined) {
        filterQuery.isRead = String(isRead).toLowerCase() === "true";
      }

      // Execute query
      const [result, totalCount] = await Promise.all([
        Helpdesk.find(filterQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate("respondedBy", "-password")
          .lean(),
        Helpdesk.countDocuments(filterQuery),
      ]);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            result,
            pagination: {
              currentPage: pageNumber,
              itemsPerPage: limitNumber,
              totalItems: totalCount,
              totalPages: Math.ceil(totalCount / limitNumber),
            },
          },
          "Tickets fetched successfully"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const ticket = await Helpdesk.findById(id).populate(
        "respondedBy",
        "-password"
      );

      if (!ticket) {
        return res
          .status(404)
          .json(new ApiError(404, "Ticket not found"));
      }

      // Mark as read if not already
      if (!ticket.isRead) {
        ticket.isRead = true;
        await ticket.save();
      }

      return res
        .status(200)
        .json(new ApiResponse(200, ticket, "Ticket fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update ticket - Admin only
   * Can update: status, priority, adminResponse, respondedBy
   */
  static async updateTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { status, priority, adminResponse } = req.body;
      const adminId = (req as any).user?.id;

      const ticket = await Helpdesk.findById(id);
      if (!ticket) {
        return res
          .status(404)
          .json(new ApiError(404, "Ticket not found"));
      }

      const updateData: Partial<IHelpdesk> = {};

      // Update status if provided
      if (status) {
        if (
          !["open", "in-progress", "resolved", "closed"].includes(status)
        ) {
          return res
            .status(400)
            .json(
              new ApiError(
                400,
                "Invalid status. Allowed: open, in-progress, resolved, closed"
              )
            );
        }
        updateData.status = status as HelpdeskStatus;
      }

      // Update priority if provided
      if (priority) {
        if (
          ![
            "low",
            "medium",
            "high",
            "urgent",
          ].includes(priority)
        ) {
          return res
            .status(400)
            .json(
              new ApiError(
                400,
                "Invalid priority. Allowed: low, medium, high, urgent"
              )
            );
        }
        updateData.priority = priority as any;
      }

      // Update admin response
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
        updateData.respondedBy = adminId;
        updateData.respondedAt = new Date();
      }

      const result = await HelpdeskService.updateById(id, updateData);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update ticket"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Ticket updated successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete ticket - Admin only
   */
  static async deleteTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const result = await HelpdeskService.deleteById(id);
      if (!result) {
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete ticket"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Ticket deleted successfully")
        );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get statistics about tickets
   */
  static async getTicketStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await Helpdesk.aggregate([
        {
          $facet: {
            byType: [
              { $group: { _id: "$type", count: { $sum: 1 } } },
            ],
            byStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } },
            ],
            byPriority: [
              { $group: { _id: "$priority", count: { $sum: 1 } } },
            ],
            totalOpen: [
              { $match: { status: "open" } },
              { $count: "count" },
            ],
            totalUnread: [
              { $match: { isRead: false } },
              { $count: "count" },
            ],
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(200, stats[0], "Ticket statistics fetched successfully")
        );
    } catch (err) {
      next(err);
    }
  }
}
