import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const salaryStructureSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'Employee', required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
    ctc: { type: Number, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    allowances: {
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      lta: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      meal: { type: Number, default: 0 },
    },
    deductions: {
      pfEmployeePct: { type: Number, default: 12 },
      pfEmployerPct: { type: Number, default: 12 },
      esiEmployeePct: { type: Number, default: 0.75 },
      esiEmployerPct: { type: Number, default: 3.25 },
      ptMonthly: { type: Number, default: 200 },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salaryStructureSchema.index({ employeeId: 1, isActive: 1 });

export default mongoose.model('SalaryStructure', salaryStructureSchema);
