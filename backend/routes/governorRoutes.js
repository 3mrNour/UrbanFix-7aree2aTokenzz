import { Router } from "express";
import {
  getGlobalReports,
  getSystemAnalytics,
  getHeatmapMapData,
} from "../controllers/governorController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, restrictTo("GOVERNOR"));

router.get("/reports", getGlobalReports);
router.get("/analytics", getSystemAnalytics);
router.get("/heatmap", getHeatmapMapData);

export default router;
