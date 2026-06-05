import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const feedbackSchema = new mongoose.Schema(
  {
    overallRating: Number,
    technical: Number,
    communication: Number,
    problemSolving: Number,
    strengths: String,
    weaknesses: String,
    recommendation: String,
    notes: String,
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    candidateId: { type: ObjectId, ref: 'Candidate', required: true },
    jobPostingId: { type: ObjectId, ref: 'JobPosting', required: true },
    round: { type: Number, default: 1 },
    type: { type: String, enum: ['phone', 'video', 'technical', 'hr', 'final'], required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    interviewers: [{ type: ObjectId, ref: 'Employee' }],
    meetingLink: String,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
    feedback: feedbackSchema,
    voiceRecordingUrl: String,
    transcript: String,
    aiEvaluation: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('Interview', interviewSchema);
