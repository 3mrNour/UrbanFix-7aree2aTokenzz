import { Router } from "express";
import {
  assignTask,
  delegateTasks,
  getAllReports,
  getAvailableTechnicians,
  getPendingReports,
  getTechnicianSuggestions,
  processReport,
  reviewReport,
} from "../controllers/managerController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = Router();

// Governor is treated as a super-admin and can access manager operations.
router.use(protect, restrictTo("MANAGER", "GOVERNOR"));

router.get("/reports/pending", getPendingReports);
router.get("/reports", getAllReports);
router.patch("/reports/:id/review", reviewReport);
router.get("/technicians", getAvailableTechnicians);
router.get("/reports/:id/technicians/suggestions", getTechnicianSuggestions);
router.patch("/reports/:id/assign", assignTask);
router.patch("/reports/:id/process", processReport);
router.post("/technicians/delegate", delegateTasks);

export default router;
