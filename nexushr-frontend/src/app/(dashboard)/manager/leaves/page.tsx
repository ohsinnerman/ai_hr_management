'use client';

import { useState } from 'react';
import { Check, X, CalendarClock } from 'lucide-react';
import { usePendingLeaves, useReviewLeave } from '@/lib/api/leaves';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';
import type { LeaveRequest } from '@/types';

export default function ManagerLeavesPage() {
  const { data: pending, isLoading } = usePendingLeaves();
  const review = useReviewLeave();
  const [actingId, setActingId] = useState<string | null>(null);
  const gridRef = useStaggerCards();

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id);
    try { await review.mutateAsync({ id, action }); } finally { setActingId(null); }
  };

  const empName = (l: LeaveRequest) => {
    const e = l.employeeId as unknown as { firstName?: string; lastName?: string };
    return e?.firstName ? `${e.firstName} ${e.lastName ?? ''}`.trim() : '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Team Leave Approvals" description="Review leave requests from your direct reports" />

      <div ref={gridRef}>
        <Card className="card-bento" data-animate>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-primary-dark flex items-center gap-2"><CalendarClock className="w-4 h-4 text-accent" /> Pending Requests</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !pending?.length ? (
              <EmptyState icon={<Check className="w-7 h-7" />} title="All caught up" description="No leave requests await your approval." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-2">
                    <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((l) => (
                    <TableRow key={l._id}>
                      <TableCell className="font-medium text-sm text-primary-dark">{empName(l)}</TableCell>
                      <TableCell className="text-sm">{l.leaveTypeId?.name}</TableCell>
                      <TableCell className="text-sm text-muted">{formatDate(l.startDate)} → {formatDate(l.endDate)}</TableCell>
                      <TableCell className="text-sm">{l.totalDays}d</TableCell>
                      <TableCell className="text-sm text-muted max-w-48 truncate" title={l.reason}>{l.reason || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50" disabled={actingId === l._id} onClick={() => act(l._id, 'approve')}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50" disabled={actingId === l._id} onClick={() => act(l._id, 'reject')}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      </TableCell>
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
