import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserRoles } from "../utils/enums.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    nationalId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRoles),
      required: true,
      default: UserRoles.CITIZEN,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      default: null,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ currentLocation: "2dsphere" });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = async function comparePassword(plainText) {
  return bcrypt.compare(plainText, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
