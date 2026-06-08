'use client';

import { Users, Briefcase, Clock, DollarSign, UserCheck, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { useAdminDashboard } from '@/lib/api/dashboard';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const DEPT_COLORS = ['#1a3a6b', '#2d5a9e', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899'];

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();
  const gridRef = useStaggerCards();

  const headcountData =
    data?.headcountTrend.map((item) => ({
      month: format(new Date(item._id.year, item._id.month - 1), 'MMM'),
      joiners: item.count,
    })) ?? [];

  const deptData = (data?.deptBreakdown ?? []).map((d) => ({ name: d.name ?? 'Unassigned', count: d.count }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${data?.kpis ? '' : ''}`}
        description="Company-wide overview — FWC IT Services Pvt. Ltd."
      />

      {isError ? (
        <ErrorState message="We couldn't load the admin dashboard. Please try again." />
      ) : (
        <div ref={gridRef}>
          {/* KPI Row — Bento Style */}
          <div className="bento-grid mb-6" data-animate>
            <div className="bento-sm">
              <StatsCard
                title="Employees"
                value={data?.kpis.totalEmployees ?? 0}
                icon={<Users className="w-6 h-6 text-primary" />}
                iconBg="bg-primary/10"
                isLoading={isLoading}
              />
            </div>
            <div className="bento-sm">
              <StatsCard
                title="New Hires"
                value={data?.kpis.newHiresThisMonth ?? 0}
                subtitle="this month"
                icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
                iconBg="bg-emerald-50"
                isLoading={isLoading}
              />
            </div>
            <div className="bento-sm">
              <StatsCard
                title="Open Positions"
                value={data?.kpis.activeJobs ?? 0}
                icon={<Briefcase className="w-6 h-6 text-accent-dark" />}
                iconBg="bg-accent/10"
                isLoading={isLoading}
                variant="accent"
              />
            </div>
            <div className="bento-sm">
              <StatsCard
                title="Present Today"
                value={data?.kpis.todayPresent ?? 0}
                icon={<Clock className="w-6 h-6 text-sky-600" />}
                iconBg="bg-sky-50"
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* Joiners Chart — large */}
            <Card className="lg:col-span-8" data-animate>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-primary-dark">Monthly Joiners</CardTitle>
                  <span className="text-xs text-muted font-medium">Last 6 months</span>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full rounded-xl" />
                ) : headcountData.length === 0 ? (
                  <p className="text-sm text-muted py-16 text-center">No joiner data for the last 6 months.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={headcountData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="joinersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece5" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737980' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#737980' }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e3dfd9',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(166,141,95,0.08)',
                          background: '#fefdfb',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="joiners"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fill="url(#joinersGradient)"
                        dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, stroke: '#fcd34d', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Dept Pie — small */}
            <Card className="lg:col-span-4" data-animate>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary-dark">By Department</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full rounded-xl" />
                ) : (
                  <div>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={deptData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          innerRadius={35}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {deptData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} employees`, 'Headcount']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e3dfd9', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {deptData.slice(0, 5).map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                          <span className="text-[10px] text-muted font-medium">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Pending Items — dark card */}
            <div className="lg:col-span-4 card-dark" data-animate>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">Quick Stats</p>
                <ArrowUpRight className="w-4 h-4 text-white/40" />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Pending Leaves', value: data?.kpis.pendingLeaves ?? 0, color: 'bg-amber-400' },
                  { label: 'Attrition (90d)', value: data?.kpis.attritionCount ?? 0, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-white/60 font-medium">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Payroll Run */}
            {(data?.lastPayrollRun || isLoading) && (
              <Card className="lg:col-span-8" data-animate>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    Last Payroll Run
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex gap-8">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-14 w-32 rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-surface-2 rounded-2xl p-4">
                        <p className="text-[10px] text-muted uppercase font-medium tracking-wider">Period</p>
                        <p className="text-sm font-bold text-primary-dark mt-1">
                          {formatDate(data!.lastPayrollRun!.periodStart)} — {formatDate(data!.lastPayrollRun!.periodEnd)}
                        </p>
                      </div>
                      <div className="bg-accent/5 rounded-2xl p-4 border border-accent/10">
                        <p className="text-[10px] text-muted uppercase font-medium tracking-wider">Net Payout</p>
                        <p className="text-lg font-extrabold text-primary mt-1">{formatCurrency(data!.lastPayrollRun!.totalNet)}</p>
                      </div>
                      <div className="bg-surface-2 rounded-2xl p-4">
                        <p className="text-[10px] text-muted uppercase font-medium tracking-wider">Employees</p>
                        <p className="text-lg font-bold text-primary-dark mt-1">{data!.lastPayrollRun!.employeeCount}</p>
                      </div>
                      <div className="bg-surface-2 rounded-2xl p-4">
                        <p className="text-[10px] text-muted uppercase font-medium tracking-wider">Status</p>
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${data!.lastPayrollRun!.status === 'paid' ? 'badge-success' : 'badge-info'}`}>
                          {data!.lastPayrollRun!.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
