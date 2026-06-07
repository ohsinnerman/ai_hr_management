'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function ManagerTeamPage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="My Team" description="View and manage your direct reports" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<Users className="w-8 h-8" />} 
              title="Team Directory" 
              description="This module is under development. You will soon be able to view your entire team roster and profiles."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
