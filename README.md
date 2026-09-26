# Unimeds

Multi-tenant healthcare SaaS with four roles:

- **Patient:** find doctors, book, reschedule and cancel visits, and keep medical records.
- **Doctor:** agenda, confirm/complete visits, clinical notes, patient charts, weekly schedule.
- **Clinic admin:** front desk, team invites, doctor schedules, analytics, activity log.
- **Super admin:** onboard and suspend clinics, manage users, platform-wide audit log.

```
Browser ──► Next.js 16 (src/) ──/api/backend/*──► Express API (server/) ──► Postgres (Neon)
              NextAuth (Google + email/password)                  └──► Cloudinary (private files)
              httpOnly session holds API token                    └──► SMTP (invites, resets, booking emails)
```

`ai_engine/` (FastAPI OCR/LLM) is not wired in yet.

## Local setup

```bash
# API
cd server
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, INTERNAL_API_KEY, Cloudinary
npm install
npm run db:migrate
SUPER_ADMIN_EMAIL=you@company.com SUPER_ADMIN_PASSWORD='a-long-password' npm run seed:admin
npm run dev                    # :8080

# Web
cd ../src
cp .env.example .env           # same INTERNAL_API_KEY, AUTH_SECRET, Google OAuth
npm install
npm run dev                    # :3000
```

## Onboarding flow

1. The super admin opens `/admin/clinics` and clicks **Onboard clinic**. This emails an invite link, which the admin can also copy.
2. The clinic owner accepts the link at `/invite/<token>` and sets a password. This activates the clinic.
3. The clinic admin invites doctors from `/clinic/team`. Doctors accept, then set their weekly hours.
4. Patients sign up at `/signup` (or with Google) and book at `/patient/book`, or from a public `/doctors` page.

## Docs

- `docs/api.md`: API contract
- `docs/frontend-conventions.md`: frontend architecture and shared components
- `docs/gap-audit.md`: audit that drove this rebuild
