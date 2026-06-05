import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';
import type { AttendanceRecord } from '@/types';

type GeoLocation = { lat: number; lng: number; address?: string };

// Backend: GET /attendance?month=&year= → array (own records, or employeeId for privileged roles).
export const useMyAttendance = (month: number, year: number) =>
  useQuery({
    queryKey: ['attendance', 'me', year, month],
    queryFn: async () => {
      const { data } = await api.get('/attendance', { params: { month, year } });
      return data.data as AttendanceRecord[];
    },
  });

// Today's record is derived from the month array (backend has no ?date= filter).
export const useTeamAttendance = (employeeId: string, month: number, year: number) =>
  useQuery({
    queryKey: ['attendance', 'employee', employeeId, year, month],
    queryFn: async () => {
      const { data } = await api.get('/attendance', { params: { employeeId, month, year } });
      return data.data as AttendanceRecord[];
    },
    enabled: !!employeeId,
  });

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (location?: GeoLocation) => api.post('/attendance/check-in', { location }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('✅ Checked in successfully!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Check-in failed'),
  });
};

export const useCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (location?: GeoLocation) => api.post('/attendance/check-out', { location }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      const hours = res.data?.data?.workingHours?.toFixed?.(1);
      toast.success(`👋 Checked out! Total: ${hours ?? '—'}h`);
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Check-out failed. Please try again.'),
  });
};
