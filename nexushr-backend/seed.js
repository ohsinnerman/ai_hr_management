// nexushr-backend/seed.js
// Idempotent demo-data seeder. Run with: node seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { connectDB } from './src/config/db.js';
import {
  Company, User, Employee, Department, Designation,
  LeaveType, LeaveBalance, AttendanceRecord, SalaryStructure,
  JobPosting, Candidate, PayrollRun, Payslip, Document,
} from './src/models/index.js';

await connectDB();

// 1. Clear all collections
await Promise.all([
  Company, User, Employee, Department, Designation,
  LeaveType, LeaveBalance, AttendanceRecord, SalaryStructure,
  JobPosting, Candidate, PayrollRun, Payslip, Document,
].map((M) => M.deleteMany({})));
console.log('[Seed] Collections cleared');

// 2. Company
const company = await Company.create({
  name: 'FWC IT Services Pvt. Ltd.', domain: 'fwcit.com',
  settings: { timezone: 'Asia/Kolkata', currency: 'INR', currencySymbol: '₹', attendanceCutoffTime: '09:30' },
});

// 3. Departments (6)
const deptNames = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Operations', 'Sales'];
const departments = await Department.insertMany(
  deptNames.map((name) => ({ companyId: company._id, name, isActive: true }))
);

// 4. Designations (5 per department = 30 total)
const desgMap = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'Principal Engineer', 'VP Engineering'],
  'Human Resources': ['HR Associate', 'HR Executive', 'HR Manager', 'HR Business Partner', 'CHRO'],
  Finance: ['Finance Analyst', 'Senior Analyst', 'Finance Manager', 'Controller', 'CFO'],
  Marketing: ['Marketing Executive', 'Senior Executive', 'Brand Manager', 'VP Marketing', 'CMO'],
  Operations: ['Operations Executive', 'Senior Executive', 'Operations Manager', 'Director Ops', 'COO'],
  Sales: ['Sales Executive', 'Senior Executive', 'Sales Manager', 'Regional Head', 'VP Sales'],
};
const designations = [];
for (const dept of departments) {
  for (const [i, name] of desgMap[dept.name].entries()) {
    designations.push({ companyId: company._id, name, level: i + 1, departmentId: dept._id, isActive: true });
  }
}
const createdDesignations = await Designation.insertMany(designations);

// 5. Users (5 — password: Demo@1234)
const passwordHash = await bcryptjs.hash('Demo@1234', 12);
const userSeeds = [
  { email: 'superadmin@fwcit.com', role: 'super_admin' },
  { email: 'hrmanager@fwcit.com', role: 'hr_manager' },
  { email: 'recruiter@fwcit.com', role: 'recruiter' },
  { email: 'manager@fwcit.com', role: 'senior_manager' },
  { email: 'employee@fwcit.com', role: 'employee' },
];
const users = await User.insertMany(
  userSeeds.map((u) => ({ ...u, companyId: company._id, passwordHash, isActive: true }))
);

// 6. Employees (50)
const indianNames = [
  ['Aryan', 'Sharma'], ['Priya', 'Patel'], ['Rohan', 'Mehta'], ['Divya', 'Singh'], ['Aditya', 'Gupta'],
  ['Ananya', 'Kapoor'], ['Vikram', 'Nair'], ['Sneha', 'Iyer'], ['Kunal', 'Verma'], ['Pooja', 'Reddy'],
  ['Rahul', 'Joshi'], ['Kavya', 'Menon'], ['Amit', 'Bose'], ['Shreya', 'Das'], ['Nikhil', 'Pillai'],
  ['Ritika', 'Shah'], ['Siddharth', 'Rao'], ['Meghna', 'Patil'], ['Abhishek', 'Saxena'], ['Aishwarya', 'Kumar'],
  ['Varun', 'Tiwari'], ['Nandini', 'Choudhary'], ['Rajesh', 'Kulkarni'], ['Swati', 'Desai'], ['Harsh', 'Pandey'],
  ['Pallavi', 'Shukla'], ['Deepak', 'Srivastava'], ['Megha', 'Agarwal'], ['Sandeep', 'Bhatt'], ['Ritu', 'Malhotra'],
  ['Vivek', 'Chatterjee'], ['Neha', 'Mishra'], ['Manish', 'Tandon'], ['Sunita', 'Dubey'], ['Gaurav', 'Tripathi'],
  ['Ankita', 'Bajaj'], ['Suresh', 'Bhatia'], ['Rekha', 'Walia'], ['Mohit', 'Arora'], ['Tanya', 'Grover'],
  ['Piyush', 'Sood'], ['Smita', 'Hegde'], ['Dhruv', 'Chopra'], ['Rashmi', 'Kaur'], ['Yash', 'Ahuja'],
  ['Kratika', 'Sinha'], ['Tarun', 'Gill'], ['Sudha', 'Nambiar'], ['Jigar', 'Modi'], ['Leela', 'Pillai'],
];

const employees = [];
for (let i = 0; i < 50; i++) {
  const deptIdx = i % 6;
  const dept = departments[deptIdx];
  const desgOptions = createdDesignations.filter((d) => d.departmentId.equals(dept._id));
  const desg = desgOptions[Math.min(Math.floor(Math.random() * 3), desgOptions.length - 1)];
  const [firstName, lastName] = indianNames[i];

  employees.push({
    companyId: company._id,
    employeeCode: `EMP-${String(i + 1).padStart(4, '0')}`,
    userId: i < 5 ? users[i]._id : undefined,
    departmentId: dept._id,
    designationId: desg._id,
    managerId: i >= 6 ? employees[deptIdx]?._id : undefined,
    firstName, lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@fwcit.com`,
    gender: i % 3 === 0 ? 'female' : 'male',
    dateJoined: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000),
    employmentType: i < 45 ? 'full_time' : (i < 48 ? 'contract' : 'intern'),
    employmentStatus: 'active',
  });
}
const createdEmployees = await Employee.insertMany(employees);

// 7. SalaryStructures (50)
await SalaryStructure.insertMany(createdEmployees.map((emp) => {
  const ctc = 400000 + Math.floor(Math.random() * 2600000);
  const basic = Math.round(ctc * 0.4);
  return {
    employeeId: emp._id, effectiveFrom: emp.dateJoined, ctc, basic,
    hra: Math.round(basic * 0.5), da: Math.round(basic * 0.1),
    isActive: true, createdBy: users[1]._id,
  };
}));

// 8. LeaveTypes (5)
const leaveTypes = await LeaveType.insertMany([
  { companyId: company._id, name: 'Annual Leave', code: 'AL', annualAllowance: 21, carryForward: true, maxCarryForward: 5 },
  { companyId: company._id, name: 'Sick Leave', code: 'SL', annualAllowance: 12, requiresDocument: true },
  { companyId: company._id, name: 'Casual Leave', code: 'CL', annualAllowance: 8 },
  { companyId: company._id, name: 'Maternity Leave', code: 'ML', annualAllowance: 182, genderSpecific: 'female' },
  { companyId: company._id, name: 'Paternity Leave', code: 'PL', annualAllowance: 15, genderSpecific: 'male' },
]);

// 9. LeaveBalances (50 employees × 5 leave types)
const leaveBalances = [];
for (const emp of createdEmployees) {
  for (const lt of leaveTypes) {
    leaveBalances.push({
      employeeId: emp._id, leaveTypeId: lt._id, year: new Date().getFullYear(),
      totalAllocated: lt.annualAllowance,
      used: Math.floor(Math.random() * (lt.annualAllowance / 3)),
    });
  }
}
await LeaveBalance.insertMany(leaveBalances);

// 10. 3 months of AttendanceRecords
const now = new Date();
const attendanceRecords = [];
for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
  const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    if (date > now) break;
    const dow = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;

    for (const emp of createdEmployees) {
      const rand = Math.random();
      let status, checkIn, checkOut;

      if (isWeekend) {
        status = 'weekend';
      } else if (rand < 0.92) {
        status = 'present';
        const isLate = Math.random() < 0.05;
        checkIn = new Date(date); checkIn.setHours(isLate ? 10 : 9, Math.floor(Math.random() * 30));
        checkOut = new Date(date); checkOut.setHours(18, Math.floor(Math.random() * 30));
      } else if (rand < 0.97) {
        status = 'absent';
      } else {
        status = 'half_day';
        checkIn = new Date(date); checkIn.setHours(9, 30);
        checkOut = new Date(date); checkOut.setHours(13, 30);
      }

      attendanceRecords.push({
        employeeId: emp._id, date,
        checkInTime: checkIn, checkOutTime: checkOut,
        workingHours: checkIn && checkOut ? (checkOut - checkIn) / 3600000 : 0,
        status,
      });
    }
  }
}
await AttendanceRecord.insertMany(attendanceRecords);
console.log(`[Seed] ${attendanceRecords.length} attendance records created`);

// 11. JobPostings (5)
const jobs = await JobPosting.insertMany([
  { companyId: company._id, departmentId: departments[0]._id, title: 'Senior Backend Engineer', description: 'Build scalable Node.js services.', requiredSkills: ['Node.js', 'Express', 'MongoDB'], openings: 2, status: 'active', createdBy: users[2]._id },
  { companyId: company._id, departmentId: departments[1]._id, title: 'HR Business Partner', description: 'Partner with business units on HR strategy.', requiredSkills: ['HRBP', 'Talent Management'], openings: 1, status: 'active', createdBy: users[2]._id },
  { companyId: company._id, departmentId: departments[2]._id, title: 'Financial Analyst', description: 'Financial modeling and reporting.', requiredSkills: ['Excel', 'Financial Modelling', 'SAP'], openings: 1, status: 'active', createdBy: users[2]._id },
  { companyId: company._id, departmentId: departments[3]._id, title: 'Product Marketing Manager', description: 'Drive product go-to-market strategy.', requiredSkills: ['GTM', 'Content', 'Analytics'], openings: 1, status: 'active', createdBy: users[2]._id },
  { companyId: company._id, departmentId: departments[4]._id, title: 'Operations Lead', description: 'Streamline operational processes.', requiredSkills: ['Process Improvement', 'Six Sigma'], openings: 1, status: 'active', createdBy: users[2]._id },
]);

// 12. Candidates (4 per job = 20 total)
const candidateSeeds = [];
for (const job of jobs) {
  const scores = [
    { score: 91, rec: 'strong_yes', stage: 'shortlisted' },
    { score: 76, rec: 'yes', stage: 'ai_screening' },
    { score: 58, rec: 'maybe', stage: 'ai_screening' },
    { score: 38, rec: 'no', stage: 'ai_screening' },
  ];
  for (const { score, rec, stage } of scores) {
    candidateSeeds.push({
      jobPostingId: job._id,
      firstName: indianNames[Math.floor(Math.random() * indianNames.length)][0],
      lastName: indianNames[Math.floor(Math.random() * indianNames.length)][1],
      email: `candidate.${Date.now()}.${score}.${Math.floor(Math.random() * 1e6)}@external.com`,
      yearsExperience: Math.floor(Math.random() * 10) + 1,
      source: 'portal', stage,
      aiScore: score, aiSkillMatch: score - 5, aiExpMatch: score + 3, aiEduMatch: score - 2, aiCultureFit: score - 8,
      aiRecommendation: rec,
      aiSummary: `Candidate scored ${score}/100. Recommendation: ${rec}.`,
      aiScreenedAt: new Date(),
    });
  }
}
await Candidate.insertMany(candidateSeeds);

// 13. Policy Documents (5 — embeddings generated at upload time via the API)
await Document.insertMany([
  { companyId: company._id, title: 'Leave Policy 2025', fileUrl: 'seed/leave-policy.pdf', fileType: 'pdf', category: 'policy', contentText: 'Employees are entitled to 21 annual leave days per year. Carry-forward of up to 5 days is permitted. Sick leave requires a medical certificate for absences exceeding 2 consecutive days.', embedding: [], uploadedBy: users[1]._id },
  { companyId: company._id, title: 'Work From Home Policy', fileUrl: 'seed/wfh-policy.pdf', fileType: 'pdf', category: 'policy', contentText: 'Employees may work from home up to 2 days per week subject to manager approval. Core hours are 10 AM to 4 PM IST regardless of location.', embedding: [], uploadedBy: users[1]._id },
  { companyId: company._id, title: 'Code of Conduct', fileUrl: 'seed/code-of-conduct.pdf', fileType: 'pdf', category: 'compliance', contentText: 'All employees are expected to maintain professional conduct and uphold the company values of integrity, collaboration, and innovation.', embedding: [], uploadedBy: users[1]._id },
  { companyId: company._id, title: 'Employee Benefits Guide', fileUrl: 'seed/benefits.pdf', fileType: 'pdf', category: 'policy', contentText: 'Health insurance covers employee and immediate family members. Reimbursement for professional certifications up to ₹50,000 per year. Flexi-fuel allowance of ₹3,000/month for senior roles.', embedding: [], uploadedBy: users[1]._id },
  { companyId: company._id, title: 'Performance Review Guidelines', fileUrl: 'seed/performance.pdf', fileType: 'pdf', category: 'policy', contentText: 'Annual performance reviews are conducted in Q4. Mid-year check-ins are mandatory for all employees. Ratings are on a 1-5 scale. Promotion eligibility requires a minimum rating of 4 for two consecutive cycles.', embedding: [], uploadedBy: users[1]._id },
]);

console.log('✅ Seed completed: 1 company, 5 users, 50 employees, 30 designations, 5 jobs, 20 candidates, 5 policy docs');
await mongoose.disconnect();
process.exit(0);
