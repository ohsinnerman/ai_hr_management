import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String },
    settings: {
      timezone: { type: String, default: 'Asia/Kolkata' },
      currency: { type: String, default: 'INR' },
      currencySymbol: { type: String, default: '₹' },
      fiscalYearStart: { type: Number, default: 4 },
      country: { type: String, default: 'IN' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      workingDaysPerWeek: { type: Number, default: 5 },
      attendanceCutoffTime: { type: String, default: '09:30' },
    },
    subscription: {
      type: String,
      enum: ['trial', 'starter', 'professional', 'enterprise'],
      default: 'trial',
    },
    employeeLimit: { type: Number, default: 5000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
