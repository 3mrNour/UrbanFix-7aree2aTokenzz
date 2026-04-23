import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserProfile,
  updateUser,
  deleteUser,
  login,
  loginAdmin,
} from "../controllers/userController.js";
import { createUserValidator, updateUserValidator } from "../validators/userValidator.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/admin/login", loginAdmin);

router.post(
  "/",
  createUserValidator,
  createUser
);

router.get(
  "/",
  protect,
  restrictTo("GOVERNOR"),
  getAllUsers
);

router.get(
  "/profile",
  protect,
  getUserProfile
);

router.patch(
  "/:id",
  protect,
  restrictTo("GOVERNOR"),
  updateUserValidator,
  updateUser
);

router.delete(
  "/:id",
  protect,
  restrictTo("GOVERNOR"),
  deleteUser
);

export default router;
