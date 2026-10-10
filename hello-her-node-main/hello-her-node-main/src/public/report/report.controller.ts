import { Request, Response, NextFunction } from "express";
import Report, { IReport } from "../../modals/report.model";
import { CommonService } from "../../services/common.services";

const reportService = new CommonService<IReport>(Report);

export default class ReportController {

  // Create a new report
  static async createReport(req: Request | any, res: Response, next: NextFunction) {
    try {
      const reporterId = req.user?.id;
      if (!reporterId) {
        return res.status(400).json({ success: false, message: "Reporter must be logged in" });
      }

      const { reportedUserId, message } = req.body;
      if (!reportedUserId || !message) {
        return res.status(400).json({ success: false, message: "reportedUserId and message are required" });
      }

      const report = await reportService.create({
        reporterId,
        reportedUserId,
        message,
        status: "pending"
      });

      return res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all reports (admin can use)
  static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await reportService.getAll(
        req.query,
        [
          {
            $lookup: {
              from: "serviceproviders",
              localField: "reporterId",
              foreignField: "_id",
              as: "reporterInfo"
            }
          },
          { $unwind: { path: "$reporterInfo", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "reportedUserId",
              foreignField: "_id",
              as: "reportedUserInfo"
            }
          },
          { $unwind: { path: "$reportedUserInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              message: 1,
              status: 1,
              adminRemark: 1,
              createdAt: 1,
              updatedAt: 1,
              reporterId: {
                _id: "$reporterInfo._id",
                name: "$reporterInfo.name",
                email: "$reporterInfo.email"
              },
              reportedUserId: {
                _id: "$reportedUserInfo._id",
                name: "$reportedUserInfo.name",
                email: "$reportedUserInfo.email"
              }
            }
          }
        ]
      );
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Success",
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get report by ID
  static async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update report status and/or admin remark (admin action)
  static async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, adminRemark } = req.body;

      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const updated = await reportService.updateById(req.params.id, { status, adminRemark });

      return res.status(200).json({
        success: true,
        message: "Report updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a report
  static async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      await reportService.deleteById(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}