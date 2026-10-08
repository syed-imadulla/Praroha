# Phase 22 Plan: Global App Shell (UI Upgrade Phase 2)

## Goal
Establish the new PRAROHA global application shell:
- Permanent warm cream desktop sidebar (265–280px)
- PRAROHA botanical leaf identity and refined serif wordmark (`Seed → Universe`)
- Navigation structure: Home, My Creations, Graveyard, and anchored bottom Profile
- Subtle hand-painted botanical corner leaf foliage (pointer-events-none, non-obtrusive)
- Clean, flexible Main Content area wrapping the existing Seed Unfold workspace without breaking any functional contracts or stages
- Responsive mobile/tablet support with accessible minimum 44×44px touch targets

## Source of Truth
- `design.md` (Sections 1, 2, 5, 6, 8, 10, 21, 22)

## Affected Files & Components
- **New Components**:
  - `frontend/src/components/shell/BotanicalDecorations.tsx` (top-right & bottom-left subtle SVG dried leaves)
  - `frontend/src/components/shell/Sidebar.tsx` (brand, 3 nav items, bottom profile, mobile drawer state)
  - `frontend/src/components/shell/AppShell.tsx` (wraps application layout with sidebar and main content)
- **Modified Files**:
  - `frontend/src/store/workspaceStore.ts` (add `activeNav` state for shell routing: `'home' | 'creations' | 'graveyard' | 'profile'`)
  - `frontend/src/App.tsx` (wrap workspace inside `AppShell`, retaining TopBar, StageProgressHeader, WorkspaceCanvas, and InspectorDrawer)

## Implementation Steps
1. **Create `BotanicalDecorations.tsx`**:
   - Handcrafted organic botanical SVG fronds with muted terracotta/tan palette (`#C38A66`, `#D0A27F`, `#B98260`), 50% opacity, `pointer-events-none fixed`.
2. **Create `Sidebar.tsx`**:
   - Width: 270px desktop, fixed left or sticky.
   - Background: `bg-[#F4EEDF]` (warm cream), right border `1px solid #D8CCB7`.
   - Brand: Small terracotta spark (`#A0522D`), botanical leaf logo, serif uppercase "PRAROHA" with `0.18em` letter-spacing, "Seed → Universe" subtitle.
   - Navigation:
     - Home (Sage `#294B3A` active, 54px height, 16px radius)
     - My Creations (Sage `#294B3A` active, 54px height, 16px radius)
     - Graveyard (Plum `#6A4B67` accent, 54px height, 16px radius)
   - Profile area at bottom:
     - Botanical circular avatar, user name, plan badge, profile trigger.
   - Keyboard focus rings: 2px sage ring with offset.
3. **Create `AppShell.tsx`**:
   - Manages responsive mobile toggle and desktop layout.
   - Provides semantic `<aside>` and `<main>` structure.
4. **Update `App.tsx` & Store**:
   - Connect shell navigation to store view without breaking any existing stage/workspace behavior.
5. **Verification**:
   - Build test: `npm run build` in `frontend`.
   - Backend test: `pytest backend/tests -v`.
   - E2E verification: Run Playwright test suite to confirm zero regressions in stage flow.
