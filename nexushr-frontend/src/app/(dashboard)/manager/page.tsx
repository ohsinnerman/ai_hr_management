'use client';

import { Users, UserCheck, UserX, Clock, Calendar, Star } from 'lucide-react';
import { useManagerDashboard } from '@/lib/api/dashboard';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, formatDate } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const statusDot: Record<string, string> = {
  present: 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]', 
  absent: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]', 
  on_leave: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
  half_day: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]', 
  holiday: 'bg-slate-300', 
  weekend: 'bg-slate-300',
};

export default function ManagerDashboardPage() {
  const { data, isLoading, isError } = useManagerDashboard();
  const gridRef = useStaggerCards();
  const s = data?.attendanceSummary;

  return (
    <div className="space-y-8">
      <PageHeader title="Manager Dashboard" description="Your team at a glance" />

      {isError ? (
        <ErrorState message="We couldn't load your team dashboard. Please try again." />
      ) : (
        <div ref={gridRef}>
          <div className="bento-grid mb-6" data-animate>
            <div className="bento-sm">
              <StatsCard title="Team Size" value={data?.teamSize ?? 0} icon={<Users className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" isLoading={isLoading} />
            </div>
            <div className="bento-sm">
              <StatsCard title="Present Today" value={s?.present ?? 0} icon={<UserCheck className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50" isLoading={isLoading} />
            </div>
            <div className="bento-sm">
              <StatsCard title="Absent Today" value={s?.absent ?? 0} icon={<UserX className="w-6 h-6 text-red-500" />} iconBg="bg-red-50" isLoading={isLoading} />
            </div>
            <div className="bento-sm">
              <StatsCard title="Late Today" value={s?.late ?? 0} icon={<Clock className="w-6 h-6 text-amber-500" />} iconBg="bg-amber-50" isLoading={isLoading} variant="accent" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Team Attendance */}
            <Card className="lg:col-span-8" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark">Team Attendance Today</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex gap-3 mt-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-28 rounded-full" />)}</div>
                ) : !data?.teamAttendance?.length ? (
                  <EmptyState icon={<Users className="w-7 h-7" />} title="No attendance records" description="No direct reports have attendance logged today." className="py-8" />
                ) : (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {data.teamAttendance.map((a) => (
                      <div key={a._id} className="flex items-center gap-2.5 border border-border/50 bg-surface-2 rounded-full pl-1.5 pr-4 py-1.5 hover:shadow-sm transition-shadow">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {getInitials(a.employeeId?.firstName ?? '?', a.employeeId?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-primary-dark">
                          {a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : 'Member'}
                        </span>
                        <div className="w-[1px] h-3 bg-border/80 mx-0.5" />
                        <span className={`w-2.5 h-2.5 rounded-full ${statusDot[a.status] ?? 'bg-slate-300'}`} title={a.status.replace('_', ' ')} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Leave Approvals */}
            <Card className="lg:col-span-4" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Pending Leaves
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 mt-4">{[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
                ) : !data?.pendingLeaves?.length ? (
                  <EmptyState icon={<Calendar className="w-7 h-7" />} title="No pending approvals" className="py-8" />
                ) : (
                  <div className="space-y-3 mt-4">
                    {data.pendingLeaves.map((l) => (
                      <div key={l._id} className="flex items-center justify-between border border-border/40 bg-surface-2 rounded-xl px-4 py-3 hover:shadow-sm transition-all">
                        <div>
                          <p className="text-sm font-semibold text-primary-dark">
                            {l.employeeId ? `${l.employeeId.firstName} ${l.employeeId.lastName}` : 'Employee'}
                          </p>
                          <p className="text-[11px] font-medium text-muted mt-1 uppercase tracking-wide">
                            {l.leaveTypeId?.name ?? 'Leave'} · {formatDate(l.startDate)}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-accent-dark bg-accent/10 px-2.5 py-1 rounded-md">{l.totalDays}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Reviews */}
          <Card className="bento-full mt-6" data-animate>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" /> Reviews Awaiting Your Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-full mt-4 rounded-xl" />
              ) : !data?.pendingReviews?.length ? (
                <EmptyState icon={<Star className="w-7 h-7" />} title="No reviews awaiting you" className="py-8" />
              ) : (
                <div className="space-y-3 mt-4">
                  {data.pendingReviews.map((r) => (
                    <div key={r._id} className="flex items-center justify-between bg-surface-2 p-3 rounded-xl border border-border/30 hover:bg-surface-3 transition-colors cursor-pointer">
                      <p className="font-semibold text-primary-dark text-sm">
                        {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : 'Employee'}
                      </p>
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider bg-white px-3 py-1 rounded shadow-sm">{r.reviewCycle}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
