# Comprehensive Frontend Implementation Plan: Unimeds

## 1. Architecture & Tech Stack

### Framework
- **Next.js (App Router)**
  - Server-side rendering
  - SEO optimization
  - Advanced routing capabilities

### Language
- **TypeScript**
  - Strict mode enabled
  - End-to-end type safety
  - Direct compatibility with Drizzle ORM schemas

### Styling
- **Tailwind CSS**
- **clsx**
- **tailwind-merge**

Used for dynamic utility class composition and maintainable styling patterns.

### Server State Management
- **React Query** (preferred) or **SWR**
  - Request caching
  - Revalidation
  - Background synchronization
  - Optimistic UI updates

### Client State Management
- **Zustand**
  - Lightweight global state
  - Sidebar visibility
  - Active tenant selection
  - UI preferences

### Authentication
- **Auth.js (NextAuth)**
  - OAuth
  - OTP authentication
  - Session management
  - Role-based access control (RBAC)

### Component Primitives
- **Radix UI**
  - Accessible headless components
  - Complete styling flexibility

---

## 2. Design System & Aesthetic Constraints

### Typography

- **Geist** sans-serif exclusively

### Color Palette

Use only the **zinc** color scale.

#### Approved Examples

```txt
zinc-50
zinc-100
zinc-200
zinc-300
zinc-700
zinc-800
zinc-900
```

#### Restrictions

- Standard gray palette is prohibited.
- All backgrounds, borders, and typography should derive from the zinc scale.

### Layouts

Adopt a **Bento Grid Architecture**:

- Responsive CSS Grid layouts
- Card-based information hierarchy
- Consistent spacing and alignment

### Borders & Separation

Use dashed borders extensively:

```css
border-dashed
```

Recommended for:

- Empty states
- File upload zones
- Subtle grid separators
- Placeholder components

### Effects & Elevation

#### Glassmorphism

```css
bg-zinc-900/80
backdrop-blur-md
```

Use for:

- Floating widgets
- Sticky headers
- AI assistant panel

#### Shadows

- Sharp
- Minimal
- High-contrast

Avoid:

- Large soft shadows
- Excessive glow effects

---

## 3. Detailed Directory Structure

```text
src/
├── app/
│   ├── (auth)/                 # Clerk sign-in/sign-up routing
│   ├── (user)/                 # Phase 1: Patient-facing routes
│   │   ├── dashboard/          # Health timeline overview
│   │   ├── records/            # Document upload & management
│   │   └── book/               # Appointment scheduling wizard
│   ├── (hospital)/             # Phase 2: Clinic/Doctor routes
│   │   ├── doctor/             # Omni-search & clinical context
│   │   └── admin/              # Clinic operational metrics
│   ├── (admin)/                # Phase 3: Super Admin routes
│   │   ├── tenants/            # Clinic onboarding & n8n templates
│   │   └── audit/              # Immutable platform logs
│   ├── api/                    # Next.js Route Handlers (BFF)
│   ├── globals.css             # Tailwind imports & CSS variables
│   └── layout.tsx              # Root layout (Providers, Fonts)
│
├── components/
│   ├── ui/                     # Reusable atoms
│   ├── forms/                  # Complex forms
│   ├── layout/                 # Navigation
│   └── widgets/                # Floating widgets
│
├── hooks/                      # Custom hooks
│
├── lib/
│   ├── api.ts                  # Axios instance
│   └── utils.ts                # cn utility
│
├── store/                      # Zustand slices
│
└── types/                      # Shared TypeScript interfaces
```

---

## 4. Component Deep Dive by Phase

# Phase 1: User (Patient) App

### UploadZone (`components/forms`)

A drag-and-drop file upload component.

#### Styling

```css
border-2
border-dashed
border-zinc-300
bg-zinc-50
hover:bg-zinc-100
transition-colors
```

#### Workflow

1. User drops a file.
2. Upload state activates.
3. File uploads to AWS S3.
4. FastAPI OCR pipeline starts.
5. Skeleton `BentoCard` appears.
6. OCR processing completes.
7. Timeline updates with extracted data.

---

### TimelineGrid (`components/user`)

Responsive masonry or structured bento-grid layout.

#### Displays

- `RecordCard`
- `AppointmentCard`

#### Behavior

- Chronological sorting
- Responsive layout
- Unified patient timeline experience

---

### AiAssistantWidget (`components/widgets`)

Floating AI assistant powered by LangGraph.

#### Positioning

```css
fixed
bottom-4
right-4
```

#### Styling

- Glassmorphic container
- Backdrop blur
- Elevated shadow
- Rounded corners

#### Features

- Streaming responses
- Markdown rendering
- LangGraph memory integration

#### Refusal States

The assistant must reject:

- Medical diagnoses
- Treatment recommendations
- Prescription advice

Instead, direct users to schedule an appointment.

---

# Phase 2: Hospital (Doctor & Clinic) App

### OmniSearch (`components/hospital`)

Global command palette using `cmdk`.

#### Shortcut

```txt
Cmd + K
```

#### Features

- Debounced API requests
- Instant patient search
- Keyboard-first navigation

#### Search Targets

- Patient name
- Phone number
- Patient ID

---

### ClinicalContextBento (`components/hospital`)

Primary doctor workspace.

#### Layout Structure

| Section | Purpose | Styling |
|----------|----------|----------|
| Top Left | Patient Demographics | Standard Bento Card |
| Top Right | OCR Summary Panel | Standard Bento Card |
| Bottom | Consultation Notes | `border-dashed` |

---

#### Patient Demographics

Displays:

- Name
- Age
- Gender
- Contact Information
- Medical Identifiers

---

#### OCR Summary Panel

Displays:

- Extracted records
- Active medications
- OCR summaries
- Key medical insights

---

#### Consultation Notes

Contains:

- Free-text textarea
- Clinical observations
- Follow-up instructions
- Doctor notes

---

### MetricsGrid (`components/hospital`)

Administrative analytics dashboard.

#### Visualization Libraries

- Recharts
- Tremor

#### Metrics

- Revenue trends
- Appointment volume
- No-show rates

#### Time Window

```txt
Rolling 30 Days
```

#### Design Goals

- Responsive
- Minimalistic
- Fast rendering
- Easy interpretation

---

# Phase 3: Super Admin App

### AuditDataTable (`components/admin`)

High-performance audit log viewer.

#### Powered By

- TanStack Table

#### Features

- Pagination
- Column sorting
- Text filtering
- Large dataset support

#### Security Constraints

Strictly read-only.

Prohibited actions:

- Edit
- Delete
- Bulk modification

Purpose:

- Preserve audit immutability
- Compliance tracking

---

## 5. State & Data Fetching Strategy

### API Interceptor (`lib/api.ts`)

Centralized Axios instance for authenticated requests.

#### Authentication Flow

```ts
import { getSession } from "next-auth/react";
const session = await getSession();
const token = (session as any)?.accessToken;
```

Attach token:

```http
Authorization: Bearer <token>
```

#### Responsibilities

- Token injection
- Standardized API communication
- Error handling
- Request configuration

---

### Data Fetching & Cache Management

Use React Query as the primary data layer.

#### Example

```ts
useQuery({
  queryKey: ["appointments"],
  queryFn: fetchAppointments,
});
```

#### Benefits

- Request caching
- Background revalidation
- Automatic retries
- Loading states
- Error handling
- Query invalidation

---

### Optimistic Updates Workflow

#### Appointment Booking Flow

1. User selects a slot.
2. `onMutate` instantly blocks the slot.
3. Request is sent to backend.
4. Backend validates availability.

##### Success

- Cache refreshes
- Optimistic state retained

##### Failure

- Rollback occurs
- Previous cache restored
- Conflict notification shown

---

## 6. Middleware & Security (`middleware.ts`)

RBAC enforcement occurs at the Next.js Edge Middleware layer.

### Goals

- Prevent unauthorized page access
- Reduce unnecessary API calls
- Enforce permissions before rendering

---

### Route Protection Matrix

| Protected Route | Allowed Roles | Redirect Action |
|----------------|--------------|----------------|
| `/admin/*` | `admin` | `/unauthorized` |
| `/hospital/*` | `doctor`, `clinic_admin` | `/user/dashboard` |

---

### Middleware Logic

#### Admin Routes

```ts
if (
  role !== "admin" &&
  pathname.startsWith("/admin")
) {
  return redirect("/unauthorized");
}
```

---

#### Hospital Routes

```ts
if (
  role !== "doctor" &&
  role !== "clinic_admin" &&
  pathname.startsWith("/hospital")
) {
  return redirect("/user/dashboard");
}
```

---

### Security Benefits

- Edge-level RBAC enforcement
- Reduced backend load
- Faster unauthorized redirects
- Defense-in-depth authorization model
- Consistent permissions across frontend and backend