# Unimeds Specification Layout Canvas: Client UI Framework (`client-ui.md`)

## 1. Core Structural Foundations & Responsive Design Principles

To capture the exact fluid layout, precision alignment, and editorial premiumness from the provided references, all portals must be constructed over a cohesive CSS grid.

### Multi-Device Grid Topology

#### Desktop Viewport (≥ 1280px)

- Strict dual-axis or asymmetric bento layout configuration.
- Sidebars remain statically locked at exactly `w-64`.
- Use `position: fixed` or explicit grid boundaries:

```css
grid-cols-[16rem_1fr]
```

#### Tablet Viewport (768px - 1027px)

- Sidebars automatically contract into a micro-icon rail (`w-20`).
- Alternative floating glass container:

```css
fixed bottom-6 left-1/2 -translate-x-1/2 z-50
```

- Main grids downscale into dual-column layouts:

```css
grid-cols-2
```

#### Mobile Viewport (≤ 767px)

- Sidebars collapse into sheet overlays:

```css
fixed inset-y-0 left-0
```

- Grid layouts compress to:

```css
grid-cols-1
```

- Multi-action headers become stacked action groups.

---

## 2. Tokenized Luxury Design Token System

The interface avoids standard flat designs by utilizing deep rich blues, sharp borders, heavy font weights, and extensive glassmorphism.

### Typography Specifications

#### Primary System Family

```txt
Geist Sans
```

#### Letter Spacing

##### Headlines

```css
tracking-tight
```

##### Labels / Badges / Metadata

```css
tracking-widest uppercase font-bold text-[10px]
```

#### Weight Contrasts

Use:

```css
font-black
```

or

```css
font-semibold
```

paired with:

```css
font-normal
```

for metadata.

---

### Luxury Token Value Dictionary

```json
{
  "colors": {
    "brand": {
      "deep": "zinc-950",
      "royal-blue": "#0a2540",
      "vibrant-blue": "#003366",
      "accent-cyan": "#0ea5e9"
    },
    "canvas": {
      "bg-base": "zinc-50",
      "bg-surface": "white",
      "bg-glass-light": "rgba(255, 255, 255, 0.8)",
      "bg-glass-dark": "rgba(9, 9, 11, 0.85)"
    },
    "borders": {
      "subtle": "zinc-200",
      "muted": "zinc-300",
      "focus": "zinc-950"
    }
  },
  "effects": {
    "blur": "backdrop-blur-md",
    "shadow-premium": "0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 1px rgba(0, 0, 0, 0.03)",
    "transition-fluid": "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
  }
}
```

---

## 3. Atomic shadcn/ui Component Variations

Every base primitive should wrap Radix primitives into custom luxury-themed components.

### Premium Button Override (`components/ui/button.tsx`)

#### Primary Luxury Action

```ts
"bg-[#0a2540] text-white hover:bg-[#003366] active:scale-[0.98] transition-all duration-300 font-medium tracking-tight rounded-lg shadow-premium border border-zinc-950/10 px-4 py-2"
```

#### Secondary Dashed Utility

```ts
"bg-white text-zinc-900 border border-dashed border-zinc-300 hover:border-zinc-950 hover:bg-zinc-50 active:scale-[0.98] transition-all duration-300 rounded-lg px-4 py-2"
```

### Elite Bento Container (`components/ui/bento-card.tsx`)

```ts
"relative overflow-hidden bg-white border border-zinc-200 rounded-xl p-6 shadow-premium transition-all duration-300 hover:border-zinc-300 hover:shadow-lg group"
```

---

## 4. Super Admin Portal Layout Template

### Purpose

Corporate workspace used to:

- Oversee platform growth
- Onboard clinics
- Manage platform stability

### Layout

```text
+-----------------------------------------------------------------------------------------+
|  [Logo] Unimeds Admin        (Search Metrics...)             [Admin Session Profile]    |
+-----------------------------------------------------------------------------------------+
|              |  [BENTO 1: TOTAL ACTIVE CLINICS]   |  [BENTO 2: DAILY PLATFORM HIT RATE] |
|  Overview    |  Count: 142 Tenants                |  Rate: 98.4% uptime                 |
|  Tenants     |  +12% this month                   |  Response: 42ms avg                 |
|  Audit Logs  +------------------------------------+-------------------------------------+
|  Settings    |  [BENTO 3: TENANT ONBOARDING ENGINE & CONFIGURATION WIZARD]              |
|              |  Inputs: Name, Secret Webhook URL, License Parameters...                 |
|              |  [Action: Confirm Tenant Provisioning]                                   |
|              +--------------------------------------------------------------------------+
|              |  [BENTO 4: IMMUTABLE AUDIT LOG VIEWER]                                   |
+--------------+--------------------------------------------------------------------------+
```

### Interactive Mechanics

#### Clinic Onboarding Flow

- Multi-step shadcn dialog.
- States:

```txt
IDLE → PROVISIONING
```

- Skeleton loaders shown during provisioning.

#### Audit Log Viewer

- Read-only TanStack Table.
- URL-driven sorting state.
- Hover state:

```css
hover:bg-zinc-50/50
```

---

## 5. Patient Portal Layout Template

### Purpose

Clean workspace optimized for:

- Medical record uploads
- Health summaries
- Appointment scheduling

### Interactive Mechanics

#### Dashed Dropzone Component

Default:

```css
border-2 border-dashed
```

Active Drag State:

```css
bg-zinc-100/80 border-zinc-950
```

#### Health Timeline Grid

Vertical timeline guide:

```css
before:absolute
before:left-4
before:h-full
before:w-[1px]
before:bg-zinc-200
```

---

## 6. Doctor Workspace Layout Template

### Purpose

Clinical dashboard optimized for:

- Fast context switching
- Patient review
- Consultation note entry

### Command Palette Lookup (`Cmd + K`)

#### Features

- Modal overlay
- Patient search
- Smooth scrolling

```css
max-h-[300px] overflow-y-auto
```

#### Behavior

- Updates router parameters dynamically.
- No full-page refreshes.

### Prescription Highlighting

Critical warnings:

```css
bg-red-50
text-red-900
border-red-200
font-semibold
```

Examples:

- Drug allergies
- Contraindications
- High-risk alerts

---

## 7. Clinic Dashboard Layout Template

### Purpose

Operational analytics center for clinic administrators.

### Live Queue Operations

Supports:

- Instant status updates
- Background synchronization
- Animated row repositioning

Example:

```txt
AWAITING → IN_CONSULTATION
```

### Data Chart Implementation

#### Library

```txt
Recharts
```

#### Theme

```css
stroke: #0a2540
```

#### Containers

```tsx
<ResponsiveContainer>
```

#### Metrics

- Revenue
- Queue activity
- Utilization
- No-show rates

---

## 8. Seamless Micro-Interactions, Layout Smoothness & Polling States

### Skeleton Loading States

Replace spinners with:

```css
animate-pulse
bg-zinc-200/60
rounded-lg
```

### Long-Polling Feedback

Status badge:

```css
bg-blue-50
text-[#003366]
border-dashed
border-zinc-300
```

Displayed message:

```txt
AI Engine extracting core data layers...
```

### Layout Adaptability

Use fluid responsive grids:

```css
grid-cols-[repeat(auto-fit,minmax(320px,1fr))]
```

Benefits:

- Automatic resizing
- No overlap
- Consistent spacing
- Responsive expansion

---

## Design Philosophy Summary

The Unimeds UI framework prioritizes:

- Premium luxury aesthetics
- Responsive bento-grid architecture
- Deep zinc and blue color systems
- Glassmorphism
- Accessibility via Radix UI
- Seamless AI-powered workflows
- High-performance dashboards
- Smooth micro-interactions
- Enterprise-grade healthcare usability