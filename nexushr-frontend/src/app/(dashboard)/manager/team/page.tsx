'use client';

import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useManagerDashboard } from '@/lib/api/dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getInitials, cn } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

const statusDot: Record<string, string> = {
  present: 'bg-emerald-500', absent: 'bg-red-500', on_leave: 'bg-amber-500',
  half_day: 'bg-sky-500', holiday: 'bg-gray-300', weekend: 'bg-gray-300',
};

export default function ManagerTeamPage() {
  const { data, isLoading } = useManagerDashboard();
  const gridRef = useStaggerCards();
  const s = data?.attendanceSummary;

  return (
    <div className="space-y-6">
      <PageHeader title="My Team" description="Your direct reports at a glance" />

      <div ref={gridRef} className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-animate><StatsCard title="Team Size" value={data?.teamSize ?? '—'} icon={<Users className="w-6 h-6 text-primary" />} iconBg="bg-primary/10" isLoading={isLoading} /></div>
          <div data-animate><StatsCard title="Present Today" value={s?.present ?? '—'} icon={<UserCheck className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50" isLoading={isLoading} /></div>
          <div data-animate><StatsCard title="Absent Today" value={s?.absent ?? '—'} icon={<UserX className="w-6 h-6 text-red-500" />} iconBg="bg-red-50" isLoading={isLoading} /></div>
          <div data-animate><StatsCard title="Late Today" value={s?.late ?? '—'} icon={<Clock className="w-6 h-6 text-amber-500" />} iconBg="bg-amber-50" isLoading={isLoading} /></div>
        </div>

        <Card className="card-bento" data-animate>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-primary-dark">Team Roster — Today</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">{[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : !data?.teamAttendance?.length ? (
              <EmptyState icon={<Users className="w-7 h-7" />} title="No direct reports" description="Employees reporting to you will appear here." className="py-8" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {data.teamAttendance.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 bg-surface-2 rounded-xl p-3 border border-border/40 interactive-lift">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(a.employeeId?.firstName ?? '?', a.employeeId?.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary-dark truncate">{a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : 'Member'}</p>
                      <p className="text-xs text-muted capitalize">{a.status.replace('_', ' ')}{a.isLate ? ' · late' : ''}</p>
                    </div>
                    <span className={cn('w-2.5 h-2.5 rounded-full', statusDot[a.status] ?? 'bg-gray-300')} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
