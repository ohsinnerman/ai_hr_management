import mongoose from 'mongoose';
import { Document } from '../../models/index.js';
import { embed } from './embeddings.js';

/**
 * Cosine similarity between two equal-length float vectors.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

/**
 * Retrieve the top-K most relevant documents for a query within a company.
 * Tries MongoDB Atlas $vectorSearch first; falls back to in-process cosine sim
 * for local dev (no Atlas). Confidential docs are excluded from RAG context.
 */
export async function searchDocuments(query, companyId, topK = 5) {
  const queryEmbedding = await embed(query);

  // --- Try Atlas $vectorSearch first (production) ---
  try {
    const results = await Document.aggregate([
      {
        $vectorSearch: {
          index: 'documents_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: topK,
          filter: { companyId: new mongoose.Types.ObjectId(companyId) },
        },
      },
      { $match: { deletedAt: null, isConfidential: { $ne: true } } },
      {
        $project: {
          title: 1,
          contentText: { $substr: ['$contentText', 0, 600] },
          category: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);
    if (results.length > 0) return results;
  } catch (_atlasErr) {
    // Atlas not configured (local dev) → fall through to cosine sim.
  }

  // --- Local Dev Fallback: in-process cosine similarity ---
  const docs = await Document.find({
    companyId,
    deletedAt: null,
    isConfidential: { $ne: true },
    embedding: { $exists: true, $not: { $size: 0 } },
  }).lean();

  return docs
    .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => ({
      title: r.doc.title,
      contentText: (r.doc.contentText || '').slice(0, 600),
      category: r.doc.category,
      score: r.score,
    }));
}

/**
 * Build the system instruction for the HR chat assistant.
 * IMPORTANT: pass this as systemInstruction (not as a user message).
 */
export function buildChatSystem({ companyName, employee, policyChunks, employeeData }) {
  const policyContext = (policyChunks || [])
    .map((c, i) => `[Policy ${i + 1}: ${c.title}]\n${c.contentText}`)
    .join('\n\n');

  return `You are NexusHR Assistant for ${companyName}.
Answer HR questions based ONLY on provided policy context and employee data.
If you cannot answer from the provided context, say: "I'll connect you with your HR team."
Never invent policies. Never reveal other employees' private data.

Employee: ${employee.firstName} ${employee.lastName}, ${employee?.departmentId?.name ?? 'N/A'}, joined ${employee.dateJoined ? new Date(employee.dateJoined).toDateString() : 'N/A'}, role: ${employee.employmentType ?? 'N/A'}

Policy Context:
${policyContext}

Real-time Employee Data:
${JSON.stringify(employeeData)}`;
}
