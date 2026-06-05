import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';
import { Payslip, PayrollRun, ApiResponse } from '@/types';

// Backend: GET /payroll → runs[] + meta ; POST /payroll ; GET /payroll/:id/payslips → {run,payslips}
// ; PATCH /payroll/:id/approve. Employee payslips: GET /employees/me/payslips.

export const usePayrollRuns = (params?: { page?: number; perPage?: number }) =>
  useQuery({
    queryKey: ['payroll', 'runs', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PayrollRun[]>>('/payroll', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });

export const useRunPayslips = (runId: string) =>
  useQuery({
    queryKey: ['payroll', 'runs', runId, 'payslips'],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/${runId}/payslips`);
      return data.data as { run: PayrollRun; payslips: Payslip[] };
    },
    enabled: !!runId,
  });

export const useMyPayslips = () =>
  useQuery({
    queryKey: ['payroll', 'payslips', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me/payslips');
      return data.data as Payslip[];
    },
  });

export const useCreatePayrollRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { periodStart: string; periodEnd: string }) => api.post('/payroll', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll run initiated! Processing in background...');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to initiate payroll run'),
  });
};

// Fetches a short-lived signed URL for a published payslip PDF and opens it.
export const downloadMyPayslip = async (payslipId: string): Promise<string | null> => {
  try {
    const { data } = await api.get(`/employees/me/payslips/${payslipId}/download`);
    return (data?.data?.url as string) ?? null;
  } catch {
    return null;
  }
};

export const useApprovePayroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.patch(`/payroll/${runId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll approved and payslips published!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to approve payroll'),
  });
};
