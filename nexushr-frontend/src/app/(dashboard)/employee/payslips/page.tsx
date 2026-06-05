'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, DollarSign } from 'lucide-react';
import { useMyPayslips, downloadMyPayslip } from '@/lib/api/payroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payslip } from '@/types';

function PayslipModal({ payslip, open, onClose }: { payslip: Payslip | null; open: boolean; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  if (!payslip) return null;

  const period = payslip.payrollRunId;

  const handleDownload = async () => {
    setDownloading(true);
    const url = await downloadMyPayslip(payslip._id);
    setDownloading(false);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast.error('Payslip PDF is not available yet.');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payslip — {period ? formatDate(period.periodStart, 'MMMM yyyy') : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="gradient-primary rounded-xl p-4 text-white">
            <p className="text-white/70 text-sm">Net Salary</p>
            <p className="text-3xl font-bold">{formatCurrency(payslip.netSalary)}</p>
            {period && <p className="text-white/60 text-xs mt-1">{formatDate(period.periodStart)} – {formatDate(period.periodEnd)}</p>}
          </div>

          <div className="space-y-2">
            {[
              { label: 'Gross Salary', value: payslip.grossSalary, type: 'credit' as const },
              { label: 'Total Deductions', value: payslip.totalDeductions, type: 'debit' as const },
              { label: 'Net Salary', value: payslip.netSalary, type: 'total' as const },
            ].map(({ label, value, type }) => (
              <div key={label} className={`flex justify-between items-center py-2 ${type === 'total' ? 'border-t font-bold' : ''}`}>
                <span className={`text-sm ${type === 'total' ? 'text-primary-dark' : 'text-muted'}`}>{label}</span>
                <span className={`text-sm font-semibold ${type === 'debit' ? 'text-red-600' : 'text-primary-dark'}`}>
                  {type === 'debit' ? '- ' : ''}{formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-surface-2 rounded-lg p-3 grid grid-cols-2 gap-3">
            <div><p className="text-xs text-muted">Working Days</p><p className="text-sm font-semibold">{payslip.totalWorkingDays}</p></div>
            <div><p className="text-xs text-muted">Paid Days</p><p className="text-sm font-semibold">{payslip.paidDays}</p></div>
          </div>

          <Button className="w-full" onClick={handleDownload} disabled={downloading}>
            <Download className="w-4 h-4 mr-2" /> {downloading ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PayslipsPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const { data: payslips, isLoading } = useMyPayslips();

  const latest = payslips?.[0];

  const handleLatestDownload = async () => {
    if (!latest) return;
    const url = await downloadMyPayslip(latest._id);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast.error('Payslip PDF is not available yet.');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payslips" description="Your salary and payment history" />

      {isLoading ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : latest ? (
        <Card className="overflow-hidden">
          <div className="gradient-primary p-6 text-white">
            <p className="text-white/70 text-sm">Latest Payslip</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(latest.netSalary)}</p>
            {latest.payrollRunId && <p className="text-white/60 text-sm mt-1">{formatDate(latest.payrollRunId.periodStart, 'MMMM yyyy')}</p>}
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
              <div><p className="text-white/60 text-xs">Gross</p><p className="text-white font-semibold">{formatCurrency(latest.grossSalary)}</p></div>
              <div><p className="text-white/60 text-xs">Deductions</p><p className="text-white/80 font-semibold">- {formatCurrency(latest.totalDeductions)}</p></div>
              <div><p className="text-white/60 text-xs">Paid Days</p><p className="text-white font-semibold">{latest.paidDays}/{latest.totalWorkingDays}</p></div>
            </div>
          </div>
          <div className="p-4 bg-white">
            <Button variant="outline" className="w-full" onClick={handleLatestDownload}>
              <Download className="w-4 h-4 mr-2" /> Download Latest Payslip
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Payment History</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4"><Skeleton className="h-12 w-48" /><Skeleton className="h-8 w-24" /></div>
            ))
          ) : !payslips?.length ? (
            <EmptyState icon={<DollarSign className="w-7 h-7" />} title="No payslips yet" description="Published payslips will appear here after a payroll run is approved." />
          ) : (
            payslips.map((payslip) => (
              <div key={payslip._id} className="flex items-center justify-between py-4 hover:bg-surface-2 px-2 rounded-lg cursor-pointer transition-colors" onClick={() => setSelectedPayslip(payslip)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-semibold text-primary-dark">{payslip.payrollRunId ? formatDate(payslip.payrollRunId.periodStart, 'MMMM yyyy') : 'Payslip'}</p>
                    <p className="text-xs text-muted">{payslip.paidDays} days paid • {formatCurrency(payslip.totalDeductions)} deducted</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-primary-dark">{formatCurrency(payslip.netSalary)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${payslip.isPublished ? 'badge-success' : 'badge-neutral'}`}>{payslip.isPublished ? 'Published' : 'Pending'}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <PayslipModal payslip={selectedPayslip} open={!!selectedPayslip} onClose={() => setSelectedPayslip(null)} />
    </div>
  );
}
