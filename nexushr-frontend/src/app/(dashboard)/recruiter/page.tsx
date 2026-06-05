'use client';

import { Briefcase, Calendar, Star, Users } from 'lucide-react';
import { useRecruiterDashboard } from '@/lib/api/dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PIPELINE_ORDER = ['applied', 'ai_screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-gray-400', ai_screening: 'bg-info', shortlisted: 'bg-primary-light',
  interview: 'bg-accent', offer: 'bg-amber-500', hired: 'bg-success', rejected: 'bg-danger',
};

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError } = useRecruiterDashboard();

  const pipelineMap = new Map((data?.candidatePipeline ?? []).map((p) => [p._id, p.count]));
  const totalPipeline = (data?.candidatePipeline ?? []).reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Recruiter Dashboard" description="Your hiring pipeline at a glance" />

      {isError ? (
        <ErrorState message="We couldn't load the recruiter dashboard. Please try again." />
      ) : (
        <>
          {/* Candidate Pipeline Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-primary-dark">Candidate Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : totalPipeline === 0 ? (
                <EmptyState icon={<Users className="w-7 h-7" />} title="No candidates yet" description="Pipeline stages will populate as candidates apply." />
              ) : (
                <>
                  <div className="flex h-8 w-full overflow-hidden rounded-lg">
                    {PIPELINE_ORDER.filter((s) => (pipelineMap.get(s) ?? 0) > 0).map((stage) => {
                      const count = pipelineMap.get(stage) ?? 0;
                      return (
                        <div
                          key={stage}
                          className={cn('flex items-center justify-center text-xs font-semibold text-white', STAGE_COLORS[stage])}
                          style={{ width: `${(count / totalPipeline) * 100}%` }}
                          title={`${stage}: ${count}`}
                        >
                          {count}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {PIPELINE_ORDER.filter((s) => (pipelineMap.get(s) ?? 0) > 0).map((stage) => (
                      <div key={stage} className="flex items-center gap-1.5 text-xs text-muted">
                        <span className={cn('w-2.5 h-2.5 rounded-full', STAGE_COLORS[stage])} />
                        <span className="capitalize">{stage.replace('_', ' ')}</span>
                        <span className="font-semibold text-primary-dark">{pipelineMap.get(stage)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Jobs */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : !data?.activeJobs?.length ? (
                  <EmptyState icon={<Briefcase className="w-7 h-7" />} title="No active jobs" />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {data.activeJobs.map((job) => (
                      <div key={job._id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <p className="font-medium text-primary-dark text-sm">{job.title}</p>
                        <p className="text-xs text-muted mt-1">
                          {job.filledCount}/{job.openings} filled · <span className="capitalize">{job.status}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Interviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Today&apos;s Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !data?.todayInterviews?.length ? (
                  <EmptyState icon={<Calendar className="w-7 h-7" />} title="No interviews today" className="py-8" />
                ) : (
                  <div className="space-y-2">
                    {data.todayInterviews.map((iv) => (
                      <div key={iv._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-primary-dark">
                            {iv.candidateId ? `${iv.candidateId.firstName} ${iv.candidateId.lastName}` : 'Candidate'}
                          </p>
                          <p className="text-xs text-muted">{iv.jobPostingId?.title ?? ''} · {iv.type ?? 'interview'}</p>
                        </div>
                        <span className="text-xs font-medium text-primary">{format(new Date(iv.scheduledAt), 'h:mm a')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top AI-screened candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" /> Top AI-Screened Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !data?.topCandidates?.length ? (
                <EmptyState icon={<Star className="w-7 h-7" />} title="No high-scoring candidates yet" description="Candidates scoring 85+ from AI screening appear here." className="py-8" />
              ) : (
                <div className="space-y-2">
                  {data.topCandidates.map((c) => (
                    <div key={c._id} className="flex items-center justify-between border-b border-gray-50 last:border-0 py-2">
                      <div>
                        <p className="text-sm font-medium text-primary-dark">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted">{c.jobPostingId?.title ?? ''}</p>
                      </div>
                      <span className="text-sm font-bold text-success">{c.aiScore != null ? Math.round(c.aiScore) : '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
