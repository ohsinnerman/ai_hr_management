'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { Clock, LogIn, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMyAttendance, useCheckIn, useCheckOut } from '@/lib/api/attendance';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  half_day: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  on_leave: 'bg-blue-100 text-blue-700 border-blue-200',
  holiday: 'bg-purple-100 text-purple-700 border-purple-200',
  weekend: 'bg-gray-50 text-gray-400 border-gray-100',
};

export default function AttendancePage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [elapsed, setElapsed] = useState('00:00:00');

  const month = cursor.getMonth() + 1;
  const year = cursor.getFullYear();
  const { data: monthRecords, isLoading } = useMyAttendance(month, year);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  // "Today" is derived from the month array (backend has no ?date= filter).
  const todayRecord = monthRecords?.find((r) => isSameDay(new Date(r.date), new Date())) ?? null;
  const isCheckedIn = !!todayRecord?.checkInTime;
  const isCheckedOut = !!todayRecord?.checkOutTime;

  useEffect(() => {
    if (!todayRecord?.checkInTime || todayRecord?.checkOutTime) return;
    const tick = () => {
      const diff = Date.now() - new Date(todayRecord.checkInTime!).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => checkIn.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => checkIn.mutate(undefined)
      );
    } else {
      checkIn.mutate(undefined);
    }
  };

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const getRecord = (date: Date) => monthRecords?.find((r) => isSameDay(new Date(r.date), date)) ?? null;

  const summary = (monthRecords ?? []).reduce(
    (acc: Record<string, number>, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      if (r.isLate) acc.late = (acc.late || 0) + 1;
      acc.totalHours = (acc.totalHours || 0) + (r.workingHours || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description={`Your attendance for ${format(cursor, 'MMMM yyyy')}`} />

      {/* Today hero */}
      <Card className="overflow-hidden">
        <div className="gradient-primary p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm">Today, {format(new Date(), 'EEEE dd MMMM yyyy')}</p>
              <h2 className="text-2xl font-bold mt-1">
                {!isCheckedIn ? 'Good morning! Ready to start?' : isCheckedOut ? `Great work! ${(todayRecord!.workingHours ?? 0).toFixed(1)}h today` : `Currently working — ${elapsed}`}
              </h2>
              {isCheckedIn && !isCheckedOut && (
                <div className="flex items-center gap-2 mt-2 text-sm text-white/80">
                  <Clock className="w-4 h-4" />
                  <span>Checked in at {format(new Date(todayRecord!.checkInTime!), 'hh:mm a')}</span>
                  {todayRecord?.isLate && (
                    <span className="bg-yellow-400/20 border border-yellow-300/30 text-yellow-100 text-xs px-2 py-0.5 rounded-full">Late by {todayRecord.lateByMinutes}m</span>
                  )}
                </div>
              )}
            </div>
            <div>
              {!isCheckedIn ? (
                <Button onClick={handleCheckIn} disabled={checkIn.isPending} className="bg-accent hover:bg-accent-dark text-primary-dark font-bold h-14 px-8 rounded-xl text-base shadow-lg">
                  <LogIn className="w-5 h-5 mr-2" /> {checkIn.isPending ? 'Checking in...' : 'Check In'}
                </Button>
              ) : !isCheckedOut ? (
                <Button onClick={() => checkOut.mutate(undefined)} disabled={checkOut.isPending} className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-14 px-8 rounded-xl text-base">
                  <LogOut className="w-5 h-5 mr-2" /> {checkOut.isPending ? 'Checking out...' : 'Check Out'}
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-white/70 text-sm">Shift Complete</p>
                  <p className="text-3xl font-bold">{(todayRecord!.workingHours ?? 0).toFixed(1)}h</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Present Days" value={summary.present ?? 0} icon={<span className="text-xl">✅</span>} iconBg="bg-green-50" isLoading={isLoading} />
        <StatsCard title="Absent Days" value={summary.absent ?? 0} icon={<span className="text-xl">❌</span>} iconBg="bg-red-50" isLoading={isLoading} />
        <StatsCard title="Late Arrivals" value={summary.late ?? 0} icon={<span className="text-xl">⏰</span>} iconBg="bg-yellow-50" isLoading={isLoading} />
        <StatsCard title="Total Hours" value={`${(summary.totalHours ?? 0).toFixed(0)}h`} icon={<span className="text-xl">⏱️</span>} iconBg="bg-blue-50" isLoading={isLoading} />
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Monthly Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-medium w-32 text-center">{format(cursor, 'MMMM yyyy')}</span>
              <Button variant="outline" size="sm" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map((day) => {
              const record = getRecord(day);
              const dayStatus = record?.status ?? (day > new Date() ? undefined : undefined);
              const statusClass = dayStatus ? STATUS_COLORS[dayStatus] : 'bg-transparent border-gray-100';
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'aspect-square rounded-lg border flex flex-col items-center justify-center p-1 text-xs font-medium transition-all',
                    statusClass,
                    isToday(day) && 'ring-2 ring-primary ring-offset-1',
                    !isSameMonth(day, monthStart) && 'opacity-30'
                  )}
                  title={record ? `${format(day, 'd MMM')} — ${record.status.replace('_', ' ')}${record.isLate ? ' (Late)' : ''}` : format(day, 'd MMM')}
                >
                  <span>{format(day, 'd')}</span>
                  {record?.isLate && <span className="w-1 h-1 rounded-full bg-yellow-500 mt-0.5" />}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
            {[
              { label: 'Present', class: 'bg-green-100 border-green-200' },
              { label: 'Absent', class: 'bg-red-100 border-red-200' },
              { label: 'Leave', class: 'bg-blue-100 border-blue-200' },
              { label: 'Holiday', class: 'bg-purple-100 border-purple-200' },
              { label: 'Weekend', class: 'bg-gray-50 border-gray-200' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded border', item.class)} />
                <span className="text-xs text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
