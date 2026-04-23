import { validationResult } from "express-validator";
import User from "../models/User.js";
import { UserRoles } from "../utils/enums.js";
import generateToken from "../utils/generateToken.js";

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;

  return res.status(422).json({
    success: false,
    message: "Validation failed",
    errors: errors.array(),
  });
};

export const createUser = async (req, res, next) => {
  try {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    const { fullName, nationalId, employeeId, password, phoneNumber, role } = req.body;

    if (role === UserRoles.CITIZEN && !nationalId) {
      return res.status(400).json({
        success: false,
        message: "National ID is required for citizen accounts",
      });
    }

    if (role !== UserRoles.CITIZEN && !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required for staff accounts",
      });
    }

    const payload = {
      fullName,
      password,
      phoneNumber,
      role,
      nationalId: role === UserRoles.CITIZEN ? nationalId : undefined,
      employeeId: role !== UserRoles.CITIZEN ? employeeId : undefined,
      // Hackathon-friendly behavior: citizen accounts can sign in immediately.
      isActive: role === UserRoles.CITIZEN,
    };

    const createdUser = await User.create(payload);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: createdUser._id,
        fullName: createdUser.fullName,
        phoneNumber: createdUser.phoneNumber,
        role: createdUser.role,
        nationalId: createdUser.nationalId,
        employeeId: createdUser.employeeId,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A unique field already exists",
        duplicateField: Object.keys(error.keyPattern || {})[0] || "unknown",
      });
    }
    return next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing authenticated user context",
      });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (typeof isActive !== "undefined") filters.isActive = isActive === "true";

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      User.find(filters).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      User.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber) || 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    const { id } = req.params;
    const allowedFields = ["fullName", "phoneNumber", "nationalId", "employeeId", "role", "isActive"];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(
        ([key, value]) => allowedFields.includes(key) && typeof value !== "undefined"
      )
    );

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A unique field already exists",
        duplicateField: Object.keys(error.keyPattern || {})[0] || "unknown",
      });
    }
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    user.deletedAt = user.isActive ? null : new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been ${user.isActive ? "reactivated" : "deactivated"} successfully`,
      data: {
        id: user._id,
        isActive: user.isActive,
        deletedAt: user.deletedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { nationalId, employeeId, password } = req.body;

    if ((!nationalId && !employeeId) || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide (nationalId or employeeId) and password",
      });
    }

    const query = nationalId ? { nationalId } : { employeeId };
    const user = await User.findOne(query).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      accessToken: token,
      data: userResponse,
    });
  } catch (error) {
    return next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide employeeId and password",
      });
    }

    const admin = await User.findOne({
      employeeId,
      role: { $in: [UserRoles.MANAGER, UserRoles.GOVERNOR] },
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const token = generateToken(admin._id);
    const userResponse = admin.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      accessToken: token,
      data: userResponse,
    });
  } catch (error) {
    return next(error);
  }
};
