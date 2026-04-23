import mongoose from 'mongoose';
import { ReportStatus, IssueCategories, UrgencyLevels } from '../utils/enums.js';

const reportSchema = new mongoose.Schema({
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: IssueCategories, required: true },
    description: { type: String, required: true },
    urgency: { type: String, enum: UrgencyLevels, default: 'Medium' },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    addressDescription: String,
    photoBefore: { type: String, required: true },
    photoAfter: String,
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.PENDING },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    districtManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String
}, { timestamps: true });

// إنشاء Index جيو-مكاني للبحث عن المسافات (الـ 50 متر)
reportSchema.index({ location: '2dsphere' });

export default mongoose.model('Report', reportSchema);