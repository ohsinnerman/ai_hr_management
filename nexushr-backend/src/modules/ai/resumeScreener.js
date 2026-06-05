import Candidate from '../../models/Candidate.model.js';
import JobPosting from '../../models/JobPosting.model.js';
import { complete, isGeminiConfigured } from './gemini.service.js';
import { downloadFromS3 } from '../../utils/s3Upload.js';
import { extractResumeText } from '../../utils/resumeParser.js';

export const RESUME_SCREENING_SYSTEM = `You are an expert HR recruiter. Analyze the resume against the job description.
Return ONLY valid JSON starting with { (no markdown, no code blocks) matching this schema:
{
  "candidate_name": "string",
  "years_experience": number,
  "current_title": "string or null",
  "current_company": "string or null",
  "skills": { "technical": ["list"], "soft": ["list"], "certifications": ["list"] },
  "experience": [{ "company":"str", "title":"str", "duration_months":num, "highlights":["str"] }],
  "education": [{ "degree":"str", "field":"str", "institution":"str", "year":num }],
  "overall_score": number (0-100),
  "skill_match": number (0-100),
  "experience_match": number (0-100),
  "education_match": number (0-100),
  "culture_fit": number (0-100),
  "recommendation": "strong_yes|yes|maybe|no",
  "strengths": ["3-5 positive signals"],
  "red_flags": ["concerns if any, empty array if none"],
  "gaps_identified": ["missing skills vs JD"],
  "summary": "3-4 sentence candidate summary for this role",
  "interview_questions": ["5 targeted questions based on resume+JD gaps"]
}

IMPORTANT: Gemini sometimes wraps JSON in markdown. Do NOT do this.
Start your response directly with { and end with }`;

export const buildScreeningPrompt = (job, resumeText) =>
  `JOB REQUIREMENTS:\n${job.description}\nSkills: ${(job.requiredSkills || []).join(',')}\n\nRESUME:\n${resumeText.slice(0, 12000)}`;

/**
 * Parse Gemini output into JSON, tolerating ```json fences or surrounding prose.
 */
export const parseGeminiJson = (raw) => {
  let text = (raw || '').trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini returned no parseable JSON');
    return JSON.parse(match[0]);
  }
};

/**
 * Deterministic keyword-based fallback when Gemini is unavailable.
 * (Mirrors the fallback documented in AI_ARCHITECTURE.md.)
 */
export const ruleBasedResumeScore = (resumeText, requiredSkills = []) => {
  const lower = (resumeText || '').toLowerCase();
  const matched = requiredSkills.filter((s) => lower.includes(String(s).toLowerCase()));
  const score = Math.round((matched.length / Math.max(requiredSkills.length, 1)) * 60);
  return {
    overall_score: score,
    skill_match: score,
    experience_match: 50,
    education_match: 50,
    culture_fit: 50,
    recommendation: score >= 50 ? 'maybe' : 'no',
    summary: 'AI screening unavailable. Rule-based keyword score applied.',
    strengths: [`Matched skills: ${matched.join(', ') || 'none detected'}`],
    red_flags: [],
    gaps_identified: requiredSkills.filter((s) => !lower.includes(String(s).toLowerCase())),
    interview_questions: [],
  };
};

/**
 * Full screening pipeline for one candidate:
 * download resume → extract text → Gemini (or fallback) → persist analysis.
 */
export const screenCandidate = async (candidateId, jobId) => {
  const [candidate, job] = await Promise.all([
    Candidate.findById(candidateId),
    JobPosting.findById(jobId),
  ]);
  if (!candidate) throw new Error(`Candidate ${candidateId} not found`);
  if (!job) throw new Error(`JobPosting ${jobId} not found`);

  // Download + extract resume text.
  const buffer = await downloadFromS3(candidate.resumeUrl);
  let resumeText = await extractResumeText(buffer, candidate.resumeUrl);
  resumeText = resumeText.replace(/\x00/g, '').replace(/\s{3,}/g, '\n').trim();

  // Analyze with Gemini, falling back to rule-based scoring on any failure.
  let analysis;
  let usedFallback = false;
  if (isGeminiConfigured()) {
    try {
      const raw = await complete({
        system: RESUME_SCREENING_SYSTEM,
        user: buildScreeningPrompt(job, resumeText),
        model: 'gemini-2.0-flash',
        maxTokens: 2048,
      });
      analysis = parseGeminiJson(raw);
    } catch (err) {
      console.error('[AI Screening] Gemini failed, using fallback:', err.message);
      analysis = ruleBasedResumeScore(resumeText, job.requiredSkills);
      usedFallback = true;
    }
  } else {
    analysis = ruleBasedResumeScore(resumeText, job.requiredSkills);
    usedFallback = true;
  }

  await Candidate.findByIdAndUpdate(candidateId, {
    aiScore: analysis.overall_score,
    aiSkillMatch: analysis.skill_match,
    aiExpMatch: analysis.experience_match,
    aiEduMatch: analysis.education_match,
    aiCultureFit: analysis.culture_fit,
    aiRecommendation: analysis.recommendation,
    aiSummary: analysis.summary,
    aiAnalysis: analysis,
    aiScreenedAt: new Date(),
    stage: 'ai_screening',
  });

  return { analysis, usedFallback };
};
