'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Star, AlertTriangle, ChevronRight, Download, Lightbulb } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useCandidate, useMoveCandidate } from '@/lib/api/recruitment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/types';

const AI_REC_CONFIG: Record<string, { label: string; class: string }> = {
  strong_yes: { label: 'Strong Yes', class: 'bg-green-100 text-green-800 border-green-200' },
  yes: { label: 'Yes', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  maybe: { label: 'Maybe', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  no: { label: 'No', class: 'bg-red-100 text-red-800 border-red-200' },
};

const STAGE_NEXT: Record<string, string> = {
  applied: 'ai_screening', ai_screening: 'shortlisted', shortlisted: 'interview', interview: 'offer', offer: 'hired',
};

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: candidate, isLoading } = useCandidate(id);
  const moveCandidate = useMoveCandidate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  if (!candidate) return <div className="text-center py-16 text-muted">Candidate not found</div>;

  const analysis = (candidate.aiAnalysis ?? {}) as Record<string, unknown>;
  const recConfig = candidate.aiRecommendation ? AI_REC_CONFIG[candidate.aiRecommendation] : null;
  const nextStage = STAGE_NEXT[candidate.stage];

  const radarData = [
    { metric: 'Skills', value: candidate.aiSkillMatch ?? 0 },
    { metric: 'Exp', value: candidate.aiExpMatch ?? 0 },
    { metric: 'Education', value: candidate.aiEduMatch ?? 0 },
    { metric: 'Culture', value: candidate.aiCultureFit ?? 0 },
    { metric: 'Overall', value: candidate.aiScore ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-2">
          {candidate.resumeUrl && (
            <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Resume</Button>
            </a>
          )}
          {nextStage && (
            <Button disabled={moveCandidate.isPending} onClick={() => moveCandidate.mutate({ id: candidate._id, stage: nextStage })}>
              Move to {nextStage.replace('_', ' ')} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Hero */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-primary-dark">{candidate.firstName} {candidate.lastName}</h1>
                  <p className="text-muted text-sm">{candidate.email} • {candidate.phone ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full border border-gray-200 bg-surface-2">{candidate.stage.replace('_', ' ')}</span>
                    {recConfig && <span className={cn('text-xs px-2 py-0.5 rounded-full border', recConfig.class)}>AI: {recConfig.label}</span>}
                  </div>
                </div>
                {candidate.aiScore !== undefined && (
                  <div className="text-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#f0f0f0" strokeWidth="8" fill="none" />
                        <circle cx="48" cy="48" r="40" stroke="#1a3a6b" strokeWidth="8" fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - candidate.aiScore / 100)}`} strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-primary-dark">{Math.round(candidate.aiScore)}</span>
                        <span className="text-xs text-muted">/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-1 flex items-center gap-1 justify-center"><Sparkles className="w-3 h-3" /> AI Score</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ai-analysis">
        <TabsList className="bg-surface-2">
          <TabsTrigger value="ai-analysis">🤖 AI Analysis</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-analysis" className="space-y-4">
          {candidate.aiScore === undefined && (
            <Card><CardContent className="p-6 text-sm text-muted flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> AI screening is still in progress (or unavailable). Scores will appear here once complete.
            </CardContent></Card>
          )}

          {candidate.aiSummary && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Summary</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-gray-700 leading-relaxed">{candidate.aiSummary}</p></CardContent>
            </Card>
          )}

          {candidate.aiScore !== undefined && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Score Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Skill Match', value: candidate.aiSkillMatch },
                    { label: 'Experience', value: candidate.aiExpMatch },
                    { label: 'Education', value: candidate.aiEduMatch },
                    { label: 'Culture Fit', value: candidate.aiCultureFit },
                  ].map(({ label, value }) =>
                    value !== undefined ? (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted">{label}</span>
                          <span className="font-bold text-primary-dark">{Math.round(value)}/100</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ) : null
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Profile Radar</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <Radar dataKey="value" stroke="#1a3a6b" fill="#1a3a6b" fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.isArray(analysis.strengths) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2 text-green-700"><Star className="w-4 h-4" /> Strengths</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(analysis.strengths as string[]).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />{s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {Array.isArray(analysis.red_flags) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /> Red Flags</CardTitle></CardHeader>
                <CardContent>
                  {(analysis.red_flags as string[]).length === 0 ? (
                    <p className="text-sm text-muted">No significant red flags identified</p>
                  ) : (
                    <ul className="space-y-2">
                      {(analysis.red_flags as string[]).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />{s}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {Array.isArray(analysis.interview_questions) && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="w-5 h-5 text-accent" /> AI-Generated Interview Questions</CardTitle></CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {(analysis.interview_questions as string[]).map((q, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-gray-700 leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="experience">
          {Array.isArray(analysis.experience) ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Work Experience</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {(analysis.experience as Array<{ company: string; title: string; duration_months: number; highlights: string[] }>).map((exp, i) => (
                  <div key={i} className="border-l-2 border-primary/20 pl-4">
                    <p className="font-semibold text-sm text-primary-dark">{exp.title}</p>
                    <p className="text-xs text-muted">{exp.company} • {Math.floor((exp.duration_months ?? 0) / 12)}y {(exp.duration_months ?? 0) % 12}m</p>
                    {exp.highlights?.length > 0 && (
                      <ul className="mt-2 space-y-1">{exp.highlights.map((h, j) => <li key={j} className="text-xs text-gray-600">• {h}</li>)}</ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-6 text-sm text-muted text-center">No parsed experience available.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="interviews">
          <Card><CardContent className="p-6 text-sm text-muted text-center">Interview scheduling & feedback — not available in this build (no interview API yet).</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export type { Candidate };
