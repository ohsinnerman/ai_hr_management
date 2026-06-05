import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';
import { PerformanceReview, ApiResponse } from '@/types';

// Backend routes are under /performance (not /performance/reviews).

export const useMyReviews = () =>
  useQuery({
    queryKey: ['performance', 'reviews', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/performance/me');
      return data.data as PerformanceReview[];
    },
  });

export const useTeamReviews = () =>
  useQuery({
    queryKey: ['performance', 'reviews', 'team'],
    queryFn: async () => {
      const { data } = await api.get('/performance/team');
      return data.data as PerformanceReview[];
    },
  });

export const useAllReviews = (params?: { page?: number; perPage?: number }) =>
  useQuery({
    queryKey: ['performance', 'reviews', 'all', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PerformanceReview[]>>('/performance/all', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });

export const useReview = (id: string) =>
  useQuery({
    queryKey: ['performance', 'reviews', id],
    queryFn: async () => {
      const { data } = await api.get(`/performance/${id}`);
      return data.data as PerformanceReview;
    },
    enabled: !!id,
  });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      employeeId: string; reviewerId: string; reviewCycle: string;
      periodStart: string; periodEnd: string;
      kpis: Array<{ name: string; target: number; weight: number }>;
    }) => api.post('/performance', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance'] });
      toast.success('Performance review created!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to create review'),
  });
};

// Backend body: { selfRating, kpiSelfScores: [{ kpiIndex, score }], strengths, improvements, goalsNextPeriod }
export const useSubmitSelfReview = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      selfRating: number;
      kpiSelfScores: Array<{ kpiIndex: number; score: number }>;
      strengths: string;
      improvements: string;
      goalsNextPeriod: string;
    }) => api.patch(`/performance/${id}/self-review`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance'] });
      toast.success('Self review submitted!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to submit self review'),
  });
};

// Backend body: { managerRating, kpiManagerScores: [{ kpiIndex, score }], promotionFlag, salaryRevisionFlag }
export const useSubmitManagerReview = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      managerRating: number;
      kpiManagerScores: Array<{ kpiIndex: number; score: number }>;
      promotionFlag: boolean;
      salaryRevisionFlag: boolean;
    }) => api.patch(`/performance/${id}/manager-review`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance'] });
      toast.success('Manager review submitted!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to submit manager review'),
  });
};

// Backend body: { finalRating }
export const useCompleteReview = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { finalRating: number }) => api.patch(`/performance/${id}/complete`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance'] });
      toast.success('Review finalized and published!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to finalize review'),
  });
};
