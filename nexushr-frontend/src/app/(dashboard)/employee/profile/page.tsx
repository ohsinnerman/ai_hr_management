'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

export default function EmployeeProfilePage() {
  const gridRef = useStaggerCards();

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="View and manage your personal information" />
      
      <div ref={gridRef}>
        <Card className="bento-full" data-animate>
          <CardContent className="py-12">
            <EmptyState 
              icon={<User className="w-8 h-8" />} 
              title="Profile Settings" 
              description="This module is under development. You will soon be able to update your contact details and upload a profile photo."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
