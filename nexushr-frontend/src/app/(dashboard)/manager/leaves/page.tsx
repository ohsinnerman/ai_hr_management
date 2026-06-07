'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function ManagerLeavesPage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="Team Leaves" description="Review and approve team leave requests" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<Calendar className="w-8 h-8" />} 
              title="Leave Management" 
              description="This module is under development. You will soon be able to approve/reject leaves and view the team calendar."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
