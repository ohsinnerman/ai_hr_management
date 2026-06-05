import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { resolveEmployee } from '../../utils/resolveEmployee.js';
import * as svc from './performance.service.js';

export const createReview = asyncHandler(async (req, res) => {
  const review = await svc.createReview(req.body, req.user.userId);
  success(res, review, 201);
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const emp = await resolveEmployee(req.user.userId);
  success(res, await svc.getMyReviews(emp._id));
});

export const getReview = asyncHandler(async (req, res) => {
  success(res, await svc.getReview(req.params.id));
});

export const submitSelfReview = asyncHandler(async (req, res) => {
  const emp = await resolveEmployee(req.user.userId);
  success(res, await svc.submitSelfReview(req.params.id, emp._id, req.body));
});

export const submitManagerReview = asyncHandler(async (req, res) => {
  const emp = await resolveEmployee(req.user.userId);
  success(res, await svc.submitManagerReview(req.params.id, emp._id, req.body));
});

export const completeReview = asyncHandler(async (req, res) => {
  success(res, await svc.completeReview(req.params.id, req.body));
});

export const getTeamReviews = asyncHandler(async (req, res) => {
  const emp = await resolveEmployee(req.user.userId);
  success(res, await svc.getTeamReviews(emp._id));
});

export const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, perPage = 25 } = req.query;
  const data = await svc.getAllReviews(req.user.companyId, Number(page), Number(perPage));
  success(res, data.reviews, 200, data.meta);
});
