'use client';

import { Clock, Calendar, DollarSign, CheckCircle2, XCircle, Star } from 'lucide-react';
import { useEmployeeDashboard } from '@/lib/api/dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { format } from 'date-fns';

const leaveStatusBadge: Record<string, string> = {
  pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error',
  cancelled: 'badge-neutral', draft: 'badge-neutral',
};

export default function EmployeeDashboardPage() {
  const { data, isLoading, isError } = useEmployeeDashboard();

  const checkedIn = !!data?.todayAttendance?.checkInTime;
  const checkedOut = !!data?.todayAttendance?.checkOutTime;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isLoading ? 'My Dashboard' : `Welcome, ${data?.employee.firstName ?? ''}`}
        description={data?.employee ? `${data.employee.designationId?.name ?? ''}${data.employee.departmentId?.name ? ` · ${data.employee.departmentId.name}` : ''}` : 'Your personal overview'}
      />

      {isError ? (
        <ErrorState message="We couldn't load your dashboard. Please try again." />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="flex items-center gap-3">
                    {checkedIn ? <CheckCircle2 className="w-10 h-10 text-success" /> : <XCircle className="w-10 h-10 text-muted/40" />}
                    <div>
                      <p className="text-sm font-semibold text-primary-dark capitalize">
                        {data?.todayAttendance?.status ?? 'Not checked in'}
                      </p>
                      <p className="text-xs text-muted">
                        {checkedIn ? `In: ${format(new Date(data!.todayAttendance!.checkInTime!), 'h:mm a')}` : 'No check-in yet'}
                        {checkedOut ? ` · Out: ${format(new Date(data!.todayAttendance!.checkOutTime!), 'h:mm a')}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Payslip */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Last Payslip
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : !data?.lastPayslip ? (
                  <p className="text-sm text-muted py-4">No published payslip yet.</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(data.lastPayslip.netSalary)}</p>
                    <p className="text-xs text-muted mt-1">
                      Net pay
                      {data.lastPayslip.payrollRunId
                        ? ` · ${formatDate(data.lastPayslip.payrollRunId.periodStart)} – ${formatDate(data.lastPayslip.payrollRunId.periodEnd)}`
                        : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" /> My Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : !data?.myReviews?.length ? (
                  <p className="text-sm text-muted py-4">No performance reviews yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.myReviews.map((r) => (
                      <div key={r._id} className="flex items-center justify-between text-sm">
                        <span className="text-primary-dark">{r.reviewCycle}</span>
                        <span className="text-xs text-muted capitalize">{r.status.replace('_', ' ')}{r.finalRating ? ` · ${r.finalRating}/5` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leave Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-primary-dark">Leave Balances ({new Date().getFullYear()})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : !data?.leaveBalances?.length ? (
                <EmptyState icon={<Calendar className="w-7 h-7" />} title="No leave balances" className="py-8" />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.leaveBalances.map((b) => {
                    const available = b.totalAllocated - b.used - b.pending + (b.carriedForward ?? 0);
                    const pct = b.totalAllocated > 0 ? Math.max(0, Math.min(100, (available / b.totalAllocated) * 100)) : 0;
                    return (
                      <div key={b._id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-primary-dark">{b.leaveTypeId?.name ?? 'Leave'}</span>
                          <span className="text-xs text-muted">{available}/{b.totalAllocated}</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.leaveTypeId?.colorCode || '#1a3a6b' }} />
                        </div>
                        <p className="text-xs text-muted mt-1.5">{b.used} used · {b.pending} pending</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leaves */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-primary-dark">Recent Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !data?.recentLeaves?.length ? (
                <EmptyState icon={<Calendar className="w-7 h-7" />} title="No leave requests yet" className="py-8" />
              ) : (
                <div className="space-y-2">
                  {data.recentLeaves.map((l) => (
                    <div key={l._id} className="flex items-center justify-between border-b border-gray-50 last:border-0 py-2">
                      <div>
                        <p className="text-sm font-medium text-primary-dark">{l.leaveTypeId?.name ?? 'Leave'}</p>
                        <p className="text-xs text-muted">{formatDate(l.startDate)} → {formatDate(l.endDate)} · {l.totalDays}d</p>
                      </div>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', leaveStatusBadge[l.status] ?? 'badge-neutral')}>
                        {l.status}
                      </span>
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
