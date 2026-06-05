import mongoose from 'mongoose';
import { Employee, LeaveRequest } from '../../models/index.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

// GET /api/v1/analytics/headcount — joiners grouped by month.
export const getHeadcount = async (companyId) =>
  Employee.aggregate([
    { $match: { companyId: oid(companyId), deletedAt: null } },
    {
      $group: {
        _id: { year: { $year: '$dateJoined' }, month: { $month: '$dateJoined' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

// GET /api/v1/analytics/attrition?year=YYYY
export const getAttrition = async (companyId, year) => {
  const periodStart = new Date(`${year}-01-01`);
  const periodEnd = new Date(`${year}-12-31`);

  const [terminated, startCount, endCount] = await Promise.all([
    Employee.countDocuments({
      companyId,
      employmentStatus: 'terminated',
      dateLeft: { $gte: periodStart, $lte: periodEnd },
    }),
    Employee.countDocuments({ companyId, dateJoined: { $lt: periodStart }, deletedAt: null }),
    Employee.countDocuments({ companyId, dateJoined: { $lte: periodEnd }, deletedAt: null }),
  ]);

  const avgHeadcount = (startCount + endCount) / 2;
  const rate = avgHeadcount > 0 ? (terminated / avgHeadcount) * 100 : 0;
  return { year: Number(year), terminated, startCount, endCount, attritionRate: parseFloat(rate.toFixed(2)) };
};

// GET /api/v1/analytics/departments — active headcount by department.
export const getDeptBreakdown = async (companyId) =>
  Employee.aggregate([
    { $match: { companyId: oid(companyId), deletedAt: null, employmentStatus: 'active' } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $project: { name: '$dept.name', count: 1, _id: 0 } },
  ]);

// GET /api/v1/analytics/leave-summary?year=YYYY — leave requests grouped by status.
export const getLeaveSummary = async (companyId, year) => {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);

  return LeaveRequest.aggregate([
    { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'emp' } },
    { $unwind: '$emp' },
    { $match: { 'emp.companyId': oid(companyId), startDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
  ]);
};
