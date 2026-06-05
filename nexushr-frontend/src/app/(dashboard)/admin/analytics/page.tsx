'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { TrendingDown, Brain, RefreshCw } from 'lucide-react';
import { useAttritionRisk, useRecruitmentFunnel, usePayrollCost, useAttendancePattern, useWorkforceInsights } from '@/lib/api/analytics';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatCurrency } from '@/lib/utils';

const RISK_COLORS: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const RISK_BADGES: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};
const STAGE_FILL: Record<string, string> = {
  applied: '#e2e8f0', ai_screening: '#bfdbfe', shortlisted: '#a5b4fc', interview: '#7c3aed', offer: '#4f46e5', hired: '#1a3a6b', rejected: '#fca5a5',
};
const STAGE_ORDER = ['applied', 'ai_screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export default function AnalyticsDashboardPage() {
  const { data: attrition, isLoading: attritionLoading, refetch: refetchAttrition, isFetching } = useAttritionRisk();
  const { data: funnel, isLoading: funnelLoading } = useRecruitmentFunnel();
  const { data: payroll, isLoading: payrollLoading } = usePayrollCost(6);
  const { data: attendance, isLoading: attendanceLoading } = useAttendancePattern(currentMonth());
  const { data: insights } = useWorkforceInsights();

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    (attrition ?? []).forEach((a) => { c[a.riskLevel] = (c[a.riskLevel] ?? 0) + 1; });
    return c;
  }, [attrition]);

  const funnelData = useMemo(() => {
    const map = new Map((funnel ?? []).map((f) => [f._id, f.count]));
    return STAGE_ORDER.filter((s) => map.has(s)).map((s) => ({ name: s.replace('_', ' '), value: map.get(s) ?? 0, fill: STAGE_FILL[s] }));
  }, [funnel]);

  const payrollData = (payroll ?? []).map((p) => ({ month: p.period, netPayout: p.totalNet }));
  const attendanceData = (attendance?.breakdown ?? []).map((b) => ({ status: b._id, count: b.count }));

  return (
    <div className="space-y-6">
      <PageHeader title="AI Analytics" description="Gemini-powered workforce intelligence" />

      {/* AI insights banner */}
      {insights?.insights && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 text-sm text-gray-700 flex gap-2">
          <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>{insights.insights}</p>
        </div>
      )}

      <Tabs defaultValue="attrition">
        <TabsList className="bg-surface-2">
          <TabsTrigger value="attrition">🤖 Attrition Risk</TabsTrigger>
          <TabsTrigger value="recruitment">📊 Recruitment</TabsTrigger>
          <TabsTrigger value="payroll">💰 Payroll</TabsTrigger>
          <TabsTrigger value="attendance">⏰ Attendance</TabsTrigger>
        </TabsList>

        {/* Attrition */}
        <TabsContent value="attrition" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {([
              { label: 'High Risk', key: 'high', color: 'border-l-red-500', icon: '🔴' },
              { label: 'Medium Risk', key: 'medium', color: 'border-l-yellow-400', icon: '🟡' },
              { label: 'Low Risk', key: 'low', color: 'border-l-green-500', icon: '🟢' },
            ] as const).map((item) => (
              <Card key={item.key} className={`border-l-4 ${item.color}`}>
                <CardContent className="p-4">
                  {attritionLoading ? <Skeleton className="h-12 w-full" /> : (
                    <>
                      <p className="text-xs text-muted font-medium">{item.label}</p>
                      <p className="text-3xl font-bold text-primary-dark mt-1">{item.icon} {counts[item.key]}</p>
                      <p className="text-xs text-muted">employees</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted bg-primary/5 border border-primary/10 rounded-lg px-4 py-2">
            <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> Analysis by Gemini • cached 24h on the backend</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => refetchAttrition()} disabled={isFetching}>
              <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} /> Refresh
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-500" /> Employee Attrition Risk Analysis</CardTitle></CardHeader>
            <CardContent>
              {attritionLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
              ) : !attrition?.length ? (
                <EmptyState icon={<Brain className="w-7 h-7" />} title="No attrition analysis yet" description="This requires a configured Gemini API key with quota. Results are cached for 24h once generated." />
              ) : (
                <div className="space-y-3">
                  {attrition.map((item, index) => (
                    <div key={index} className={cn('p-4 rounded-xl border-l-4 bg-white shadow-sm',
                      item.riskLevel === 'high' ? 'border-l-red-500 bg-red-50/30' : item.riskLevel === 'medium' ? 'border-l-yellow-400 bg-yellow-50/30' : 'border-l-green-500 bg-green-50/30')}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-sm text-primary-dark">{item.employeeName}</p>
                            <span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', RISK_BADGES[item.riskLevel])}>{item.riskLevel} risk</span>
                          </div>
                          <p className="text-xs text-muted mb-2">Risk Score: {item.riskScore}%</p>
                          {item.primaryFactors?.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-muted uppercase mb-1">Primary Factors</p>
                              <div className="flex flex-wrap gap-1">
                                {item.primaryFactors.map((factor, fi) => (
                                  <span key={fi} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{factor}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.recommendedAction && (
                            <div>
                              <p className="text-xs font-semibold text-muted uppercase mb-1">Recommended Action</p>
                              <p className="text-xs text-gray-700 flex items-start gap-1"><span className="text-green-500 mt-0.5">→</span> {item.recommendedAction}</p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 shrink-0">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90">
                              <circle cx="32" cy="32" r="26" stroke="#f0f0f0" strokeWidth="5" fill="none" />
                              <circle cx="32" cy="32" r="26" stroke={RISK_COLORS[item.riskLevel]} strokeWidth="5" fill="none"
                                strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - item.riskScore / 100)}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold" style={{ color: RISK_COLORS[item.riskLevel] }}>{item.riskScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recruitment funnel */}
        <TabsContent value="recruitment" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recruitment Funnel</CardTitle></CardHeader>
            <CardContent>
              {funnelLoading ? <Skeleton className="h-64 w-full" /> : funnelData.length === 0 ? (
                <EmptyState icon={<TrendingDown className="w-7 h-7" />} title="No candidate data" />
              ) : (
                <div className="space-y-3">
                  {funnelData.map((item, i) => {
                    const maxVal = funnelData[0]?.value || 1;
                    const pct = Math.round((item.value / maxVal) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-700 capitalize">{item.name}</span>
                          <span className="font-bold text-primary">{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div className="h-full rounded-lg transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll cost */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Payroll Trend (Net Payout)</CardTitle></CardHeader>
            <CardContent>
              {payrollLoading ? <Skeleton className="h-64 w-full" /> : payrollData.length === 0 ? (
                <EmptyState icon={<TrendingDown className="w-7 h-7" />} title="No processed payroll runs yet" description="Run and approve payroll to see the cost trend." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={payrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <RechartsTooltip formatter={(v) => [formatCurrency(Number(v)), 'Net Payout']} />
                    <defs>
                      <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a3a6b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1a3a6b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="netPayout" stroke="#1a3a6b" fill="url(#payrollGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance pattern */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted">Month</p><p className="text-lg font-bold text-primary-dark">{attendance?.month ?? currentMonth()}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted">Late Arrivals</p><p className="text-lg font-bold text-amber-600">{attendanceLoading ? '…' : attendance?.lateArrivals ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted">Avg Working Hours</p><p className="text-lg font-bold text-primary-dark">{attendanceLoading ? '…' : `${attendance?.avgWorkingHours ?? 0}h`}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Attendance Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              {attendanceLoading ? <Skeleton className="h-64 w-full" /> : attendanceData.length === 0 ? (
                <EmptyState icon={<TrendingDown className="w-7 h-7" />} title="No attendance records this month" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} tickFormatter={(s: string) => s.replace('_', ' ')} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(v) => [Number(v), 'Records']} />
                    <Bar dataKey="count" fill="#1a3a6b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
