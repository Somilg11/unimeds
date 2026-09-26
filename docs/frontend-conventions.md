# Frontend conventions (src/)

Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui (Radix), TanStack Query v5. **Next 16 differs from older versions.** Read `src/node_modules/next/dist/docs/` before relying on memory. For example, `middleware.ts` is now `proxy.ts`, and `params`/`searchParams` are Promises.

## Architecture

- **Auth.** NextAuth (`src/lib/auth.ts`) keeps the backend API token inside its encrypted httpOnly cookie. The browser never sees the token.
- **Data access.**
  - Client components call `api.get/post/...` from `@/lib/api`. It hits `/api/backend/*`, a same-origin proxy that attaches the token.
  - On a 401 the client signs the user out automatically.
  - Server components may use `serverApi()` from `@/lib/server-api`. Prefer client components with React Query for interactive pages.
- **Route protection.**
  - `src/proxy.ts` redirects by role: `/patient` requires patient, `/doctor` requires doctor, `/clinic` requires clinic_admin, `/admin` requires super_admin.
  - The API enforces all authorization anyway. Don't re-implement role checks in pages.
- **API contract.** See `docs/api.md`. Types are in `@/lib/types`.

## Shared building blocks

Use these; don't re-create them.

| Import | Purpose |
|---|---|
| `@/components/app/app-shell` → `AppShell`, `NavItem` | Portal layout: sidebar, mobile sheet, notifications, account menu |
| `@/components/app/common` → `PageHeader`, `StatusBadge`, `EmptyState`, `Pagination`, `ListSkeleton`, `ErrorState`, `StatCard` | Page primitives |
| `@/components/app/slot-picker` → `SlotPicker` | Date strip + free times for doctor × clinic (booking, reschedule, walk-in) |
| `@/components/app/availability-editor` → `AvailabilityEditor` | Weekly schedule editor |
| `@/components/app/record-upload-dialog` → `RecordUploadDialog` | Upload flow (ticket → storage → confirm) |
| `@/components/app/confirm-action` → `ConfirmAction` | Confirm dialog, optional reason textarea |
| `@/lib/api` → `api`, `errorMessage`, `recordFileUrl`, `uploadRecord` | Data + files |
| `@/lib/format` → `formatDateTime`, `formatDate`, `formatTime`, `formatWeekday`, `relativeTime`, `formatBytes`, `initials`, `zoneLabel`, `isBrowserZone`, `STATUS_LABEL`, `RECORD_TYPE_LABEL`, `ROLE_LABEL`, `DAY_NAMES` | Formatting |
| `@/components/ui/*` | shadcn: button, card, badge, input, textarea, label, select, dialog, sheet, alert-dialog, dropdown-menu, popover, tabs, table, switch, skeleton, tooltip, avatar, separator, sonner |

## Rules

- **Timezones.** Render appointment times in `appointment.clinic.timezone`, e.g. `formatDateTime(a.startsAt, a.clinic.timezone)`. Show `zoneLabel(tz)` when `!isBrowserZone(tz)`.
- **Errors.**
  - Surface `errorMessage(err)` via `toast.error` (from `sonner`).
  - Every list needs loading (`ListSkeleton`), empty (`EmptyState`) and error (`ErrorState`) states.
- **Queries.**
  - Use `useQuery` with key arrays like `['doctor', 'appointments', filters]`.
  - Mutations invalidate the affected keys.
  - Keep page and filter state in the URL (`useSearchParams` plus `router.replace`) when practical. Pages using `useSearchParams` must be wrapped in `<Suspense>`.
- **Files.** Open with `recordFileUrl(id)` in a new tab (`target="_blank" rel="noopener"`); download with `recordFileUrl(id, true)`. Never build Cloudinary URLs.
- **No mock data**, no hardcoded stats, no `localStorage` tokens, no `console.log`.
- **Styling.** Use Tailwind with the theme tokens (`bg-card`, `text-muted-foreground`, `border`, `bg-primary`, …). Keep it clean and responsive down to 360px; a luxury redesign pass comes later, so favour structure and consistency over decoration.
- **Accessibility.** Label every input and icon button (`aria-label`), use semantic headings, and keep everything keyboard-reachable.
- **Portal-private components** go in `app/<portal>/_components/`.
