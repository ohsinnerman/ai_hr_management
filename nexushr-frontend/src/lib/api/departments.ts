import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';

export interface Department {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  headId?: { firstName?: string; lastName?: string } | string;
}

export interface Designation {
  _id: string;
  name: string;
  level?: number;
  departmentId?: string;
}

export const useDepartmentsList = () =>
  useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data.data as Department[];
    },
  });

export const useDesignationsList = () =>
  useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const { data } = await api.get('/designations');
      return data.data as Designation[];
    },
  });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; code?: string; description?: string }) => api.post('/departments', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to create department'),
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; code?: string; description?: string }) =>
      api.put(`/departments/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated!');
    },
    onError: () => toast.error('Failed to update department'),
  });
};

export const useDeleteDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department removed');
    },
    onError: () => toast.error('Failed to remove department'),
  });
};
