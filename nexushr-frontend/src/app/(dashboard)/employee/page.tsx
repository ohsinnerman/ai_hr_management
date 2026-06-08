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
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const leaveStatusBadge: Record<string, string> = {
  pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error',
  cancelled: 'badge-neutral', draft: 'badge-neutral',
};

export default function EmployeeDashboardPage() {
  const { data, isLoading, isError } = useEmployeeDashboard();
  const gridRef = useStaggerCards();

  const checkedIn = !!data?.todayAttendance?.checkInTime;
  const checkedOut = !!data?.todayAttendance?.checkOutTime;

  return (
    <div className="space-y-8">
      <PageHeader
        title={isLoading ? 'My Dashboard' : `Welcome, ${data?.employee.firstName ?? ''}`}
        description={data?.employee ? `${data.employee.designationId?.name ?? ''}${data.employee.departmentId?.name ? ` · ${data.employee.departmentId.name}` : ''}` : 'Your personal overview'}
      />

      {isError ? (
        <ErrorState message="We couldn't load your dashboard. Please try again." />
      ) : (
        <div ref={gridRef}>
          <div className="bento-grid mb-6" data-animate>
            {/* Today's Attendance */}
            <Card className="bento-md card-dark text-white border-0 bg-primary-dark" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" /> Today&apos;s Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl bg-white/10" />
                ) : (
                  <div className="flex items-center gap-4 mt-2">
                    {checkedIn ? <CheckCircle2 className="w-12 h-12 text-accent" /> : <XCircle className="w-12 h-12 text-white/20" />}
                    <div>
                      <p className="text-lg font-bold text-white capitalize">
                        {data?.todayAttendance?.status ?? 'Not checked in'}
                      </p>
                      <p className="text-xs text-white/60 mt-1 font-medium">
                        {checkedIn ? `In: ${format(new Date(data!.todayAttendance!.checkInTime!), 'h:mm a')}` : 'No check-in yet'}
                        {checkedOut ? ` · Out: ${format(new Date(data!.todayAttendance!.checkOutTime!), 'h:mm a')}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Payslip */}
            <Card className="bento-md card-accent" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent-dark" /> Last Payslip
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl bg-black/5" />
                ) : !data?.lastPayslip ? (
                  <p className="text-sm text-primary-dark/60 py-4 font-medium">No published payslip yet.</p>
                ) : (
                  <div className="mt-2">
                    <p className="text-3xl font-extrabold text-primary-dark">{formatCurrency(data.lastPayslip.netSalary)}</p>
                    <p className="text-xs text-primary-dark/60 mt-2 font-medium">
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
            <Card className="bento-md" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" /> My Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : !data?.myReviews?.length ? (
                  <p className="text-sm text-muted py-4">No performance reviews yet.</p>
                ) : (
                  <div className="space-y-3 mt-2">
                    {data.myReviews.slice(0,2).map((r) => (
                      <div key={r._id} className="flex items-center justify-between text-sm bg-surface-2 p-3 rounded-xl">
                        <span className="font-semibold text-primary-dark">{r.reviewCycle}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted bg-white px-2 py-1 rounded-md shadow-sm">
                          {r.status.replace('_', ' ')}{r.finalRating ? ` · ${r.finalRating}/5` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Leave Balances */}
            <Card className="lg:col-span-7" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark">Leave Balances ({new Date().getFullYear()})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
                ) : !data?.leaveBalances?.length ? (
                  <EmptyState icon={<Calendar className="w-7 h-7" />} title="No leave balances" className="py-8" />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    {data.leaveBalances.map((b) => {
                      const available = b.totalAllocated - b.used - b.pending + (b.carriedForward ?? 0);
                      const pct = b.totalAllocated > 0 ? Math.max(0, Math.min(100, (available / b.totalAllocated) * 100)) : 0;
                      return (
                        <div key={b._id} className="bg-surface-2 rounded-xl p-4 border border-border/40 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary-dark">{b.leaveTypeId?.name ?? 'Leave'}</span>
                            <span className="text-xs font-semibold text-muted bg-white px-2 py-0.5 rounded-full">{available}/{b.totalAllocated}</span>
                          </div>
                          <div className="mt-3 h-2 w-full rounded-full bg-white overflow-hidden border border-border/50">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: b.leaveTypeId?.colorCode || '#f59e0b' }} />
                          </div>
                          <p className="text-[10px] uppercase tracking-wider font-medium text-muted mt-2">
                            {b.used} used · {b.pending} pending
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Leaves */}
            <Card className="lg:col-span-5" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark">Recent Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 mt-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : !data?.recentLeaves?.length ? (
                  <EmptyState icon={<Calendar className="w-7 h-7" />} title="No leave requests yet" className="py-8" />
                ) : (
                  <div className="space-y-3 mt-4">
                    {data.recentLeaves.map((l) => (
                      <div key={l._id} className="flex items-center justify-between bg-surface-2 p-3.5 rounded-xl border border-border/40 hover:shadow-sm transition-shadow">
                        <div>
                          <p className="text-sm font-semibold text-primary-dark">{l.leaveTypeId?.name ?? 'Leave'}</p>
                          <p className="text-[11px] font-medium text-muted mt-1">{formatDate(l.startDate)} → {formatDate(l.endDate)} · {l.totalDays}d</p>
                        </div>
                        <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border', leaveStatusBadge[l.status] ?? 'badge-neutral')}>
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
