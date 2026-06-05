'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { useJob, useJobCandidates, useMoveCandidate } from '@/lib/api/recruitment';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getInitials, formatDate } from '@/lib/utils';
import type { Candidate } from '@/types';

const PIPELINE_STAGES = [
  { key: 'applied', label: 'Applied', color: 'border-gray-300' },
  { key: 'ai_screening', label: 'AI Screening', color: 'border-blue-300' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'border-yellow-300' },
  { key: 'interview', label: 'Interview', color: 'border-purple-300' },
  { key: 'offer', label: 'Offer', color: 'border-green-300' },
  { key: 'hired', label: 'Hired', color: 'border-emerald-500' },
];

const STAGE_NEXT: Record<string, string> = {
  applied: 'ai_screening',
  ai_screening: 'shortlisted',
  shortlisted: 'interview',
  interview: 'offer',
  offer: 'hired',
};

const AI_REC_COLORS: Record<string, string> = {
  strong_yes: 'bg-green-100 text-green-700',
  yes: 'bg-blue-100 text-blue-700',
  maybe: 'bg-yellow-100 text-yellow-700',
  no: 'bg-red-100 text-red-700',
};

function CandidateCard({
  candidate, onMove, onView,
}: {
  candidate: Candidate;
  onMove: (id: string, stage: string) => void;
  onView: (id: string) => void;
}) {
  const nextStage = STAGE_NEXT[candidate.stage];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(candidate._id)}>
      <div className="flex items-start gap-2 mb-2">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(candidate.firstName, candidate.lastName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary-dark truncate">{candidate.firstName} {candidate.lastName}</p>
          <p className="text-xs text-muted truncate">{candidate.email}</p>
        </div>
      </div>

      {candidate.aiScore !== undefined && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-bold text-primary">{Math.round(candidate.aiScore)}/100</span>
          </div>
          {candidate.aiRecommendation && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium capitalize', AI_REC_COLORS[candidate.aiRecommendation])}>
              {candidate.aiRecommendation.replace('_', ' ')}
            </span>
          )}
        </div>
      )}

      {candidate.aiScore !== undefined && (
        <div className="space-y-1 mt-2">
          {[
            { label: 'Skills', value: candidate.aiSkillMatch },
            { label: 'Exp', value: candidate.aiExpMatch },
          ].map(({ label, value }) =>
            value !== undefined ? (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted w-8">{label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${value}%` }} />
                </div>
                <span className="text-xs font-medium text-primary-dark w-6">{Math.round(value)}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      <p className="text-xs text-muted mt-2">{formatDate(candidate.createdAt)}</p>

      {nextStage && (
        <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7 hover:bg-primary hover:text-white hover:border-primary transition-all"
          onClick={(e) => { e.stopPropagation(); onMove(candidate._id, nextStage); }}>
          Move to {nextStage.replace('_', ' ')} <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

export default function JobPipelinePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: pipeline, isLoading: pipelineLoading } = useJobCandidates(id);
  const moveCandidate = useMoveCandidate();

  const handleMove = (candidateId: string, stage: string) => moveCandidate.mutate({ id: candidateId, stage });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/recruiter/jobs')}><ArrowLeft className="w-4 h-4 mr-1" /> Jobs</Button>
        {jobLoading ? <Skeleton className="h-7 w-64" /> : <h1 className="text-xl font-bold text-primary-dark">{job?.title}</h1>}
      </div>

      {pipeline && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage) => {
            const stageData = pipeline.pipeline[stage.key];
            return (
              <div key={stage.key} className="text-center px-3 py-1.5 rounded-lg bg-white border text-xs shrink-0">
                <p className="font-bold text-primary-dark text-sm">{stageData?.count ?? 0}</p>
                <p className="text-muted">{stage.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: '500px' }}>
        {PIPELINE_STAGES.map((stage) => {
          const stageData = pipeline?.pipeline[stage.key];
          const candidates = stageData?.candidates ?? [];
          return (
            <div key={stage.key} className={cn('shrink-0 w-64 rounded-xl bg-surface-2 border-t-4', stage.color)}>
              <div className="px-3 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-primary-dark uppercase tracking-wide">{stage.label}</span>
                <span className="text-xs font-semibold text-muted bg-white border border-gray-200 rounded-full px-2 py-0.5">{stageData?.count ?? 0}</span>
              </div>
              <div className="px-3 pb-3 space-y-2">
                {pipelineLoading
                  ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
                  : candidates.map((c) => (
                      <CandidateCard key={c._id} candidate={c} onMove={handleMove} onView={(cId) => router.push(`/recruiter/candidates/${cId}`)} />
                    ))}
                {!pipelineLoading && candidates.length === 0 && <p className="text-xs text-muted text-center py-4">No candidates</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
