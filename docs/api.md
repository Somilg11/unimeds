# Unimeds: REST API Documentation (Monolithic Gateway)

All requests must include a valid Auth.js (NextAuth) session token in the header unless explicitly marked as **Public**:

```http
Authorization: Bearer <Auth.js_JWT>
```

---

## 1. Authentication & User Profile Routes

### GET `/api/v1/auth/sync`

**Description:**  
Synchronizes a newly created Auth.js user session with the NeonDB PostgreSQL database.

**Access:**  
Authenticated (All Roles)

#### Response (200)

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "role": "patient|doctor|clinic_admin|super_admin"
  }
}
```

---

## 2. Phase 1: Patient (User) Routes

### GET `/api/v1/user/timeline`

**Description:**  
Retrieves a chronological list of health records and appointments for the authenticated patient or their dependents.

**Access:**  
Patient

---

### POST `/api/v1/user/records/upload`

**Description:**  
Generates a Cloudinary signed upload URL/signature and registers a pending record asset.

**Access:**  
Patient

#### Request Body

```json
{
  "fileName": "prescription.pdf",
  "fileType": "application/pdf"
}
```

#### Response (200)

```json
{
  "uploadUrl": "https://api.cloudinary.com/v1_1/...",
  "signature": "...",
  "timestamp": 123456789,
  "recordId": "uuid"
}
```

---

### POST `/api/v1/user/records/:id/process-ocr`

**Description:**  
Dispatches a background processing task to FastAPI to parse the uploaded document using the PaddleOCR + Groq pipeline.

**Access:**  
Patient

#### Response (202)

```json
{
  "status": "processing",
  "message": "OCR pipeline initiated"
}
```

---

### POST `/api/v1/user/appointments/book`

**Description:**  
Reserves an available appointment slot after running conflict resolution checks.

**Access:**  
Patient

#### Request Body

```json
{
  "doctorId": "uuid",
  "clinicId": "uuid",
  "slotTime": "2026-06-15T10:00:00Z"
}
```

---

## 3. Phase 2: Hospital & Clinic Routes

### GET `/api/v1/hospital/patients/search`

**Description:**  
Omni-search patient registry by name, phone number, or medical identifier.

**Access:**  
Doctor / Clinic Admin

#### Query Parameters

```txt
?q=John
```

---

### GET `/api/v1/hospital/patients/:id/context`

**Description:**  
Fetches complete clinical context data for a patient, including OCR summaries and timeline events.

**Access:**  
Doctor

---

### POST `/api/v1/hospital/appointments/:id/notes`

**Description:**  
Stores consultation notes directly on the appointment record.

**Access:**  
Doctor

#### Request Body

```json
{
  "notes": "Patient advised to reduce sodium intake."
}
```

---

### GET `/api/v1/hospital/admin/analytics`

**Description:**  
Returns aggregated analytics such as:

- No-show rates
- Active booking trends
- Revenue metrics

**Access:**  
Clinic Admin

---

## 4. Phase 3: Super Admin Routes

### POST `/api/v1/admin/tenants/onboard`

**Description:**  
Creates and configures a new clinic tenant, initializes operational metadata, and registers n8n notification payload configurations.

**Access:**  
Super Admin

---

### GET `/api/v1/admin/audit-logs`

**Description:**  
Queries the immutable append-only audit ledger.

**Access:**  
Super Admin

---

# Unimeds: Frontend-Backend Integration & Communication Guide

This guide outlines the required integration pattern between the Next.js frontend and the Node.js + FastAPI backend architecture.

---

## 1. Request Lifecycle & Authentication Interceptor

Every outbound API request must automatically retrieve the active Auth.js session token and attach it to the request headers.

### Axios Client Configuration

```typescript
// src/lib/api-client.ts

import axios from "axios";
import { getSession } from "next-auth/react";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Auth.js JWT to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();

    // Assuming you append the custom accessToken
    // to the session object in NextAuth callbacks
    const token = (session as any)?.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error(
      "Failed to append authentication vector",
      error
    );
  }

  return config;
});
```

### Authentication Flow

1. User authenticates via NextAuth.
2. NextAuth issues a session JWT.
3. Axios interceptor retrieves the token.
4. JWT is attached to every API request.
5. Node.js gateway validates the token.
6. Request proceeds through RBAC middleware.

---

## 2. Server State Synchronization (React Query Strategy)

Use React Query mutations with optimistic updates to provide an instant user experience.

### Appointment Booking Hook

```typescript
// src/hooks/useBookAppointment.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const useBookAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      appointmentData: {
        doctorId: string;
        slotTime: string;
      }
    ) => {
      const { data } = await apiClient.post(
        "/api/v1/user/appointments/book",
        appointmentData
      );

      return data;
    },

    onMutate: async (newAppointment) => {
      await queryClient.cancelQueries({
        queryKey: ["appointments"],
      });

      const previousAppointments =
        queryClient.getQueryData(["appointments"]);

      queryClient.setQueryData(
        ["appointments"],
        (old: any) => [
          ...(old || []),
          {
            ...newAppointment,
            id: "temp-id",
            status: "pending",
          },
        ]
      );

      return { previousAppointments };
    },

    onError: (
      err,
      newAppointment,
      context
    ) => {
      queryClient.setQueryData(
        ["appointments"],
        context?.previousAppointments
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
};
```

### Optimistic Update Workflow

1. User books an appointment.
2. UI immediately reflects the booking.
3. Mutation is sent to the backend.
4. If successful, cache is refreshed.
5. If failed, previous state is restored.

---

## 3. Real-Time Status & Long-Polling Fallback

Long-running FastAPI jobs should be monitored using React Query polling.

### Jobs Requiring Polling

- PaddleOCR + Groq processing
- Pipecat voice transcript generation

### Record Status Monitoring

```typescript
const { data } = useQuery({
  queryKey: ["record", recordId],

  queryFn: () =>
    apiClient
      .get(`/api/v1/user/records/${recordId}`)
      .then((res) => res.data),

  refetchInterval: (data) =>
    data?.status === "processing"
      ? 3000
      : false,
});
```

### Polling Behavior

| Status | Action |
|----------|----------|
| `processing` | Poll every 3 seconds |
| `completed` | Stop polling |
| `failed` | Stop polling and show error |
| `queued` | Continue polling |

---

## 4. Multi-Tenant Routing Guardrails

Frontend route protection must mirror backend authorization rules.

### Responsibilities

- Validate role-based access before rendering pages.
- Prevent unauthorized navigation.
- Reduce unnecessary API traffic.
- Align frontend permissions with backend RBAC.

### Examples

| Route | Allowed Roles |
|---------|--------------|
| `/user/*` | Patient |
| `/hospital/*` | Doctor, Clinic Admin |
| `/admin/*` | Super Admin |

### Enforcement Layers

1. Next.js Middleware
2. Auth.js (NextAuth) Session Claims
3. Backend RBAC Middleware
4. Database Tenant Boundaries

This layered security model ensures unauthorized users are blocked before protected application logic executes.