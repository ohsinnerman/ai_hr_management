import multer from 'multer';

// Memory storage so the buffer can be streamed straight to R2/S3.
// 10MB limit + MIME allow-list (PDF / DOC / DOCX) per the security rules.
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    const err = new Error('Only PDF, DOC, or DOCX files are allowed');
    err.status = 400;
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  },
});

// Knowledge-base documents also accept plain text in addition to PDF/DOC/DOCX.
const DOC_MIME = new Set([...ALLOWED_MIME, 'text/plain']);

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (DOC_MIME.has(file.mimetype)) return cb(null, true);
    const err = new Error('Only PDF, DOC, DOCX, or TXT files are allowed');
    err.status = 400;
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  },
});

// Alias used by the AI document-upload route.
export const upload = documentUpload;
