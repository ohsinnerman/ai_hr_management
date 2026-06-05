'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Briefcase, Users, Clock, MoreHorizontal, Eye, Check, X } from 'lucide-react';
import { useJobs, usePublishJob, useCloseJob, useCreateJob } from '@/lib/api/recruitment';
import { useDepartments } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, formatDate } from '@/lib/utils';
import type { JobPosting } from '@/types';

const jobSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
  departmentId: z.string().min(1, 'Department is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(20, 'Requirements are required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  location: z.string().min(2, 'Location is required'),
  openings: z.number().min(1).max(100),
  minExperienceYears: z.number().min(0).optional(),
  requiredSkills: z.string().optional(), // comma-separated; split at submit
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
});
type JobInput = z.infer<typeof jobSchema>;

const JOB_STATUS_COLORS: Record<string, string> = {
  draft: 'badge-neutral',
  active: 'badge-success',
  paused: 'badge-warning',
  closed: 'badge-error',
  filled: 'badge-info',
};

export default function JobsPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useJobs({ status: statusFilter });
  const { data: departments } = useDepartments();
  const createJob = useCreateJob();
  const publishJob = usePublishJob();
  const closeJob = useCloseJob();

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: { employmentType: 'full_time', openings: 1, minExperienceYears: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      requiredSkills: (values.requiredSkills ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    };
    await createJob.mutateAsync(payload as never);
    reset();
    setCreateOpen(false);
  });

  const jobs: JobPosting[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Postings"
        description="Manage open positions and recruitment pipeline"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Create Job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Job Posting</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Job Title *</Label>
                    <Input {...register('title')} placeholder="Senior Backend Engineer" />
                    {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Department *</Label>
                    <Select onValueChange={(v) => setValue('departmentId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{departments?.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Employment Type *</Label>
                    <Select defaultValue="full_time" onValueChange={(v) => setValue('employmentType', v as JobInput['employmentType'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location *</Label>
                    <Input {...register('location')} placeholder="Bengaluru, India" />
                    {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Number of Openings *</Label>
                    <Input {...register('openings', { valueAsNumber: true })} type="number" min={1} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Min. Experience (years)</Label>
                    <Input {...register('minExperienceYears', { valueAsNumber: true })} type="number" min={0} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Required Skills (comma-separated)</Label>
                    <Input {...register('requiredSkills')} placeholder="Node.js, React, MongoDB" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Job Description *</Label>
                    <Textarea {...register('description')} rows={4} placeholder="Describe the role, team, and impact..." className="resize-none" />
                    {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Requirements *</Label>
                    <Textarea {...register('requirements')} rows={3} placeholder="Experience, skills, qualifications..." className="resize-none" />
                    {errors.requirements && <p className="text-xs text-red-500">{errors.requirements.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Min. Salary (₹/year)</Label>
                    <Input {...register('salaryMin', { valueAsNumber: true })} type="number" placeholder="1200000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max. Salary (₹/year)</Label>
                    <Input {...register('salaryMax', { valueAsNumber: true })} type="number" placeholder="2500000" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={createJob.isPending}>
                    {createJob.isPending ? 'Creating...' : 'Create as Draft'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {[undefined, 'active', 'draft', 'paused', 'closed', 'filled'].map((s) => (
          <Button key={s ?? 'all'} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Jobs'}
          </Button>
        ))}
      </div>

      {/* Jobs grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card-elevated py-16 text-center text-muted text-sm">No job postings yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job._id} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', JOB_STATUS_COLORS[job.status])}>{job.status}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/recruiter/jobs/${job._id}`)}><Eye className="w-4 h-4 mr-2" /> View Pipeline</DropdownMenuItem>
                        {job.status === 'draft' && <DropdownMenuItem onClick={() => publishJob.mutate(job._id)}><Check className="w-4 h-4 mr-2" /> Publish</DropdownMenuItem>}
                        {job.status === 'active' && <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => closeJob.mutate(job._id)}><X className="w-4 h-4 mr-2" /> Close Job</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h3 className="font-semibold text-primary-dark text-sm mb-1 line-clamp-2">{job.title}</h3>
                <p className="text-xs text-muted mb-3">{(job.departmentId as { name?: string })?.name ?? '—'} • {job.employmentType.replace('_', ' ')}</p>

                <div className="flex items-center gap-4 text-xs text-muted border-t pt-3">
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{job.filledCount}/{job.openings} filled</span></div>
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{formatDate(job.createdAt)}</span></div>
                </div>

                {job.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.requiredSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full border border-primary/10">{skill}</span>
                    ))}
                    {job.requiredSkills.length > 4 && <span className="text-xs text-muted">+{job.requiredSkills.length - 4}</span>}
                  </div>
                )}

                <Button className="w-full mt-4 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all text-sm" onClick={() => router.push(`/recruiter/jobs/${job._id}`)}>
                  View Pipeline
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
