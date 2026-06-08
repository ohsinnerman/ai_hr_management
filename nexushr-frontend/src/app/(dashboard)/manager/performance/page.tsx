'use client';

import { useState } from 'react';
import { Star, ClipboardCheck } from 'lucide-react';
import { useTeamReviews, useSubmitManagerReview } from '@/lib/api/performance';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';
import type { PerformanceReview, Employee } from '@/types';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', self_review: 'badge-warning', manager_review: 'badge-info', hr_review: 'badge-info', completed: 'badge-success',
};

function ManagerReviewDialog({ review, onClose }: { review: PerformanceReview | null; onClose: () => void }) {
  const submit = useSubmitManagerReview(review?._id ?? '');
  const [rating, setRating] = useState(3);
  const [scores, setScores] = useState<number[]>([]);
  const [promotion, setPromotion] = useState(false);
  const [salary, setSalary] = useState(false);

  if (!review) return null;
  const kpis = review.kpis ?? [];

  const handleSubmit = async () => {
    await submit.mutateAsync({
      managerRating: rating,
      kpiManagerScores: kpis.map((_, kpiIndex) => ({ kpiIndex, score: Number(scores[kpiIndex] ?? 0) })),
      promotionFlag: promotion,
      salaryRevisionFlag: salary,
    });
    onClose();
  };

  return (
    <Dialog open={!!review} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Manager Review — {review.reviewCycle}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {/* Employee self-assessment context */}
          <div className="bg-surface-2 rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-muted">Self rating: <strong className="text-primary-dark">{review.selfRating ?? '—'}/5</strong></p>
            {review.strengths && <p className="text-xs text-muted"><span className="font-semibold">Strengths:</span> {review.strengths}</p>}
            {review.improvements && <p className="text-xs text-muted"><span className="font-semibold">Improvements:</span> {review.improvements}</p>}
          </div>

          {/* Per-KPI manager scores */}
          <div className="space-y-2">
            <Label>KPI Scores (manager)</Label>
            {kpis.map((kpi, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm flex-1 text-primary-dark">{kpi.name} <span className="text-muted text-xs">(self: {kpi.selfScore ?? '—'})</span></span>
                <Input type="number" min={0} max={5} step={0.5} className="w-24 h-8 text-center" placeholder="0–5"
                  onChange={(e) => setScores((p) => { const n = [...p]; n[i] = Number(e.target.value); return n; })} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Label>Overall Manager Rating</Label>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={5} step={0.5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="flex-1 accent-[#1a3a6b]" />
              <div className="flex items-center gap-1 w-12"><Star className="w-4 h-4 text-accent fill-accent" /><span className="text-lg font-bold text-primary-dark">{rating}</span></div>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={promotion} onChange={(e) => setPromotion(e.target.checked)} className="accent-[#1a3a6b]" /> Recommend promotion</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={salary} onChange={(e) => setSalary(e.target.checked)} className="accent-[#1a3a6b]" /> Salary revision</label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" disabled={submit.isPending} onClick={handleSubmit}>{submit.isPending ? 'Submitting…' : 'Submit & Advance to HR'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ManagerPerformancePage() {
  const { data, isLoading } = useTeamReviews();
  const gridRef = useStaggerCards();
  const [target, setTarget] = useState<PerformanceReview | null>(null);

  const reviews = (data ?? []) as PerformanceReview[];
  const empName = (e?: Employee) => e?.firstName ? `${e.firstName} ${e.lastName ?? ''}`.trim() : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Team Performance" description="Review and score your direct reports' assessments" />

      <div ref={gridRef} className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : reviews.length === 0 ? (
          <Card className="card-bento"><CardContent className="py-12"><EmptyState icon={<Star className="w-7 h-7" />} title="No team reviews" description="Reviews for your reports will appear here once HR initiates a cycle." /></CardContent></Card>
        ) : (
          reviews.map((r) => {
            const needsAction = r.status === 'manager_review';
            return (
              <Card key={r._id} className={cn('card-bento interactive-lift', needsAction && 'border-l-4 border-l-accent')} data-animate>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-primary-dark flex items-center gap-2">
                      {empName(r.employeeId as Employee)} <span className="text-xs font-normal text-muted">· {r.reviewCycle}</span>
                    </CardTitle>
                    <span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', STATUS_BADGE[r.status])}>{r.status.replace('_', ' ')}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-xs text-muted">{formatDate(r.periodStart)} → {formatDate(r.periodEnd)} · self {r.selfRating ?? '—'}/5</p>
                  {needsAction ? (
                    <Button size="sm" onClick={() => setTarget(r)}><ClipboardCheck className="w-4 h-4 mr-1.5" /> Review</Button>
                  ) : <span className="text-xs text-muted">No action needed</span>}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ManagerReviewDialog review={target} onClose={() => setTarget(null)} />
    </div>
  );
}
