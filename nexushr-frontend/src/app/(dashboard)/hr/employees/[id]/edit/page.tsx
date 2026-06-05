'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useEmployee, useUpdateEmployee } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const editSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  employmentStatus: z.enum(['active', 'on_leave', 'suspended', 'terminated']),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
});
type EditData = z.infer<typeof editSchema>;

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: employee, isLoading } = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone ?? '',
        employmentStatus: employee.employmentStatus,
        employmentType: employee.employmentType,
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EditData) => {
    await updateEmployee.mutateAsync(data);
    router.push(`/hr/employees/${id}`);
  };

  if (isLoading) return <Skeleton className="h-96 w-full max-w-2xl mx-auto rounded-2xl" />;
  if (!employee) return <div className="text-center py-16 text-muted">Employee not found</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
      <PageHeader title={`Edit ${employee.firstName} ${employee.lastName}`} description={employee.employeeCode} />

      <Card>
        <CardHeader><CardTitle className="text-lg">Employee Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email *</Label>
              <Input {...register('email')} type="email" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input {...register('phone')} /></div>
            <div className="space-y-1.5">
              <Label>Employment Type</Label>
              <Select value={watch('employmentType')} onValueChange={(v) => setValue('employmentType', v as EditData['employmentType'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={watch('employmentStatus')} onValueChange={(v) => setValue('employmentStatus', v as EditData['employmentStatus'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={updateEmployee.isPending}>{updateEmployee.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
