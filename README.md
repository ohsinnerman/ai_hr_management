# NexusHR — AI-Powered HR Management System

**NexusHR** is a modern, AI-powered Human Resource Management System (MVP) developed for the FWC IT Services hackathon. It streamlines core HR processes, including employee management, attendance, leave, payroll processing, and AI-driven candidate screening.

This project is built using a modern **MERN Stack** (MongoDB, Express.js, React/Next.js, Node.js 20) with a robust background task queue system and advanced AI integrations.

---

## 🌟 Key Features & Phase Status

NexusHR is developed in phases. The following modules are currently operational:

- **Auth & Security (Phase 1):** Robust JWT-based authentication with refresh tokens (stored in Redis), password hashing, role-based access control, and account lockout protection.
- **Core HR (Phase 2):** Comprehensive company, department, designation, and employee management. Includes full organizational tree visualization and strict PII encryption (AES-256-GCM) for sensitive data like banking and tax details.
- **Attendance & Leave Management (Phase 3):** Automated check-in/out tracking with lateness calculation based on company policy. Leave request system with multi-tier approval tracking and balance validation (enforcing BR-001: managers cannot approve their own leaves).
- **Automated Payroll (Phase 4):** BullMQ-powered background worker for processing complex salary structures (Basic, HRA, DA, PF, ESI, TDS) calculated pro-rata against attendance data. Automated dynamic PDF payslip generation and secure upload to S3/R2.
- **AI Recruitment Screening (Phase 5):** Background AI worker using Google Gemini (`gemini-2.0-flash`) to parse uploaded PDF/DOCX resumes and automatically score candidates against job requirements, assessing skills, experience, and cultural fit.

---

## 🛠️ Technology Stack

### Backend (`nexushr-backend`)
- **Core Environment:** Node.js 20, Express 4, Mongoose (MongoDB)
- **Caching & Queues:** ioredis, BullMQ (for Payroll and AI background workers)
- **Authentication:** jsonwebtoken, bcryptjs
- **Security:** helmet, cors, cookie-parser, express-validator
- **Storage:** @aws-sdk/client-s3 (Compatible with AWS S3, Cloudflare R2, and MinIO)
- **Document Processing:** multer (upload handling), pdfkit (payslip generation), pdf-parse v2 (resume PDF extraction), mammoth (DOCX extraction)
- **AI Integration:** @google/generative-ai (Gemini 2.0 Flash)

### Frontend (`nexushr-frontend`)
- **Core Environment:** Next.js 14, TypeScript, Tailwind CSS
- **State & Data Fetching:** Zustand, @tanstack/react-query, axios
- **UI Components:** lucide-react, react-hot-toast

---

## 📁 Repository Structure

The project is structured as a monorepo with separate deployment targets for the backend API and frontend application.

```text
ai_hr_management/
├── nexushr-backend/      # Node 20 + Express 4 (ESM) REST API
│   ├── src/
│   │   ├── config/       # MongoDB, Redis, S3, and Multer configs
│   │   ├── middleware/   # Authentication, RBAC, and Validation
│   │   ├── models/       # Mongoose Schemas (15+ models)
│   │   ├── modules/      # Domain-driven features (Auth, HR, Payroll, Recruitment, AI)
│   │   ├── queues/       # BullMQ queue initializers
│   │   ├── utils/        # Crypto, S3 uploaders, PDF generators, Resume parsers
│   │   ├── workers/      # BullMQ background workers
│   │   └── server.js     # Main application entry point
├── nexushr-frontend/     # Next.js 14 Frontend Application
├── docs/                 # Extensive project documentation (PRD, BRD, DB Schemas, API Specs)
└── context.md            # Living source of truth for repository state
```

---

## 🚀 Getting Started

### 1. Prerequisites (Infrastructure via Docker)
NexusHR relies on MongoDB, Redis, and an S3-compatible storage system. You can easily spin these up using Docker for local development.

```bash
# Start MongoDB & Redis
docker run -d --name nexushr-mongo -p 27017:27017 mongo:7
docker run -d --name nexushr-redis -p 6379:6379 redis:7-alpine

# Start MinIO (Optional, for local S3 storage for Resumes & Payslips)
docker run -d --name nexushr-minio -p 9000:9000 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data
```

*(After the first run, simply use `docker start nexushr-mongo nexushr-redis nexushr-minio`)*

### 2. Environment Variables
Create an `.env` file in the `nexushr-backend` directory.

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Databases
MONGODB_URI=mongodb://127.0.0.1:27017/nexushr
REDIS_URL=redis://127.0.0.1:6379

# Security (DO NOT CHANGE ENCRYPTION_KEY AFTER DATA IS SAVED)
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=32_character_hex_string_for_aes_256

# Storage (Point to local MinIO or remote R2/S3)
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=nexushr
S3_REGION=us-east-1

# AI Integration (Get a free key from aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key
```

Create an `.env.local` in `nexushr-frontend`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 3. Running the Application

Run the backend and frontend in separate terminals.

**Backend Server:**
```bash
cd nexushr-backend
npm install
npm run dev
# Server runs at http://localhost:5000
# Verify Health: curl http://localhost:5000/api/v1/health
```

**Frontend Application:**
```bash
cd nexushr-frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

*Note: There is currently no database seeder. You must create your first Company and User via API calls before attempting to log in.*

---

## 🧠 Background Jobs & AI Screening

NexusHR heavily utilizes **BullMQ** for complex, long-running tasks. The workers run in-process on the Express backend via a dedicated Redis connection.

1. **Automated Payroll (`payrollWorker`):** 
   When triggered by an HR Admin, this worker calculates prorated salaries, processes standard tax/PF deductions, generates personalized PDF payslips using `pdfkit`, and securely uploads them to S3/R2.
2. **AI Resume Screening (`aiScreeningWorker`):** 
   When a candidate applies with a resume, the worker downloads the PDF/DOCX from S3, extracts the raw text (`pdf-parse`/`mammoth`), and streams the data to Google Gemini. Gemini evaluates the candidate against the specific Job Posting requirements and returns a structured JSON evaluation (Skill Match, Culture Fit, Red Flags) saving HR countless hours of manual review. 
   *(Fallback: If the Gemini API key is missing or fails, a deterministic keyword-matching fallback scorer is used automatically).*

---

## 🔒 Security & Business Rules

NexusHR is built with enterprise security patterns in mind:
- **AES-256-GCM Encryption:** Employee PII (Aadhaar, PAN, Bank Details) is encrypted at rest in MongoDB.
- **Multi-Tenant Isolation:** Every single database query is strictly scoped by `companyId`.
- **Strict Validation Rules:**
  - **BR-001:** Employees cannot review or approve their own leave requests.
  - **BR-002:** The system enforces exactly one payroll run per company per distinct calendar period.
  - **BR-004:** AI Screening is strictly advisory. Human HR gatekeepers are the only ones allowed to transition candidates to interview or offer stages. 

---

*Documentation updated as of Phase 5 Completion.*
