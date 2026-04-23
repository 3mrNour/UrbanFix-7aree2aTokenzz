import { body, param } from "express-validator";
import { UserRoles } from "../utils/enums.js";

const phoneRegex = /^[0-9+\-() ]{7,20}$/;

export const createUserValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(phoneRegex)
    .withMessage("Invalid phone number format"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(Object.values(UserRoles))
    .withMessage("Invalid role value"),

  body("nationalId")
    .optional({ nullable: true })
    .trim()
    .isLength({ exactly: 14 })
    .withMessage("National ID must be exactly 14 characters"),

  body("employeeId")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Employee ID must be between 3 and 30 characters"),

  body().custom((value) => {
    if (value.role === UserRoles.CITIZEN && !value.nationalId) {
      throw new Error("National ID is required for CITIZEN role");
    }
    if (value.role !== UserRoles.CITIZEN && !value.employeeId) {
      throw new Error("Employee ID is required for staff roles");
    }
    return true;
  }),
];

export const updateUserValidator = [
  param("id").isMongoId().withMessage("Invalid user id"),

  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters"),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(phoneRegex)
    .withMessage("Invalid phone number format"),

  body("role")
    .optional()
    .isIn(Object.values(UserRoles))
    .withMessage("Invalid role value"),

  body("nationalId")
    .optional({ nullable: true })
    .trim()
    .isLength({ exactly: 14 })
    .withMessage("National ID must be exactly 14 characters"),

  body("employeeId")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Employee ID must be between 3 and 30 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("password").not().exists().withMessage("Password update is not allowed from this endpoint"),
];
