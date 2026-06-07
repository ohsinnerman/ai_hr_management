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
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const PIPELINE_ORDER = ['applied', 'ai_screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-stone-300', ai_screening: 'bg-sky-400', shortlisted: 'bg-indigo-400',
  interview: 'bg-accent', offer: 'bg-amber-500', hired: 'bg-emerald-500', rejected: 'bg-red-400',
};

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError } = useRecruiterDashboard();
  const gridRef = useStaggerCards();

  const pipelineMap = new Map((data?.candidatePipeline ?? []).map((p) => [p._id, p.count]));
  const totalPipeline = (data?.candidatePipeline ?? []).reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Recruiter Dashboard" description="Your hiring pipeline at a glance" />

      {isError ? (
        <ErrorState message="We couldn't load the recruiter dashboard. Please try again." />
      ) : (
        <div ref={gridRef}>
          {/* Candidate Pipeline Funnel */}
          <Card className="bento-full mb-6" data-animate>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> Candidate Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-full rounded-xl" />
              ) : totalPipeline === 0 ? (
                <EmptyState icon={<Users className="w-7 h-7" />} title="No candidates yet" description="Pipeline stages will populate as candidates apply." />
              ) : (
                <div className="mt-2">
                  <div className="flex h-10 w-full overflow-hidden rounded-xl shadow-inner-glow bg-surface-2 border border-border/50">
                    {PIPELINE_ORDER.filter((s) => (pipelineMap.get(s) ?? 0) > 0).map((stage) => {
                      const count = pipelineMap.get(stage) ?? 0;
                      return (
                        <div
                          key={stage}
                          className={cn('flex items-center justify-center text-[11px] font-bold tracking-wider text-white transition-all duration-500 ease-out hover:opacity-90', STAGE_COLORS[stage])}
                          style={{ width: `${(count / totalPipeline) * 100}%` }}
                          title={`${stage}: ${count}`}
                        >
                          {count > 0 && (count / totalPipeline > 0.05) ? count : ''}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                    {PIPELINE_ORDER.filter((s) => (pipelineMap.get(s) ?? 0) > 0).map((stage) => (
                      <div key={stage} className="flex items-center gap-1.5 text-xs text-muted font-medium bg-surface-2 px-2 py-1 rounded-md">
                        <span className={cn('w-2.5 h-2.5 rounded-full', STAGE_COLORS[stage])} />
                        <span className="capitalize">{stage.replace('_', ' ')}</span>
                        <span className="font-bold text-primary-dark ml-1">{pipelineMap.get(stage)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Jobs */}
            <Card className="lg:col-span-8" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Active Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
                ) : !data?.activeJobs?.length ? (
                  <EmptyState icon={<Briefcase className="w-7 h-7" />} title="No active jobs" />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    {data.activeJobs.map((job) => (
                      <div key={job._id} className="border border-border/40 bg-surface-2 rounded-xl p-4 hover:shadow-sm hover:border-accent/20 transition-all duration-300">
                        <p className="font-semibold text-primary-dark text-sm">{job.title}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[11px] font-medium text-muted uppercase tracking-wider">
                            {job.filledCount}/{job.openings} filled
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Interviews */}
            <Card className="lg:col-span-4" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent-dark" /> Today&apos;s Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 mt-4">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : !data?.todayInterviews?.length ? (
                  <EmptyState icon={<Calendar className="w-7 h-7" />} title="No interviews today" className="py-8" />
                ) : (
                  <div className="space-y-3 mt-4">
                    {data.todayInterviews.map((iv) => (
                      <div key={iv._id} className="flex flex-col border border-border/40 bg-surface-2 rounded-xl p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-accent-dark bg-accent/10 px-2 py-0.5 rounded">{format(new Date(iv.scheduledAt), 'h:mm a')}</span>
                           <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">{iv.type ?? 'interview'}</span>
                        </div>
                        <p className="text-sm font-semibold text-primary-dark">
                          {iv.candidateId ? `${iv.candidateId.firstName} ${iv.candidateId.lastName}` : 'Candidate'}
                        </p>
                        <p className="text-[11px] text-muted font-medium mt-0.5 truncate">{iv.jobPostingId?.title ?? ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top AI-screened candidates */}
          <Card className="bento-full mt-6" data-animate>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" /> Top AI-Screened Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 mt-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : !data?.topCandidates?.length ? (
                <EmptyState icon={<Star className="w-7 h-7" />} title="No high-scoring candidates yet" description="Candidates scoring 85+ from AI screening appear here." className="py-8" />
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted border-b border-border/50">
                        <th className="py-3 font-medium px-2">Candidate</th>
                        <th className="py-3 font-medium">Job</th>
                        <th className="py-3 font-medium text-right px-2">AI Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCandidates.map((c) => (
                        <tr key={c._id} className="border-b border-border/30 last:border-0 hover:bg-surface-2/50 transition-colors">
                          <td className="py-3 px-2">
                            <p className="font-semibold text-primary-dark">{c.firstName} {c.lastName}</p>
                          </td>
                          <td className="py-3 text-muted">{c.jobPostingId?.title ?? ''}</td>
                          <td className="py-3 text-right px-2 text-base font-extrabold text-success">
                            {c.aiScore != null ? Math.round(c.aiScore) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
