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

const statusDot: Record<string, string> = {
  present: 'bg-success', absent: 'bg-danger', on_leave: 'bg-amber-500',
  half_day: 'bg-info', holiday: 'bg-gray-300', weekend: 'bg-gray-300',
};

export default function ManagerDashboardPage() {
  const { data, isLoading, isError } = useManagerDashboard();
  const s = data?.attendanceSummary;

  return (
    <div className="space-y-6">
      <PageHeader title="Manager Dashboard" description="Your team at a glance" />

      {isError ? (
        <ErrorState message="We couldn't load your team dashboard. Please try again." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Team Size" value={data?.teamSize ?? '—'} icon={<Users className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" isLoading={isLoading} />
            <StatsCard title="Present Today" value={s?.present ?? '—'} icon={<UserCheck className="w-6 h-6 text-green-600" />} iconBg="bg-green-50" isLoading={isLoading} />
            <StatsCard title="Absent Today" value={s?.absent ?? '—'} icon={<UserX className="w-6 h-6 text-red-500" />} iconBg="bg-red-50" isLoading={isLoading} />
            <StatsCard title="Late Today" value={s?.late ?? '—'} icon={<Clock className="w-6 h-6 text-amber-500" />} iconBg="bg-amber-50" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark">Team Attendance Today</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : !data?.teamAttendance?.length ? (
                  <EmptyState icon={<Users className="w-7 h-7" />} title="No attendance records" description="No direct reports have attendance logged today." className="py-8" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.teamAttendance.map((a) => (
                      <div key={a._id} className="flex items-center gap-2 border border-gray-100 rounded-full pl-1 pr-3 py-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {getInitials(a.employeeId?.firstName ?? '?', a.employeeId?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-primary-dark">
                          {a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : 'Member'}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${statusDot[a.status] ?? 'bg-gray-300'}`} title={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Leave Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Pending Leave Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !data?.pendingLeaves?.length ? (
                  <EmptyState icon={<Calendar className="w-7 h-7" />} title="No pending approvals" className="py-8" />
                ) : (
                  <div className="space-y-2">
                    {data.pendingLeaves.map((l) => (
                      <div key={l._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-primary-dark">
                            {l.employeeId ? `${l.employeeId.firstName} ${l.employeeId.lastName}` : 'Employee'}
                          </p>
                          <p className="text-xs text-muted">
                            {l.leaveTypeId?.name ?? 'Leave'} · {formatDate(l.startDate)} → {formatDate(l.endDate)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary">{l.totalDays}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" /> Reviews Awaiting Your Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !data?.pendingReviews?.length ? (
                <EmptyState icon={<Star className="w-7 h-7" />} title="No reviews awaiting you" className="py-8" />
              ) : (
                <div className="space-y-2">
                  {data.pendingReviews.map((r) => (
                    <div key={r._id} className="flex items-center justify-between border-b border-gray-50 last:border-0 py-2">
                      <p className="text-sm font-medium text-primary-dark">
                        {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : 'Employee'}
                      </p>
                      <span className="text-xs text-muted">{r.reviewCycle}</span>
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
