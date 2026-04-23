import { Router } from "express";
import {
  assignTask,
  delegateTasks,
  getAvailableTechnicians,
  getPendingReports,
  reviewReport,
} from "../controllers/managerController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, restrictTo("MANAGER"));

router.get("/reports/pending", getPendingReports);
router.patch("/reports/:id/review", reviewReport);
router.get("/technicians", getAvailableTechnicians);
router.patch("/reports/:id/assign", assignTask);
router.post("/technicians/delegate", delegateTasks);

export default router;
