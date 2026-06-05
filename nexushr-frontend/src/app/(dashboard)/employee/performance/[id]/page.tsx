'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Star, CheckCircle, Clock, Lock } from 'lucide-react';
import { useReview, useSubmitSelfReview } from '@/lib/api/performance';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate } from '@/lib/utils';

const STAGE_STEPS = [
  { key: 'draft', label: 'Created', icon: Clock },
  { key: 'self_review', label: 'Self Review', icon: Star },
  { key: 'manager_review', label: 'Manager Review', icon: Star },
  { key: 'hr_review', label: 'HR Review', icon: Star },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
];
const STAGE_ORDER = ['draft', 'self_review', 'manager_review', 'hr_review', 'completed'];

function StageIndicator({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STAGE_ORDER.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-0 w-full">
      {STAGE_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isDone = index < currentIdx;
        const isCurrent = index === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold',
                isDone ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-muted')}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <p className={cn('text-xs mt-1 whitespace-nowrap font-medium', isCurrent ? 'text-primary' : 'text-muted')}>{step.label}</p>
            </div>
            {index < STAGE_STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-1 mb-4', index < currentIdx ? 'bg-green-400' : 'bg-gray-200')} />}
          </div>
        );
      })}
    </div>
  );
}

interface SelfForm {
  strengths: string;
  improvements: string;
  goalsNextPeriod: string;
  kpiScores: number[];
}

export default function PerformanceReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: review, isLoading } = useReview(id);
  const submitSelf = useSubmitSelfReview(id);
  const [selfRating, setSelfRating] = useState(3);

  const { register, handleSubmit, formState: { errors } } = useForm<SelfForm>({
    defaultValues: { strengths: '', improvements: '', goalsNextPeriod: '', kpiScores: [] },
  });

  const onSelfSubmit = async (data: SelfForm) => {
    const kpiSelfScores = (review?.kpis ?? []).map((_, kpiIndex) => ({
      kpiIndex,
      score: Number(data.kpiScores?.[kpiIndex] ?? 0),
    }));
    await submitSelf.mutateAsync({
      selfRating,
      kpiSelfScores,
      strengths: data.strengths,
      improvements: data.improvements,
      goalsNextPeriod: data.goalsNextPeriod,
    });
    router.push('/employee/performance');
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-96 w-full" /></div>;
  }
  if (!review) return <div className="text-center py-16 text-muted">Review not found</div>;

  const isEditable = review.status === 'self_review';
  const ratingLabel = selfRating >= 4.5 ? 'Outstanding' : selfRating >= 3.5 ? 'Exceeds Expectations' : selfRating >= 2.5 ? 'Meets Expectations' : selfRating >= 1.5 ? 'Needs Improvement' : 'Unsatisfactory';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.push('/employee/performance')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Reviews</Button>
      <PageHeader title={`Performance Review — ${review.reviewCycle}`} description={`${formatDate(review.periodStart)} → ${formatDate(review.periodEnd)}`} />

      <Card><CardContent className="pt-6 pb-4"><StageIndicator currentStatus={review.status} /></CardContent></Card>

      {!isEditable && (
        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border',
          review.status === 'completed' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800')}>
          <Lock className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">
            {review.status === 'draft' && 'This review is awaiting activation by HR.'}
            {review.status === 'manager_review' && 'Your self review is submitted. Awaiting manager review.'}
            {review.status === 'hr_review' && 'Under HR review.'}
            {review.status === 'completed' && `Review completed! Final Rating: ${review.finalRating}/5 ⭐`}
          </p>
        </div>
      )}

      {/* KPI scorecard */}
      <Card>
        <CardHeader><CardTitle className="text-base">KPI Scorecard</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface-2">
                  <th className="text-left py-2 px-3 font-semibold text-muted text-xs uppercase">KPI</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted text-xs uppercase">Weight</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted text-xs uppercase">Target</th>
                  {review.selfRating != null && <th className="text-center py-2 px-3 font-semibold text-muted text-xs uppercase">Self</th>}
                  {review.managerRating != null && <th className="text-center py-2 px-3 font-semibold text-muted text-xs uppercase">Mgr</th>}
                  {isEditable && <th className="text-center py-2 px-3 font-semibold text-primary text-xs uppercase">Your Score</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {review.kpis.map((kpi, index) => (
                  <tr key={index} className="hover:bg-surface-2/50">
                    <td className="py-3 px-3 font-medium">{kpi.name}</td>
                    <td className="py-3 px-3 text-center text-muted">{kpi.weight}</td>
                    <td className="py-3 px-3 text-center">{kpi.target}</td>
                    {review.selfRating != null && <td className="py-3 px-3 text-center font-semibold text-primary">{kpi.selfScore ?? '—'}</td>}
                    {review.managerRating != null && <td className="py-3 px-3 text-center font-semibold text-green-600">{kpi.managerScore ?? '—'}</td>}
                    {isEditable && (
                      <td className="py-3 px-3 text-center">
                        <Input {...register(`kpiScores.${index}` as const, { valueAsNumber: true })} type="number" min={0} max={5} step={0.5} className="w-20 text-center h-8" defaultValue={0} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Self review form */}
      {isEditable && (
        <form onSubmit={handleSubmit(onSelfSubmit)}>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="w-5 h-5 text-accent" /> Self Assessment</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label>Overall Self Rating</Label>
                <div className="flex items-center gap-4">
                  <input type="range" min={1} max={5} step={0.5} value={selfRating} onChange={(e) => setSelfRating(Number(e.target.value))} className="flex-1 accent-[#1a3a6b]" />
                  <div className="flex items-center gap-1 w-12">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="text-lg font-bold text-primary-dark">{selfRating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted">{ratingLabel}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Your Key Strengths *</Label>
                <Textarea {...register('strengths', { required: 'Please describe your strengths' })} rows={3} className="resize-none" placeholder="Describe what you excelled at during this review period..." />
                {errors.strengths && <p className="text-xs text-red-500">{errors.strengths.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Areas of Improvement *</Label>
                <Textarea {...register('improvements', { required: 'Please describe areas for improvement' })} rows={3} className="resize-none" placeholder="Where do you feel you could improve?" />
                {errors.improvements && <p className="text-xs text-red-500">{errors.improvements.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Goals for Next Review Period *</Label>
                <Textarea {...register('goalsNextPeriod', { required: 'Please set goals for next period' })} rows={3} className="resize-none" placeholder="What do you aim to achieve in the next period?" />
                {errors.goalsNextPeriod && <p className="text-xs text-red-500">{errors.goalsNextPeriod.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={submitSelf.isPending}>
                {submitSelf.isPending ? 'Submitting...' : 'Submit Self Review'}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Completed summary */}
      {review.status === 'completed' && review.finalRating != null && (
        <Card>
          <CardHeader><CardTitle className="text-base">Final Review Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Final Rating</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-5 h-5', i < Math.round(review.finalRating!) ? 'text-accent fill-accent' : 'text-gray-200')} />
                ))}
              </div>
              <span className="text-lg font-bold text-primary-dark">{review.finalRating}/5</span>
            </div>
            {review.aiRecommendation && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><span>🤖</span> AI Recommendation</p>
                <p className="text-sm text-gray-700">{review.aiRecommendation}</p>
              </div>
            )}
            <div className="flex gap-2">
              {review.promotionFlag && <span className="text-xs px-2 py-0.5 rounded-full border bg-green-100 text-green-800 border-green-200">🚀 Recommended for Promotion</span>}
              {review.salaryRevisionFlag && <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">💰 Salary Revision Recommended</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
