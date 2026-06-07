'use client';

import { Calendar, UserX, Clock, DollarSign, Star, Users } from 'lucide-react';
import { useHrDashboard } from '@/lib/api/dashboard';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const stageBadge = (stage: string) => {
  const map: Record<string, string> = {
    applied: 'badge-neutral', ai_screening: 'badge-info', shortlisted: 'badge-info',
    interview: 'badge-warning', offer: 'badge-warning', hired: 'badge-success', rejected: 'badge-error',
  };
  return map[stage] ?? 'badge-neutral';
};

export default function HrDashboardPage() {
  const { data, isLoading, isError } = useHrDashboard();
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-8">
      <PageHeader title="HR Dashboard" description="People operations overview" />

      {isError ? (
        <ErrorState message="We couldn't load the HR dashboard. Please try again." />
      ) : (
        <div ref={gridRef}>
          <div className="bento-grid mb-6" data-animate>
            <div className="bento-sm">
              <StatsCard 
                title="Pending Leaves" 
                value={data?.pendingLeaves ?? 0} 
                icon={<Calendar className="w-6 h-6 text-orange-500" />} 
                iconBg="bg-orange-50" 
                isLoading={isLoading} 
              />
            </div>
            <div className="bento-sm">
              <StatsCard 
                title="Absent Today" 
                value={data?.todayAbsent ?? 0} 
                icon={<UserX className="w-6 h-6 text-red-500" />} 
                iconBg="bg-red-50" 
                isLoading={isLoading} 
              />
            </div>
            <div className="bento-sm">
              <StatsCard 
                title="Late Today" 
                value={data?.todayLate ?? 0} 
                icon={<Clock className="w-6 h-6 text-amber-500" />} 
                iconBg="bg-amber-50" 
                isLoading={isLoading} 
                variant="accent"
              />
            </div>
            <div className="bento-sm">
              <StatsCard 
                title="Pending Payrolls" 
                value={data?.pendingPayrolls ?? 0} 
                icon={<DollarSign className="w-6 h-6 text-primary" />} 
                iconBg="bg-primary/10" 
                isLoading={isLoading} 
              />
            </div>
            <div className="bento-sm">
              <StatsCard 
                title="Reviews Pending" 
                value={data?.reviewsPending ?? 0} 
                icon={<Star className="w-6 h-6 text-white" />} 
                iconBg="bg-white/10" 
                isLoading={isLoading}
                variant="dark"
              />
            </div>
          </div>

          <Card data-animate>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary-dark">Recent Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : !data?.recentCandidates?.length ? (
                <EmptyState icon={<Users className="w-7 h-7" />} title="No recent candidates" description="New applicants will appear here as they apply." />
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted border-b border-border/50">
                        <th className="py-3 font-medium px-2">Candidate</th>
                        <th className="py-3 font-medium">Job</th>
                        <th className="py-3 font-medium">Stage</th>
                        <th className="py-3 font-medium">AI Score</th>
                        <th className="py-3 font-medium text-right px-2">Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentCandidates.map((c) => (
                        <tr key={c._id} className="border-b border-border/30 last:border-0 hover:bg-surface-2/50 transition-colors">
                          <td className="py-3 px-2">
                            <p className="font-semibold text-primary-dark">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-muted">{c.email}</p>
                          </td>
                          <td className="py-3 text-muted">{c.jobPostingId?.title ?? '—'}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${stageBadge(c.stage)}`}>
                              {c.stage.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 font-extrabold text-primary-dark text-base">{c.aiScore != null ? Math.round(c.aiScore) : '—'}</td>
                          <td className="py-3 text-xs text-muted text-right px-2">{formatDate(c.createdAt)}</td>
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
