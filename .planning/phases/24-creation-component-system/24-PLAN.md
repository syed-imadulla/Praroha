# Phase 24: Creation Component System — Execution Plan

## 1. Overview & Objective
Create ONE canonical, strongly-typed, accessible `CreationCard` component for the entire PRAROHA application that strictly follows `design.md`.

This unified component system will power:
- Home → Recent Creations
- My Creations (Phase 25)
- Graveyard (Phase 26)
- Profile → My Creations / Favorites / Archived / Deleted (Phase 27)

## 2. Component Architecture
```
frontend/src/components/creation/
├── types.ts          # Discriminated types: 'image' | 'story' | 'sound' | 'video' | 'chat', CreationItem, CreationAction, CreationCardProps
├── CreationCard.tsx  # Canonical card with 16:9 thumbnail, badge overlay, favorite toggle, content text, context menu, and calm placeholder fallbacks
└── index.ts          # Clean exports
```

## 3. Visual & Aesthetic Specifications (design.md)
- **Surface**: Paper-like cream surface (`card-botanical` or `bg-[#F8F4E8]/90`), `border 1px solid #D8CCB7`, radius `18px`, soft shadow.
- **Hover**: `translateY(-2px)` with slightly stronger soft shadow, 180ms ease transition.
- **Thumbnail**: 16:9 ratio, `rounded-[13px]`, overflow-hidden.
- **Content Type Badges & Accents**:
  - Image: landscape icon (`Image`), sage accent (`#294B3A`), `sage-100` (`#DDE2D2`) bg.
  - Story: document icon (`FileText`), terracotta accent (`#A0522D`), warm terracotta (`#E8D5C4`) bg.
  - Sound: audio icon (`Music`), plum accent (`#6A4B67`), `plum-200` (`#DCCDD8`) bg.
  - Video: play icon (`Play`), sage accent (`#294B3A`), `sage-100` (`#DDE2D2`) bg.
  - Chat: speech bubble icon (`MessageSquare`), gold/terracotta accent (`#B8734F`), `gold-200` (`#E9DDBF`) bg.
- **Media Safety & Fallbacks**:
  - Image element with `onError` handling that automatically swaps to a serene botanical placeholder matching the content-type tone and icon.
  - Missing image, video, audio gracefully renders a content-type placeholder without layout shifts.
- **Context Menu & Parent Actions**:
  - 3-dot trigger button with 44×44px hit target, keyboard focus rings, and `aria-expanded`/`aria-haspopup` attributes.
  - Parent-configurable actions list (`Open`, `Favorite`, `Archive`, `Delete`, or `Restore` / `Delete permanently` for Graveyard).
  - Emits callbacks: `onOpen`, `onToggleFavorite`, `onAction`.
- **Graveyard Variant**:
  - Supports `variant="graveyard"` showing deleted timestamp and optional quick-action buttons: Restore (sage) and Delete permanently (soft terracotta/red).

## 4. Home Refactoring
- Refactor `RecentCreationsRow.tsx` to consume `CreationCard`.
- Map `CANONICAL_RECENT_CREATIONS` data to `CreationItem`.
- Retain Home layout and visual hierarchy.

## 5. Verification Plan
- Build check: `npm run build`
- Backend check: `pytest backend/tests -v`
- E2E tests:
  - `node frontend/e2e/test_phase24_creation_component.cjs`
  - Regression: `node frontend/e2e/test_phase20_human_only_zones.cjs`
  - Regression: `node frontend/e2e/test_phase22_app_shell.cjs`
  - Regression: `node frontend/e2e/test_phase23_home_screen.cjs`
