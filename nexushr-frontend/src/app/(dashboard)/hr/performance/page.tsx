'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Star, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { useAllReviews, useCreateReview, useCompleteReview } from '@/lib/api/performance';
import { useEmployees } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';
import type { PerformanceReview, Employee } from '@/types';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', self_review: 'badge-warning', manager_review: 'badge-info', hr_review: 'badge-info', completed: 'badge-success',
};

interface CreateForm {
  employeeId: string; reviewerId: string; reviewCycle: string; periodStart: string; periodEnd: string;
  kpis: Array<{ name: string; target: number; weight: number }>;
}

function CompleteDialog({ review, onClose }: { review: PerformanceReview | null; onClose: () => void }) {
  const complete = useCompleteReview(review?._id ?? '');
  const [rating, setRating] = useState(3);
  if (!review) return null;
  return (
    <Dialog open={!!review} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Finalize Review — {review.reviewCycle}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="bg-surface-2 rounded-xl p-4 text-sm space-y-1">
            <p className="text-muted">Self rating: <strong className="text-primary-dark">{review.selfRating ?? '—'}/5</strong></p>
            <p className="text-muted">Manager rating: <strong className="text-primary-dark">{review.managerRating ?? '—'}/5</strong></p>
            {review.aiRecommendation && <p className="text-xs text-muted mt-2 border-t border-border/40 pt-2">🤖 {review.aiRecommendation}</p>}
          </div>
          <div className="space-y-3">
            <Label>Final Rating</Label>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={5} step={0.5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="flex-1 accent-[#1a3a6b]" />
              <div className="flex items-center gap-1 w-12"><Star className="w-4 h-4 text-accent fill-accent" /><span className="text-lg font-bold text-primary-dark">{rating}</span></div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" disabled={complete.isPending} onClick={async () => { await complete.mutateAsync({ finalRating: rating }); onClose(); }}>
              {complete.isPending ? 'Finalizing…' : 'Finalize & Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HrPerformancePage() {
  const { data, isLoading } = useAllReviews({ perPage: 100 });
  const { data: empData } = useEmployees({ perPage: 100, status: 'active' });
  const createReview = useCreateReview();
  const gridRef = useStaggerCards();

  const [createOpen, setCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<PerformanceReview | null>(null);

  const employees = empData?.data ?? [];
  const reviews = (data?.data ?? []) as PerformanceReview[];

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<CreateForm>({
    defaultValues: { reviewCycle: '', periodStart: '', periodEnd: '', kpis: [{ name: '', target: 5, weight: 1 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'kpis' });

  const onCreate = async (values: CreateForm) => {
    await createReview.mutateAsync(values);
    reset();
    setCreateOpen(false);
  };

  const empName = (e?: Employee | { firstName?: string; lastName?: string }) => e?.firstName ? `${e.firstName} ${e.lastName ?? ''}`.trim() : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Reviews"
        description="Create review cycles and finalize completed assessments"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Review</Button>}
      />

      <div ref={gridRef}>
        <Card className="card-bento" data-animate>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-primary-dark flex items-center gap-2"><Star className="w-4 h-4 text-accent" /> All Reviews</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : reviews.length === 0 ? (
              <EmptyState icon={<Star className="w-7 h-7" />} title="No reviews yet" description="Create a review cycle to get started." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-2"><TableHead>Employee</TableHead><TableHead>Cycle</TableHead><TableHead>Period</TableHead><TableHead>Stage</TableHead><TableHead>Final</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium text-sm text-primary-dark">{empName(r.employeeId as Employee)}</TableCell>
                      <TableCell className="text-sm">{r.reviewCycle}</TableCell>
                      <TableCell className="text-sm text-muted">{formatDate(r.periodStart)} → {formatDate(r.periodEnd)}</TableCell>
                      <TableCell><span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', STATUS_BADGE[r.status])}>{r.status.replace('_', ' ')}</span></TableCell>
                      <TableCell className="text-sm font-semibold">{r.finalRating != null ? `${r.finalRating}/5` : '—'}</TableCell>
                      <TableCell className="text-right">
                        {r.status === 'hr_review' ? (
                          <Button size="sm" className="h-8 text-xs" onClick={() => setCompleteTarget(r)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalize</Button>
                        ) : <span className="text-xs text-muted">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Review Cycle</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Employee *</Label>
                <Select onValueChange={(v) => setValue('employeeId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e._id} value={e._id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reviewer (Manager) *</Label>
                <Select onValueChange={(v) => setValue('reviewerId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e._id} value={e._id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Review Cycle *</Label>
              <Input {...register('reviewCycle', { required: 'Required' })} placeholder="Q2-2025" />
              {errors.reviewCycle && <p className="text-xs text-red-500">{errors.reviewCycle.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Period Start *</Label><Input type="date" {...register('periodStart', { required: true })} /></div>
              <div className="space-y-1.5"><Label>Period End *</Label><Input type="date" {...register('periodEnd', { required: true })} /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>KPIs</Label><Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => append({ name: '', target: 5, weight: 1 })}><Plus className="w-3 h-3 mr-1" /> Add</Button></div>
              {fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-center">
                  <Input className="flex-1" placeholder="KPI name" {...register(`kpis.${i}.name` as const, { required: true })} />
                  <Input className="w-20" type="number" placeholder="Target" {...register(`kpis.${i}.target` as const, { valueAsNumber: true })} />
                  <Input className="w-20" type="number" placeholder="Weight" {...register(`kpis.${i}.weight` as const, { valueAsNumber: true })} />
                  {fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => remove(i)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createReview.isPending}>{createReview.isPending ? 'Creating…' : 'Create Cycle'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CompleteDialog review={completeTarget} onClose={() => setCompleteTarget(null)} />
    </div>
  );
}
