# UI Context & Design System: Unimeds

## 1. Luxury Medical Aesthetic
The interface must present a clinical yet deeply luxurious environment. It avoids generic, sterile designs by adopting a premium editorial layout combined with modern glassmorphism.

* **Primary Palette:** A sophisticated mix of deep Royal Blues (`#0a2540`, `#003366`) and clean, expansive Whites.
* **Structural Canvas:** Built over a highly refined monochromatic baseline. Use the Tailwind `zinc` scale (`zinc-50` through `zinc-900`) for structural elements. **Standard grays are strictly prohibited.**
* **Typography:** `Geist` sans-serif exclusively. Use wide letter-spacing tracking on subheadings and heavy weight contrasts for crisp hierarchy.

## 2. Layout & Decorative Accents
* **Bento Grid Architecture:** Every dashboard screen must organize data fragments inside explicit, card-based responsive grids.
* **Dashed Separations:** Use `border-dashed` lines (`border-zinc-200` or `border-zinc-300`) for empty states, dropzones, and section boundaries to establish an engineering-grade aesthetic.
* **Glassmorphism & Depth:** Sticky structural headers, floating elements, and the AI interactive cockpit must implement glassmorphic variables (`bg-white/80 backdrop-blur-md` or `bg-zinc-900/80`). 
* **Shadows:** Use minimal, ultra-sharp border definitions instead of soft, diffuse blurs to keep components looking crisp.

## 3. Component Implementation Standards (shadcn/ui + Radix)
* **Shadcn Alignment:** All atomic interactive nodes (Buttons, Dialogs, Command Palettes, Dropdowns) must extend natively from custom `shadcn/ui` Tailwind primitives.
* **Dropzone Formations:** Empty states and document intake targets must utilize distinct dashed configurations to make interactions obvious.
* **Context Cards:** Group patient records, medication logs, and analytics inside uniform bento cards featuring clean padding and subtle border definitions.