import mongoose from "mongoose";
import Report from "../models/report.model.js";
import User from "../models/User.js";
import { ReportStatus, UserRoles } from "../utils/enums.js";

const ACTIVE_TECH_TASK_STATUSES = [ReportStatus.VALID, ReportStatus.IN_PROGRESS];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const getDistrictReports = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;
    const { status, category, urgency } = req.query;

    const filters = { districtId };
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (urgency) filters.urgency = urgency;

    const reports = await Report.find(filters)
      .populate("citizen", "fullName phoneNumber")
      .populate("assignedTechnician", "fullName phoneNumber employeeId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};

export const reviewReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, category } = req.body;
    const districtId = req.user.districtId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid report id" });
    }

    const allowedReviewStatuses = [ReportStatus.VALID, ReportStatus.REJECTED, ReportStatus.SPAM];
    if (!allowedReviewStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be VALID, REJECTED, or SPAM",
      });
    }

    if (status === ReportStatus.VALID && !category) {
      return res.status(400).json({
        success: false,
        message: "Category is required when accepting a report as VALID",
      });
    }

    const report = await Report.findOne({ _id: id, districtId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found in your district",
      });
    }

    report.status = status;
    if (status === ReportStatus.VALID) {
      report.category = category;
      report.rejectionReason = undefined;
    } else {
      report.assignedTechnician = undefined;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report triage updated successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

export const suggestBestTechnicians = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const districtId = req.user.districtId;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report id" });
    }

    const report = await Report.findOne({ _id: reportId, districtId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found in your district",
      });
    }

    const hasReportCoordinates = Array.isArray(report.location?.coordinates);

    const technicians = await User.aggregate([
      ...(hasReportCoordinates
        ? [
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: report.location.coordinates,
                },
                distanceField: "distanceMeters",
                spherical: true,
                query: {
                  role: UserRoles.TECHNICIAN,
                  districtId: new mongoose.Types.ObjectId(districtId),
                },
              },
            },
          ]
        : [
            {
              $match: {
                role: UserRoles.TECHNICIAN,
                districtId: new mongoose.Types.ObjectId(districtId),
              },
            },
          ]),
      {
        $lookup: {
          from: "reports",
          let: { technicianId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$assignedTechnician", "$$technicianId"] },
                status: { $in: ACTIVE_TECH_TASK_STATUSES },
              },
            },
          ],
          as: "activeTasks",
        },
      },
      {
        $addFields: {
          activeTaskCount: { $size: "$activeTasks" },
        },
      },
      {
        $project: {
          fullName: 1,
          phoneNumber: 1,
          employeeId: 1,
          districtId: 1,
          currentLocation: 1,
          distanceMeters: 1,
          activeTaskCount: 1,
        },
      },
      { $sort: { activeTaskCount: 1, distanceMeters: 1, createdAt: 1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reportId: report._id,
        districtId: report.districtId,
        suggestions: technicians,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const assignReportToTechnician = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { technicianId } = req.body;
    const districtId = req.user.districtId;

    if (!isValidObjectId(reportId) || !isValidObjectId(technicianId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reportId or technicianId",
      });
    }

    const [report, technician] = await Promise.all([
      Report.findOne({ _id: reportId, districtId }),
      User.findOne({
        _id: technicianId,
        districtId,
        role: UserRoles.TECHNICIAN,
      }),
    ]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found in your district",
      });
    }

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found in your district",
      });
    }

    if (report.status !== ReportStatus.VALID) {
      return res.status(400).json({
        success: false,
        message: "Report must be VALID before assignment",
      });
    }

    report.assignedTechnician = technician._id;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report assigned to technician successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};
