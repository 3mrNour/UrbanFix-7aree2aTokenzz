import { UserRoles } from "../utils/enums.js";

export const blockManagerReportCreation = (req, res, next) => {
  if (req.user?.role === UserRoles.MANAGER) {
    return res.status(403).json({
      success: false,
      message: "District Manager is not allowed to create reports",
    });
  }

  return next();
};

export const requireDistrictAssignment = (req, res, next) => {
  if (!req.user?.districtId) {
    return res.status(403).json({
      success: false,
      message: "User is not assigned to a district",
    });
  }

  return next();
};

export const enforceDistrictScopeByResource = (getResourceDistrictId) => {
  return async (req, res, next) => {
    const districtId = req.user?.districtId?.toString?.() || req.user?.districtId;

    if (!districtId) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a district",
      });
    }

    const resourceDistrictId = await getResourceDistrictId(req);
    if (!resourceDistrictId) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    if (resourceDistrictId.toString() !== districtId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied: resource outside your district scope",
      });
    }

    return next();
  };
};
