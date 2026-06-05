'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Check, DollarSign, Users, TrendingDown } from 'lucide-react';
import { usePayrollRuns, useCreatePayrollRun, useApprovePayroll } from '@/lib/api/payroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import type { PayrollRun } from '@/types';

const runPayrollSchema = z
  .object({
    periodStart: z.string().min(1, 'Start date required'),
    periodEnd: z.string().min(1, 'End date required'),
  })
  .refine((d) => new Date(d.periodStart) < new Date(d.periodEnd), { message: 'End date must be after start date', path: ['periodEnd'] });
type RunPayrollData = z.infer<typeof runPayrollSchema>;

const RUN_STATUS_COLORS: Record<string, string> = {
  draft: 'badge-neutral',
  processing: 'badge-info',
  processed: 'badge-warning',
  approved: 'badge-info',
  paid: 'badge-success',
};

export default function PayrollPage() {
  const [runOpen, setRunOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<PayrollRun | null>(null);

  const { data, isLoading } = usePayrollRuns();
  const createRun = useCreatePayrollRun();
  const approveRun = useApprovePayroll();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RunPayrollData>({ resolver: zodResolver(runPayrollSchema) });

  const onRunPayroll = async (values: RunPayrollData) => {
    await createRun.mutateAsync(values);
    reset();
    setRunOpen(false);
  };

  const runs: PayrollRun[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Manage payroll runs and payslips"
        actions={
          <Dialog open={runOpen} onOpenChange={setRunOpen}>
            <DialogTrigger asChild>
              <Button><Play className="w-4 h-4 mr-2" /> Run Payroll</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Initiate Payroll Run</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onRunPayroll)} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  ⚠️ Payroll can only be run once per period. Ensure all attendance and leave data is complete before proceeding.
                </div>
                <div className="space-y-1.5">
                  <Label>Period Start *</Label>
                  <Input {...register('periodStart')} type="date" />
                  {errors.periodStart && <p className="text-xs text-red-500">{errors.periodStart.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Period End *</Label>
                  <Input {...register('periodEnd')} type="date" />
                  {errors.periodEnd && <p className="text-xs text-red-500">{errors.periodEnd.message}</p>}
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setRunOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={createRun.isPending}>
                    {createRun.isPending ? 'Processing...' : 'Start Payroll Run'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-2">
              <TableHead>Period</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Gross Payout</TableHead>
              <TableHead>Total Deductions</TableHead>
              <TableHead>Net Payout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : runs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted text-sm">No payroll runs yet. Run payroll for a period to begin.</TableCell></TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run._id}>
                  <TableCell>
                    <p className="text-sm font-medium">{formatDate(run.periodStart, 'MMM yyyy')}</p>
                    <p className="text-xs text-muted">{formatDate(run.periodStart)} – {formatDate(run.periodEnd)}</p>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-1"><Users className="w-4 h-4 text-muted" /><span className="text-sm">{run.employeeCount}</span></div></TableCell>
                  <TableCell><div className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-muted" /><span className="text-sm font-medium">{formatCurrency(run.totalGross)}</span></div></TableCell>
                  <TableCell><div className="flex items-center gap-1"><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-sm text-red-600">{formatCurrency(run.totalDeductions)}</span></div></TableCell>
                  <TableCell><span className="text-sm font-bold text-green-700">{formatCurrency(run.totalNet)}</span></TableCell>
                  <TableCell><span className={cn('capitalize text-xs px-2 py-0.5 rounded-full border', RUN_STATUS_COLORS[run.status])}>{run.status}</span></TableCell>
                  <TableCell>
                    {run.status === 'processed' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => setApproveTarget(run)}>
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payroll Run?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the payroll run for <strong>{approveTarget ? formatDate(approveTarget.periodStart, 'MMMM yyyy') : ''}</strong> and publish payslips for{' '}
              <strong>{approveTarget?.employeeCount}</strong> employees. Net payout: <strong>{formatCurrency(approveTarget?.totalNet ?? 0)}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={() => { if (approveTarget) approveRun.mutate(approveTarget._id); setApproveTarget(null); }}>
              Approve &amp; Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
