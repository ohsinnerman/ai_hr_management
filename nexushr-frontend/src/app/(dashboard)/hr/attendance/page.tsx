'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function HrAttendancePage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="Company Attendance" description="Monitor employee attendance logs" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<Clock className="w-8 h-8" />} 
              title="Attendance Management" 
              description="This module is under development. You will soon be able to view full attendance logs and manage shifts."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
