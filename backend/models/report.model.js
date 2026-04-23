import mongoose from "mongoose";
import { ReportStatus, IssueCategories, UrgencyLevels } from "../utils/enums.js";

const reportSchema = new mongoose.Schema({
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
    category: { type: String, enum: IssueCategories, required: true },
    description: { type: String, required: true, trim: true },
    urgency: { type: String, enum: UrgencyLevels, default: "Medium" },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: (coords) => Array.isArray(coords) && coords.length === 2,
                message: "Coordinates must be an array [longitude, latitude]"
            }
        } // [longitude, latitude]
    },
    addressDescription: String,
    photoBefore: { type: String, required: true },
    photoAfter: { type: String },
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.PENDING, required: true },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    districtManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: String
}, { timestamps: true });

// إنشاء Index جيو-مكاني للبحث عن المسافات (الـ 50 متر)
reportSchema.index({ location: "2dsphere" });

export default mongoose.model("Report", reportSchema);