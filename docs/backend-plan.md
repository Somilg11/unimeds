# Comprehensive Backend Implementation Plan: Unimeds (Free Tier Stack)

## 0. LLM System Instructions & Core Architecture

**To the AI/LLM generating code from this document:** Adhere strictly to the following architectural, stack, and security constraints.

### Core Architecture

Hybrid monolithic backend:

#### Node.js (Express/Hono)

Primary responsibilities:

- API Gateway
- Backend-for-Frontend (BFF)
- Authentication validation
- Database access layer
- Business logic orchestration

#### FastAPI (Python)

Primary responsibilities:

- AI orchestration
- LLM inference
- OCR processing
- Voice pipeline management

### Database

- PostgreSQL (NeonDB Serverless)

### ORM

- **Drizzle ORM** (TypeScript only)
- Used exclusively within the Node.js environment

### Authentication

- **Auth.js (NextAuth)**
- All protected routes must validate NextAuth session tokens

### AI Safety Constraint

All AI agents must include hard-coded system prompt guardrails that:

- Prohibit medical diagnosis
- Prohibit treatment recommendations
- Redirect users to healthcare professionals when medical advice is requested

---

## 1. Monolithic Directory Structure

```text
server/
├── node_gateway/               # Node.js Primary API & DB Layer
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth & RBAC
│   │   ├── db/                 # Drizzle schemas & migrations
│   │   └── index.ts            # Gateway entry point
│   └── package.json
│
└── fastapi_ai/                 # Python AI Orchestration Layer
    ├── app/
    │   ├── agents/             # LangGraph agents
    │   ├── services/           # OCR, Voice, LLM integrations
    │   ├── api/                # Internal FastAPI routes
    │   └── main.py             # FastAPI entry point
    └── requirements.txt
```

### Node Gateway Responsibilities

- Authentication
- RBAC enforcement
- CRUD APIs
- Database management
- Webhook dispatching
- Integration with FastAPI

### FastAPI Responsibilities

- OCR processing
- LangGraph agents
- Voice orchestration
- AI inference
- Transcript generation

---

## 2. Database Schema (Drizzle ORM)

The Node.js gateway manages the PostgreSQL (NeonDB) database through Drizzle ORM.

### users

Stores platform identities and RBAC roles.

| Field | Type | Description |
|---------|---------|---------|
| id | UUID (PK) | Primary key |
| auth_id | String (Unique) | NextAuth user identifier |
| role | Enum | Patient, Doctor, Admin |
| profile_data | JSONB | Profile metadata |

---

### clinics

Stores tenant and notification configuration.

| Field | Type | Description |
|---------|---------|---------|
| id | UUID (PK) | Primary key |
| name | String | Clinic name |
| n8n_webhook_urls | JSONB | Notification webhooks |
| settings | JSONB | Tenant settings |

---

### appointments

Scheduling and booking ledger.

| Field | Type | Description |
|---------|---------|---------|
| id | UUID (PK) | Primary key |
| patient_id | UUID | Patient reference |
| doctor_id | UUID | Doctor reference |
| clinic_id | UUID | Clinic reference |
| slot_time | Timestamp | Appointment time |
| status | Enum | pending, confirmed, cancelled |

---

### records

Medical documents and extracted metadata.

| Field | Type | Description |
|---------|---------|---------|
| id | UUID (PK) | Primary key |
| patient_id | UUID | Patient reference |
| file_url | String | Cloudinary asset URL |
| record_type | String | Document category |
| ocr_data | JSONB | Extracted OCR metadata |
| created_at | Timestamp | Upload timestamp |

---

### audit_logs

Immutable security and compliance ledger.

| Field | Type | Description |
|---------|---------|---------|
| id | UUID (PK) | Primary key |
| user_id | UUID | User reference |
| action | String | Executed action |
| target_resource | String | Affected resource |
| timestamp | Timestamp | Event timestamp |

#### Restrictions

```sql
UPDATE audit_logs;
DELETE audit_logs;
```

Both operations are prohibited.

---

## 3. Node.js Gateway Workflows (Core CRUD & Auth)

### Authentication & RBAC Middleware

#### Responsibilities

1. Intercept all `/api/v1/*` requests.
2. Validate NextAuth session tokens.
3. Extract user identity.
4. Extract RBAC roles.
5. Enforce authorization boundaries.

#### Examples

##### Patients Cannot Access

```txt
/hospital/*
```

##### Doctors Cannot Access

```txt
/admin/*
```

##### Unauthorized Requests

Return:

```http
403 Forbidden
```

---

### Automation Integration (n8n)

#### Workflow

1. User action triggers an event.
2. Node.js constructs an event payload.
3. Payload is sent to a self-hosted n8n webhook.
4. n8n executes downstream automation workflows.

#### Example Event

```txt
Appointment Booked
```

#### Downstream Actions

- Email notifications (Nodemailer)
- WhatsApp notifications (Baileys)
- Internal workflow automation
- Administrative alerts

---

## 4. FastAPI AI Engine Workflows

The Node.js gateway forwards compute-intensive AI workloads to FastAPI.

---

### A. Document OCR Pipeline (`/ai/ocr`)

#### Workflow

1. Receive Cloudinary file URL.
2. Download document.
3. Process with PaddleOCR (or Tesseract).
4. Extract raw text.
5. Send extracted text to Groq API (Llama 3).
6. Convert into structured medical metadata.
7. Return JSON to Node.js.
8. Update the `records` table.

#### Structured Output Example

```json
{
  "doctor_name": "Dr. Smith",
  "date": "2026-06-01",
  "medications": [
    "Paracetamol",
    "Vitamin D"
  ]
}
```

---

### B. LangGraph Chatbot Agent (`/ai/chat`)

#### Engine

- Groq API
- Llama 3

#### Responsibilities

- Maintain conversation state
- Patient-specific RAG
- Record summarization
- Navigation assistance

#### Mandatory Guardrail Prompt

```txt
You are an assistant for Unimeds. You summarize records and help navigate the app. You must explicitly refuse to diagnose conditions or prescribe treatments. If asked for medical advice, direct the user to book an appointment.
```

#### Allowed Actions

- Summarize records
- Explain documents
- Help navigate features

#### Disallowed Actions

- Diagnosis
- Treatment planning
- Prescription recommendations

---

### C. Open-Source Voice Orchestration (`/ai/voice`)

#### Engine

- Pipecat
- Groq Whisper (optional)

#### Workflow

1. Receive or initiate Pipecat WebRTC session.
2. Load appointment context.
3. Enrich prompts dynamically.
4. Execute voice interaction.
5. Transcribe audio.
6. Generate final transcript.
7. POST transcript to Node.js.
8. Append transcript to patient records.

#### Supported Use Cases

- Appointment confirmation
- Appointment reminders
- Follow-up calls
- Administrative outreach

---

## 5. Security & Error Handling Standards

### Data at Rest & Transit

#### NeonDB

Connection strings must enforce SSL:

```txt
?sslmode=require
```

#### Cloudinary

Requirements:

- Signed URLs
- Secure upload presets
- Restricted asset access
- Protected medical records

---

### API Rate Limiting

Apply gateway-level throttling to all public endpoints.

#### Recommended Policy

```txt
100 Requests / Minute / IP
```

#### Protects

- Groq API quota
- OCR processing capacity
- Backend resources
- Abuse prevention

---

### Graceful Degradation (Timeout Handling)

Long-running AI workloads must never crash the frontend.

#### Trigger Conditions

- FastAPI timeout
- PaddleOCR timeout
- Groq API latency spike

#### Required Response

```http
202 Accepted
```

#### Response Body

```json
{
  "status": "accepted",
  "processing_state": "queued"
}
```

---

### Frontend Expectations

When a queued response is received:

1. Display skeleton loaders.
2. Show processing indicators.
3. Begin polling workflow.
4. Refresh automatically when processing completes.

#### Benefits

- Better user experience
- Prevents UI crashes
- Handles AI latency gracefully
- Supports asynchronous processing pipelines

---

## Backend Design Principles

### Reliability

- Retry transient failures
- Queue expensive operations
- Isolate AI workloads

### Security

- RBAC everywhere
- NextAuth validation
- Encrypted transport
- Signed asset access

### Scalability

- NeonDB serverless scaling
- FastAPI workload separation
- Stateless Node.js gateway

### Maintainability

- Drizzle ORM type safety
- Clear service boundaries
- Shared schema contracts
- Structured audit logging