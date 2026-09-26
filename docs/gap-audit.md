# Unimeds — Gap Audit (2026-09-26)

Scope: patient (`/user`), doctor (`/doctor`), clinic admin (`/clinic`), super admin (`/admin`), landing/public pages, Express backend (`server/`). `ai_engine/` excluded.

Legend: **P0** = security / data loss, fix before anything else. **P1** = broken core flow. **P2** = missing SaaS feature / quality.

---

## P0 — Security & data loss

| # | Gap | Where |
|---|-----|-------|
| 1 | `POST /api/v1/auth/oauth` is public and mints a JWT for **any posted email** (incl. super admin / clinic admin / doctor). Full auth bypass. Also lets caller self-assign `doctor`/`clinic_admin` role. | `server/src/controllers/authController.ts` |
| 2 | Super admin credentials hardcoded `admin123` / `12345678`. | `adminController.ts:17-18` |
| 3 | JWT secret falls back to `'dev-secret'` (server + NextAuth). | `middleware/auth.ts`, `src/lib/auth.ts` |
| 4 | Doctor login = single static `authId` string, no password, never rotates; shown to clinic admin and written into a notification body. | `doctorController.ts:doctorLogin`, `clinicController.ts:addDoctorToClinic` |
| 5 | `completeAppointment` **deletes every patient-uploaded record** of that patient (all clinics, all doctors) from Cloudinary + DB. | `doctorController.ts:completeAppointment` |
| 6 | Doctor patient search returns **every patient on the platform**. | `doctorController.ts:searchPatients` |
| 7 | Clinic records/dashboard join on `patientId` only → clinic sees patient's records from other clinics + personal uploads; duplicate rows. | `clinicController.ts:getClinicRecords` |
| 8 | Deactivated clinic doctor keeps full access (authorize checks role only). | `middleware/auth.ts`, doctor controller |
| 9 | `POST /user/auth/sync` lets any authed user create users with any role. | `patientController.ts:syncUser` |
| 10 | Patient routes have no role check (any role uses patient portal as itself). | `routes/patientRoutes.ts` |
| 11 | Super admin can wipe the "immutable" audit log; wipe itself not logged. | `adminController.ts:clearAuditLogs` |
| 12 | Record delete: Cloudinary `resource_type:'auto'` invalid on destroy → error swallowed, DB row deleted, **PHI file stays public**. | `server/src/lib/cloudinary.ts:deleteAsset` |
| 13 | Clinic activation token never expires / never cleared; public endpoints reusable. | `adminController.ts:activateClinic` |
| 14 | No route protection: no `middleware.ts`/`proxy.ts`; doctor/admin tokens in `localStorage`; client-only guards. | `src/src/app/**` |
| 15 | `api-client` token priority: `doctor_token` > `admin_token` > session → wrong identity sent on shared browser. | `src/src/lib/api-client.ts` |
| 16 | No rate limiting, no input validation (zod), no request size limit tuning, no pagination (unbounded queries). | server-wide |
| 17 | Legal/security pages claim HIPAA BAA, SOC 2 Type II, AES-256, GDPR — nothing backs them. Legal risk. | `app/legal/*`, `app/support` |

## P1 — Broken core flows

**Auth / onboarding**
- Clinic admin whose Gmail signed in before activation is created as `patient`; activation never upgrades → locked out.
- Admin "toggle active" never creates the clinic_admin user.
- Activation link only visible once (list endpoint doesn't return it); no email is ever sent (SMTP env unused).
- `onboard-form.tsx` broken (no email field → always 400) and orphaned.
- NextAuth session ~30d vs backend JWT 24h, no refresh → silent empty dashboards after a day.
- Expired doctor token → redirect loop between `/doctor` and `/doctor/dashboard`.

**Appointments**
- Nothing ever sets `status = confirmed`. No confirm action in any portal. Clinic can't confirm/cancel/reschedule.
- Timezones: slots generated/validated in server local time, client builds times in browser local time; clinic `timezone` setting ignored. IST browser + UTC server = wrong/rejected bookings.
- Double-booking race: no unique index on (doctor, slot) for active statuses.
- `complete` allowed from any non-cancelled state incl. future appointments.
- Cancel allowed on completed/past appointments; `cancellationHours` and `bookingWindowDays` never enforced.
- Reschedule proposal not checked against availability / past.
- Booking wizard stale-closure bugs: step 2 empty doctor list, step 3 no slots fetched.
- Patient dashboard reschedule card shows old time as "new time" and notes as reason.
- "Upcoming" shows 3 furthest-future appointments, not next 3.

**Records**
- Cloudinary: server reads `CLOUDINARY_CLOUD_NAME`, client hardcodes preset `medical_uploads` vs server `CLOUDINARY_UPLOAD_PRESET` → signature mismatch.
- DB row + notification created **before** upload; no confirm step → orphan records on failure.
- Stored `fileUrl` `…/auto/upload/<id>` is not a valid delivery URL → viewer fails. `fileSize` never stored.
- OCR "processing" state faked (excluded: AI engine later).

**Profile / data**
- Profile PUT replaces whole `profileData` jsonb → wipes picture/other fields; email editable (and used for login matching).
- Clinic settings: name editable in UI but never saved.
- Staff: linking existing email doesn't check role (patient becomes "doctor"); UI says "removed" when backend only deactivated.

**Analytics**
- "No-show rate" is cancellation rate. "This week" counts all future appointments. Upcoming doctor name blank.

**Config**
- Server default PORT 3000 collides with Next; `FRONTEND_URL`, `NEXT_PUBLIC_APP_URL` undefined → CORS/links break in prod.
- Duplicate migrations `0002_*`, `0003_*` (orphans not in journal).
- No DB constraints: unique clinic email, unique (clinic, doctor), indexes on FK/status/slot.
- Tenant membership stored in `profileData.clinicId` JSON instead of a column.
- `globals.css` font var not wired to next/font → Inter never loads.

## P2 — Missing SaaS features / cleanup

**Platform**
- Subscription plans, billing (Stripe/Razorpay), plan limits per clinic.
- Transactional email (invites, booking confirmation, reminders, password reset).
- Staff roles: receptionist, multiple clinic admins, invite flow.
- Patient detail pages (doctor + clinic) — backend endpoints exist, unused.
- Consultation notes / prescriptions UI (notes endpoint unused).
- Clinic calendar/day view; clinic view/edit doctor availability.
- Family / dependent profiles (promised in docs).
- Notifications page; patient notified on confirm.
- Server-side pagination + search everywhere; audit log paginated, read-only table.
- Account deletion / data export.

**Cleanup**
- Dead Next proxy routes (`app/api/user/**`, most `app/api/admin/**`, `app/api/clinic-admin/**`), duplicate backend route set `/hospital/admin/*`.
- Unused `src/lib/db.ts`, `lib/schema.ts` (drifted types), `lib/cloudinary.ts`, `components/forms/upload-zone.tsx`, `portal-welcome.tsx`, empty `hooks/`.
- ~500 lines commented-out code in landing nav/footer/speciality menu.
- Landing: fake stats/testimonials, placeholder contact address, broken `/doctors/<slug>` links, wrong social icons, "Quick Access (Demo)" on sign-in.
- React Query / Zustand installed, never used. Errors show axios message instead of backend `error`.

---

## Status after rebuild (2026-09-27)

**Done:**
- All P0 items.
- All P1 items.
- These P2 items:
  - transactional email
  - invites
  - clinic front-desk booking
  - clinic appointment actions
  - patient/doctor/clinic patient detail pages
  - clinical notes
  - clinic management of doctor schedules
  - notifications
  - pagination everywhere
  - read-only audit logs
  - data export and account deletion
  - cleanup of dead code and fake content

**Deferred:**
- Subscriptions and billing (the `clinics.plan` column exists with no enforcement).
- Receptionist role.
- Family profiles.
- Appointment reminder emails (T-24h), which need a scheduler.
- AI engine and OCR.
- Luxury UI redesign.
