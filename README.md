# NexusHR — AI-Powered HR Management System

**NexusHR** is a full-stack, AI-powered Human Resource Management System (HRMS) built for the FWC IT Services hackathon. It covers the complete HR lifecycle — employee management, attendance, leave, payroll, recruitment with AI résumé screening, performance reviews, analytics, and a RAG-powered HR chat assistant — for organizations of up to ~5,000 employees.

Built on the **MERN stack** (MongoDB 7 · Express 4 · Next.js 14 · Node.js 20, all ESM) with BullMQ background workers, Redis, S3-compatible object storage, and Google Gemini for AI.

> **Status:** Backend **Phases 1–8 complete** · Frontend **Phases 1–5 complete**. The system is feature-complete end-to-end. Per-phase design notes live in [`docs/CONTEXT_*.md`](docs/) and [`docs/FRONTEND_CONTEXT_*.md`](docs/).

---

## ✨ Features

| Domain | What it does |
|---|---|
| **Auth & Security** | JWT auth — 15-min access token (in memory), 7-day httpOnly refresh cookie (hash in Redis); bcrypt passwords; RBAC across 5 roles; account lockout; tiered rate limiting. |
| **Core HR** | Companies, departments, designations, employees with org-tree; **AES-256-GCM** encryption at rest for PII (PAN, Aadhaar, bank details). |
| **Attendance** | Geo-tagged check-in/out, lateness vs. company cutoff, monthly calendar + summaries. |
| **Leave** | Leave types, balance-validated requests, manager/HR approval queue (BR-001: can't approve your own leave). |
| **Payroll** | BullMQ worker computes pro-rata salary (Basic/HRA/DA/PF/ESI/PT/TDS) against attendance, renders PDF payslips (pdfkit), uploads to S3/R2; one run per period; HR approval publishes payslips. |
| **Recruitment** | Job postings + candidate Kanban pipeline; **AI résumé screening** via a background worker (Gemini scores skills/experience/culture/red-flags; rule-based fallback without a key). |
| **Performance** | 5-stage review workflow (draft → self → manager → HR → completed) with KPI scoring and an async Gemini recommendation. |
| **AI Assistant (RAG)** | SSE-streamed HR chat grounded in company policy docs (Gemini `text-embedding-004`, 768-dim) via Atlas Vector Search with a JS cosine-similarity fallback for local dev. |
| **Analytics** | Headcount, attrition rate, department breakdown, leave summary, recruitment funnel, payroll cost, attendance pattern, and Gemini-powered attrition-risk + workforce insights. |
| **Dashboards** | A tailored dashboard per role: admin, HR, recruiter, manager, employee. |
| **Ops** | Swagger/OpenAPI docs, Winston logging, graceful shutdown, nightly attrition cron, enriched health check. |

---

## 🛠 Tech Stack

**Backend** (`nexushr-backend`) — Node 20, Express 4 (ESM), Mongoose 8, ioredis + BullMQ 5, jsonwebtoken, bcryptjs, helmet/cors/express-validator, express-rate-limit, `@aws-sdk/client-s3` (S3 / Cloudflare R2 / MinIO), multer, pdfkit, **pdf-parse v2** + mammoth (résumé extraction), `@google/generative-ai` (Gemini), node-cron, winston, swagger-jsdoc + swagger-ui-express.

**Frontend** (`nexushr-frontend`) — Next.js 14 App Router + TypeScript, Tailwind CSS, Radix-based UI primitives, Zustand (auth/chat stores), TanStack Query, axios (JWT interceptor + auto-refresh), react-hook-form + zod, recharts, react-hot-toast, react-markdown, lucide-react.

**Infrastructure** — MongoDB 7, Redis 7, S3-compatible storage (MinIO locally / Cloudflare R2 in prod), Google Gemini.

---

## 📁 Repository Structure

```text
ai_hr_management/
├── nexushr-backend/            # Express 4 REST API (ESM)
│   ├── src/
│   │   ├── config/             # db, redis, s3, multer, swagger, logger
│   │   ├── middleware/         # authenticate, requireRole, rateLimiter, validate, errorHandler
│   │   ├── models/             # 19 Mongoose schemas (+ index.js barrel)
│   │   ├── modules/            # auth, employees, departments, designations, attendance,
│   │   │                       #   leaves, payroll, recruitment, ai, analytics, dashboard, performance
│   │   ├── workers/            # payrollWorker, aiScreeningWorker (BullMQ)
│   │   ├── jobs/               # attritionCron (node-cron)
│   │   ├── utils/              # crypto, s3Upload, pdfGenerator, resumeParser, dates, …
│   │   └── server.js           # app entry: middleware, routes, workers, cron
│   ├── seed.js                 # idempotent demo-data seeder
│   └── .env                    # backend config (see below)
├── nexushr-frontend/           # Next.js 14 app (App Router)
│   ├── src/app/(auth)/         # login, forgot-password
│   ├── src/app/(dashboard)/    # admin · hr · recruiter · manager · employee routes
│   ├── src/components/         # layout (Sidebar/Header), ui primitives, ai chat, ErrorBoundary
│   ├── src/lib/                # api hooks (TanStack Query), stores, utils, navigation
│   └── .env.local              # NEXT_PUBLIC_API_URL
└── docs/                       # PRD/BRD/architecture/DB/API + per-phase prompts & context notes
```

---

## 🚀 Getting Started

### 1. Prerequisites — infrastructure (Docker)

```bash
# MongoDB + Redis (required)
docker run -d --name nexushr-mongo -p 27017:27017 mongo:7
docker run -d --name nexushr-redis -p 6379:6379 redis:7-alpine

# MinIO (optional — needed for résumé / payslip / document uploads to actually store)
docker run -d --name nexushr-minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

After the first run, just: `docker start nexushr-mongo nexushr-redis nexushr-minio`.

### 2. Environment variables

**`nexushr-backend/.env`:**

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

MONGODB_URI=mongodb://127.0.0.1:27017/nexushr
REDIS_URL=redis://127.0.0.1:6379

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 32-char key — do NOT change after PII is saved, or encrypted data becomes unreadable
ENCRYPTION_KEY=dev-32-char-aes-key-change-in-prod

# S3 / MinIO / R2 (forcePathStyle works with all three)
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=nexushr-dev
S3_REGION=auto

# Optional — enables live AI (chat, screening, embeddings, insights).
# Without it the app degrades gracefully (rule-based screening, empty AI results).
GEMINI_API_KEY=
```

**`nexushr-frontend/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 3. Seed demo data

```bash
cd nexushr-backend
npm install
node seed.js
```

The seeder is **idempotent** and creates: 1 company (`fwcit.com`), 6 departments, 30 designations, **5 demo users**, 50 employees, salary structures, leave types/balances, ~3 months of attendance, 5 job postings, 20 candidates, and 5 policy documents.

### 4. Run (two terminals)

```bash
# Terminal 1 — backend
cd nexushr-backend && npm run dev      # http://localhost:5000  (health: /api/v1/health)

# Terminal 2 — frontend
cd nexushr-frontend && npm install && npm run dev   # http://localhost:3000
```

> Keep **both** running. If only the frontend is up, every API call fails with `ERR_CONNECTION_REFUSED`.

### Demo accounts (after seeding) — password `Demo@1234`

| Role | Email | Lands on |
|---|---|---|
| Super Admin | `superadmin@fwcit.com` | `/admin` |
| HR Manager | `hrmanager@fwcit.com` | `/hr` |
| Recruiter | `recruiter@fwcit.com` | `/recruiter` |
| Senior Manager | `manager@fwcit.com` | `/manager` |
| Employee | `employee@fwcit.com` | `/employee` |

API docs: **[localhost:5000/api-docs](http://localhost:5000/api-docs)** (Swagger UI).

---

## 🧠 Background Jobs & AI

Workers run in-process on the Express backend over a dedicated (duplicated) Redis connection.

- **`payrollWorker`** — on an HR-triggered run, computes prorated salaries + statutory deductions, generates per-employee PDF payslips (pdfkit), and uploads them to S3/R2.
- **`aiScreeningWorker`** — on a candidate application, downloads the résumé from S3, extracts text (pdf-parse v2 / mammoth), and asks Gemini to score it against the job (skills, experience, culture, red flags) as structured JSON. **Fallback:** a deterministic keyword scorer runs automatically if the Gemini key is missing/over quota.
- **`attritionCron`** — nightly (02:00 IST) job that pre-warms the Gemini attrition-risk cache per company.
- **AI chat (RAG)** — embeds the query (768-dim), retrieves policy chunks via Atlas Vector Search (JS cosine fallback locally), injects live employee data, and streams the Gemini answer over SSE.

> **AI is optional.** With no `GEMINI_API_KEY` (or one over the free-tier quota), every AI path degrades gracefully — résumé screening uses the rule-based scorer, and chat/insights/attrition return empty results instead of failing.

---

## 🔒 Security & Business Rules

- **AES-256-GCM** encryption at rest for employee PII (Aadhaar, PAN, bank details).
- **Multi-tenant isolation** — every query is scoped by `companyId`.
- **Tiered rate limiting** — 100/min general, 10/min auth (brute-force), 20/min AI chat.
- **PII exposure control** — list endpoints omit PII, HR single-fetch masks it, only `/employees/me` returns plaintext.
- **Immutable audit log** (pre-hook blocks updates/deletes).
- Key business rules: **BR-001** can't approve own leave · **BR-002** one payroll run per period · **BR-004** AI screening is advisory (humans change candidate stages) · **BR-009** confidential docs hidden from non-HR.

---

## 🌐 API Surface (`/api/v1`)

`auth` · `employees` (+ `/me`, `/me/payslips`) · `departments` · `designations` · `attendance` · `leaves` · `payroll` · `recruitment` (`/jobs`, `/candidates`) · `ai` (`/chat`, `/documents`, `/feedback`, `/analytics/insights`) · `analytics` (8 endpoints) · `dashboard` (5 role dashboards) · `performance` (8 endpoints) · `health` · `/api-docs`.

19 Mongoose models · 2 BullMQ workers · 1 nightly cron.

---

## 🧩 Frontend Routes

- **Auth:** `/login`, `/forgot-password`
- **Role dashboards:** `/admin`, `/hr`, `/recruiter`, `/manager`, `/employee`
- **HR:** employees (list / create wizard / profile / edit), payroll, leaves approval queue, documents, analytics
- **Recruiter:** jobs, Kanban pipeline, candidate AI-analysis detail
- **Employee:** attendance (check-in/out + calendar), leaves (apply + balances), payslips, performance reviews
- Plus a floating **AI chat assistant** on every dashboard page, a responsive mobile sidebar, and an error boundary.

Auth tokens live **in memory only** (Zustand) — never `localStorage`; the only cookie is the httpOnly refresh token.

---

## 📚 Documentation

- Design docs in [`docs/`](docs/): PRD, BRD, architecture, database, API, AI architecture.
- **Backend phase notes:** `docs/CONTEXT_*.md` (Phases 1–8).
- **Frontend phase notes:** `docs/FRONTEND_CONTEXT_*.md` (Phases 1–5).

---

## ✅ Production notes

To enable the full live experience:

1. Set a billed/quota'd `GEMINI_API_KEY` (free key: [aistudio.google.com](https://aistudio.google.com/app/apikey)).
2. Run MinIO (local) or configure Cloudflare R2 / AWS S3 for résumé, payslip, and document storage.
3. For production RAG, create the MongoDB Atlas Vector Search index `documents_vector_index` (768 dims, cosine).

---

*NexusHR · FWC IT Services Pvt. Ltd. — hackathon MVP. Internal & proprietary.*
