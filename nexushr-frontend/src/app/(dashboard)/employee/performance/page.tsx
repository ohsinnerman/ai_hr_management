'use client';

import { useRouter } from 'next/navigation';
import { Star, ChevronRight, Award } from 'lucide-react';
import { useMyReviews } from '@/lib/api/performance';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Created', self_review: 'Self Review', manager_review: 'Manager Review', hr_review: 'HR Review', completed: 'Completed',
};
const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', self_review: 'badge-warning', manager_review: 'badge-info', hr_review: 'badge-info', completed: 'badge-success',
};

export default function MyPerformancePage() {
  const router = useRouter();
  const { data: reviews, isLoading } = useMyReviews();

  return (
    <div className="space-y-6">
      <PageHeader title="My Performance Reviews" description="Your appraisal cycles and self-assessments" />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !reviews?.length ? (
        <EmptyState icon={<Award className="w-7 h-7" />} title="No reviews yet" description="Your performance reviews will appear here once HR initiates a cycle." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const needsAction = r.status === 'self_review';
            return (
              <Card key={r._id} className={cn('hover:shadow-md transition-shadow cursor-pointer', needsAction && 'border-l-4 border-l-accent')} >
                <CardContent className="p-4 flex items-center justify-between" onClick={() => router.push(`/employee/performance/${r._id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Star className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="text-sm font-semibold text-primary-dark">{r.reviewCycle}</p>
                      <p className="text-xs text-muted">{formatDate(r.periodStart)} → {formatDate(r.periodEnd)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.status === 'completed' && r.finalRating != null && (
                      <span className="text-sm font-bold text-primary-dark">{r.finalRating}/5 ★</span>
                    )}
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', STATUS_BADGE[r.status])}>{STATUS_LABEL[r.status]}</span>
                    {needsAction && <span className="text-xs font-semibold text-accent">Action needed</span>}
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
