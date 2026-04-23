import Report from "../models/report.model.js";

export const createReport = async (req, res, next) => {
  try {
    const { category, description, urgency, location, addressDescription, photoBefore } = req.body;
    const districtId = req.user?.districtId;

    if (!category || !description || !photoBefore || !location?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "category, description, photoBefore, and location.coordinates are required",
      });
    }

    if (!districtId) {
      return res.status(400).json({
        success: false,
        message: "Citizen account must be assigned to a district before creating reports",
      });
    }

    const report = await Report.create({
      citizen: req.user.id,
      districtId,
      category,
      description,
      urgency,
      location,
      addressDescription,
      photoBefore,
    });

    return res.status(201).json({
      success: true,
      message: "Report created successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ citizen: req.user.id })
      .sort({ createdAt: -1 })
      .populate("citizen", "fullName phoneNumber role");

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};
