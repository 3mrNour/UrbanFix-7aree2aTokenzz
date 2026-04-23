import User from "../models/User.js";
import { UserRoles } from "./enums.js";

const getAdminSeedConfig = () => {
  const roleFromEnv = process.env.ADMIN_ROLE;
  const allowedRoles = [UserRoles.GOVERNOR, UserRoles.MANAGER];

  return {
    fullName: process.env.ADMIN_FULL_NAME || "Urban Fix Super Admin",
    employeeId: process.env.ADMIN_EMPLOYEE_ID || "ADMIN-0001",
    phoneNumber: process.env.ADMIN_PHONE_NUMBER || "+201000000001",
    password: process.env.ADMIN_PASSWORD || "Admin@12345",
    role: allowedRoles.includes(roleFromEnv) ? roleFromEnv : UserRoles.GOVERNOR,
  };
};

export const ensureDefaultAdmin = async () => {
  const config = getAdminSeedConfig();

  const existingAdmin = await User.findOne({ employeeId: config.employeeId });
  if (existingAdmin) {
    if (!existingAdmin.isActive) {
      existingAdmin.isActive = true;
      await existingAdmin.save();
    }
    return existingAdmin;
  }

  const createdAdmin = await User.create({
    fullName: config.fullName,
    employeeId: config.employeeId,
    phoneNumber: config.phoneNumber,
    password: config.password,
    role: config.role,
    isActive: true,
  });

  return createdAdmin;
};
