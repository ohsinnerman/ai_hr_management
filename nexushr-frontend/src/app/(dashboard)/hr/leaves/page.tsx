'use client';

import { useState } from 'react';
import { Check, X, CalendarClock } from 'lucide-react';
import { usePendingLeaves, useReviewLeave, useMyLeaves } from '@/lib/api/leaves';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDate, statusColors } from '@/lib/utils';
import type { LeaveRequest } from '@/types';

export default function HrLeavesPage() {
  const { data: pending, isLoading: pendingLoading } = usePendingLeaves();
  const { data: all, isLoading: allLoading } = useMyLeaves(); // HR → company-wide (role-scoped server-side)
  const review = useReviewLeave();
  const [actingId, setActingId] = useState<string | null>(null);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id);
    try {
      await review.mutateAsync({ id, action });
    } finally {
      setActingId(null);
    }
  };

  const empName = (l: LeaveRequest) => {
    const e = l.employeeId as unknown as { firstName?: string; lastName?: string };
    return e?.firstName ? `${e.firstName} ${e.lastName ?? ''}`.trim() : '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Approvals" description="Review and act on team leave requests" />

      <Tabs defaultValue="pending">
        <TabsList className="bg-surface-2">
          <TabsTrigger value="pending">Pending {pending?.length ? `(${pending.length})` : ''}</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingLoading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !pending?.length ? (
                <EmptyState icon={<Check className="w-7 h-7" />} title="All caught up" description="No leave requests awaiting your approval." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-2">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Action</TableHead>
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
                            <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700 hover:bg-green-50" disabled={actingId === l._id} onClick={() => act(l._id, 'approve')}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50" disabled={actingId === l._id} onClick={() => act(l._id, 'reject')}>
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">All Leave Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              {allLoading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !all?.length ? (
                <EmptyState icon={<CalendarClock className="w-7 h-7" />} title="No requests" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-2">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {all.map((l) => (
                      <TableRow key={l._id}>
                        <TableCell className="font-medium text-sm text-primary-dark">{empName(l)}</TableCell>
                        <TableCell className="text-sm">{l.leaveTypeId?.name}</TableCell>
                        <TableCell className="text-sm text-muted">{formatDate(l.startDate)} → {formatDate(l.endDate)}</TableCell>
                        <TableCell className="text-sm">{l.totalDays}d</TableCell>
                        <TableCell><span className={cn('capitalize text-xs px-2 py-0.5 rounded-full border', statusColors[l.status])}>{l.status}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
