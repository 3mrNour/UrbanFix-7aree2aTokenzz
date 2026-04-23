import Report from "../models/report.model.js";
import { ReportStatus } from "../utils/enums.js";

const buildReportsFilter = (query) => {
  const { status, category, urgency, fromDate, toDate } = query;
  const filters = {};

  if (status) filters.status = status;
  if (category) filters.category = category;
  if (urgency) filters.urgency = urgency;

  if (fromDate || toDate) {
    filters.createdAt = {};
    if (fromDate) filters.createdAt.$gte = new Date(fromDate);
    if (toDate) filters.createdAt.$lte = new Date(toDate);
  }

  return filters;
};

export const getGlobalReports = async (req, res, next) => {
  try {
    const filters = buildReportsFilter(req.query);
    const reports = await Report.find(filters)
      .populate("citizen", "fullName phoneNumber")
      .populate("assignedTechnician", "fullName phoneNumber employeeId role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSystemAnalytics = async (req, res, next) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [reportsLast24Hours, statusCounts, topCategories, resolutionTimeAggregation] =
      await Promise.all([
        Report.countDocuments({ createdAt: { $gte: last24Hours } }),
        Report.aggregate([
          {
            $match: {
              status: {
                $in: [
                  ReportStatus.PENDING,
                  ReportStatus.IN_PROGRESS,
                  ReportStatus.RESOLVED,
                ],
              },
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Report.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        Report.aggregate([
          { $match: { status: ReportStatus.RESOLVED } },
          {
            $group: {
              _id: null,
              avgResolutionMs: {
                $avg: {
                  $subtract: ["$updatedAt", "$createdAt"],
                },
              },
            },
          },
        ]),
      ]);

    const statusMap = {
      [ReportStatus.PENDING]: 0,
      [ReportStatus.IN_PROGRESS]: 0,
      [ReportStatus.RESOLVED]: 0,
    };

    statusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const avgResolutionMs = resolutionTimeAggregation[0]?.avgResolutionMs || 0;
    const avgResolutionHours = Number((avgResolutionMs / (1000 * 60 * 60)).toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        reportsLast24Hours,
        statusBreakdown: statusMap,
        topReportedCategories: topCategories.map((item) => ({
          category: item._id,
          count: item.count,
        })),
        averageResolutionTime: {
          milliseconds: avgResolutionMs,
          hours: avgResolutionHours,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getHeatmapMapData = async (req, res, next) => {
  try {
    const filters = buildReportsFilter(req.query);
    const heatmapData = await Report.find(filters).select(
      "location status urgency category createdAt"
    );

    return res.status(200).json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    return next(error);
  }
};
