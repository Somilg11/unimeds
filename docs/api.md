# Unimeds API v1

Base: `${API_URL}/api/v1` (Express, `server/`). JSON in/out.

**Browser code never calls the API directly.** It calls the Next.js proxy at `/api/backend/<path>`, which attaches the user's token from the httpOnly session cookie. Example: `GET /api/backend/patient/overview` → `GET /api/v1/patient/overview`.

## Conventions

- **Errors:** `{ error: string, code?: string, issues?: [{ path, message }] }`. Always show `error` to the user.
- **Pagination:** list endpoints take `?page=1&pageSize=20` (max 100) and return `{ items, page, pageSize, total, totalPages }`.
- **Times:** always ISO-8601 UTC. Every appointment carries `clinic.timezone` (IANA). **Render appointment times in the clinic's timezone**, not the browser's.
- **Slots:** `GET /public/slots` returns `startsAt` values. Book by sending that exact `startsAt` back.
- **Status codes:**
  - 401: session invalid or expired; sign out.
  - 403: wrong role or clinic.
  - 409: state conflict (see `code`).

## Shared types

```ts
type Role = 'patient' | 'doctor' | 'clinic_admin' | 'super_admin';
type AppointmentStatus = 'pending' | 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show';

type Appointment = {
  id: string; status: AppointmentStatus; startsAt: string; endsAt: string;
  reason: string | null; clinicalNotes: string | null;
  proposedStartsAt: string | null; rescheduleReason: string | null;
  cancellationReason: string | null; cancelledBy: string | null;
  confirmedAt: string | null; completedAt: string | null; createdAt: string;
  patient: { id; name; email; avatarUrl };
  doctor: { id; name; avatarUrl; specialization: string | null };
  clinic: { id; name; timezone; address; city };
};

type RecordItem = {
  id; patientId; title; recordType; fileName; mimeType; fileSize: number | null;
  appointmentId: string | null; createdAt;
  uploadedBy: { id; name; role } | null;
  clinic: { id; name } | null;
  patient?: { id; name };            // doctor/clinic lists only
};
// recordType ∈ general | prescription | lab_report | imaging | discharge_summary | vaccination | insurance | other

type Me = {
  id; email; name; role: Role; avatarUrl; profile: Record<string, unknown>; hasPassword: boolean; createdAt;
  memberships: { clinicId; clinicName; clinicStatus: 'invited' | 'active' | 'suspended'; timezone; role: 'doctor' | 'clinic_admin'; isActive }[];
};

type Notification = { id; type; title; message; link: string | null; readAt: string | null; createdAt; clinicId };
```

## Auth — `/auth`

These are used by the Next server (NextAuth), except where marked **(proxy)**.

- `POST /login` `{ email, password }` → `{ token, user: Me }`. Rate limited.
- `POST /register` `{ name, email, password }` → `{ token, user }`. Creates a patient. Password is ≥10 characters with a letter and a digit.
- `POST /google` (needs the internal key header; server only) `{ email, emailVerified, googleSub, name, picture }` → `{ token, user }`.
- `POST /password/forgot` `{ email }` → `{ ok }` (always succeeds).
- `POST /password/reset` `{ token, password }` → `{ token, user }`.
- `GET /invites/:token` → `{ email, role, clinicName, expiresAt, accountExists }`. 404 if invalid.
- `POST /invites/accept` `{ token, name?, password? }` → `{ token, user }`.
  - New accounts need `name` and `password`.
  - If the account exists, the caller must be signed in as that email; otherwise 409 `SIGN_IN_REQUIRED`.
- `GET /me` **(proxy)** → `{ user: Me }`.
- `POST /password/change` **(proxy)** `{ currentPassword?, newPassword }` → `{ token, user }`. Revokes other sessions.
- `POST /logout-all` **(proxy)** → `{ ok }`.

## Public (no auth) — `/public`

- `GET /clinics?q&city&lat&lng&radiusKm&page&pageSize` → paged clinic cards. Each item has `id, name, slug, description, logoUrl, phone, address, city, state, zipCode, latitude, longitude, timezone, doctorCount, distanceKm`.
- `GET /clinics/:idOrSlug` → `{ clinic: {..., bookingWindowDays, slotDurationMinutes, cancellationHours}, doctors: [{ id, name, avatarUrl, specialization, bio, yearsOfExperience }] }`.
- `GET /doctors?q&specialization&clinicId&city&lat&lng&radiusKm&page` → paged doctors. Each item has `id, name, avatarUrl, specialization, bio, yearsOfExperience, clinics: [{ id, name, city, address, timezone, distanceKm }]`.
- `GET /doctors/:id` → `{ doctor: {..., clinics: [clinic]} }`.
- `GET /specializations` → `{ items: [{ name, doctors }] }`.
- `GET /slots?doctorId&clinicId&date=YYYY-MM-DD` → `{ timezone, date, slots: [{ startsAt, endsAt, label }] }`.
  - `date` is a clinic-local date.
  - `label` is HH:mm in clinic time.
  - Past slots and slots beyond the booking window return `[]`.
- `GET /stats` → `{ clinics, doctors, cities }`.

## Patient — `/patient` (role `patient`)

**Overview**

- `GET /overview` → `{ upcoming: Appointment[≤5], recentRecords: RecordItem[≤5], stats: { upcoming, completed, actionRequired, records } }`.

**Appointments**

- `GET /appointments?scope=upcoming|past|all&status&page` → paged `Appointment`.
- `GET /appointments/:id` → `{ appointment, records }`.
- `POST /appointments` `{ doctorId, clinicId, startsAt, reason? }` → 201 `{ appointment }`.
  - Status is `pending`, or `confirmed` if the clinic auto-confirms.
  - Errors: 400 `SLOT_UNAVAILABLE`, 409 `SLOT_UNAVAILABLE`.
- `POST /appointments/:id/cancel` `{ reason? }` → `{ appointment }`. 409 `CANCELLATION_WINDOW` when a confirmed visit is too close.
- `POST /appointments/:id/reschedule` `{ startsAt }` → `{ appointment }`. Patient-initiated move to another free slot.
- `POST /appointments/:id/respond` `{ accept: boolean }` → `{ appointment }`. Answers a `reschedule_proposed` appointment.
  - Accept: the appointment moves to `proposedStartsAt` and becomes confirmed.
  - Decline: the appointment is cancelled.

**Records**

- `GET /records?type&q&page` → paged `RecordItem`.
- `POST /records/upload-ticket` → `{ uploadUrl, fields, publicId, maxBytes }`.
  - The browser POSTs multipart to `uploadUrl` with every `fields` entry plus `file`.
  - The Cloudinary response gives `public_id` and `resource_type`.
- `POST /records` `{ publicId, resourceType, fileName, mimeType, title?, recordType?, appointmentId? }` → 201 `{ record }`.
  - Only PDF and JPEG/PNG/WebP/HEIC files, up to 15 MB.
  - Attaching an `appointmentId` shares the record with that clinic and doctor.
- `PATCH /records/:id` `{ title?, recordType?, appointmentId?: string | null }` → `{ record }`.
- `DELETE /records/:id` → `{ ok }`.

**Profile and account**

- `GET /profile` → `{ user }`.
- `PATCH /profile` `{ name?, profile?: { phone, dateOfBirth (YYYY-MM-DD), gender, bloodType, allergies, address, emergencyContact: { name, phone, relation } } }` → `{ user }`.
  - The profile is merged, never replaced.
  - Email can't be changed.
- `GET /export` → a JSON download of all the patient's data.
- `DELETE /account` `{ confirm: 'DELETE' }` → `{ ok }`. 400 `HAS_UPCOMING` if there are upcoming visits.

## Doctor — `/doctor` (role `doctor`)

Scope is limited to clinics where the doctor is an active member.

**Overview**

- `GET /overview` → `{ clinics, timezone, today: Appointment[], needsAction: Appointment[], stats: { pending, upcomingWeek, completedMonth, patients } }`.
- `GET /clinics` → `{ items: [{ id, name, timezone, city, address, settings }] }`.

**Appointments**

- `GET /appointments?scope=upcoming|past|all&status&clinicId&from&to&q&page` → paged `Appointment`.
- `GET /appointments/:id` → `{ appointment, patient: { id, name, email, avatarUrl, phone, dateOfBirth, gender, bloodType, allergies, emergencyContact }, history: Appointment[] }`.
- `POST /appointments/:id/confirm`. Only from `pending`.
- `POST /appointments/:id/cancel` `{ reason? }`.
- `POST /appointments/:id/complete` `{ clinicalNotes? }`. Allowed from 15 minutes before the start; 409 `TOO_EARLY` before that.
- `POST /appointments/:id/no-show`. Only after the start time.
- `POST /appointments/:id/propose` `{ startsAt, reason? }`. `startsAt` must be a free slot from `/public/slots`.
- `PUT /appointments/:id/notes` `{ clinicalNotes }`.

All of these return `{ appointment }`.

**Patients**

- `GET /patients?q&page` → paged `{ id, name, email, avatarUrl, phone, visits, lastVisit, nextVisit }`.
- `GET /patients/:id` → `{ patient, appointments, records }`. 403 if the patient isn't under this doctor's care.

**Records**

- `GET /records?q&type&patientId&page` → paged `RecordItem` including `patient`.
- `POST /records/upload-ticket` `{ patientId }` → a ticket.
- `POST /records` takes the same body as the patient version plus `patientId` → `{ record }`. The patient is notified.

**Availability and profile**

- `GET /availability?clinicId` → `{ items: [{ id, clinicId, dayOfWeek (0 = Sunday), startTime 'HH:MM', endTime }] }`.
- `PUT /availability` `{ clinicId, schedule: [{ dayOfWeek, startTime, endTime }] }` → `{ items }`.
  - This replaces the whole schedule for that clinic.
  - Times are wall-clock in the clinic's timezone.
  - Overlapping blocks or start ≥ end return 400.
- `GET /profile`, `PATCH /profile` `{ name?, profile?: { phone, specialization, licenseNumber, bio, yearsOfExperience } }`.

## Clinic admin — `/clinic` (role `clinic_admin`)

The scope is the admin's active clinic. An optional `X-Clinic-Id` header selects between clinics.

**Clinic profile and settings**

- `GET /` → `{ clinic }`. `settings` has `slotDurationMinutes`, `bookingWindowDays`, `cancellationHours` and `autoConfirm`.
- `PATCH /` `{ name?, phone?, description?, logoUrl?, address?, city?, state?, zipCode?, latitude?, longitude?, timezone?, settings?: { slotDurationMinutes: 10|15|20|30|45|60, bookingWindowDays, cancellationHours, autoConfirm } }`.

**Overview and analytics**

- `GET /overview` → `{ clinic, today: Appointment[], pending: Appointment[], stats: { next7Days, pending, patients, completed30d, doctors } }`.
- `GET /analytics?months=6` → `{ range, kpis: { totalAppointments, noShowRate, cancellationRate, newPatients }, trend: [{ month, total, completed, cancelled, noShow }], statusBreakdown: [{ status, count }], doctorPerformance: [{ doctorId, name, specialization, total, completed, cancelled, noShow, patients }] }`.

**Appointments**

- `GET /appointments?scope&status&doctorId&from&to&q&page` → paged `Appointment`.
- `GET /appointments/:id` → `{ appointment }`.
- `POST /appointments` `{ doctorId, startsAt, reason?, patient: { email, name, phone? } }`: front-desk booking.
  - It is auto-confirmed.
  - It creates the patient account if it doesn't exist.
- `POST /appointments/:id/confirm` | `cancel {reason?}` | `no-show` | `propose {startsAt, reason?}`.

**Team**

- `GET /team` → `{ members: [{ id, role, isActive, joinedAt, upcoming, user: { id, name, email, avatarUrl, specialization, phone } }], invites: [{ id, email, role, expiresAt, createdAt }] }`.
- `POST /team/invites` `{ email, role: 'doctor'|'clinic_admin' }` → `{ inviteId, inviteUrl, emailSent }`. Show `inviteUrl` with a copy button, especially when `emailSent` is false.
- `POST /team/invites/:id/resend` and `DELETE /team/invites/:id`.
- `PATCH /team/:memberId` `{ isActive }`. 409 `HAS_UPCOMING` if the doctor still has upcoming visits.
- `DELETE /team/:memberId`. Same 409 rule.
- `GET|PUT /team/:memberId/availability`. Same schedule shape as the doctor endpoint, without `clinicId`.

**Patients, records and audit**

- `GET /patients?q&page` → paged `{ id, name, email, avatarUrl, phone, visits, lastVisit, nextVisit }`.
- `GET /patients/:id` → `{ patient, appointments, records }`.
- `GET /records?q&type&page` → paged `RecordItem` with `patient`. Only records attached to this clinic.
- `GET /audit-logs?page` → paged `{ id, action, targetType, targetId, createdAt, actor: { id, name, role } }`.

## Super admin — `/admin` (role `super_admin`)

**Overview**

- `GET /overview` → `{ users: { patients, doctors, admins, newLast30 }, clinics: { total, active, invited, suspended }, appointments: { total, last30, completed }, records, activity: [{ day, bookings, signups }] }` (30 days of activity).

**Clinics**

- `GET /clinics?q&status&page` → paged `{ id, name, slug, email, city, status, plan, timezone, createdAt, activatedAt, doctors, admins, appointments30d }`.
- `POST /clinics` `{ name, email, phone?, address?, city?, state?, zipCode?, latitude?, longitude?, timezone?, plan?: starter|growth|enterprise }` → 201 `{ clinic, inviteUrl, emailSent }`.
  - The clinic's status stays `invited` until its admin accepts the invite.
- `GET /clinics/:id` → `{ clinic, members, invites, stats: { total, upcoming, patients } }`.
- `PATCH /clinics/:id` `{ name?, plan?, status?: 'active'|'suspended', timezone? }`. 400 `NO_ADMIN` when activating a clinic that is still `invited`.
- `POST /clinics/:id/invites` `{ email, role }` → `{ inviteId, inviteUrl, emailSent }`. Also used to resend the owner invite.
- `DELETE /clinics/:clinicId/invites/:id`.

**Users**

- `GET /users?q&role&page` → paged `{ id, name, email, role, isActive, createdAt, lastLoginAt, clinics: string[] }`.
- `PATCH /users/:id` `{ isActive }`. Deactivating also revokes the user's sessions.

**Audit logs**

- `GET /audit-logs?action&clinicId&actorId&from&to&page` → paged entries plus `actions: string[]` for filters. The log is read-only; there is no delete.

## Any signed-in user

- `GET /notifications?unread=true&page` → paged `Notification` + `unreadCount`.
- `POST /notifications/read` `{ all: true } | { ids: string[] }`.
- `GET /records/:id/file[?download=1]` streams the file after an access check.
  - Patient: their own records.
  - Doctor: see the access rules below.
  - Clinic admin: records attached to their clinic.
  - In the browser use `/api/backend/records/:id/file`.

## Access rules (summary)

**Doctor**
- Patients: only those with an appointment with this doctor at an active clinic.
- Records: ones they uploaded, ones attached to their appointments, and a patient's records while that patient has an active appointment or one completed within the last 14 days.

**Clinic admin**
- Data from their own clinic only.
- Never sees a patient's private uploads unless the patient attaches them to an appointment at that clinic.

**Sessions**
- Deactivated users, or revoked sessions (after a password change or "sign out everywhere"), get 401 immediately.
