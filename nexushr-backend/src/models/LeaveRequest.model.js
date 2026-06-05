import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'Employee', required: true },
    leaveTypeId: { type: ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: String,
    documentUrl: String,
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    appliedAt: { type: Date, default: Date.now },
    managerReviewedAt: Date,
    managerReviewedBy: { type: ObjectId, ref: 'Employee' },
    managerComment: String,
    hrReviewedAt: Date,
    hrReviewedBy: { type: ObjectId, ref: 'Employee' },
    hrComment: String,
  },
  { timestamps: true }
);

leaveRequestSchema.index({ employeeId: 1, status: 1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
