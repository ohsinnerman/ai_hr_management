import { body } from 'express-validator';

export const applyLeaveRules = [
  body('leaveTypeId').isMongoId().withMessage('A valid leaveTypeId is required'),
  body('startDate').isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').isISO8601().withMessage('endDate must be a valid date'),
  body('reason').optional().isString(),
];

export const reviewLeaveRules = [
  body('action').isIn(['approve', 'reject']).withMessage("action must be 'approve' or 'reject'"),
  body('comment').optional().isString(),
];

export const createLeaveTypeRules = [
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('code').isString().trim().notEmpty().withMessage('code is required'),
  body('annualAllowance').isNumeric().withMessage('annualAllowance must be a number'),
];
