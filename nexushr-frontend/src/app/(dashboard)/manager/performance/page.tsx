'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function ManagerPerformancePage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="Team Performance" description="Evaluate your team's performance" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<Star className="w-8 h-8" />} 
              title="Performance Reviews" 
              description="This module is under development. You will soon be able to submit performance evaluations for your team members."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
