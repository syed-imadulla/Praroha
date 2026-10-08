# Phase 23 Plan: Home Screen UI Upgrade

## Goal
Transform the Home / Stage 1 view into the PRAROHA botanical creative-journal experience in exact alignment with `design.md` and reference mockups, while 100% preserving existing seed submission, validation, demo universe seeding, and stage progression.

## Visual & Functional Requirements
1. **Editorial Hero**:
   - High-contrast literary typography: `font-serif` (Cormorant Garamond), 30–38px, `#294B3A` (dark sage).
   - Exact text:
     "Universes exist in a seed form,
     autonomously unfolds with initial agency.
     Forms hidden in formless."
2. **Leaf Separator**:
   - Thin cream/sage horizontal rule (`#D8CCB7`), centered PRAROHA leaf symbol in dark sage, horizontal rule.
3. **72px Pill Seed Input Container**:
   - Height ~72px, radius ~36px, background `#F8F4E8` / `#F2EBDD` with `#D8CCB7` border.
   - Outlined seed icon on the left.
   - Placeholder: `"Enter your seed... (text, image, sound or idea)"`.
   - Circular sage submit button (`#355A46`, hover `#294B3A`) with white/cream arrow icon (minimum 44×44px).
   - Enter key submits seed.
   - Retain 1-click canonical demo trigger ("Instant Full Universe") and quick preset selector pills.
4. **Creation Modes (5 cards)**:
   - 5 cards in a horizontal row:
     - **Image**: `#DDE2D2` background, landscape icon, sage accent.
     - **Story**: `#E8D5C4` background, document icon, terracotta accent.
     - **Sound**: `#DCCDD8` background, audio waveform icon, plum accent.
     - **Video**: `#DDE2D2` background, play icon, sage accent.
     - **Chat**: `#E9DDBF` background, message bubble icon, gold/terracotta accent.
   - Sizing: ~145–160px width, 130–140px height, 20px radius.
   - Selecting a creation mode sets prompt inspiration or default creative focus.
5. **Recent Creations Row**:
   - Section header: `Recent Creations` (`font-serif`, 24px) + `View all →` button.
   - 3-card horizontal row with 16:9 photographic thumbnails, content-type badge, title, relative timestamp, and context menu.
   - Pre-populated with initial recent creations or user's active/created universe artifacts.
   - Empty state when none exist:
     - "Your garden is waiting."
     - "Plant your first seed and watch an idea become a universe."
     - CTA button: "Plant a seed".
6. **Side Journey Preview Card (Desktop Layout)**:
   - "From a seed..." card featuring the botanical sprout photo, visual stage progression checklist (Seed Input, AI Magic, Image, Your Universe), and poetic motto "Same seed, endless worlds...".
7. **Responsive Adaptability**:
   - Desktop (>= 1280px): Dual-column (Left: Hero, Seed Input, Creation Modes, Recent Creations; Right: Sprout Journey Card).
   - Tablet/Mobile: Single column, creation modes horizontally scrollable or grid, accessible 44px touch targets.
8. **Motion & Polish**:
   - 180ms ease transitions, subtle hover card lifts (`translateY(-2px)`), gentle seed pulse during generation.

## Implementation Steps
1. **Develop `HomeHero.tsx`**: Editorial quote & botanical leaf separator.
2. **Develop `CreationModes.tsx`**: 5 equal creation mode cards matching exact token colors and outlined icons.
3. **Develop `RecentCreationsRow.tsx`**: Horizontal 3-card gallery + poetic empty state.
4. **Develop `SeedJourneyPreviewCard.tsx`**: "From a seed..." sprout stage card.
5. **Upgrade `SeedInputCanvas.tsx`**:
   - Wire the 72px pill input, submit button, instant demo button, and presets into the new botanical layout.
   - Connect with `HomeHero`, `CreationModes`, `RecentCreationsRow`, and `SeedJourneyPreviewCard`.
6. **Automated Verification**:
   - `npm run build`
   - `pytest backend/tests -v`
   - E2E test `test_phase23_home_screen.cjs`:
     - Checks hero quote, leaf separator, 72px input, 5 creation modes, recent creations, demo launcher, and seed submission.
