// Barrel that imports every model so Mongoose registers all schemas at startup.
// This guarantees `ref`/`populate` works regardless of import order.
import Company from './Company.model.js';
import User from './User.model.js';
import Department from './Department.model.js';
import Designation from './Designation.model.js';
import Employee from './Employee.model.js';
import AttendanceRecord from './AttendanceRecord.model.js';
import LeaveType from './LeaveType.model.js';
import LeaveRequest from './LeaveRequest.model.js';
import LeaveBalance from './LeaveBalance.model.js';
import SalaryStructure from './SalaryStructure.model.js';
import PayrollRun from './PayrollRun.model.js';
import Payslip from './Payslip.model.js';
import JobPosting from './JobPosting.model.js';
import Candidate from './Candidate.model.js';
import Interview from './Interview.model.js';

export {
  Company,
  User,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  SalaryStructure,
  PayrollRun,
  Payslip,
  JobPosting,
  Candidate,
  Interview,
};
