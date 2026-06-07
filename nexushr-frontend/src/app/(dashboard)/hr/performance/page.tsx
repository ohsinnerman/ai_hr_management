'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function HrPerformancePage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="Performance Reviews" description="Manage performance evaluation cycles" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<Star className="w-8 h-8" />} 
              title="Performance Management" 
              description="This module is under development. You will soon be able to start review cycles and analyze results."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
