'use client';

import { Mail, Phone, Calendar, Building2, Briefcase, User, Shield, MapPin } from 'lucide-react';
import { useMyProfile } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatDate, cn } from '@/lib/utils';
import { useStaggerCards } from '@/lib/hooks/useGSAP';
import type { Employee } from '@/types';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-muted shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted font-semibold">{label}</p>
        <p className="text-sm font-medium text-primary-dark truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: emp, isLoading } = useMyProfile();
  const gridRef = useStaggerCards();

  const manager = emp?.managerId as Employee | undefined;
  const dept = (emp?.departmentId as { name?: string })?.name;
  const desig = (emp?.designationId as { name?: string })?.name;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your personal and employment information" />

      {isLoading || !emp ? (
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid lg:grid-cols-2 gap-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
        </div>
      ) : (
        <div ref={gridRef} className="space-y-6">
          {/* Hero — dark card like the reference */}
          <div className="card-dark relative overflow-hidden" data-animate>
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar className="w-24 h-24 ring-4 ring-white/10">
                <AvatarImage src={emp.profilePhotoUrl} />
                <AvatarFallback className="bg-accent text-primary-dark text-3xl font-bold">{getInitials(emp.firstName, emp.lastName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{emp.firstName} {emp.lastName}</h2>
                <p className="text-white/60 text-sm mt-0.5">{desig ?? '—'}{dept ? ` · ${dept}` : ''}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs font-mono bg-white/10 text-white/80 px-2.5 py-1 rounded-lg">{emp.employeeCode}</span>
                  <span className={cn('text-xs capitalize px-2.5 py-1 rounded-lg font-medium',
                    emp.employmentStatus === 'active' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/70')}>
                    {emp.employmentStatus.replace('_', ' ')}
                  </span>
                  <span className="text-xs capitalize bg-white/10 text-white/80 px-2.5 py-1 rounded-lg">{emp.employmentType.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-white/50">Joined</p>
                <p className="text-lg font-bold text-white">{formatDate(emp.dateJoined)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact / personal */}
            <Card className="card-bento" data-animate>
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2"><User className="w-4 h-4 text-accent" /> Personal Details</h3>
                <div className="divide-y divide-border/40">
                  <InfoRow icon={<Mail className="w-4 h-4" />} label="Work Email" value={emp.email} />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={emp.phone} />
                  <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : undefined} />
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Gender" value={emp.gender?.replace('_', ' ')} />
                </div>
              </CardContent>
            </Card>

            {/* Employment */}
            <Card className="card-bento" data-animate>
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4 text-accent" /> Employment</h3>
                <div className="divide-y divide-border/40">
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department" value={dept} />
                  <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Designation" value={desig} />
                  <InfoRow icon={<Shield className="w-4 h-4" />} label="Reporting Manager" value={manager ? `${manager.firstName} ${manager.lastName}` : undefined} />
                  <InfoRow icon={<Calendar className="w-4 h-4" />} label="Employment Type" value={emp.employmentType.replace('_', ' ')} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
