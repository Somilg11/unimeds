# Architecture Context: Unimeds

## 1. System Topology
Unimeds utilizes a high-performance hybrid monolithic topology split cleanly into two decoupled systems operating behind a unified gateway canvas:

```text
                  +-----------------------------------+
                  |        Next.js Frontend           |
                  +-----------------------------------+
                                    |
                        Auth.js (NextAuth) Session
                                    v
                  +-----------------------------------+
                  |    Node.js (Express/Hono) GW      |
                  +-----------------------------------+
                     |                             |
             Drizzle ORM (SSL)             Internal REST
                     v                             v
           +-------------------+         +-------------------+
           | NeonDB PostgreSQL |         |    FastAPI AI     |
           +-------------------+         +-------------------+
                                                   |
                                        PaddleOCR / Groq / Pipecat


## 2. Monorepo Layer Responsibilities

### Node.js Gateway Layer (`server/node_gateway`)

#### Role

Acts as the primary:

- API Gateway
- Backend-for-Frontend (BFF)
- Data persistence coordinator

#### Authentication

- Validates incoming requests by verifying Auth.js (NextAuth) stateless session signatures.
- Enforces authentication before protected route execution.

#### Data Layer

- Executes secure queries against NeonDB PostgreSQL.
- Uses Drizzle ORM as the exclusive database access layer.
- Handles CRUD operations and transaction management.

#### Orchestration

- Delegates high-compute workloads to the internal FastAPI service.
- Dispatches transactional webhooks to a self-hosted n8n instance.
- Coordinates communication between application services.

---

### FastAPI AI Engine Layer (`server/fastapi_ai`)

#### Role

Dedicated micro-engine for:

- AI orchestration
- Local compute pipelines
- OCR processing
- Voice automation workflows

---

#### Document Engine

Responsibilities:

- Text extraction using PaddleOCR or Tesseract
- Document parsing and structuring
- Integration with Groq API for semantic processing

Workflow:

1. Receive document request from Node.js.
2. Extract raw text locally.
3. Send extracted text to Groq.
4. Return structured metadata.

---

#### Conversational Layer

Responsibilities:

- Runs LangGraph multi-agent workflows
- Maintains conversational state
- Performs retrieval-augmented generation (RAG)
- Applies strict medical safety guardrails

Capabilities:

- Record summarization
- Patient context retrieval
- Application navigation assistance

Restrictions:

- No diagnosis generation
- No treatment recommendations
- No prescription assistance

---

#### Voice Stream Engine

Powered by:

- Pipecat
- WebRTC

Responsibilities:

- Voice call automation
- Appointment confirmations
- Follow-up communications
- Real-time audio processing
- Speech transcription workflows

---

## 3. Persistent Data Modeling

### Multi-Tenant Core Schemas

The platform follows a multi-tenant architecture with isolated clinic configurations and shared identity management.

---

### users

Manages platform identities across all supported roles.

#### Supported Roles

- patient
- doctor
- clinic_admin
- super_admin

#### Responsibilities

- Authentication linkage
- Role-based access control
- Tenant association
- Profile management

#### Stored Data

- Identity information
- Profile metadata
- Permission assignments
- Tenant mappings

---

### clinics

Primary tenant ledger responsible for organizational configuration.

#### Responsibilities

- Clinic registration
- Tenant configuration
- Operational settings
- Notification routing

#### Stored Data

- Clinic metadata
- Webhook configurations
- Feature settings
- Automation parameters

---

### appointments

Transaction-heavy scheduling engine.

#### Responsibilities

- Appointment booking
- Slot allocation
- Conflict prevention
- Status management

#### Features

- Time-zone aware scheduling
- Localized date-time mapping
- Availability validation
- Booking lifecycle tracking

#### Supported Statuses

```txt
pending
confirmed
cancelled
```

---

### records

Secure metadata vault connected to Cloudinary asset storage.

#### Responsibilities

- Medical document tracking
- OCR result storage
- File metadata management
- Patient record indexing

#### Stored Data

- Cloudinary asset references
- OCR outputs
- Document classifications
- Upload timestamps

---

### audit_logs

Immutable append-only compliance ledger.

#### Purpose

Maintains a complete security and activity trail across the platform.

#### Characteristics

- Append-only
- Read-only after insertion
- Compliance-focused
- Tamper-resistant

#### Database Restrictions

```sql
UPDATE audit_logs;
DELETE audit_logs;
```

Both operations are strictly prohibited.

#### Tracked Events

- Authentication actions
- Data modifications
- Appointment activities
- Administrative operations
- Security events