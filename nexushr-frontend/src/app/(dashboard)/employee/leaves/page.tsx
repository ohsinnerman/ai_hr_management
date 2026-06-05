'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import { Plus, Calendar } from 'lucide-react';
import { useLeaveTypes, useLeaveBalances, useMyLeaves, useApplyLeave } from '@/lib/api/leaves';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, statusColors } from '@/lib/utils';
import type { LeaveBalance, LeaveRequest } from '@/types';

const applyLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().max(500).optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
type ApplyLeaveData = z.infer<typeof applyLeaveSchema>;

function BalanceProgressRing({ balance }: { balance: LeaveBalance }) {
  const available = balance.totalAllocated - balance.used - balance.pending + (balance.carriedForward ?? 0);
  const usedPct = balance.totalAllocated > 0 ? Math.min(100, (balance.used / balance.totalAllocated) * 100) : 0;
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference - (usedPct / 100) * circumference;

  return (
    <div className="card-elevated p-4 flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r={r} stroke="#f0f0f0" strokeWidth="4" fill="none" />
          <circle
            cx="32" cy="32" r={r}
            stroke={balance.leaveTypeId?.colorCode || '#1a3a6b'}
            strokeWidth="4" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-primary-dark">{available}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-primary-dark">{balance.leaveTypeId?.name}</p>
        <p className="text-xs text-muted">
          {balance.used} used · {balance.pending > 0 ? `${balance.pending} pending · ` : ''}
          {available} left of {balance.totalAllocated}
        </p>
        {(balance.carriedForward ?? 0) > 0 && <p className="text-xs text-blue-500">+{balance.carriedForward} carried forward</p>}
      </div>
    </div>
  );
}

export default function LeavesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: leaveTypes } = useLeaveTypes();
  const { data: balances, isLoading: balancesLoading } = useLeaveBalances();
  const { data: leaves, isLoading: leavesLoading } = useMyLeaves();
  const applyLeave = useApplyLeave();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<ApplyLeaveData>({
    resolver: zodResolver(applyLeaveSchema),
  });

  const watchStart = watch('startDate');
  const watchEnd = watch('endDate');
  const watchType = watch('leaveTypeId');

  const businessDays = watchStart && watchEnd ? Math.max(0, differenceInBusinessDays(parseISO(watchEnd), parseISO(watchStart)) + 1) : 0;
  const selectedBalance = balances?.find((b) => b.leaveTypeId?._id === watchType);
  const available = selectedBalance ? selectedBalance.totalAllocated - selectedBalance.used - selectedBalance.pending + (selectedBalance.carriedForward ?? 0) : 0;
  const insufficient = !!selectedBalance && businessDays > 0 && available < businessDays;

  const onSubmit = async (data: ApplyLeaveData) => {
    await applyLeave.mutateAsync(data);
    reset();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description={`${new Date().getFullYear()} leave summary`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Apply for Leave</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Leave Type *</Label>
                  <Select onValueChange={(v) => setValue('leaveTypeId', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                    <SelectContent>{leaveTypes?.map((lt) => <SelectItem key={lt._id} value={lt._id}>{lt.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.leaveTypeId && <p className="text-xs text-red-500">{errors.leaveTypeId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start Date *</Label>
                    <Input {...register('startDate')} type="date" min={new Date().toISOString().slice(0, 10)} />
                    {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Date *</Label>
                    <Input {...register('endDate')} type="date" min={watchStart || new Date().toISOString().slice(0, 10)} />
                    {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
                  </div>
                </div>

                {businessDays > 0 && (
                  <div className={cn('p-3 rounded-lg text-sm', insufficient ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800')}>
                    <p className="font-medium">{businessDays} business day{businessDays !== 1 ? 's' : ''} requested</p>
                    {selectedBalance && <p className="text-xs mt-0.5">{available} days available{insufficient && ' — Insufficient balance!'}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Reason (optional)</Label>
                  <Textarea {...register('reason')} placeholder="Brief reason for leave..." rows={3} className="resize-none" />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={applyLeave.isPending || insufficient}>
                    {applyLeave.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Balances */}
      <div>
        <h2 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">Leave Balances</h2>
        {balancesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : !balances?.length ? (
          <p className="text-sm text-muted">No leave balances configured for this year.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{balances.map((b) => <BalanceProgressRing key={b._id} balance={b} />)}</div>
        )}
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Leave History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-2">
                <TableHead>Leave Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leavesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{[1, 2, 3, 4, 5].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : !leaves?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted text-sm">No leave requests yet.</TableCell></TableRow>
              ) : (
                leaves.map((leave: LeaveRequest) => (
                  <TableRow key={leave._id}>
                    <TableCell className="font-medium text-sm">{leave.leaveTypeId?.name}</TableCell>
                    <TableCell className="text-sm text-muted">{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</TableCell>
                    <TableCell className="text-sm">{leave.totalDays}d</TableCell>
                    <TableCell className="text-sm text-muted">{formatDate(leave.appliedAt)}</TableCell>
                    <TableCell>
                      <span className={cn('capitalize text-xs px-2 py-0.5 rounded-full border', statusColors[leave.status])}>{leave.status}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
