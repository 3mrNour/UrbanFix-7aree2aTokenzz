import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAssignedTasks,
  getTaskDetails,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "tasks");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `task-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({ storage });
const router = Router();

router.use(protect, restrictTo("TECHNICIAN"));

router.get("/", getAssignedTasks);
router.get("/:id", getTaskDetails);
router.patch("/:id/status", upload.single("photoAfter"), updateTaskStatus);

export default router;
