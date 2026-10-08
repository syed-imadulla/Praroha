# Phase 23 UI Refinement: Layout Consistency, Global Content Grid & Botanical Workspace

## 1. Objectives & Scope
This refinement pass elevates the PRAROHA frontend to senior-level product design standards based strictly on `design.md` and user feedback:
1. **Home Screen Cleanup**: Remove the large right-side `SeedJourneyPreviewCard` from Home; center the unified vertical flow (Hero → Leaf divider → 72px Seed Input → Presets → Creation Modes → Recent Creations).
2. **Global Content Grid**: Establish a shared content container (`max-w-[1200px]`, `px-6 sm:px-10 lg:px-12`) aligning all headings, cards, and dividers to a single canonical left/right grid.
3. **Creation Modes Responsive Grid**: Eliminate horizontal overflow. Render 5 equal-height, equal-width cards in 1 row on desktop (`grid-cols-5`), 2–3 columns on tablet, and 2 columns on mobile.
4. **TopBar & StageProgressHeader Alignment**: Modernize the top bar and stage progress rail into the PRAROHA botanical system (warm cream surface `#F8F4E8`/`#F2EBDD`, `#D8CCB7` borders, `#294B3A` sage active indicators, no dark navy or neon cyan).
5. **Stage 2 (Understand / Seed DNA)**: Replace low-contrast white/cyan text and dark cyber panels with readable editorial Cormorant Garamond headings, high-contrast dark text (`#294B3A` / `#394840`), paper cream cards, and balanced 2-column desktop / 1-column mobile grid.
6. **Stage 3 (Divergent Worlds)**: Replace dark sci-fi cards with 3 equal-weight botanical cards in a balanced 3-column desktop / stacked mobile grid, with subtle Familiar (sage), Radical (plum), and Inverse (terracotta) accents.
7. **Workspace Canvas & Diagnostics**: Redesign bottom architecture/status cards and notification toasts to match PRAROHA botanical tokens.
8. **Responsive Smoke Testing**: Verify at 1440×900, 1280×800, 1024×768, 768×1024, 390×844, 360×800 for zero horizontal page overflow.

## 2. Component Modification Plan
- `frontend/src/components/shell/PageContainer.tsx`: Reusable content container standardizing max width (`max-w-[1200px]`) and responsive padding.
- `frontend/src/components/SeedInputCanvas.tsx`: Remove right-side `SeedJourneyPreviewCard` from hero layout; align hero, seed input, presets, creation modes, and recent creations into single vertical rhythm.
- `frontend/src/components/home/CreationModes.tsx`: Redesign grid to responsive `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5` with equal flex height and zero overflow.
- `frontend/src/components/TopBar.tsx`: Reskin to PRAROHA palette (`bg-[#F4EEDF]`, `border-[#D8CCB7]`, sage text, subtle badges).
- `frontend/src/components/StageProgressHeader.tsx`: Reskin to PRAROHA palette (`bg-[#F8F4E8]`, `border-[#D8CCB7]`, active sage `#294B3A`/`#DDE2D2`, completed checkmark, horizontal scroll on mobile).
- `frontend/src/components/SeedDnaViewer.tsx`: Reskin to PRAROHA palette with high-contrast text (`#294B3A`), paper cream cards (`card-botanical`), and clean 2-column layout.
- `frontend/src/components/SeedPotentialCanvas.tsx`: Reskin subtab to warm cream/sage palette.
- `frontend/src/components/WorldCandidatesCanvas.tsx`: Reskin header and controls to warm cream/sage.
- `frontend/src/components/WorldCandidateCard.tsx`: Reskin the 3 world cards to PRAROHA cream cards with archetype accents.
- `frontend/src/components/WorkspaceCanvas.tsx`: Use standardized `PageContainer` and reskin bottom engine cards.

## 3. Verification Plan
- `npm run build`
- `pytest backend/tests -v`
- Run existing E2E regression suites (Phase 20, 22, 23, 24).
- Create automated responsive E2E test verifying zero horizontal overflow at desktop, tablet, and mobile viewports.
