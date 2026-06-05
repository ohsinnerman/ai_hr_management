import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './client';
import { JobPosting, Candidate, ApiResponse } from '@/types';

// All recruitment routes are mounted under /recruitment on the backend.

// ── JOBS ────────────────────────────────────────────────────
export const useJobs = (params?: { status?: string; department?: string; page?: number }) =>
  useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JobPosting[]>>('/recruitment/jobs', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });

export const useJob = (id: string) =>
  useQuery({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JobPosting>>(`/recruitment/jobs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

export interface JobPipeline {
  jobId: string;
  total: number;
  pipeline: Record<string, { count: number; candidates: Candidate[] }>;
}

export const useJobCandidates = (jobId: string) =>
  useQuery({
    queryKey: ['jobs', jobId, 'candidates'],
    queryFn: async () => {
      const { data } = await api.get(`/recruitment/jobs/${jobId}/candidates`);
      return data.data as JobPipeline;
    },
    enabled: !!jobId,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<JobPosting>) => api.post('/recruitment/jobs', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job posting created!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to create job posting'),
  });
};

export const usePublishJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.post(`/recruitment/jobs/${jobId}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job published successfully!');
    },
    onError: () => toast.error('Failed to publish job'),
  });
};

export const useCloseJob = () => {
  const qc = useQueryClient();
  return useMutation({
    // Backend update is PUT /recruitment/jobs/:id
    mutationFn: (jobId: string) => api.put(`/recruitment/jobs/${jobId}`, { status: 'closed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job closed');
    },
    onError: () => toast.error('Failed to close job'),
  });
};

// ── CANDIDATES ──────────────────────────────────────────────
export const useCandidate = (id: string) =>
  useQuery({
    queryKey: ['candidates', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Candidate>>(`/recruitment/candidates/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

export const useMoveCandidate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, note }: { id: string; stage: string; note?: string }) =>
      api.patch(`/recruitment/candidates/${id}/stage`, { stage, note }),
    onSuccess: (_, { stage }) => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success(`Candidate moved to ${stage.replace('_', ' ')} ✓`);
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to move candidate'),
  });
};

export const useUploadResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId, firstName, lastName, email, phone, file, source,
    }: {
      jobId: string; firstName: string; lastName: string; email: string; phone?: string; file: File; source?: string;
    }) => {
      const form = new FormData();
      form.append('jobId', jobId);
      form.append('firstName', firstName);
      form.append('lastName', lastName);
      form.append('email', email);
      if (phone) form.append('phone', phone);
      if (source) form.append('source', source);
      form.append('resume', file);
      return api.post('/recruitment/candidates', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: ['jobs', jobId, 'candidates'] });
      toast.success('Candidate added! AI screening has started.');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Failed to upload candidate resume'),
  });
};
