'use client';

import { Users, Briefcase, TrendingDown, Clock, DollarSign, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAdminDashboard } from '@/lib/api/dashboard';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DEPT_COLORS = ['#1a3a6b', '#2d5a9e', '#f59e0b', '#16a34a', '#0ea5e9', '#8b5cf6'];

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  const headcountData =
    data?.headcountTrend.map((item) => ({
      month: format(new Date(item._id.year, item._id.month - 1), 'MMM yy'),
      joiners: item.count,
    })) ?? [];

  const deptData = (data?.deptBreakdown ?? []).map((d) => ({ name: d.name ?? 'Unassigned', count: d.count }));

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Company-wide overview — FWC IT Services Pvt. Ltd." />

      {isError ? (
        <ErrorState message="We couldn't load the admin dashboard. Please try again." />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard title="Total Employees" value={data?.kpis.totalEmployees ?? '—'} icon={<Users className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" isLoading={isLoading} />
            <StatsCard title="New This Month" value={data?.kpis.newHiresThisMonth ?? '—'} icon={<UserCheck className="w-6 h-6 text-green-600" />} iconBg="bg-green-50" isLoading={isLoading} />
            <StatsCard title="Open Positions" value={data?.kpis.activeJobs ?? '—'} icon={<Briefcase className="w-6 h-6 text-accent" />} iconBg="bg-amber-50" isLoading={isLoading} />
            <StatsCard title="Pending Leaves" value={data?.kpis.pendingLeaves ?? '—'} icon={<Clock className="w-6 h-6 text-orange-500" />} iconBg="bg-orange-50" isLoading={isLoading} />
            <StatsCard title="Present Today" value={data?.kpis.todayPresent ?? '—'} icon={<Clock className="w-6 h-6 text-info" />} iconBg="bg-blue-50" isLoading={isLoading} />
            <StatsCard title="Attrition (90d)" value={data?.kpis.attritionCount ?? '—'} icon={<TrendingDown className="w-6 h-6 text-red-500" />} iconBg="bg-red-50" isLoading={isLoading} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark">Monthly Joiners (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : headcountData.length === 0 ? (
                  <p className="text-sm text-muted py-16 text-center">No joiner data for the last 6 months.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={headcountData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Bar dataKey="joiners" fill="#1a3a6b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark">Headcount by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full rounded-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deptData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {deptData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} employees`, 'Headcount']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Last Payroll Run */}
          {(data?.lastPayrollRun || isLoading) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary-dark flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Last Payroll Run
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex gap-8">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-32" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-8">
                    <div>
                      <p className="text-xs text-muted">Period</p>
                      <p className="text-sm font-semibold text-primary-dark">
                        {formatDate(data!.lastPayrollRun!.periodStart)} — {formatDate(data!.lastPayrollRun!.periodEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Total Net Payout</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(data!.lastPayrollRun!.totalNet)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Employees Paid</p>
                      <p className="text-sm font-semibold">{data!.lastPayrollRun!.employeeCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Status</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${data!.lastPayrollRun!.status === 'paid' ? 'badge-success' : 'badge-info'}`}>
                        {data!.lastPayrollRun!.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
