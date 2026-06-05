'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface UploadedDoc {
  title: string;
  category: string;
  at: string;
}

const CATEGORIES = ['policy', 'contract', 'certificate', 'compliance', 'other'];

// NOTE: the backend exposes POST /ai/documents (upload to the RAG knowledge base, HR/Admin).
// There is no document list/search/delete API, so this page is upload-focused: each uploaded
// doc is embedded (768-dim) and becomes searchable by the AI chat assistant.
export default function DocumentsPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('policy');
  const [uploaded, setUploaded] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
      form.append('category', category);
      return api.post('/ai/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (_, file) => {
      setUploaded((prev) => [{ title: title || file.name, category, at: new Date().toLocaleString() }, ...prev]);
      setTitle('');
      toast.success('Document uploaded and indexed for AI search!');
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err?.response?.data?.error?.message || 'Upload failed. Max 10MB; PDF/DOC/DOCX/TXT only.'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Knowledge Base" description="Upload HR policies — they become searchable by the AI assistant" />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Document Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave Policy 2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="w-full border-2 border-dashed border-primary/20 rounded-xl py-10 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-60"
          >
            <Upload className="w-8 h-8 text-primary/60" />
            <p className="text-sm font-medium text-primary-dark">{uploadMutation.isPending ? 'Uploading & indexing…' : 'Click to upload a document'}</p>
            <p className="text-xs text-muted">PDF, DOC, DOCX, or TXT • max 10MB</p>
          </button>

          <div className="flex items-center gap-2 text-xs text-muted bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            Uploaded documents are embedded with Gemini (768-dim) and retrieved by the floating AI assistant when employees ask policy questions.
          </div>
        </CardContent>
      </Card>

      {uploaded.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-primary-dark mb-3">Uploaded this session</p>
            <div className="space-y-2">
              {uploaded.map((d, i) => (
                <div key={i} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><FileText className="w-4 h-4 text-red-500" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-dark">{d.title}</p>
                    <p className="text-xs text-muted capitalize">{d.category} • {d.at}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
