import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const payrollRunSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    runDate: Date,
    status: {
      type: String,
      enum: ['draft', 'processing', 'processed', 'approved', 'paid'],
      default: 'draft',
    },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    totalPf: { type: Number, default: 0 },
    totalEsi: { type: Number, default: 0 },
    totalTds: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 },
    processedBy: { type: ObjectId, ref: 'User' },
    processedAt: Date,
    approvedBy: { type: ObjectId, ref: 'User' },
    approvedAt: Date,
    bankFileUrl: String,
  },
  { timestamps: true }
);

// BR-002: a company can only have one payroll run per exact period.
payrollRunSchema.index({ companyId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

export default mongoose.model('PayrollRun', payrollRunSchema);
