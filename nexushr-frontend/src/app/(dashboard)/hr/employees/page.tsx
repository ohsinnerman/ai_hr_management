'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Search, MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmployees, useDepartments, useDeleteEmployee } from '@/lib/api/employees';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, formatDate, getInitials, statusColors } from '@/lib/utils';
import type { Employee } from '@/types';

const PER_PAGE = 25;

export default function EmployeesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const { data, isLoading } = useEmployees({ page, perPage: PER_PAGE, search, department, status });
  const { data: departments } = useDepartments();
  const deleteMutation = useDeleteEmployee();

  const employees = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`${meta?.total ?? '—'} employees across all departments`}
        actions={
          <Button onClick={() => router.push('/hr/employees/new')}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        }
      />

      {/* Filters */}
      <div className="card-elevated p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input placeholder="Search by name, code, or email..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        <Select value={department ?? 'all'} onValueChange={(v) => { setDepartment(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status ?? 'all'} onValueChange={(v) => { setStatus(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-2 hover:bg-surface-2">
              <TableHead className="w-12">Photo</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="w-9 h-9 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted text-sm">No employees match your filters.</TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp._id} className="cursor-pointer hover:bg-surface-2/50 transition-colors" onClick={() => router.push(`/hr/employees/${emp._id}`)}>
                  <TableCell>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={emp.profilePhotoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(emp.firstName, emp.lastName)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm text-primary-dark">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-muted">{emp.employeeCode} • {emp.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{(emp.departmentId as { name?: string })?.name ?? '—'}</TableCell>
                  <TableCell className="text-sm">{(emp.designationId as { name?: string })?.name ?? '—'}</TableCell>
                  <TableCell><span className="text-xs capitalize text-muted">{emp.employmentType.replace('_', ' ')}</span></TableCell>
                  <TableCell className="text-sm text-muted">{formatDate(emp.dateJoined)}</TableCell>
                  <TableCell>
                    <span className={cn('text-xs capitalize px-2 py-0.5 rounded-full border', statusColors[emp.employmentStatus])}>
                      {emp.employmentStatus.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/hr/employees/${emp._id}`)}><Eye className="w-4 h-4 mr-2" /> View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/hr/employees/${emp._id}/edit`)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteTarget(emp)}><Trash2 className="w-4 h-4 mr-2" /> Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-muted">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, meta.total)} of {meta.total} employees
            </p>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm px-2 py-1 text-muted">{page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>. They will lose portal access. This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
