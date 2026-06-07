# Unimeds: Master Phase Tracking (30-Day MVP - Free Tier Development)

## Phase 1: Foundation & Data Layer (Days 1–6)
*Objective: Establish core infrastructure, database schemas, and authentication.*

- [x] **Monorepo Setup:** Initialize Next.js, Node.js (Gateway), and FastAPI (AI Engine) environments. *(Completed)*
- [x] **Database Schema:** Define `patients`, `records`, `appointments`, and `clinics` tables using Drizzle ORM connected to **NeonDB**. *(Completed)*
- [x] **Authentication:** Integrate **Auth.js (NextAuth)** and configure RBAC (Patient, Doctor, Clinic Admin, Super Admin). *(Completed)*
- [x] **Storage Infrastructure:** Provision **Cloudinary** for medical document storage and configure upload presets. *(Completed)*
- [x] **CI/CD:** Setup GitHub Actions for automated deployment to staging. *(Completed)*

---

## Phase 2: Core Healthcare Workflows (Days 7–16)
*Objective: Deliver primary CRUD operations, UI dashboards, and booking engine.*

- [ ] **Super Admin Portal:** Build tenant onboarding (`/admin/clinics`), global platform metrics, and the immutable audit log data table.
- [ ] **Patient Portal:** Build registration, family sub-profiles, and document upload forms (dashed dropzones).
- [ ] **Health Timeline:** Implement chronological bento-grid view for patient records.
- [ ] **Appointment Engine:** Build real-time slot selection, booking logic, and conflict resolution APIs.
- [ ] **Doctor Dashboard:** Develop Omni-Search and Clinical Context Grid (patient history).
- [ ] **Clinic Dashboard:** Build real-time appointment queues and operational analytics cards.

---

## Phase 3: AI & Orchestration (Days 17–24)
*Objective: Integrate free OCR, AI chatbot, and automated notification workflows.*

- [ ] **OCR Pipeline:** Connect frontend uploads to FastAPI gateway triggering **PaddleOCR / Tesseract** instead of Google Doc AI.
- [ ] **Record Parsing:** Extract structured JSON (medications, doctors) from OCR via **Groq API / Ollama** and save to DB.
- [ ] **LangGraph Chatbot:** Embed UI widget and build AI agent powered by **Groq / Llama 3** with strict "no-diagnosis" guardrails.
- [ ] **Workflow Automation:** Deploy self-hosted n8n instance.
- [ ] **Multi-Channel Alerts:** Configure n8n webhooks for **Nodemailer (Gmail SMTP)** and free WhatsApp wrappers (e.g., Baileys) for appointment notifications.

---

## Phase 4: Voice Agent Integration (Days 25–28)
*Objective: Implement outbound conversational AI using open-source tools.*

- [ ] **Voice Pipeline Setup:** Configure **Pipecat** (Open Source) to replace Vapi for automated voice handling.
- [ ] **Voice Webhooks:** Write FastAPI endpoints to handle Pipecat state transitions and triggers.
- [ ] **Call Scripts:** Engineer prompts for **Groq** for T-24h appointment confirmations and missed follow-up recovery.
- [ ] **Transcript Storage:** Route call transcripts from the Pipecat pipeline back to the patient's Drizzle ORM record.

---

## Phase 5: Testing, Security & Launch (Days 29–30)
*Objective: Finalize QA, validate security guardrails, and push to production.*

- [ ] **E2E Testing:** Verify all Must-Have (P0) user stories across Patient, Doctor, Clinic, and Admin flows.
- [ ] **Security Audit:** Validate Cloudinary access controls, TLS in transit, and NextAuth session isolation.
- [ ] **Guardrail Regression:** Test 100+ AI edge cases via Groq to ensure 0% medical diagnosis rate.
- [ ] **Production Go-Live:** Deploy to production environment and hand over UAT documentation.