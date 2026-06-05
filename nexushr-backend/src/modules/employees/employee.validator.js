import { body } from 'express-validator';

export const createEmployeeRules = [
  body('firstName').isString().trim().notEmpty().withMessage('firstName is required'),
  body('lastName').isString().trim().notEmpty().withMessage('lastName is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('dateJoined').notEmpty().withMessage('dateJoined is required').isISO8601().withMessage('dateJoined must be a valid date'),
  body('employmentType')
    .optional()
    .isIn(['full_time', 'part_time', 'contract', 'intern'])
    .withMessage('Invalid employmentType'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'non_binary', 'prefer_not_to_say'])
    .withMessage('Invalid gender'),
];

export const updateEmployeeRules = [
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('dateJoined').optional().isISO8601().withMessage('dateJoined must be a valid date'),
  body('employmentType')
    .optional()
    .isIn(['full_time', 'part_time', 'contract', 'intern'])
    .withMessage('Invalid employmentType'),
  body('employmentStatus')
    .optional()
    .isIn(['active', 'on_leave', 'suspended', 'terminated'])
    .withMessage('Invalid employmentStatus'),
];
