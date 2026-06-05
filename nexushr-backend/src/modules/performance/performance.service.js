import { Employee, PerformanceReview } from '../../models/index.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

/**
 * HR creates a review for an employee. Sets status = 'self_review'.
 * Required: employeeId, reviewerId, reviewCycle, periodStart, periodEnd, kpis[]
 * Each KPI: { name, target, weight } (selfScore/managerScore set later).
 */
export const createReview = async (data, _creatorUserId) => {
  const { employeeId, reviewerId, reviewCycle, periodStart, periodEnd, kpis = [] } = data;

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) throw httpError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');

  const existing = await PerformanceReview.findOne({ employeeId, reviewCycle });
  if (existing) {
    throw httpError(409, 'REVIEW_EXISTS', `Review for cycle ${reviewCycle} already exists for this employee`);
  }

  return PerformanceReview.create({
    employeeId,
    reviewerId,
    reviewCycle,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    status: 'self_review',
    kpis: kpis.map((k) => ({ ...k, selfScore: null, managerScore: null })),
  });
};

export const getReview = async (reviewId) => {
  const review = await PerformanceReview.findById(reviewId)
    .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
    .populate('reviewerId', 'firstName lastName')
    .lean();
  if (!review) throw httpError(404, 'NOT_FOUND', 'Review not found');
  return review;
};

/**
 * Employee submits their self-assessment. Only when status === 'self_review'.
 * selfData: { selfRating, kpiSelfScores:[{kpiIndex,score}], strengths, improvements, goalsNextPeriod }
 */
export const submitSelfReview = async (reviewId, requestingEmployeeId, selfData) => {
  const review = await PerformanceReview.findById(reviewId);
  if (!review) throw httpError(404, 'NOT_FOUND', 'Review not found');

  // BR-006: an employee may only submit their own self-review.
  if (!review.employeeId.equals(requestingEmployeeId)) {
    throw httpError(403, 'FORBIDDEN', 'You can only submit your own self-review');
  }
  if (review.status !== 'self_review') {
    throw httpError(400, 'INVALID_STATUS', `Self-review cannot be submitted when status is '${review.status}'`);
  }

  const { selfRating, kpiSelfScores = [], strengths, improvements, goalsNextPeriod } = selfData;
  kpiSelfScores.forEach(({ kpiIndex, score }) => {
    if (review.kpis[kpiIndex]) review.kpis[kpiIndex].selfScore = score;
  });

  review.selfRating = selfRating;
  review.strengths = strengths;
  review.improvements = improvements;
  review.goalsNextPeriod = goalsNextPeriod;
  review.status = 'manager_review';

  await review.save();
  return review;
};

/**
 * Internal — writes Gemini's recommendation back to the review (fire-and-forget).
 */
const generateAiRecommendation = async (reviewId, context) => {
  const { complete, isGeminiConfigured } = await import('../ai/gemini.service.js');
  if (!isGeminiConfigured()) return; // graceful no-op without a key

  const prompt = `Analyze this employee performance review and provide a concise HR recommendation in 3-4 sentences.
Context:
- Employee: ${context.employeeName}
- Self Rating: ${context.selfRating}/5
- Manager Rating: ${context.managerRating}/5
- KPI Composite Score: ${context.kpiComposite}/5
- Key Strengths: ${context.strengths}
- Development Areas: ${context.improvements}
- Promotion Flagged: ${context.promotionFlag}
- Salary Revision Flagged: ${context.salaryRevisionFlag}

Provide a balanced, actionable recommendation for HR. Focus on: (1) overall assessment, (2) whether promotion/revision is warranted, (3) one specific development action.`;

  const recommendation = await complete({
    system: 'You are an expert HR advisor. Provide concise, professional recommendations.',
    user: prompt,
    model: 'gemini-2.0-flash',
    maxTokens: 300,
  });

  await PerformanceReview.findByIdAndUpdate(reviewId, { aiRecommendation: recommendation });
};

/**
 * Manager submits assessment. Only when status === 'manager_review'.
 * managerData: { managerRating, kpiManagerScores:[{kpiIndex,score}], promotionFlag, salaryRevisionFlag }
 */
export const submitManagerReview = async (reviewId, requestingEmployeeId, managerData) => {
  const review = await PerformanceReview.findById(reviewId);
  if (!review) throw httpError(404, 'NOT_FOUND', 'Review not found');

  if (!review.reviewerId.equals(requestingEmployeeId)) {
    throw httpError(403, 'FORBIDDEN', 'Only the assigned reviewer can submit the manager review');
  }
  if (review.status !== 'manager_review') {
    throw httpError(400, 'INVALID_STATUS', `Manager review cannot be submitted when status is '${review.status}'`);
  }

  const { managerRating, kpiManagerScores = [], promotionFlag = false, salaryRevisionFlag = false } = managerData;
  kpiManagerScores.forEach(({ kpiIndex, score }) => {
    if (review.kpis[kpiIndex]) review.kpis[kpiIndex].managerScore = score;
  });

  review.managerRating = managerRating;
  review.promotionFlag = promotionFlag;
  review.salaryRevisionFlag = salaryRevisionFlag;
  review.status = 'hr_review';

  // KPI achieved = avg(self, manager); composite = weighted average.
  let totalWeight = 0;
  let weightedScore = 0;
  review.kpis.forEach((kpi) => {
    const avg = ((kpi.selfScore ?? 0) + (kpi.managerScore ?? 0)) / 2;
    kpi.achieved = avg;
    weightedScore += avg * (kpi.weight ?? 1);
    totalWeight += kpi.weight ?? 1;
  });
  const kpiComposite = totalWeight > 0 ? weightedScore / totalWeight : managerRating;

  await review.save();

  // Fire-and-forget Gemini recommendation (don't block the response).
  const emp = await Employee.findById(review.employeeId).lean();
  generateAiRecommendation(review._id, {
    employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
    selfRating: review.selfRating,
    managerRating,
    kpiComposite: kpiComposite.toFixed(2),
    strengths: review.strengths,
    improvements: review.improvements,
    promotionFlag,
    salaryRevisionFlag,
  }).catch((err) => console.warn('[Performance] AI recommendation failed:', err.message));

  return review;
};

/**
 * HR sets the final rating and completes the review. Only from 'hr_review'.
 */
export const completeReview = async (reviewId, hrData) => {
  const review = await PerformanceReview.findById(reviewId);
  if (!review) throw httpError(404, 'NOT_FOUND', 'Review not found');
  if (review.status !== 'hr_review') {
    throw httpError(400, 'INVALID_STATUS', 'Review must be in hr_review stage to complete');
  }

  review.finalRating = hrData.finalRating;
  review.status = 'completed';
  await review.save();
  return review;
};

export const getMyReviews = async (employeeId) =>
  PerformanceReview.find({ employeeId })
    .populate('reviewerId', 'firstName lastName designationId')
    .sort({ createdAt: -1 })
    .lean();

export const getTeamReviews = async (managerId) => {
  const directReports = await Employee.find({ managerId, deletedAt: null }).select('_id').lean();
  const empIds = directReports.map((e) => e._id);
  return PerformanceReview.find({ employeeId: { $in: empIds } })
    .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
    .sort({ createdAt: -1 })
    .lean();
};

export const getAllReviews = async (companyId, page = 1, perPage = 25) => {
  const employees = await Employee.find({ companyId, deletedAt: null }).select('_id').lean();
  const empIds = employees.map((e) => e._id);
  const skip = (page - 1) * perPage;

  const [reviews, total] = await Promise.all([
    PerformanceReview.find({ employeeId: { $in: empIds } })
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('reviewerId', 'firstName lastName')
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .lean(),
    PerformanceReview.countDocuments({ employeeId: { $in: empIds } }),
  ]);

  return { reviews, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
};
