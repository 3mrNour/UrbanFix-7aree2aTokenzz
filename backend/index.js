import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import governorRoutes from "./routes/governorRoutes.js";
import districtManagerRoutes from "./routes/districtManagerRoutes.js";
import { ensureDefaultAdmin } from "./utils/seedAdmin.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/governor", governorRoutes);
app.use("/api/manager", districtManagerRoutes);


app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "Urban Fix API is running" });
});


app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});


app.use((err, req, res, _next) => {
  console.error("Global error handler:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  await ensureDefaultAdmin();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();