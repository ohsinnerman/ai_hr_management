import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const candidateSchema = new mongoose.Schema(
  {
    jobPostingId: { type: ObjectId, ref: 'JobPosting', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    linkedinUrl: String,
    portfolioUrl: String,
    yearsExperience: Number,
    currentCompany: String,
    currentCtc: Number,
    expectedCtc: Number,
    noticePeriod: Number,
    resumeUrl: String,
    source: { type: String, enum: ['portal', 'referral', 'linkedin', 'agency', 'walk_in'], default: 'portal' },
    stage: {
      type: String,
      enum: ['applied', 'ai_screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    rejectionReason: String,
    referredBy: { type: ObjectId, ref: 'Employee' },
    aiScore: { type: Number, min: 0, max: 100 },
    aiSkillMatch: { type: Number, min: 0, max: 100 },
    aiExpMatch: { type: Number, min: 0, max: 100 },
    aiEduMatch: { type: Number, min: 0, max: 100 },
    aiCultureFit: { type: Number, min: 0, max: 100 },
    aiRecommendation: { type: String, enum: ['strong_yes', 'yes', 'maybe', 'no'] },
    aiSummary: String,
    aiAnalysis: mongoose.Schema.Types.Mixed,
    aiScreenedAt: Date,
  },
  { timestamps: true }
);

candidateSchema.index({ jobPostingId: 1, stage: 1 });
candidateSchema.index({ jobPostingId: 1, aiScore: -1 });

export default mongoose.model('Candidate', candidateSchema);
