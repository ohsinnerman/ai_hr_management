// src/types/index.ts

export type UserRole = 'super_admin' | 'hr_manager' | 'recruiter' | 'senior_manager' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  permissions?: string[];
  employee?: Employee | null;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  settings: {
    timezone: string;
    currency: string;
    currencySymbol: string;
    fiscalYearStart: number;
    country: string;
    dateFormat: string;
    workingDaysPerWeek: number;
    attendanceCutoffTime: string;
  };
  subscription: 'trial' | 'starter' | 'professional' | 'enterprise';
}

export interface Department {
  _id: string;
  name: string;
  code?: string;
  headId?: string;
  isActive: boolean;
}

export interface Designation {
  _id: string;
  name: string;
  level?: number;
  departmentId?: string;
}

export interface Employee {
  _id: string;
  companyId: string;
  employeeCode: string;
  userId?: string;
  departmentId?: Department;
  designationId?: Designation;
  managerId?: Employee;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  dateJoined: string;
  dateLeft?: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  employmentStatus: 'active' | 'on_leave' | 'suspended' | 'terminated';
  profilePhotoUrl?: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'half_day' | 'holiday' | 'weekend' | 'on_leave';
  isLate: boolean;
  lateByMinutes: number;
}

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  annualAllowance: number;
  carryForward: boolean;
  colorCode: string;
}

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  leaveTypeId: LeaveType;
  year: number;
  totalAllocated: number;
  used: number;
  pending: number;
  carriedForward: number;
}

export interface LeaveRequest {
  _id: string;
  employeeId: Employee;
  leaveTypeId: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedAt: string;
}

export interface SalaryStructure {
  _id: string;
  employeeId: string;
  effectiveFrom: string;
  ctc: number;
  basic: number;
  hra: number;
  da: number;
  isActive: boolean;
}

export interface PayrollRun {
  _id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'processing' | 'processed' | 'approved' | 'paid';
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  processedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Payslip {
  _id: string;
  payrollRunId: PayrollRun;
  employeeId: Employee;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalWorkingDays: number;
  paidDays: number;
  pdfUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface JobPosting {
  _id: string;
  companyId: string;
  departmentId: Department;
  title: string;
  description: string;
  employmentType: string;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'filled';
  openings: number;
  filledCount: number;
  requiredSkills: string[];
  minExperienceYears?: number;
  createdAt: string;
}

export interface Candidate {
  _id: string;
  jobPostingId: JobPosting;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stage: 'applied' | 'ai_screening' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';
  aiScore?: number;
  aiSkillMatch?: number;
  aiExpMatch?: number;
  aiEduMatch?: number;
  aiCultureFit?: number;
  aiRecommendation?: 'strong_yes' | 'yes' | 'maybe' | 'no';
  aiSummary?: string;
  aiAnalysis?: Record<string, unknown>;
  resumeUrl?: string;
  createdAt: string;
}

export interface PerformanceReview {
  _id: string;
  employeeId: Employee;
  reviewerId: Employee;
  reviewCycle: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'self_review' | 'manager_review' | 'hr_review' | 'completed';
  selfRating?: number;
  managerRating?: number;
  finalRating?: number;
  kpis: Array<{
    name: string;
    target: number;
    achieved?: number;
    weight: number;
    selfScore?: number;
    managerScore?: number;
  }>;
  strengths?: string;
  improvements?: string;
  goalsNextPeriod?: string;
  aiRecommendation?: string;
  promotionFlag: boolean;
  salaryRevisionFlag: boolean;
  createdAt: string;
}

// API Response Envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
