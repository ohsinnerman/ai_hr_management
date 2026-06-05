'use client';

import { useParams, useRouter } from 'next/navigation';
import { Edit, Mail, Phone, Calendar, Building2, ArrowLeft } from 'lucide-react';
import { useEmployee } from '@/lib/api/employees';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, getInitials, statusColors } from '@/lib/utils';
import type { Employee } from '@/types';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: employee, isLoading } = useEmployee(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center py-16 text-muted">Employee not found</div>;
  }

  const manager = employee.managerId as Employee | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Button>
        <Button onClick={() => router.push(`/hr/employees/${id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
      </div>

      {/* Hero */}
      <div className="card-elevated overflow-hidden">
        <div className="h-24 gradient-primary" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src={employee.profilePhotoUrl} />
              <AvatarFallback className="bg-primary text-white text-2xl font-bold">{getInitials(employee.firstName, employee.lastName)}</AvatarFallback>
            </Avatar>
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-primary-dark">{employee.firstName} {employee.lastName}</h1>
              <p className="text-sm text-muted">
                {(employee.designationId as { name?: string })?.name ?? '—'} • {(employee.departmentId as { name?: string })?.name ?? '—'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono bg-surface-2 border border-gray-200 px-2 py-0.5 rounded-full">{employee.employeeCode}</span>
                <span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', statusColors[employee.employmentStatus])}>
                  {employee.employmentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted" /><span className="text-muted truncate">{employee.email}</span></div>
            <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted" /><span className="text-muted">{employee.phone ?? 'Not provided'}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted" /><span className="text-muted">Joined {formatDate(employee.dateJoined)}</span></div>
            <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-muted" /><span className="text-muted capitalize">{employee.employmentType.replace('_', ' ')}</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-surface-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="card-elevated p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-primary-dark mb-3">Personal Details</h3>
              <dl className="space-y-2">
                {([
                  ['Date of Birth', employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—'],
                  ['Gender', employee.gender ?? '—'],
                  ['Marital Status', employee.maritalStatus ?? '—'],
                  ['Email', employee.email],
                ] as Array<[string, string]>).map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <dt className="text-xs text-muted w-28 shrink-0">{label}</dt>
                    <dd className="text-xs font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-dark mb-3">Employment Details</h3>
              <dl className="space-y-2">
                {([
                  ['Employee Code', employee.employeeCode],
                  ['Employment Type', employee.employmentType.replace('_', ' ')],
                  ['Manager', manager ? `${manager.firstName} ${manager.lastName}` : '—'],
                  ['Status', employee.employmentStatus.replace('_', ' ')],
                ] as Array<[string, string]>).map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <dt className="text-xs text-muted w-28 shrink-0">{label}</dt>
                    <dd className="text-xs font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </TabsContent>

        {(['attendance', 'leaves', 'payroll', 'performance', 'documents'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="card-elevated p-6 text-sm text-muted capitalize">
              {tab} history — coming in a later phase.
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
