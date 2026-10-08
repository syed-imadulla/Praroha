# Phase 21 Plan: Design System Foundation (UI Upgrade Phase 1)

## Goal
Implement the foundational design system tokens, typography, surfaces, and reusable component classes for the PRAROHA UI upgrade in strict accordance with `design.md`.

## Context & Requirements
- **Visual Source of Truth**: `design.md`
- **Core Palette**:
  - `cream`: 50 (`#F8F4E8`), 100 (`#F2EBDD`), 200 (`#E8E0D0`), 300 (`#D8CCB7`)
  - `sage`: 900 (`#294B3A`), 800 (`#355A46`), 700 (`#466A55`), 500 (`#718875`), 200 (`#C8D0BE`), 100 (`#DDE2D2`)
  - `terracotta`: 700 (`#A0522D`), 500 (`#B8734F`), 200 (`#E7C8B5`)
  - `plum`: 700 (`#6A4B67`), 200 (`#DCCDD8`)
  - `gold`: 500 (`#C59A55`), 200 (`#E9DDBF`)
  - `danger`: `#B85C46`, `danger-soft`: `#F1DDD5`
  - Text colors: `--text-primary` (`#294B3A`), `--text-body` (`#394840`), `--text-muted` (`#6D756F`)
- **Typography**:
  - Headings: `Cormorant Garamond` (fallback: Georgia, serif)
  - Body/UI: `Inter` (fallback: system-ui, sans-serif)
- **Surfaces & Background**:
  - Background `#F8F4E8` with subtle paper texture grain (`radial-gradient(rgba(72, 67, 55, 0.03) 0.6px, transparent 0.6px)`)
- **Cards**:
  - Radius 18px, border 1px solid `#D8CCB7`, soft shadow `0 5px 20px rgba(67, 70, 56, 0.05)`, paper-like appearance
- **Buttons**:
  - Primary: `#355A46` bg, `#F8F4E8` text, 18-24px radius, hover `#294B3A`
  - Secondary: `#F2EBDD` bg, `#D8CCB7` border, `#355A46` text
  - Destructive: `#F1DDD5` bg, `#B85C46` text

## Tasks
1. **Google Fonts in `frontend/index.html`**:
   - Add `<link>` imports for `Cormorant Garamond` (weights 400, 500, 600, 700, italic) alongside `Inter`.
   - Update document title & metadata to reflect "PRAROHA — Seed → Universe".
2. **Tailwind Design Tokens in `frontend/tailwind.config.js`**:
   - Add exact `cream`, `sage`, `terracotta`, `plum`, `gold`, `danger`, and `text` color scales.
   - Configure font families: `serif: ['"Cormorant Garamond"', 'Georgia', 'serif']`, `sans: ['Inter', 'system-ui', 'sans-serif']`.
   - Add radii: `card: '18px'`, `panel: '22px'`, `pill: '9999px'`.
   - Add shadows: `soft`, `card`, `hover` per `design.md` specs.
   - Retain existing utility colors (`canvas`, `accent`) during transition so un-refactored inner screens don't throw style errors.
3. **Global Styling & Utilities in `frontend/src/index.css`**:
   - Apply base background `#F8F4E8` and paper grain pattern to `body`.
   - Define CSS custom variables: `--cream-50`, `--sage-900`, etc.
   - Add botanical component classes: `.card-botanical`, `.btn-sage-primary`, `.btn-cream-secondary`, `.btn-danger-soft`, `.pill-botanical`, `.input-seed`, `.heading-editorial`.
   - Update scrollbars for warm parchment aesthetic.
4. **Build Verification**:
   - Run `npm run build` in `frontend` to verify 100% clean compilation.
