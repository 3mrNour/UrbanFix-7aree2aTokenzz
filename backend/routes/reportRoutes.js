import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createReport, getMyReports } from "../controllers/reportController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { blockManagerReportCreation } from "../middleware/districtScopeMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "reports", "before");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `report-before-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({ storage });
const router = Router();

router.post(
  "/",
  protect,
  blockManagerReportCreation,
  restrictTo("CITIZEN"),
  upload.single("photoBefore"),
  createReport
);
router.get("/my-reports", protect, restrictTo("CITIZEN"), getMyReports);

export default router;
