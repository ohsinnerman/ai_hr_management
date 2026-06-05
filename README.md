# NexusHR — AI-Powered Human Resource Management System

> **FWC IT Services Pvt. Ltd.** | Hackathon Build | June 2025  
> Theme: *"Build the Future of HR Management with AI-Powered Solutions"*  
> Stack: **MERN** — MongoDB · Express.js · React (Next.js) · Node.js

---

## 🚀 Overview

**NexusHR** is an enterprise-grade, AI-first Human Resource Management System (HRMS) built on the **MERN stack**, designed for organizations with up to **5,000 employees**. It combines full-spectrum HR operations with Anthropic Claude-powered AI to automate screening, enable conversational HR support, and surface predictive workforce insights.

---

## 📁 Documentation Index

| # | File | Description |
|---|------|-------------|
| 1 | [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document — features, NFRs, KPIs |
| 2 | [`docs/BRD.md`](docs/BRD.md) | Business Requirements Document — objectives, rules, compliance |
| 3 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical Architecture — MERN system design, stack, security |
| 4 | [`docs/DATABASE.md`](docs/DATABASE.md) | MongoDB Schema Design — collections, Mongoose models, indexes |
| 5 | [`docs/API.md`](docs/API.md) | API Design Document — all Express endpoints, contracts, examples |
| 6 | [`docs/AI_ARCHITECTURE.md`](docs/AI_ARCHITECTURE.md) | AI Architecture — Claude integration, RAG, voice, analytics |
| 7 | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deployment & Roadmap — Docker, MongoDB Atlas, 8-phase plan |
| 8 | [`docs/MASTER_PROMPT.md`](docs/MASTER_PROMPT.md) | Master Implementation Prompt — complete MERN agent build guide |

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/fwcit/nexushr.git
cd nexushr

# 2. Start infrastructure (MongoDB + Redis)
docker-compose up -d

# 3. Backend setup
cd nexushr-backend
npm install
cp .env.example .env        # fill in your keys
npm run seed                 # seed demo data
npm run dev                  # starts on port 5000

# 4. Frontend setup (new terminal)
cd ../nexushr-frontend
npm install
cp .env.example .env.local
npm run dev                  # starts on port 3000
```

API docs at `http://localhost:5000/api-docs` (Swagger UI via swagger-jsdoc)

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@fwc.com` | `Demo@1234` |
| HR Manager | `hrmanager@fwc.com` | `Demo@1234` |
| Recruiter | `recruiter@fwc.com` | `Demo@1234` |
| Senior Manager | `manager@fwc.com` | `Demo@1234` |
| Employee | `employee@fwc.com` | `Demo@1234` |

---

## 🧱 MERN Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js 20 + Express.js 4 |
| **Database** | MongoDB 7 (with Mongoose ODM) |
| **Cache / Queue** | Redis 7 + BullMQ |
| **AI** | Google Gemini (`gemini-2.0-flash`) |
| **Storage** | Cloudflare R2 (S3-compatible via AWS SDK v3) |
| **Auth** | JWT (`jsonwebtoken`) + bcryptjs |
| **Deployment** | Vercel (FE) + Railway (BE) + MongoDB Atlas (DB) |

---

## 🤖 AI Features

- **Resume Screening** — Gemini extracts, scores candidates 0–100 vs JD
- **HR Chat Assistant** — RAG-powered policy Q&A with real employee data context
- **Voice Interface** — STT (OpenAI Whisper) + TTS (ElevenLabs) for interviews
- **Attrition Prediction** — Nightly BullMQ batch analysis of employee signals
- **Hiring Forecast** — Predictive department headcount recommendations
- **Document Intelligence** — Gemini embeddings (`text-embedding-004`) for semantic search

---

## 📋 Project Structure

```
nexushr/
├── nexushr-backend/              # Node.js + Express API
│   ├── src/
│   │   ├── app.js               # Express app setup
│   │   ├── server.js            # HTTP server entry point
│   │   ├── config/              # env, db, redis, multer, s3
│   │   ├── middleware/          # auth, rbac, rateLimit, audit, error
│   │   ├── modules/             # auth, employees, attendance, leaves,
│   │   │                        # payroll, recruitment, ai, analytics
│   │   ├── models/              # Mongoose models (all collections)
│   │   ├── queues/              # BullMQ workers (AI screening, payroll)
│   │   └── utils/               # email, pdf, s3, validators
│   ├── seed.js
│   ├── .env.example
│   └── package.json
│
├── nexushr-frontend/             # Next.js 14 App Router
│   └── src/
│       ├── app/                 # (auth) + (dashboard) route groups
│       ├── components/          # ui, layout, dashboards, ai, analytics
│       └── lib/                 # api client, zustand stores, hooks
│
└── docs/                        # All markdown documentation
```

---

## 📊 Key Metrics Targets

| Metric | Target |
|--------|--------|
| Page Load (P95) | < 2 seconds |
| API Response | < 200ms |
| AI Resume Screen | < 5 seconds |
| System Uptime | 99.9% |
| Payroll Error Rate | < 0.1% |
| Self-Service Adoption | > 80% |

---

## 📄 License

Internal & Proprietary — FWC IT Services Pvt. Ltd. — Revision A2 (MERN), June 2025
