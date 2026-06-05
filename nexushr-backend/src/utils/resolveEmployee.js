import Employee from '../models/Employee.model.js';

/**
 * Resolve the Employee record linked to an authenticated user.
 * Throws 404 if the user has no employee profile (e.g. a bare admin account).
 */
export const resolveEmployee = async (userId) => {
  const employee = await Employee.findOne({ userId, deletedAt: null });
  if (!employee) {
    const err = new Error('No employee record is linked to this user account');
    err.status = 404;
    err.code = 'EMPLOYEE_NOT_FOUND';
    throw err;
  }
  return employee;
};
