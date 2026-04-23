import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserProfile,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { createUserValidator, updateUserValidator } from "../validators/userValidator.js";

const router = Router();

// TODO: Re-enable auth middlewares in next step.
router.post(
  "/",
  // protect,
  // authorize("MANAGER", "GOVERNOR"),
  createUserValidator,
  createUser
);

router.get(
  "/",
  // protect,
  // authorize("MANAGER", "GOVERNOR"),
  getAllUsers
);

router.get(
  "/profile",
  // protect,
  getUserProfile
);

router.patch(
  "/:id",
  // protect,
  // authorize("MANAGER", "GOVERNOR"),
  updateUserValidator,
  updateUser
);

router.delete(
  "/:id",
  // protect,
  // authorize("GOVERNOR"),
  deleteUser
);

export default router;
