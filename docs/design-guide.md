# Unimeds design guide

Clean, light consumer-health look: think DocSpot, Mediva and MedX-style Dribbble shots. The finished reference screen is the patient home at `src/src/app/patient/_components/overview.tsx`. **Match it.**

## Principles

- **Light is the default theme; dark is optional** (toggle in the shell). Every colour comes from tokens, so both themes work automatically.
- **Only three colours, plus greys.** No other hues, no gradients, no glow, no textures, no glassmorphism, no decorative blobs.
  - **Black** `#212121`: text and the solid "black button" (`variant="secondary"`).
  - **White** `#FFFFFF`: cards.
  - **Blue:** `primary` / `brand` = `#1F72E8` (the WCAG-safe form of `#2D87FF`).
  - **Greys:** canvas `#F6F6F6`, text `#6E6E6E`, borders `#E6E6E6`.
- **Plain shadcn.** Use the components in `src/src/components/ui` exactly as installed; they are the "luma" style, with pill buttons and rounded inputs. Don't restyle their internals, and don't hardcode palette classes (`bg-blue-500`, `text-gray-*`, hex values). Use tokens: `bg-card`, `bg-background`, `bg-primary`, `bg-brand`, `bg-accent` (light blue tint), `text-accent-foreground`, `text-muted-foreground`, `bg-muted`, `border`.
- **Shapes.** Cards are `rounded-3xl bg-card` with no border and no shadow. Chips and buttons are pills (`rounded-full`). Icons sit in circles: `size-9`–`size-12 rounded-full bg-accent text-accent-foreground`, or `bg-muted` for neutral ones.
- **Type.** Plus Jakarta Sans.
  - Hero headlines: `text-3xl sm:text-4xl font-bold tracking-tight`.
  - Section titles: `<SectionHeader title href />` ("Upcoming appointments · See all").
  - Body: `text-sm`. Numbers use `tabular-nums`.
- **Hierarchy through blocks.**
  - At most **one** solid blue block per screen: the thing that matters most (next visit, primary stat, selected slot or date). Everything else is white cards on grey.
  - The main CTA is `Button` default (blue) or `variant="secondary"` (black), size `lg` on mobile, full-width at the bottom of mobile flows (like "Book Appointment").
- **People first.** Wherever a person appears, show an Avatar with initials fallback (`bg-accent text-accent-foreground`), bold name, and specialty or role in muted text.
- **Status** always uses `<StatusBadge>`.

## Mobile-first: patient and doctor

- Design at **390px first**, then enhance at `lg`.
- The shell (`mobile="tabs"`) gives a greeting header and a floating black tab bar. Pages must leave bottom space; the shell already adds `pb-28`.
- Single column on mobile. Horizontal-scroll chip rows (`-mx-4 px-4 overflow-x-auto`) for categories and dates.
- **Lists are stacks of cards, not tables, on mobile.** A table may be used from `lg` up (`hidden lg:block`), with the card list as `lg:hidden`.
- **Tap targets ≥ 44px.** Primary actions sit in a sticky bottom bar inside flows where it helps (booking, confirm): `sticky bottom-24 lg:bottom-0`.
- **Dialogs.**
  - On mobile, prefer `Sheet side="bottom"` (`rounded-t-3xl`) for pickers and forms.
  - `Dialog` is fine on desktop.

## Desktop-first: clinic and admin

- Sidebar shell (`mobile="menu"`). Must not break on mobile, but doesn't need to be optimised for it.
- Dashboards: KPI `StatCard`s (one may be `highlight`, the solid blue one) and white `rounded-3xl` cards holding shadcn `Table`s. Filters as pill `Select`s and `Tabs` above the table.
- **Charts (recharts):**
  - Series colours come from `var(--chart-1)`…`var(--chart-5)` in fixed order: 1 blue, 2 black, 3 light blue, 4 grey, 5 dark blue.
  - Grid lines use `var(--border)`. No gradients in charts.
  - Always a legend when there are 2+ series, plus a tooltip.

## Shared building blocks

| Import | Use |
|---|---|
| `@/components/app/common`: `PageHeader`, `SectionHeader`, `StatusBadge`, `EmptyState`, `Pagination`, `ListSkeleton`, `ErrorState`, `StatCard` (`highlight`) | Page scaffolding |
| `@/components/app/slot-picker`: `SlotPicker` | Date chips + time pills |
| `@/components/app/availability-editor`, `record-upload-dialog`, `confirm-action` | As before |
| `@/components/app/app-shell` | `AppShell` + `NavItem` (`tab: true` marks mobile tab bar items, max 4) |
| `@/components/app/logo`: `Logo` (`inverted` for blue or black backgrounds) | Brand |
| `@/components/app/theme-toggle`: `ThemeToggle` | Light/dark |

Functional rules (timezones, errors, React Query, no mock data) are in `docs/frontend-conventions.md` and still apply. **Don't change behaviour or API calls while restyling** unless something is broken.
