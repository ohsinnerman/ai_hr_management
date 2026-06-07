'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function DepartmentsPage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="Departments" description="Manage company departments and structures" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<Building2 className="w-8 h-8" />} 
              title="Departments Management" 
              description="This module is under development. You will soon be able to manage departments, assign managers, and view org charts."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
