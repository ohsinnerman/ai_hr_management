import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const kpiSchema = new mongoose.Schema(
  {
    name: String,
    target: Number,
    achieved: Number,
    weight: Number,
    selfScore: Number,
    managerScore: Number,
  },
  { _id: false }
);

const performanceReviewSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'Employee', required: true },
    reviewerId: { type: ObjectId, ref: 'Employee', required: true },
    reviewCycle: { type: String, required: true }, // e.g. 'Q4-2025'
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'self_review', 'manager_review', 'hr_review', 'completed'],
      default: 'draft',
    },
    selfRating: { type: Number, min: 1, max: 5 },
    managerRating: { type: Number, min: 1, max: 5 },
    finalRating: { type: Number, min: 1, max: 5 },
    kpis: [kpiSchema],
    strengths: String,
    improvements: String,
    goalsNextPeriod: String,
    aiRecommendation: String,
    promotionFlag: { type: Boolean, default: false },
    salaryRevisionFlag: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('PerformanceReview', performanceReviewSchema);
