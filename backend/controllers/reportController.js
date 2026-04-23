import Report from "../models/report.model.js";

export const createReport = async (req, res, next) => {
  try {
    const { category, description, urgency, addressDescription } = req.body;
    const districtId = req.user?.districtId || null;
    const photoBefore = req.file ? `/uploads/reports/before/${req.file.filename}` : null;

    let parsedLocation = req.body.location;
    if (typeof parsedLocation === "string") {
      try {
        parsedLocation = JSON.parse(parsedLocation);
      } catch {
        parsedLocation = null;
      }
    }

    if (!category || !description || !photoBefore || !parsedLocation?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "category, description, photoBefore, and location.coordinates are required",
      });
    }

    const report = await Report.create({
      citizen: req.user.id,
      districtId,
      category,
      description,
      urgency,
      location: parsedLocation,
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
