# Unimeds API Documentation (Postman Collection)

## Overview

This document outlines the REST API endpoints for the Unimeds healthcare platform. All endpoints are served by the Node.js Gateway and require authentication via Auth.js (NextAuth) session tokens unless marked as **Public**.

**Base URL:** `http://localhost:8080` (development)

**Authentication:** Bearer token from Auth.js session
```http
Authorization: Bearer <Auth.js_JWT>
```

---

## Phase 1: Foundation & Data Layer

### Database Schema Status

The following database tables have been defined using Drizzle ORM in `server/src/db/schema.ts`:

- **users** - Platform identities with RBAC roles
- **clinics** - Multi-tenant configuration
- **appointments** - Scheduling engine
- **records** - Medical document metadata
- **audit_logs** - Immutable compliance ledger

---

## Planned API Endpoints

### 1. Authentication & User Profile Routes

#### POST `/api/v1/auth/sync`

**Description:**  
Synchronizes a newly created Auth.js user session with the NeonDB PostgreSQL database.

**Access:**  
Authenticated (All Roles)

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "authId": "google_oauth_user_id",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "role": "patient",
    "authId": "google_oauth_user_id",
    "profileData": {
      "name": "John Doe",
      "email": "user@example.com"
    },
    "createdAt": "2026-06-08T00:00:00Z"
  }
}
```

**Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

### 2. Patient Routes (Phase 2)

#### GET `/api/v1/user/timeline`

**Description:**  
Retrieves a chronological list of health records and appointments for the authenticated patient or their dependents.

**Access:**  
Patient

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
```

**Query Parameters:**
```txt
?limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "timeline": [
    {
      "type": "record",
      "id": "uuid",
      "recordType": "prescription",
      "fileName": "prescription.pdf",
      "createdAt": "2026-06-01T10:00:00Z",
      "ocrData": {
        "doctorName": "Dr. Smith",
        "date": "2026-06-01",
        "medications": ["Paracetamol", "Vitamin D"]
      }
    },
    {
      "type": "appointment",
      "id": "uuid",
      "doctorId": "uuid",
      "clinicId": "uuid",
      "slotTime": "2026-06-15T10:00:00Z",
      "status": "confirmed"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### POST `/api/v1/user/records/upload`

**Description:**  
Generates a Cloudinary signed upload URL/signature and registers a pending record asset.

**Access:**  
Patient

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileName": "prescription.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

**Response (200):**
```json
{
  "uploadUrl": "https://api.cloudinary.com/v1_1/...",
  "signature": "...",
  "timestamp": 123456789,
  "recordId": "uuid",
  "publicId": "unimeds/records/uuid"
}
```

---

#### POST `/api/v1/user/records/:id/process-ocr`

**Description:**  
Dispatches a background processing task to FastAPI to parse the uploaded document using the PaddleOCR + Groq pipeline.

**Access:**  
Patient

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
```

**Response (202):**
```json
{
  "status": "processing",
  "message": "OCR pipeline initiated",
  "recordId": "uuid"
}
```

---

#### POST `/api/v1/user/appointments/book`

**Description:**  
Reserves an available appointment slot after running conflict resolution checks.

**Access:**  
Patient

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "doctorId": "uuid",
  "clinicId": "uuid",
  "slotTime": "2026-06-15T10:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "clinicId": "uuid",
    "slotTime": "2026-06-15T10:00:00Z",
    "status": "pending",
    "createdAt": "2026-06-08T00:00:00Z"
  }
}
```

**Response (409):**
```json
{
  "error": "Conflict",
  "message": "Appointment slot is already booked"
}
```

---

### 3. Hospital & Clinic Routes (Phase 2)

#### GET `/api/v1/hospital/patients/search`

**Description:**  
Omni-search patient registry by name, phone number, or medical identifier.

**Access:**  
Doctor / Clinic Admin

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
```

**Query Parameters:**
```txt
?q=John&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "patients": [
    {
      "id": "uuid",
      "profileData": {
        "name": "John Doe",
        "phone": "+1234567890",
        "medicalIdentifier": "MED-12345"
      }
    }
  ]
}
```

---

#### GET `/api/v1/hospital/patients/:id/context`

**Description:**  
Fetches complete clinical context data for a patient, including OCR summaries and timeline events.

**Access:**  
Doctor

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
```

**Response (200):**
```json
{
  "success": true,
  "patient": {
    "id": "uuid",
    "profileData": {
      "name": "John Doe",
      "dateOfBirth": "1990-01-01",
      "gender": "male"
    },
    "records": [...],
    "appointments": [...]
  }
}
```

---

#### POST `/api/v1/hospital/appointments/:id/notes`

**Description:**  
Stores consultation notes directly on the appointment record.

**Access:**  
Doctor

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notes": "Patient advised to reduce sodium intake. Follow-up in 2 weeks."
}
```

**Response (200):**
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "notes": "Patient advised to reduce sodium intake. Follow-up in 2 weeks.",
    "updatedAt": "2026-06-08T00:00:00Z"
  }
}
```

---

#### GET `/api/v1/hospital/admin/analytics`

**Description:**  
Returns aggregated analytics such as no-show rates, active booking trends, and revenue metrics.

**Access:**  
Clinic Admin

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
```

**Query Parameters:**
```txt?period=30d```

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "noShowRate": 0.15,
    "bookingTrend": "+12%",
    "revenue": 45000,
    "appointmentVolume": 150,
    "period": "30d"
  }
}
```

---

### 4. Super Admin Routes (Phase 3)

#### POST `/api/v1/admin/tenants/onboard`

**Description:**  
Creates and configures a new clinic tenant, initializes operational metadata, and registers n8n notification payload configurations.

**Access:**  
Super Admin

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "City Medical Center",
  "n8nWebhookUrls": {
    "appointmentBooked": "https://n8n.example.com/webhook/appointment-booked",
    "notificationBase": "https://n8n.example.com/webhook/notify"
  },
  "settings": {
    "timezone": "America/New_York",
    "bookingWindowDays": 30,
    "cancellationHours": 24
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "clinic": {
    "id": "uuid",
    "name": "City Medical Center",
    "n8nWebhookUrls": {...},
    "settings": {...},
    "createdAt": "2026-06-08T00:00:00Z"
  }
}
```

---

#### GET `/api/v1/admin/audit-logs`

**Description:**  
Queries the immutable append-only audit ledger.

**Access:**  
Super Admin

**Request Headers:**
```http
Authorization: Bearer <Auth.js_JWT>
```

**Query Parameters:**
```txt
?limit=50&offset=0&action=RECORD_UPLOAD
```

**Response (200):**
```json
{
  "success": true,
  "auditLogs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "RECORD_UPLOAD",
      "targetResource": "records:uuid",
      "metadata": {
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      "timestamp": "2026-06-08T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Database Schema Reference

### users Table

```typescript
{
  id: uuid;                    // Primary key
  authId: string;              // NextAuth user identifier (unique)
  role: enum;                  // 'patient' | 'doctor' | 'clinic_admin' | 'super_admin'
  profileData: jsonb;          // { name, email, phone, dateOfBirth, gender, address, medicalIdentifier }
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### clinics Table

```typescript
{
  id: uuid;                    // Primary key
  name: string;                // Clinic name
  n8nWebhookUrls: jsonb;       // { appointmentBooked, appointmentCancelled, recordUploaded, notificationBase }
  settings: jsonb;             // { timezone, bookingWindowDays, cancellationHours, features }
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### appointments Table

```typescript
{
  id: uuid;                    // Primary key
  patientId: uuid;             // Foreign key to users
  doctorId: uuid;              // Foreign key to users
  clinicId: uuid;              // Foreign key to clinics
  slotTime: timestamp;         // Appointment time
  status: enum;                // 'pending' | 'confirmed' | 'cancelled'
  notes: text;                 // Consultation notes
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### records Table

```typescript
{
  id: uuid;                    // Primary key
  patientId: uuid;             // Foreign key to users
  fileUrl: string;             // Cloudinary asset URL
  recordType: string;          // Document category (e.g., 'prescription', 'lab_report')
  ocrData: jsonb;              // { extractedText, doctorName, date, medications, diagnoses, summary, processingStatus }
  fileName: string;            // Original filename
  fileSize: string;            // File size in bytes
  mimeType: string;            // e.g., 'application/pdf', 'image/jpeg'
  createdAt: timestamp;
}
```

### audit_logs Table

```typescript
{
  id: uuid;                    // Primary key
  userId: uuid;                // Foreign key to users (nullable)
  action: string;              // e.g., 'LOGIN', 'RECORD_UPLOAD', 'APPOINTMENT_BOOK'
  targetResource: string;       // e.g., 'records:uuid', 'appointments:uuid'
  metadata: jsonb;             // { ipAddress, userAgent, changes, previousState, newState }
  timestamp: timestamp;        // Event timestamp
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {...}
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 202  | Accepted (async processing) |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 409  | Conflict |
| 500  | Internal Server Error |

---

## Implementation Status

### Phase 1 (Current)
- ✅ Database schema defined (Drizzle ORM)
- ✅ Infrastructure initialized (Next.js, Node.js, FastAPI)
- ✅ Environment configuration (.env with free-tier placeholders)
- ⏳ API endpoints (planned, not yet implemented)

### Phase 2 (Next)
- ⏳ Patient portal CRUD operations
- ⏳ Appointment booking engine
- ⏳ Doctor dashboard APIs
- ⏳ Clinic admin analytics

### Phase 3 (Future)
- ⏳ OCR pipeline integration
- ⏳ AI chatbot endpoints
- ⏳ Voice orchestration APIs
- ⏳ Super admin tenant management

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are generated using `uuid` library
- JSONB fields support flexible schema evolution
- Audit logs are append-only (UPDATE/DELETE prohibited)
- All protected routes require valid Auth.js session tokens
- Rate limiting: 100 requests/minute/IP (planned)
