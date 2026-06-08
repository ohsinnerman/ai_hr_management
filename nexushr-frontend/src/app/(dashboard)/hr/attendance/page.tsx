'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { Clock, UserX, AlarmClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHrDashboard } from '@/lib/api/dashboard';
import { useTeamAttendance } from '@/lib/api/attendance';
import { useEmployees } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  half_day: 'bg-amber-100 text-amber-700 border-amber-200',
  on_leave: 'bg-sky-100 text-sky-700 border-sky-200',
  holiday: 'bg-violet-100 text-violet-700 border-violet-200',
  weekend: 'bg-gray-50 text-gray-400 border-gray-100',
};

export default function HrAttendancePage() {
  const { data: hr, isLoading: hrLoading } = useHrDashboard();
  const { data: empData } = useEmployees({ perPage: 100, status: 'active' });
  const [employeeId, setEmployeeId] = useState<string>('');
  const [cursor, setCursor] = useState(() => new Date());
  const gridRef = useStaggerCards();

  const employees = empData?.data ?? [];
  const month = cursor.getMonth() + 1;
  const year = cursor.getFullYear();
  const { data: records, isLoading: recLoading } = useTeamAttendance(employeeId, month, year);

  const monthStart = startOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(cursor) });
  const getRecord = (d: Date) => records?.find((r) => isSameDay(new Date(r.date), d)) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Company-wide attendance overview" />

      <div ref={gridRef} className="space-y-6">
        {/* Today's company snapshot */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div data-animate><StatsCard title="Absent Today" value={hr?.todayAbsent ?? '—'} icon={<UserX className="w-6 h-6 text-red-500" />} iconBg="bg-red-50" isLoading={hrLoading} /></div>
          <div data-animate><StatsCard title="Late Today" value={hr?.todayLate ?? '—'} icon={<AlarmClock className="w-6 h-6 text-amber-500" />} iconBg="bg-amber-50" isLoading={hrLoading} /></div>
          <div data-animate><StatsCard title="Pending Leaves" value={hr?.pendingLeaves ?? '—'} icon={<Clock className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" isLoading={hrLoading} /></div>
        </div>

        {/* Per-employee month calendar */}
        <Card className="card-bento" data-animate>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-sm font-bold text-primary-dark">Monthly Record</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="w-56 h-9"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e._id} value={e._id}>{e.firstName} {e.lastName} · {e.employeeCode}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm font-medium w-28 text-center">{format(cursor, 'MMM yyyy')}</span>
                <Button variant="outline" size="sm" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!employeeId ? (
              <p className="text-sm text-muted py-12 text-center">Select an employee to view their monthly attendance.</p>
            ) : recLoading ? (
              <Skeleton className="h-64 w-full mt-2" />
            ) : (
              <>
                <div className="grid grid-cols-7 mb-2 mt-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d} className="text-center text-xs font-semibold text-muted py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                  {days.map((day) => {
                    const rec = getRecord(day);
                    const cls = rec?.status ? STATUS_COLORS[rec.status] : 'bg-transparent border-gray-100';
                    return (
                      <div key={day.toISOString()} className={cn('aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-medium', cls, isToday(day) && 'ring-2 ring-accent ring-offset-1')}
                        title={rec ? `${format(day,'d MMM')} — ${rec.status}${rec.isLate ? ' (late)' : ''}` : format(day,'d MMM')}>
                        <span>{format(day, 'd')}</span>
                        {rec?.isLate && <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border/40">
                  {[['Present','bg-emerald-100 border-emerald-200'],['Absent','bg-red-100 border-red-200'],['Leave','bg-sky-100 border-sky-200'],['Holiday','bg-violet-100 border-violet-200']].map(([label, c]) => (
                    <div key={label} className="flex items-center gap-1.5"><div className={cn('w-3 h-3 rounded border', c)} /><span className="text-xs text-muted">{label}</span></div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
