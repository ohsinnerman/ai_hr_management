'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Plus, MoreHorizontal, Edit, Trash2, Hash } from 'lucide-react';
import { useDepartmentsList, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, type Department } from '@/lib/api/departments';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStaggerCards } from '@/lib/hooks/useGSAP';

interface DeptForm { name: string; code?: string; description?: string }

const TILE_GRADIENTS = [
  'from-amber-400/20 to-amber-500/5',
  'from-sky-400/20 to-sky-500/5',
  'from-emerald-400/20 to-emerald-500/5',
  'from-violet-400/20 to-violet-500/5',
  'from-rose-400/20 to-rose-500/5',
  'from-indigo-400/20 to-indigo-500/5',
];

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartmentsList();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const gridRef = useStaggerCards();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeptForm>();

  const openCreate = () => { setEditing(null); reset({ name: '', code: '', description: '' }); setDialogOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); reset({ name: d.name, code: d.code ?? '', description: d.description ?? '' }); setDialogOpen(true); };

  const onSubmit = async (values: DeptForm) => {
    if (editing) await updateDept.mutateAsync({ id: editing._id, ...values });
    else await createDept.mutateAsync(values);
    setDialogOpen(false);
  };

  const list = departments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Organize your company into teams and structures"
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Department</Button>}
      />

      {isLoading ? (
        <div className="bento-grid">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="bento-md h-40 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="bento-full"><CardContent className="py-12"><EmptyState icon={<Building2 className="w-8 h-8" />} title="No departments yet" description="Create your first department to start organizing employees." /></CardContent></Card>
      ) : (
        <div ref={gridRef} className="bento-grid">
          {list.map((d, i) => (
            <Card key={d._id} className="bento-md card-bento interactive-lift group !p-0 overflow-hidden" data-animate>
              <div className={`h-1.5 bg-gradient-to-r ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]} flex items-center justify-center`}>
                    <Building2 className="w-6 h-6 text-primary-dark" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(d)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteTarget(d)}><Trash2 className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="mt-4 text-base font-bold text-primary-dark">{d.name}</h3>
                {d.code && <p className="text-xs text-muted mt-0.5 flex items-center gap-1"><Hash className="w-3 h-3" />{d.code}</p>}
                {d.description && <p className="text-xs text-muted mt-2 line-clamp-2">{d.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Department' : 'New Department'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register('name', { required: 'Name is required' })} placeholder="Engineering" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Code</Label><Input {...register('code')} placeholder="ENG" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea {...register('description')} rows={3} className="resize-none" placeholder="What this team does…" /></div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createDept.isPending || updateDept.isPending}>{editing ? 'Save Changes' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove department?</AlertDialogTitle>
            <AlertDialogDescription>This removes <strong>{deleteTarget?.name}</strong>. Employees keep their records but lose this department assignment.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { if (deleteTarget) deleteDept.mutate(deleteTarget._id); setDeleteTarget(null); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
