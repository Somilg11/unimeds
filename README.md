# Unimeds - Premium AI-Powered Healthcare SaaS Platform

A next-generation, premium AI-powered patient engagement and healthcare management platform that transforms fragmented healthcare interactions into a unified, high-end ecosystem.

## 🏗️ Architecture

Unimeds utilizes a hybrid monolithic topology split into two decoupled systems:

```
┌─────────────────────────────────┐
│      Next.js Frontend           │
│    (App Router + TypeScript)    │
└──────────────┬──────────────────┘
               │ Auth.js Session
               ↓
┌─────────────────────────────────┐
│    Node.js Gateway (Express)    │
│  - API Gateway & BFF           │
│  - Drizzle ORM (NeonDB)        │
└──────┬──────────────┬───────────┘
       │              │
   Drizzle ORM    Internal REST
       ↓              ↓
┌──────────────┐ ┌──────────────┐
│   NeonDB     │ │  FastAPI AI  │
│ PostgreSQL  │ │   Engine     │
└──────────────┘ └──────┬───────┘
                      │
            Groq API / PaddleOCR / Pipecat
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand (client), React Query (server)
- **Authentication:** Auth.js (NextAuth)
- **Components:** Radix UI primitives

### Backend
- **API Gateway:** Node.js + Express
- **Database:** PostgreSQL (NeonDB Serverless)
- **ORM:** Drizzle ORM
- **AI Engine:** FastAPI (Python 3.11)
- **OCR:** PaddleOCR / Tesseract
- **LLM:** Groq API (Llama 3)
- **Voice:** Pipecat (WebRTC)
- **Storage:** Cloudinary
- **Automation:** n8n (self-hosted)

## 📁 Project Structure

```
unimeds-mono/
├── src/                    # Next.js Frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities (API client, Cloudinary, DB)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state slices
│   └── types/             # TypeScript type definitions
│
├── server/                # Node.js Gateway
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth & RBAC middleware
│   │   ├── db/            # Drizzle schemas & migrations
│   │   └── index.ts       # Gateway entry point
│   └── package.json
│
├── ai_engine/             # FastAPI AI Engine
│   ├── app/
│   │   ├── agents/        # LangGraph agents
│   │   ├── services/      # OCR, Voice, LLM integrations
│   │   ├── api/           # Internal FastAPI routes
│   │   └── main.py        # FastAPI entry point
│   ├── requirements.txt
│   └── venv/              # Python virtual environment
│
├── docs/                  # Documentation
│   ├── phase.md           # Phase tracking
│   ├── architecture-context.md
│   ├── api.md             # API documentation
│   ├── frontend-plan.md
│   ├── backend-plan.md
│   └── postman.md         # API collection
│
└── .env                   # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL (NeonDB account)
- Cloudinary account
- Groq API key

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd unimeds-mono
```

2. **Install root dependencies**
```bash
# No root dependencies - each service manages its own
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# System & Database
PORT=8080
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8080
FASTAPI_SERVICE_URL=http://localhost:8000
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/unimeds?sslmode=require

# Authentication (Auth.js)
AUTH_SECRET=your_generated_auth_secret_key
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_secret

# Storage (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# AI Services (Groq API)
GROQ_API_KEY=gsk_your_free_groq_api_key

# Automation (n8n)
N8N_WEBHOOK_BASE_URL=https://n8n.yourdomain.com/webhook/trigger

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_dev_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

### Frontend Setup (Next.js)

```bash
cd src
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

### Backend Setup (Node.js Gateway)

```bash
cd server
npm install
npm run dev
```

Backend runs on: `http://localhost:8080`

### AI Engine Setup (FastAPI)

```bash
cd ai_engine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

AI Engine runs on: `http://localhost:8000`

## 🗄️ Database Setup

### Running Migrations

```bash
cd server
npx drizzle-kit generate
npx drizzle-kit push
```

### Database Schema

The platform uses Drizzle ORM with the following tables:

- **users** - Platform identities with RBAC roles (patient, doctor, clinic_admin, super_admin)
- **clinics** - Multi-tenant configuration with n8n webhook URLs
- **appointments** - Scheduling engine with status tracking
- **records** - Medical document metadata with Cloudinary URLs and OCR data
- **audit_logs** - Immutable compliance ledger

## 🔐 Authentication & RBAC

### Supported Roles

- **patient** - Access to personal health timeline, record uploads, appointment booking
- **doctor** - Access to patient search, clinical context, consultation notes
- **clinic_admin** - Access to clinic analytics, appointment queues, operational metrics
- **super_admin** - Access to tenant onboarding, audit logs, global platform settings

### Auth.js Configuration

Authentication is handled by Auth.js (NextAuth) with Google OAuth provider. Session tokens include user role for RBAC enforcement.

## 📝 Development Commands

### Frontend (Next.js)

```bash
cd src

# Development
npm run dev

# Build
npm run build

# Start production
npm run start

# Lint
npm run lint
```

### Backend (Node.js Gateway)

```bash
cd server

# Development (with tsx)
npx tsx src/index.ts

# Build
npx tsc

# Generate migrations
npx drizzle-kit generate

# Push migrations
npx drizzle-kit push

# Studio (database UI)
npx drizzle-kit studio
```

### AI Engine (FastAPI)

```bash
cd ai_engine

# Development
uvicorn app.main:app --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🎨 Design System

### Color Palette
- Primary: Royal Blues (`#0a2540`, `#003366`)
- Structural: Zinc scale (`zinc-50` through `zinc-900`)
- **Standard grays are strictly prohibited**

### Typography
- Font: Geist sans-serif exclusively
- Wide letter-spacing on subheadings
- Heavy weight contrasts for hierarchy

### Layout
- Bento Grid Architecture for dashboards
- Dashed borders (`border-dashed`) for empty states and dropzones
- Glassmorphism for floating elements (`bg-white/80 backdrop-blur-md`)

## 📚 Documentation

- **[Phase Tracking](docs/phase.md)** - Development phase progress
- **[Architecture Context](docs/architecture-context.md)** - System topology and data modeling
- **[API Documentation](docs/api.md)** - REST API endpoints and examples
- **[Frontend Plan](docs/frontend-plan.md)** - Frontend implementation details
- **[Backend Plan](docs/backend-plan.md)** - Backend implementation details
- **[Postman Collection](docs/postman.md)** - API request/response examples

## 🔒 Security

- All database connections enforce SSL (`?sslmode=require`)
- Cloudinary uses signed URLs and secure upload presets
- RBAC enforced at multiple layers (middleware, backend, database)
- Audit logs are append-only (UPDATE/DELETE prohibited)
- Rate limiting: 100 requests/minute/IP (planned)

## 🚧 Current Status

### Phase 1: Foundation & Data Layer ✅
- ✅ Monorepo Setup
- ✅ Database Schema (Drizzle ORM)
- ✅ Authentication (Auth.js + RBAC)
- ✅ Storage Infrastructure (Cloudinary)
- ✅ CI/CD (GitHub Actions - deferred)

### Phase 2: Core Healthcare Workflows (Next)
- ⏳ Patient Portal
- ⏳ Health Timeline
- ⏳ Appointment Engine
- ⏳ Doctor Dashboard
- ⏳ Clinic Dashboard

## 🤝 Contributing

This is a premium healthcare SaaS platform. Please follow the coding standards and architectural constraints outlined in the documentation.

## 📄 License

ISC

## 🆘 Support

For technical questions or issues, refer to the documentation in the `docs/` directory.
