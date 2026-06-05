import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';
import { Employee, ApiResponse } from '@/types';

interface EmployeeListParams {
  page?: number;
  perPage?: number;
  search?: string;
  department?: string;
  status?: string;
  employmentType?: string;
}

// ── LIST ─────────────────────────────────────────────────
export const useEmployees = (params: EmployeeListParams = {}) =>
  useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Employee[]>>('/employees', { params });
      return data;
    },
    placeholderData: (prev) => prev, // keepPreviousData (v5)
  });

// ── SINGLE ───────────────────────────────────────────────
export const useEmployee = (id: string) =>
  useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Employee>>(`/employees/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

// ── ME ───────────────────────────────────────────────────
export const useMyProfile = () =>
  useQuery({
    queryKey: ['employees', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Employee>>('/employees/me');
      return data.data;
    },
  });

// ── ORG TREE ─────────────────────────────────────────────
export const useOrgTree = (id: string) =>
  useQuery({
    queryKey: ['employees', id, 'org-tree'],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}/org-tree`);
      return data.data;
    },
    enabled: !!id,
  });

// ── DEPARTMENTS ──────────────────────────────────────────
export const useDepartments = () =>
  useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data.data as Array<{ _id: string; name: string; code?: string }>;
    },
    staleTime: Infinity,
  });

// ── DESIGNATIONS ─────────────────────────────────────────
export const useDesignations = (departmentId?: string) =>
  useQuery({
    queryKey: ['designations', departmentId],
    queryFn: async () => {
      const { data } = await api.get('/designations', { params: { departmentId } });
      return data.data as Array<{ _id: string; name: string; level?: number }>;
    },
    staleTime: Infinity,
  });

// ── CREATE ───────────────────────────────────────────────
export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Employee>) => api.post('/employees', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to create employee');
    },
  });
};

// ── UPDATE (backend uses PUT) ────────────────────────────
export const useUpdateEmployee = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Employee>) => api.put(`/employees/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to update employee'),
  });
};

// ── SOFT DELETE ──────────────────────────────────────────
export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deactivated');
    },
    onError: () => toast.error('Failed to delete employee'),
  });
};
