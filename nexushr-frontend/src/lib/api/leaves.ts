import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';
import { LeaveBalance, LeaveType, LeaveRequest } from '@/types';

export const useLeaveTypes = () =>
  useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data } = await api.get('/leaves/types');
      return data.data as LeaveType[];
    },
    staleTime: Infinity,
  });

export const useLeaveBalances = (employeeId?: string, year?: number) =>
  useQuery({
    queryKey: ['leave-balances', employeeId, year ?? new Date().getFullYear()],
    queryFn: async () => {
      const { data } = await api.get('/leaves/balance', {
        params: { employeeId, year: year ?? new Date().getFullYear() },
      });
      return data.data as LeaveBalance[];
    },
  });

// Backend GET /leaves is role-scoped: employee→own, manager→team, HR→company. Returns an array.
export const useMyLeaves = (params?: { status?: string }) =>
  useQuery({
    queryKey: ['leaves', 'mine', params],
    queryFn: async () => {
      const { data } = await api.get('/leaves', { params });
      return data.data as LeaveRequest[];
    },
  });

export const usePendingLeaves = () =>
  useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: async () => {
      const { data } = await api.get('/leaves', { params: { status: 'pending' } });
      return data.data as LeaveRequest[];
    },
  });

export const useApplyLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { leaveTypeId: string; startDate: string; endDate: string; reason?: string }) =>
      api.post('/leaves/request', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave application submitted!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to apply for leave'),
  });
};

export const useReviewLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: 'approve' | 'reject'; comment?: string }) =>
      api.patch(`/leaves/${id}/approve`, { action, comment }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success(variables.action === 'approve' ? 'Leave approved ✓' : 'Leave rejected');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to update leave status'),
  });
};
