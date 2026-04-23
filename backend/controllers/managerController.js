import mongoose from "mongoose";
import Report from "../models/report.model.js";
import User from "../models/User.js";
import { ReportStatus, UserRoles } from "../utils/enums.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const ACTIVE_TECH_TASK_STATUSES = [ReportStatus.VALID, ReportStatus.IN_PROGRESS];

export const getPendingReports = async (req, res, next) => {
  try {
    const reports = await Report.find({
      status: ReportStatus.PENDING,
    })
      .populate("citizen", "fullName phoneNumber nationalId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllReports = async (req, res, next) => {
  try {
    const { status, category, urgency } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (urgency) filters.urgency = urgency;

    const reports = await Report.find(filters)
      .populate("citizen", "fullName phoneNumber nationalId")
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
    const { action, rejectionReason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id",
      });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be APPROVE or REJECT",
      });
    }

    if (action === "REJECT" && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required when action is REJECT",
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (action === "REJECT") {
      report.status = ReportStatus.REJECTED;
      report.rejectionReason = rejectionReason.trim();
      report.assignedTechnician = undefined;
    } else {
      if (report.status !== ReportStatus.PENDING) {
        return res.status(400).json({
          success: false,
          message: "Only PENDING reports can be approved",
        });
      }
      report.status = ReportStatus.VALID;
      report.rejectionReason = undefined;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report reviewed successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAvailableTechnicians = async (req, res, next) => {
  try {
    const technicians = await User.aggregate([
      {
        $match: {
          role: UserRoles.TECHNICIAN,
        },
      },
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
          activeTaskCount: 1,
        },
      },
      { $sort: { activeTaskCount: 1, createdAt: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTechnicianSuggestions = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id",
      });
    }

    const report = await Report.findById(id).select(
      "_id location"
    );
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const hasCoords =
      Array.isArray(report.location?.coordinates) && report.location.coordinates.length === 2;

    const suggestions = await User.aggregate([
      ...(hasCoords
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
                },
              },
            },
          ]
        : [
            {
              $match: {
                role: UserRoles.TECHNICIAN,
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
          activeTaskCount: 1,
          distanceMeters: 1,
        },
      },
      { $sort: { activeTaskCount: 1, distanceMeters: 1, createdAt: 1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    return next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(technicianId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id or technicianId",
      });
    }

    const [report, technician] = await Promise.all([
      Report.findById(id),
      User.findById(technicianId),
    ]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (!technician || technician.role !== UserRoles.TECHNICIAN) {
      return res.status(400).json({
        success: false,
        message: "Assigned user must be a technician",
      });
    }

    if (report.status === ReportStatus.RESOLVED) {
      return res.status(400).json({
        success: false,
        message: "Resolved reports cannot be reassigned",
      });
    }

    report.assignedTechnician = technician._id;
    report.districtManager = req.user.id;
    report.status = ReportStatus.IN_PROGRESS;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

export const processReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, technicianId, rejectionReason } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(technicianId)) {
      return res.status(400).json({
        success: false,
        message: "report id and technicianId are required and must be valid",
      });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be APPROVE or REJECT",
      });
    }

    if (action === "REJECT" && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required when action is REJECT",
      });
    }

    const [report, technician] = await Promise.all([
      Report.findById(id),
      User.findById(technicianId),
    ]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (!technician || technician.role !== UserRoles.TECHNICIAN) {
      return res.status(400).json({
        success: false,
        message: "Assigned user must be a technician",
      });
    }

    report.assignedTechnician = technician._id;
    report.districtManager = req.user.id;

    if (action === "APPROVE") {
      report.status = ReportStatus.IN_PROGRESS;
      report.rejectionReason = undefined;
    } else {
      report.status = ReportStatus.REJECTED;
      report.rejectionReason = rejectionReason.trim();
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report processed successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

export const delegateTasks = async (req, res, next) => {
  try {
    const { fromTechnicianId, toTechnicianId } = req.body;

    if (!isValidObjectId(fromTechnicianId) || !isValidObjectId(toTechnicianId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fromTechnicianId or toTechnicianId",
      });
    }

    if (fromTechnicianId === toTechnicianId) {
      return res.status(400).json({
        success: false,
        message: "fromTechnicianId and toTechnicianId must be different",
      });
    }

    const [fromTech, toTech] = await Promise.all([
      User.findById(fromTechnicianId),
      User.findById(toTechnicianId),
    ]);

    const bothValidTechnicians =
      fromTech &&
      toTech &&
      fromTech.role === UserRoles.TECHNICIAN &&
      toTech.role === UserRoles.TECHNICIAN;

    if (!bothValidTechnicians) {
      return res.status(400).json({
        success: false,
        message: "Both users must exist and have TECHNICIAN role",
      });
    }

    const delegationResult = await Report.updateMany(
      {
        assignedTechnician: fromTechnicianId,
        status: ReportStatus.IN_PROGRESS,
      },
      {
        $set: {
          assignedTechnician: toTechnicianId,
          districtManager: req.user.id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Tasks delegated successfully",
      data: {
        matchedCount: delegationResult.matchedCount || 0,
        modifiedCount: delegationResult.modifiedCount || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};
