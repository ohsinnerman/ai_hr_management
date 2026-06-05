import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const payslipSchema = new mongoose.Schema(
  {
    payrollRunId: { type: ObjectId, ref: 'PayrollRun', required: true },
    employeeId: { type: ObjectId, ref: 'Employee', required: true },
    grossSalary: { type: Number, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    earnings: { type: Map, of: Number, default: {} },
    deductions: { type: Map, of: Number, default: {} },
    pfEmployee: { type: Number, default: 0 },
    esiEmployee: { type: Number, default: 0 },
    pt: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true },
    paidDays: { type: Number, required: true },
    unpaidDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    pdfUrl: String,
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

payslipSchema.index({ employeeId: 1, createdAt: -1 });
payslipSchema.index({ payrollRunId: 1 });

export default mongoose.model('Payslip', payslipSchema);
