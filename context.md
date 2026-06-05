# NexusHR — Project Context

**AI-Powered Human Resource Management System** (FWC IT Services hackathon MVP)
MERN stack: MongoDB + Express + Next.js + Node 20. Backend is a REST API + (future) SSE server; the frontend calls it.

This file is the living source of truth for what has been built, how it is structured, how to run it, and how it was verified. Keep it updated as phases land.

---

## 1. Repository layout

```
ai_hr_management/
├── nexushr-backend/      # Node 20 + Express 4 (ESM) REST API  ← all phase work so far
├── nexushr-frontend/     # Next.js 14 + TS + Tailwind (scaffold only)
├── docs/                 # PRD, BRD, ARCHITECTURE, API, DATABASE, DEPLOYMENT, MASTER_PROMPT, PHASE_*_PROMPT
├── context.md            # ← this file
└── readme.md
```

> The two app folders live directly under the repo root (no `nexushr/` wrapper) so deployment platforms can target each independently.

---

## 2. Status by phase

| Phase | Scope | State | Verified |
|---|---|---|---|
| 1 | Project setup, config, Auth (JWT + refresh, lockout) | ✅ Done | live Mongo+Redis |
| 2 | Core HR: Department, Designation, Employee (+ PII encryption, User provisioning, org-tree) | ✅ Done | 41 checks |
| 3 | Attendance + Leave (check-in/out, balances, BR-001) | ✅ Done | 33 checks |
| 4 | Payroll + BullMQ (calc, PDF payslips, S3 upload) | ✅ Done | 28 checks (MinIO) |
| 5 | Recruitment + Gemini AI screening (PDF/DOCX, BullMQ) | ✅ Done | 23 checks (MinIO) |
| 6 | Payroll approval, payslip download, employee self-service | ⏳ Next | — |
| 7 | AI chat (RAG), analytics dashboards, voice | ⏳ Pending | — |
| 8 | Performance reviews + production deploy | ⏳ Pending | — |

Each phase was verified end-to-end against real infrastructure in Docker (MongoDB 7, Redis 7, and MinIO for S3). Test scripts were temporary and removed after passing.

---

## 3. Tech stack (backend, as installed)

- **Express 4** (pinned; npm defaults to 5), **Mongoose**, **ioredis**
- **Auth:** `jsonwebtoken`, `bcryptjs`; refresh-token hash stored in Redis
- **Validation:** `express-validator`; **Security:** `helmet`, `cors`, `cookie-parser`, `morgan`
- **Queue:** `bullmq` (payroll + ai-screening); **Storage:** `@aws-sdk/client-s3` + presigner (Cloudflare R2 / S3-compatible)
- **Files:** `multer` (memory, 10MB, MIME allow-list), `pdfkit` (payslips), `pdf-parse` **v2** (resume PDF text), `mammoth` (DOCX text)
- **AI:** `@google/generative-ai` (Gemini `gemini-2.0-flash`)

Frontend scaffold has: `axios`, `zustand`, `@tanstack/react-query`, `react-hot-toast`, `lucide-react` (no feature UI yet).

---

## 4. Backend structure (`nexushr-backend/src/`)

```
config/        db.js · redis.js · s3.js · multer.js
middleware/    authenticate.js · requireRole.js · validate.js · errorHandler.js
utils/         apiResponse.js · asyncHandler.js · crypto.js · dates.js ·
               resolveEmployee.js · s3Upload.js · pdfGenerator.js · resumeParser.js
models/        index.js (barrel) + 15 models (see §6)
queues/        payroll.queue.js · aiScreening.queue.js
workers/       payrollWorker.js · aiScreeningWorker.js
modules/
  auth/        routes · controller · service · validator
  employees/   routes · controller · service · validator
  departments/ routes · controller · service
  designations/routes · controller · service
  attendance/  routes · controller · service
  leaves/      routes · controller · service · validator
  payroll/     routes · controller · service · payroll.calc.js
  recruitment/ routes · controller · service
  ai/          gemini.service.js · resumeScreener.js
server.js      # app wiring + route mounts + worker startup
```

**Convention:** Router → Controller → Service → Model. Controllers wrap handlers in `asyncHandler`; services throw errors carrying `{ status, code }` that `errorHandler` renders. All queries are scoped by `companyId` (multi-tenant). The `models/index.js` barrel is imported once at startup so every schema is registered before any `populate`.

**Response envelope:** `{ success, data, meta? }` on success; `{ success:false, error:{ code, message, details? } }` on failure.

---

## 5. How to run locally

### Prerequisites — infra in Docker

```bash
docker run -d --name nexushr-mongo -p 27017:27017 mongo:7
docker run -d --name nexushr-redis -p 6379:6379 redis:7-alpine
# Optional, only if you want real resume/payslip file storage locally:
docker run -d --name nexushr-minio -p 9000:9000 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data
```

After first run, reuse with `docker start nexushr-mongo nexushr-redis`.

### Backend → <http://localhost:5000>

```bash
cd nexushr-backend
npm install          # first time
npm run dev          # nodemon
# health: curl http://localhost:5000/api/v1/health
```

### Frontend → <http://localhost:3000>

```bash
cd nexushr-frontend
npm install
npm run dev
```

Run backend and frontend in separate terminals. There is **no `seed.js` yet** (planned for a later phase), so the DB starts empty — create a company + user via the API or a small script before logging in.

---

## 6. Data models (15 registered)

`Company, User, Department, Designation, Employee` (Phase 1–2) ·
`AttendanceRecord, LeaveType, LeaveRequest, LeaveBalance` (Phase 3) ·
`SalaryStructure, PayrollRun, Payslip` (Phase 4) ·
`JobPosting, Candidate, Interview` (Phase 5).

Remaining (Phase 7–8): `PerformanceReview, Document, AiInteraction, AuditLog`.

Notable rules:

- **PII** (`bankDetails`, `panNumber`, `aadhaarNumber`) is AES-256-GCM encrypted at rest (`utils/crypto.js`); list endpoints exclude it, single-fetch masks PAN/Aadhaar and returns decrypted bank JSON.
- **Unique indexes:** `Employee.employeeCode`/`email`, `AttendanceRecord {employeeId,date}`, `LeaveBalance {employeeId,leaveTypeId,year}`, `PayrollRun {companyId,periodStart,periodEnd}` (enforces BR-002).

---

## 7. API surface (all under `/api/v1`, JWT required unless noted)

**Auth** (`/auth`) — `POST /login`, `POST /refresh` (cookie), `POST /logout`, `GET /me` (includes linked employee).

**Employees** (`/employees`) — `GET /` (paginate/search/filter), `POST /` (HR/admin; auto-generates `EMP-####`, provisions a User, encrypts PII), `GET /:id`, `GET /:id/org-tree`, `PUT /:id`, `DELETE /:id` (soft).

**Departments / Designations** — CRUD; mutations HR/admin; soft delete.

**Attendance** (`/attendance`) — `POST /check-in`(+`/checkin`), `POST /check-out`(+`/checkout`), `GET /`. Lateness derived from `Company.settings.attendanceCutoffTime`; checkout computes `workingHours` + overtime vs 9h.

**Leaves** (`/leaves`) — `GET/POST /types`, `GET /balance`, `GET /`, `POST /request`, `PATCH /:id/approve` (`action: approve|reject`). `totalDays` = working days in range; approve moves `pending→used` and writes `on_leave` attendance; **BR-001** (can't review own) enforced; reviewer must be HR/admin or direct manager.

**Payroll** (`/payroll`, HR/admin) — `POST /` (creates draft run + enqueues BullMQ job → 202), `GET /`, `GET /:id/payslips`. Worker computes per-employee payslip and uploads a PDF to `uploads/payslips/{runId}/{empId}.pdf`, then rolls up run totals → `processed`.

**Recruitment** (`/recruitment`) — `GET/POST /jobs`, `GET /jobs/:id`, `PUT /jobs/:id`, `POST /jobs/:id/publish`, `GET /jobs/:id/candidates` (pipeline by stage), `POST /candidates` (multipart `resume` → S3 + enqueue AI screening), `GET /candidates/:id`, `PATCH /candidates/:id/stage` (HR/recruiter only — BR-004 human gate).

---

## 8. Background jobs (BullMQ)

- **`payroll`** queue → `payrollWorker` — formulas in `modules/payroll/payroll.calc.js` (single source of truth, also unit-tested): monthly proration by `paidDays/totalWorkingDays`, PF 12% of basic, ESI 0.75% if gross ≤ ₹21,000, PT ₹200, simplified TDS 5% if CTC > ₹5L.
- **`ai-screening`** queue → `aiScreeningWorker` — downloads résumé from S3, extracts text (`pdf-parse` v2 for PDF, `mammoth` for DOCX), calls Gemini `complete()` with the exact `RESUME_SCREENING_SYSTEM` prompt, parses JSON (tolerating ```` ```json ```` fences), and updates the candidate (`aiScore`, sub-scores, recommendation, `aiAnalysis`, stage `ai_screening`).

Both workers run **in-process** (started in `server.js`) on a dedicated `redis.duplicate()` blocking connection. `config/redis.js` sets `maxRetriesPerRequest: null` (BullMQ requirement).

---

## 9. AI screening (Gemini)

- SDK: `@google/generative-ai`, model `gemini-2.0-flash`, low temperature for JSON stability (`modules/ai/gemini.service.js`).
- **Graceful fallback:** if `GEMINI_API_KEY` is unset or a call/parse fails, the worker uses a deterministic **rule-based keyword scorer** (`ruleBasedResumeScore`) so the pipeline always completes. Score = `round(matchedRequiredSkills / requiredSkills * 60)`; ≥50 → `maybe`, else `no`. This is what runs in CI/local without a key.
- To enable real Gemini: set `GEMINI_API_KEY` in `nexushr-backend/.env` (free key at aistudio.google.com).

---

## 10. Environment variables (`nexushr-backend/.env`)

Required for local dev (defaults already work with the Docker infra above):
`NODE_ENV, PORT, MONGODB_URI, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, ENCRYPTION_KEY, FRONTEND_URL, CORS_ORIGIN`.

Storage (needed once files are exercised — payslip/resume upload): `S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_REGION` (point at MinIO locally or R2 in prod; `s3.js` uses `forcePathStyle:true` so both work).

AI (optional; falls back if empty): `GEMINI_API_KEY`.

Frontend (`nexushr-frontend/.env.local`): `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.

⚠️ Never change `ENCRYPTION_KEY` after PII is saved (existing data becomes undecryptable). Never put secrets in `NEXT_PUBLIC_*`.

---

## 11. Business rules enforced so far

- **BR-001** — an employee cannot review/approve their own leave request.
- **BR-002** — one payroll run per company per exact period (unique index).
- **BR-004** — AI screening is advisory; only HR/recruiter roles change candidate pipeline stage.
- Multi-tenant isolation — every query filtered by `companyId`.

---

## 12. Known gaps / deviations (intentional)

- **No `seed.js`** yet — DB starts empty (planned later).
- **Recruitment apply is authenticated** (mounted behind JWT) rather than a fully public job board; revisit if external applicant portal is needed.
- **Holidays** aren't modeled — working-day math counts weekdays only (Mon–Fri).
- **`pdf-parse` pinned to v2** (docs reference v1, whose old pdf.js + ESM bug is unworkable); call style is wrapped in `utils/resumeParser.js`.
- **Express pinned to 4** (docs say "Express.js 4"; npm now defaults to 5).
- Docs mention Claude in places; the project standard is **Gemini** (per Phase 5 prompt and ARCHITECTURE.md AI section).

---

## 13. Verification approach

For each phase: spin up Docker infra → seed minimal data via Mongoose → boot the server → drive real HTTP requests (login, CRUD, uploads) → assert status codes, DB state, computed values, and (Phases 4–5) real S3 objects in MinIO. Payroll math and résumé scoring are checked against the shared pure functions so expected values are exact. Temporary seed/test scripts are deleted after they pass; nothing test-related is committed.
