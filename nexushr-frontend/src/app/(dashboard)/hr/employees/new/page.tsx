'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, User, Briefcase, DollarSign, ClipboardCheck } from 'lucide-react';
import { useCreateEmployee, useDepartments, useDesignations, useEmployees } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const personalSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid company email'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  nationality: z.string().optional(),
});
type PersonalData = z.infer<typeof personalSchema>;

const employmentSchema = z.object({
  departmentId: z.string().min(1, 'Select a department'),
  designationId: z.string().min(1, 'Select a designation'),
  managerId: z.string().optional(),
  dateJoined: z.string().min(1, 'Date joined is required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  probationEndDate: z.string().optional(),
});
type EmploymentData = z.infer<typeof employmentSchema>;

const compensationSchema = z.object({
  ctc: z.number().min(100000, 'Minimum CTC is ₹1,00,000').max(50000000),
  basic: z.number().min(1),
  hra: z.number().min(0),
  transport: z.number().min(0),
  medical: z.number().min(0),
  special: z.number().min(0),
});
type CompensationData = z.infer<typeof compensationSchema>;

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Employment', icon: Briefcase },
  { id: 3, label: 'Compensation', icon: DollarSign },
  { id: 4, label: 'Review', icon: ClipboardCheck },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PersonalData & EmploymentData>>({});
  const [selectedDept, setSelectedDept] = useState<string | undefined>();

  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations(selectedDept);
  const { data: managersData } = useEmployees({ status: 'active', perPage: 100 });
  const createEmployee = useCreateEmployee();

  const step1Form = useForm<PersonalData>({ resolver: zodResolver(personalSchema) });
  const step2Form = useForm<EmploymentData>({ resolver: zodResolver(employmentSchema), defaultValues: { employmentType: 'full_time' } });
  const step3Form = useForm<CompensationData>({
    resolver: zodResolver(compensationSchema),
    defaultValues: { ctc: 600000, basic: 240000, hra: 120000, transport: 0, medical: 0, special: 0 },
  });

  const handleStep1 = (data: PersonalData) => { setFormData((p) => ({ ...p, ...data })); setStep(2); };
  const handleStep2 = (data: EmploymentData) => { setFormData((p) => ({ ...p, ...data })); setStep(3); };
  const handleStep3 = () => setStep(4); // compensation captured; salary structure handled separately by backend

  const handleFinalSubmit = async () => {
    // Only employee fields are sent (backend createEmployee endpoint).
    await createEmployee.mutateAsync(formData as never);
    router.push('/hr/employees');
  };

  const compFields: Array<{ name: keyof CompensationData; label: string; hint: string }> = [
    { name: 'ctc', label: 'Annual CTC *', hint: 'Total Cost to Company' },
    { name: 'basic', label: 'Basic Salary *', hint: '40% of CTC recommended' },
    { name: 'hra', label: 'HRA *', hint: '50% of Basic recommended' },
    { name: 'transport', label: 'Transport Allowance', hint: 'Monthly transport' },
    { name: 'medical', label: 'Medical Allowance', hint: 'Annual medical' },
    { name: 'special', label: 'Special Allowance', hint: 'Remaining balance' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Add New Employee" description="Fill in the employee details step by step" />

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-0">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isComplete = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      isComplete ? 'bg-primary border-primary text-white' : isCurrent ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-muted'
                    )}>
                      {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <p className={cn('text-xs mt-1 font-medium', isCurrent ? 'text-primary' : 'text-muted')}>{s.label}</p>
                  </div>
                  {index < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-2 mb-4 transition-colors', step > s.id ? 'bg-primary' : 'bg-gray-200')} />}
                </div>
              );
            })}
          </div>
          <Progress value={(step / STEPS.length) * 100} className="mt-4 h-1.5" />
        </CardContent>
      </Card>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={step1Form.handleSubmit(handleStep1)} className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input {...step1Form.register('firstName')} placeholder="Priya" />
                {step1Form.formState.errors.firstName && <p className="text-xs text-red-500">{step1Form.formState.errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input {...step1Form.register('lastName')} placeholder="Sharma" />
                {step1Form.formState.errors.lastName && <p className="text-xs text-red-500">{step1Form.formState.errors.lastName.message}</p>}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Company Email *</Label>
                <Input {...step1Form.register('email')} type="email" placeholder="priya.sharma@fwcit.com" />
                {step1Form.formState.errors.email && <p className="text-xs text-red-500">{step1Form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5"><Label>Phone</Label><Input {...step1Form.register('phone')} placeholder="+91 98765 43210" /></div>
              <div className="space-y-1.5"><Label>Date of Birth</Label><Input {...step1Form.register('dateOfBirth')} type="date" /></div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select onValueChange={(v) => step1Form.setValue('gender', v as PersonalData['gender'])}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Nationality</Label><Input {...step1Form.register('nationality')} placeholder="Indian" /></div>
              <div className="col-span-2 flex justify-end">
                <Button type="submit">Next: Employment <ChevronRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Employment Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={step2Form.handleSubmit(handleStep2)} className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select onValueChange={(v) => { step2Form.setValue('departmentId', v); setSelectedDept(v); step2Form.setValue('designationId', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments?.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                {step2Form.formState.errors.departmentId && <p className="text-xs text-red-500">{step2Form.formState.errors.departmentId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Designation *</Label>
                <Select onValueChange={(v) => step2Form.setValue('designationId', v)} disabled={!selectedDept}>
                  <SelectTrigger><SelectValue placeholder={selectedDept ? 'Select designation' : 'Pick a department first'} /></SelectTrigger>
                  <SelectContent>{designations?.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                {step2Form.formState.errors.designationId && <p className="text-xs text-red-500">{step2Form.formState.errors.designationId.message}</p>}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Reporting Manager</Label>
                <Select onValueChange={(v) => step2Form.setValue('managerId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select manager (optional)" /></SelectTrigger>
                  <SelectContent>
                    {managersData?.data?.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} — {(emp.designationId as { name?: string })?.name ?? ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date Joined *</Label>
                <Input {...step2Form.register('dateJoined')} type="date" />
                {step2Form.formState.errors.dateJoined && <p className="text-xs text-red-500">{step2Form.formState.errors.dateJoined.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Employment Type *</Label>
                <Select defaultValue="full_time" onValueChange={(v) => step2Form.setValue('employmentType', v as EmploymentData['employmentType'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Probation End Date</Label><Input {...step2Form.register('probationEndDate')} type="date" /></div>
              <div className="col-span-2 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button type="submit">Next: Compensation <ChevronRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compensation Structure</CardTitle>
            <p className="text-sm text-muted">All amounts are annual (in INR)</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step3Form.handleSubmit(handleStep3)} className="grid grid-cols-2 gap-4">
              {compFields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                    <Input {...step3Form.register(field.name, { valueAsNumber: true })} type="number" className="pl-8" placeholder="0" />
                  </div>
                  <p className="text-xs text-muted/70">{field.hint}</p>
                </div>
              ))}
              <div className="col-span-2 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button type="submit">Review &amp; Submit <ChevronRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Review &amp; Confirm</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').replace('Id', '')}</p>
                  <p className="font-medium">{String(value) || '—'}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">A user account is auto-provisioned; a temporary password is returned to HR on creation.</p>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button onClick={handleFinalSubmit} disabled={createEmployee.isPending}>
                {createEmployee.isPending ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
