import mongoose from "mongoose";
import Report from "../models/report.model.js";
import User from "../models/User.js";
import { ReportStatus, UserRoles } from "../utils/enums.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const getPendingReports = async (_req, res, next) => {
  try {
    const reports = await Report.find({ status: ReportStatus.PENDING })
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

export const getAvailableTechnicians = async (_req, res, next) => {
  try {
    const activeStatuses = [ReportStatus.VALID, ReportStatus.IN_PROGRESS];

    const technicians = await User.aggregate([
      {
        $match: {
          role: UserRoles.TECHNICIAN,
          isActive: true,
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
                status: { $in: activeStatuses },
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
          isActive: 1,
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

    if (!technician || technician.role !== UserRoles.TECHNICIAN || !technician.isActive) {
      return res.status(400).json({
        success: false,
        message: "Assigned user must be an active technician",
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
      toTech.role === UserRoles.TECHNICIAN &&
      fromTech.isActive &&
      toTech.isActive;

    if (!bothValidTechnicians) {
      return res.status(400).json({
        success: false,
        message: "Both technicians must exist, be active, and have TECHNICIAN role",
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
