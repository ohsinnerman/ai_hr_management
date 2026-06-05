import * as recruitmentService from './recruitment.service.js';
import { success } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// ── Jobs ───────────────────────────────────────────────────
export const createJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.createJob(req.user.companyId, req.user.userId, req.body);
  success(res, job, 201);
});

export const listJobs = asyncHandler(async (req, res) => {
  const { status, page, per_page, perPage } = req.query;
  const { jobs, meta } = await recruitmentService.listJobs({
    companyId: req.user.companyId,
    status,
    page,
    perPage: per_page || perPage,
  });
  success(res, jobs, 200, meta);
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.getJob(req.user.companyId, req.params.id);
  success(res, job);
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.updateJob(req.user.companyId, req.params.id, req.body);
  success(res, job);
});

export const publishJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.publishJob(req.user.companyId, req.params.id);
  success(res, job);
});

export const listJobCandidates = asyncHandler(async (req, res) => {
  const data = await recruitmentService.listJobCandidates(req.user.companyId, req.params.id);
  success(res, data);
});

// ── Candidates ─────────────────────────────────────────────
export const applyCandidate = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.applyToJob({
    companyId: req.user.companyId,
    jobId: req.body.jobId || req.body.job_id,
    data: req.body,
    file: req.file,
  });
  success(
    res,
    {
      id: candidate._id,
      stage: candidate.stage,
      ai_screening_started: true,
      message: 'Application received. AI screening in progress.',
    },
    201
  );
});

export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.getCandidate(req.user.companyId, req.params.id);
  success(res, candidate);
});

export const updateCandidateStage = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.updateCandidateStage(
    req.user.companyId,
    req.params.id,
    req.body.stage,
    req.body.note
  );
  success(res, candidate);
});
