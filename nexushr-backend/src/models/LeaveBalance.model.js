import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'Employee', required: true },
    leaveTypeId: { type: ObjectId, ref: 'LeaveType', required: true },
    year: { type: Number, required: true },
    totalAllocated: { type: Number, required: true },
    used: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    carriedForward: { type: Number, default: 0 },
    encashed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
