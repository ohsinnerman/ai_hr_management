import { useQuery } from '@tanstack/react-query';
import api from './client';

// ── Attrition risk ──────────────────────────────────────────
// Backend GET /analytics/attrition-risk returns a PLAIN ARRAY (Gemini output, cached 24h):
//   [{ employeeId, employeeName, riskLevel: 'high'|'medium'|'low', riskScore: 0-100,
//      primaryFactors: string[], recommendedAction: string }]
// (empty [] when the Gemini key is unconfigured / over quota.)
export interface AttritionRiskItem {
  employeeId: string;
  employeeName: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  primaryFactors: string[];
  recommendedAction: string;
}

export const useAttritionRisk = () =>
  useQuery({
    queryKey: ['analytics', 'attrition-risk'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/attrition-risk');
      return (data.data ?? []) as AttritionRiskItem[];
    },
    staleTime: 1000 * 60 * 60, // cached 24h on the backend
  });

// ── Recruitment funnel ──────────────────────────────────────
// Returns [{ _id: stage, count, avgAiScore }]
export interface FunnelStage {
  _id: string;
  count: number;
  avgAiScore?: number;
}
export const useRecruitmentFunnel = () =>
  useQuery({
    queryKey: ['analytics', 'recruitment-funnel'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/recruitment-funnel');
      return (data.data ?? []) as FunnelStage[];
    },
  });

// ── Payroll cost ────────────────────────────────────────────
// Returns [{ period: 'YYYY-MM', totalGross, totalDeductions, totalNet, employeeCount }]
export interface PayrollCostPoint {
  period: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}
export const usePayrollCost = (months = 6) =>
  useQuery({
    queryKey: ['analytics', 'payroll-cost', months],
    queryFn: async () => {
      const { data } = await api.get('/analytics/payroll-cost', { params: { months } });
      return (data.data ?? []) as PayrollCostPoint[];
    },
  });

// ── Attendance pattern ──────────────────────────────────────
// Returns { month, breakdown: [{ _id: status, count }], lateArrivals, avgWorkingHours }
export interface AttendancePattern {
  month: string;
  breakdown: Array<{ _id: string; count: number }>;
  lateArrivals: number;
  avgWorkingHours: number;
}
export const useAttendancePattern = (month: string) =>
  useQuery({
    queryKey: ['analytics', 'attendance-pattern', month],
    queryFn: async () => {
      const { data } = await api.get('/analytics/attendance-pattern', { params: { month } });
      return data.data as AttendancePattern;
    },
    enabled: !!month,
  });

// ── AI workforce insights (Gemini) — /ai/analytics/insights ──
export const useWorkforceInsights = () =>
  useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: async () => {
      const { data } = await api.get('/ai/analytics/insights');
      return data.data as { insights: string | null } | null;
    },
    staleTime: 1000 * 60 * 30,
  });
