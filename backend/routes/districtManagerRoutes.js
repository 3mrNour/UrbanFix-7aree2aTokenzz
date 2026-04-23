import { Router } from "express";
import {
  getDistrictReports,
  reviewReport,
  suggestBestTechnicians,
  assignReportToTechnician,
} from "../controllers/districtManagerController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { requireDistrictAssignment } from "../middleware/districtScopeMiddleware.js";

const router = Router();

router.use(protect, restrictTo("MANAGER"), requireDistrictAssignment);

router.get("/reports", getDistrictReports);
router.patch("/reports/:id/review", reviewReport);
router.get("/reports/:reportId/suggestions", suggestBestTechnicians);
router.patch("/reports/:reportId/assign", assignReportToTechnician);

export default router;
