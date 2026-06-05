import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const leaveTypeSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    annualAllowance: { type: Number, required: true },
    carryForward: { type: Boolean, default: false },
    maxCarryForward: Number,
    encashable: { type: Boolean, default: false },
    requiresDocument: { type: Boolean, default: false },
    genderSpecific: { type: String, enum: ['all', 'male', 'female'], default: 'all' },
    colorCode: { type: String, default: '#4A90D9' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ companyId: 1, isActive: 1 });

export default mongoose.model('LeaveType', leaveTypeSchema);
