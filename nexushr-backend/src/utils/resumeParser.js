import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract plain text from a PDF buffer (pdf-parse v2).
 */
export const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  // v2 appends "-- N of M --" page markers; strip them for cleaner screening text.
  return (result.text || '').replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').trim();
};

/**
 * Extract plain text from a DOCX buffer (mammoth).
 */
export const extractDocxText = async (buffer) => {
  const { value } = await mammoth.extractRawText({ buffer });
  return (value || '').trim();
};

/**
 * Route to the correct extractor based on a filename/URL hint, with a
 * content-sniff fallback (PDFs start with "%PDF", DOCX is a "PK" zip).
 */
export const extractResumeText = async (buffer, hint = '') => {
  const lower = String(hint).toLowerCase();
  if (lower.endsWith('.pdf') || lower.includes('.pdf')) return extractPdfText(buffer);
  if (lower.endsWith('.docx') || lower.endsWith('.doc') || lower.includes('.docx')) return extractDocxText(buffer);

  // Fallback: sniff magic bytes.
  const head = buffer.slice(0, 4).toString('latin1');
  if (head.startsWith('%PDF')) return extractPdfText(buffer);
  if (head.startsWith('PK')) return extractDocxText(buffer);
  // Last resort: treat as UTF-8 text.
  return buffer.toString('utf8').trim();
};
