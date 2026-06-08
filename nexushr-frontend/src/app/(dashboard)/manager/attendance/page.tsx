'use client';

import { format } from 'date-fns';
import { Clock, UserCheck, UserX, AlarmClock } from 'lucide-react';
import { useManagerDashboard } from '@/lib/api/dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getInitials, cn } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const statusBadge: Record<string, string> = {
  present: 'badge-success', absent: 'badge-error', on_leave: 'badge-info',
  half_day: 'badge-warning', holiday: 'badge-neutral', weekend: 'badge-neutral',
};

export default function ManagerAttendancePage() {
  const { data, isLoading } = useManagerDashboard();
  const gridRef = useStaggerCards();
  const s = data?.attendanceSummary;
  const rows = data?.teamAttendance ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Team Attendance" description={`Today, ${format(new Date(), 'EEEE dd MMMM yyyy')}`} />

      <div ref={gridRef} className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-animate><StatsCard title="Present" value={s?.present ?? '—'} icon={<UserCheck className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50" isLoading={isLoading} /></div>
          <div data-animate><StatsCard title="Absent" value={s?.absent ?? '—'} icon={<UserX className="w-6 h-6 text-red-500" />} iconBg="bg-red-50" isLoading={isLoading} /></div>
          <div data-animate><StatsCard title="Late" value={s?.late ?? '—'} icon={<AlarmClock className="w-6 h-6 text-amber-500" />} iconBg="bg-amber-50" isLoading={isLoading} /></div>
          <div data-animate><StatsCard title="Team Size" value={s?.total ?? '—'} icon={<Clock className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" isLoading={isLoading} /></div>
        </div>

        <Card className="card-bento" data-animate>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-primary-dark">Attendance Log</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : rows.length === 0 ? (
              <EmptyState icon={<Clock className="w-7 h-7" />} title="No attendance today" description="No direct reports have logged attendance yet." className="py-8" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-2"><TableHead>Employee</TableHead><TableHead>Status</TableHead><TableHead>Check-in</TableHead><TableHead>Late</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(a.employeeId?.firstName ?? '?', a.employeeId?.lastName)}</AvatarFallback></Avatar>
                          <span className="text-sm font-medium text-primary-dark">{a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : 'Member'}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', statusBadge[a.status] ?? 'badge-neutral')}>{a.status.replace('_', ' ')}</span></TableCell>
                      <TableCell className="text-sm text-muted">{a.checkInTime ? format(new Date(a.checkInTime), 'h:mm a') : '—'}</TableCell>
                      <TableCell className="text-sm">{a.isLate ? <span className="text-amber-600 font-medium">Yes</span> : <span className="text-muted">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
