import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const jobPostingSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    departmentId: { type: ObjectId, ref: 'Department', required: true },
    designationId: { type: ObjectId, ref: 'Designation' },
    title: { type: String, required: true },
    jobCode: { type: String, sparse: true },
    description: { type: String, required: true },
    requirements: String,
    responsibilities: String,
    employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
    location: String,
    isRemote: { type: Boolean, default: false },
    salaryMin: Number,
    salaryMax: Number,
    openings: { type: Number, default: 1 },
    filledCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'active', 'paused', 'closed', 'filled'], default: 'draft' },
    requiredSkills: [String],
    preferredSkills: [String],
    minExperienceYears: Number,
    postedAt: Date,
    closesAt: Date,
    approvedBy: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

jobPostingSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('JobPosting', jobPostingSchema);
