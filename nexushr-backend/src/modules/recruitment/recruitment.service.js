import JobPosting from '../../models/JobPosting.model.js';
import Candidate from '../../models/Candidate.model.js';
import { uploadToS3 } from '../../utils/s3Upload.js';
import { enqueueScreening } from '../../queues/aiScreening.queue.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

const STAGES = ['applied', 'ai_screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];

// ── Jobs ───────────────────────────────────────────────────
export const createJob = (companyId, userId, data) =>
  JobPosting.create({
    companyId,
    departmentId: data.departmentId,
    designationId: data.designationId,
    title: data.title,
    jobCode: data.jobCode,
    description: data.description,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    employmentType: data.employmentType,
    location: data.location,
    isRemote: data.isRemote,
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    openings: data.openings,
    requiredSkills: data.requiredSkills || [],
    preferredSkills: data.preferredSkills || [],
    minExperienceYears: data.minExperienceYears,
    closesAt: data.closesAt,
    status: data.status || 'draft',
    createdBy: userId,
  });

export const listJobs = async ({ companyId, status, page = 1, perPage = 25 }) => {
  const query = { companyId };
  if (status) query.status = status;
  const pageNum = Number(page) || 1;
  const limit = Number(perPage) || 25;
  const skip = (pageNum - 1) * limit;
  const [jobs, total] = await Promise.all([
    JobPosting.find(query)
      .populate('departmentId', 'name code')
      .populate('designationId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobPosting.countDocuments(query),
  ]);
  return { jobs, meta: { page: pageNum, perPage: limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getJob = async (companyId, id) => {
  const job = await JobPosting.findOne({ _id: id, companyId })
    .populate('departmentId', 'name code')
    .populate('designationId', 'name')
    .lean();
  if (!job) throw httpError(404, 'NOT_FOUND', 'Job posting not found');
  return job;
};

export const updateJob = async (companyId, id, data) => {
  const job = await JobPosting.findOneAndUpdate({ _id: id, companyId }, data, { new: true, runValidators: true });
  if (!job) throw httpError(404, 'NOT_FOUND', 'Job posting not found');
  return job;
};

export const publishJob = async (companyId, id) => {
  const job = await JobPosting.findOneAndUpdate(
    { _id: id, companyId },
    { status: 'active', postedAt: new Date() },
    { new: true }
  );
  if (!job) throw httpError(404, 'NOT_FOUND', 'Job posting not found');
  return job;
};

// ── Candidates ─────────────────────────────────────────────
/**
 * Apply for a job: upload resume to S3/R2, create the candidate (stage 'applied'),
 * then enqueue the AI screening job. Does NOT wait for screening to complete.
 */
export const applyToJob = async ({ companyId, jobId, data, file }) => {
  const job = await JobPosting.findOne({ _id: jobId, companyId });
  if (!job) throw httpError(404, 'JOB_NOT_FOUND', 'Job posting not found');
  if (!file) throw httpError(400, 'RESUME_REQUIRED', 'A resume file is required');

  // Upload resume to R2/S3.
  const ext = (file.originalname.split('.').pop() || 'pdf').toLowerCase();
  const key = `uploads/resumes/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const resumeUrl = await uploadToS3(key, file.buffer, file.mimetype);

  const candidate = await Candidate.create({
    jobPostingId: jobId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    linkedinUrl: data.linkedinUrl,
    portfolioUrl: data.portfolioUrl,
    yearsExperience: data.yearsExperience,
    currentCompany: data.currentCompany,
    currentCtc: data.currentCtc,
    expectedCtc: data.expectedCtc,
    noticePeriod: data.noticePeriod,
    source: data.source || 'portal',
    resumeUrl,
    stage: 'applied',
  });

  await enqueueScreening({ candidateId: String(candidate._id), jobId: String(jobId) });

  return candidate;
};

export const getCandidate = async (companyId, id) => {
  const candidate = await Candidate.findById(id).populate('jobPostingId');
  if (!candidate || String(candidate.jobPostingId?.companyId) !== String(companyId)) {
    throw httpError(404, 'NOT_FOUND', 'Candidate not found');
  }
  return candidate;
};

export const listJobCandidates = async (companyId, jobId) => {
  const job = await JobPosting.findOne({ _id: jobId, companyId }).lean();
  if (!job) throw httpError(404, 'NOT_FOUND', 'Job posting not found');

  const candidates = await Candidate.find({ jobPostingId: jobId })
    .sort({ aiScore: -1, createdAt: -1 })
    .lean();

  const pipeline = {};
  for (const stage of STAGES) pipeline[stage] = { count: 0, candidates: [] };
  for (const c of candidates) {
    if (!pipeline[c.stage]) pipeline[c.stage] = { count: 0, candidates: [] };
    pipeline[c.stage].count += 1;
    pipeline[c.stage].candidates.push(c);
  }
  return { jobId, total: candidates.length, pipeline };
};

/**
 * Human-only pipeline stage change (BR-004). Route restricts to HR/recruiter roles.
 */
export const updateCandidateStage = async (companyId, id, stage, note) => {
  if (!STAGES.includes(stage)) throw httpError(400, 'INVALID_STAGE', 'Invalid pipeline stage');
  const candidate = await Candidate.findById(id).populate('jobPostingId', 'companyId');
  if (!candidate || String(candidate.jobPostingId?.companyId) !== String(companyId)) {
    throw httpError(404, 'NOT_FOUND', 'Candidate not found');
  }
  candidate.stage = stage;
  if (stage === 'rejected' && note) candidate.rejectionReason = note;
  await candidate.save();
  return candidate;
};
