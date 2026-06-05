import { useQuery } from '@tanstack/react-query';
import api from './client';

// ── Types mirror the real backend (src/modules/dashboard/dashboard.service.js) ──

export interface AdminDashboardData {
  kpis: {
    totalEmployees: number;
    newHiresThisMonth: number;
    activeJobs: number;
    pendingLeaves: number;
    todayPresent: number;
    attritionCount: number;
  };
  lastPayrollRun?: {
    periodStart: string;
    periodEnd: string;
    totalNet: number;
    employeeCount: number;
    status: string;
  } | null;
  deptBreakdown: Array<{ name?: string; count: number }>;
  headcountTrend: Array<{ _id: { year: number; month: number }; count: number }>;
}

export interface HrDashboardData {
  pendingLeaves: number;
  todayAbsent: number;
  todayLate: number;
  pendingPayrolls: number;
  reviewsPending: number;
  recentCandidates: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    stage: string;
    aiScore?: number;
    jobPostingId?: { title?: string };
    createdAt: string;
  }>;
}

export interface RecruiterDashboardData {
  activeJobs: Array<{ _id: string; title: string; openings: number; filledCount: number; status: string }>;
  candidatePipeline: Array<{ _id: string; count: number }>;
  todayInterviews: Array<{
    _id: string;
    scheduledAt: string;
    type?: string;
    candidateId?: { firstName: string; lastName: string };
    jobPostingId?: { title?: string };
  }>;
  topCandidates: Array<{ _id: string; firstName: string; lastName: string; aiScore?: number; jobPostingId?: { title?: string } }>;
}

interface TeamMemberAttendance {
  _id: string;
  status: string;
  isLate?: boolean;
  checkInTime?: string;
  employeeId?: { firstName: string; lastName: string; profilePhotoUrl?: string };
}

export interface ManagerDashboardData {
  teamSize: number;
  attendanceSummary: { present: number; absent: number; late: number; total: number };
  teamAttendance: TeamMemberAttendance[];
  pendingLeaves: Array<{
    _id: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    employeeId?: { firstName: string; lastName: string };
    leaveTypeId?: { name: string; colorCode?: string };
  }>;
  pendingReviews: Array<{ _id: string; reviewCycle: string; employeeId?: { firstName: string; lastName: string } }>;
}

export interface EmployeeDashboardData {
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    departmentId?: { name?: string };
    designationId?: { name?: string };
    employmentStatus: string;
  };
  todayAttendance?: { status: string; checkInTime?: string; checkOutTime?: string; workingHours?: number } | null;
  leaveBalances: Array<{
    _id: string;
    year: number;
    totalAllocated: number;
    used: number;
    pending: number;
    carriedForward?: number;
    leaveTypeId?: { name: string; code?: string; colorCode?: string; annualAllowance?: number };
  }>;
  recentLeaves: Array<{ _id: string; startDate: string; endDate: string; totalDays: number; status: string; leaveTypeId?: { name: string } }>;
  lastPayslip?: {
    netSalary: number;
    grossSalary: number;
    payrollRunId?: { periodStart: string; periodEnd: string };
  } | null;
  myReviews: Array<{ _id: string; reviewCycle: string; status: string; finalRating?: number }>;
}

const fetcher = <T>(url: string) => async (): Promise<T> => {
  const { data } = await api.get<{ success: true; data: T }>(url);
  return data.data;
};

export const useAdminDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'admin'], queryFn: fetcher<AdminDashboardData>('/dashboard/admin'), staleTime: 1000 * 60 * 5 });

export const useHrDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'hr'], queryFn: fetcher<HrDashboardData>('/dashboard/hr') });

export const useRecruiterDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'recruiter'], queryFn: fetcher<RecruiterDashboardData>('/dashboard/recruiter') });

export const useManagerDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'manager'], queryFn: fetcher<ManagerDashboardData>('/dashboard/manager') });

export const useEmployeeDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'employee'], queryFn: fetcher<EmployeeDashboardData>('/dashboard/employee') });
