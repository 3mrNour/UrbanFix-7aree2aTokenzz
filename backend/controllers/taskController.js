import mongoose from "mongoose";
import Report from "../models/report.model.js";
import { ReportStatus } from "../utils/enums.js";

export const getAssignedTasks = async (req, res, next) => {
  try {
    const tasks = await Report.find({ assignedTechnician: req.user.id })
      .populate("citizen", "fullName phoneNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTaskDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task id",
      });
    }

    const task = await Report.findOne({
      _id: id,
      assignedTechnician: req.user.id,
    }).populate("citizen", "fullName phoneNumber");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this technician",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task id",
      });
    }

    const allowedStatuses = [ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be IN_PROGRESS or RESOLVED",
      });
    }

    const task = await Report.findOne({
      _id: id,
      assignedTechnician: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this technician",
      });
    }

    // Closure Validation: a proof-of-work photo is mandatory on RESOLVED.
    if (status === ReportStatus.RESOLVED && !req.file) {
      return res.status(400).json({
        success: false,
        message: "photoAfter file is required when resolving a task",
      });
    }

    task.status = status;
    if (req.file) {
      task.photoAfter = `/uploads/tasks/${req.file.filename}`;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    return next(error);
  }
};
