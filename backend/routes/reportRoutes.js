import { Router } from "express";
import { createReport, getMyReports } from "../controllers/reportController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, restrictTo("CITIZEN"), createReport);
router.get("/my-reports", protect, restrictTo("CITIZEN"), getMyReports);

export default router;
