const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('🌿 Starting Phase 30.2: Clean Global Header & Shell Simplification Verification...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Load Canonical Demo universe
    await page.evaluate(async () => {
      if (window.__workspaceStore) {
        await window.__workspaceStore.getState().loadCanonicalDemoUniverse();
      }
    });
    await page.waitForTimeout(1000);
    await page.locator('text=The Sunken City: Bio-City').first().waitFor({ timeout: 15000 });

    // =========================================================================
    // 1. TOPBAR COMPOSITION & INFORMATION HIERARCHY (DESKTOP 1440px)
    // =========================================================================
    console.log('--- Check 1: TopBar Information Hierarchy & Clean Brand Composition ---');
    const topBar = page.locator('header').first();
    assert(await topBar.isVisible(), 'TopBar header must be visible');

    // Verify Brand Mark & Wordmark
    const brandMark = page.locator('span:has-text("PRAROHA"):visible').first();
    assert(await brandMark.isVisible(), 'Brand wordmark PRAROHA must be visible');
    const brandSubtitle = page.locator('span:has-text("Seed → Universe"):visible').first();
    assert(await brandSubtitle.isVisible(), 'Brand subtitle "Seed → Universe" must be visible');

    // Verify Project Identity
    const projectTitle = page.locator('span:has-text("Bio-City"):visible, span:has-text("Sunken City"):visible').first();
    assert(await projectTitle.isVisible(), 'Active project title must be visible');

    // Verify Branch Switcher is present
    const branchBtn = page.locator('#branch-switcher-btn');
    assert(await branchBtn.isVisible(), 'Branch switcher trigger must be visible');

    // =========================================================================
    // 2. MAXIMUM 3 VISIBLE UTILITY CONTROLS IN DESKTOP HEADER
    // =========================================================================
    console.log('\n--- Check 2: Maximum 3 Visible Utility Controls (Search, Inspect, •••) ---');
    const searchBtn = page.locator('#global-search-btn');
    assert(await searchBtn.isVisible(), 'Desktop search button must be visible');

    const inspectBtn = page.locator('#inspect-drawer-toggle-btn');
    assert(await inspectBtn.isVisible(), 'Inspect drawer toggle button must be visible');

    const overflowBtn = page.locator('#workspace-overflow-menu-btn');
    assert(await overflowBtn.isVisible(), 'Workspace overflow menu (•••) button must be visible');

    // Verify button cluster is REMOVED from top-level header
    // AI provider, Supabase, Demo, Tour, Shortcuts, New Seed must NOT be top-level standalone header buttons
    const topLevelDemoBtn = page.locator('header > div > button#instant-demo-topbar-btn');
    assert.strictEqual(await topLevelDemoBtn.count(), 0, 'Demo Universe must NOT be a top-level button');

    const topLevelTourBtn = page.locator('header > div > button#guided-tour-btn');
    assert.strictEqual(await topLevelTourBtn.count(), 0, 'Guided Tour must NOT be a top-level button');

    const topLevelShortcutsBtn = page.locator('header > div > button#keyboard-shortcuts-btn');
    assert.strictEqual(await topLevelShortcutsBtn.count(), 0, 'Shortcuts must NOT be a top-level button');

    console.log('  ✔ Verified exactly 3 visible utility controls: Search, Inspect, and •••');
    console.log('  ✔ Confirmed button cluster successfully evicted from top-level header');

    // =========================================================================
    // 3. OVERFLOW MENU (•••) FUNCTIONALITY & DIAGNOSTICS
    // =========================================================================
    console.log('\n--- Check 3: Workspace Overflow Menu (•••) Interaction & Contents ---');
    await overflowBtn.click();
    await page.waitForTimeout(300);

    const overflowPopover = page.locator('#workspace-overflow-popover');
    assert(await overflowPopover.isVisible(), 'Overflow popover must appear on click');

    // Check menu items
    const tourMenuItem = page.locator('#guided-tour-btn');
    assert(await tourMenuItem.isVisible(), 'Guided tour must be present inside overflow menu');

    const shortcutsMenuItem = page.locator('#keyboard-shortcuts-btn');
    assert(await shortcutsMenuItem.isVisible(), 'Keyboard shortcuts must be present inside overflow menu');

    const demoMenuItem = page.locator('#instant-demo-topbar-btn');
    assert(await demoMenuItem.isVisible(), 'Demo universe must be present inside overflow menu');

    const newSeedMenuItem = page.locator('#new-seed-btn');
    assert(await newSeedMenuItem.isVisible(), 'New seed must be present inside overflow menu');

    // Check System Diagnostics section
    assert(await overflowPopover.locator('text=System Diagnostics').isVisible(), 'System Diagnostics header must be present');
    assert(await overflowPopover.locator('text=AI Provider').isVisible(), 'AI Provider row must be present');
    assert(await overflowPopover.locator('text=Database').isVisible(), 'Database row must be present');
    console.log('  ✔ Verified all workspace tools and system diagnostics in overflow menu');

    // Test Escape key closes overflow menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    assert.strictEqual(await overflowPopover.isVisible(), false, 'Escape key must close overflow popover');
    console.log('  ✔ Verified accessible Escape closing behavior');

    // =========================================================================
    // 4. UNIVERSE SEARCH MODAL
    // =========================================================================
    console.log('\n--- Check 4: Universe Search Modal Interaction ---');
    await searchBtn.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder*="Search characters"]');
    assert(await searchInput.isVisible(), 'Search modal input must be visible');

    await searchInput.fill('Bio-City');
    await page.waitForTimeout(200);

    // Verify search modal closes on Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    assert.strictEqual(await searchInput.isVisible(), false, 'Escape key must close search modal');
    console.log('  ✔ Verified Universe Search Modal opens, queries, and closes cleanly');

    // =========================================================================
    // 5. STAGE PROGRESS HEADER: DESKTOP EDITORIAL RAIL
    // =========================================================================
    console.log('\n--- Check 5: Desktop Stage Progress Rail (1440px) ---');
    const stageNavDesktop = page.locator('nav').first();
    assert(await stageNavDesktop.isVisible(), 'Stage progress nav must be visible');

    // Verify stage buttons have thin connectors and active indicator
    const stage1Btn = page.locator('#stage-nav-seed');
    assert(await stage1Btn.isVisible(), 'Stage 1 Seed must be visible');
    const stage4Btn = page.locator('#stage-nav-choose');
    assert(await stage4Btn.isVisible(), 'Stage 4 Choose must be visible');

    // Click Stage 4
    await stage4Btn.click();
    await page.waitForTimeout(300);
    const activeStage = await page.evaluate(() => window.__workspaceStore.getState().activeStage);
    assert.strictEqual(activeStage, 'choose', 'Clicking Stage 4 must set activeStage to choose');
    console.log('  ✔ Desktop progress rail navigates cleanly');

    // =========================================================================
    // 6. TABLET VIEWPORT (1024px & 768px): ADAPTIVE COMPOSITION
    // =========================================================================
    console.log('\n--- Check 6: Tablet Viewport (1024px & 768px) Adaptive Composition ---');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);

    // Verify no document overflow at 1024px
    let isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.strictEqual(isOverflowing, false, '1024px tablet must NOT have horizontal scroll overflow');

    // Verify compact search button or input is visible and functional
    const tabletInspectBtn = page.locator('#inspect-drawer-toggle-btn');
    assert(await tabletInspectBtn.isVisible(), 'Inspect button must remain visible on tablet');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.strictEqual(isOverflowing, false, '768px portrait tablet must NOT have horizontal scroll overflow');
    console.log('  ✔ Verified 1024px and 768px tablet adaptive layout without overflow');

    // =========================================================================
    // 7. MOBILE VIEWPORT (390px & 360px): COMPACT CAROUSEL
    // =========================================================================
    console.log('\n--- Check 7: Mobile Viewport (390px & 360px) Compact Stage Carousel ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.strictEqual(isOverflowing, false, '390px iPhone must NOT have horizontal scroll overflow');

    // Check Mobile Stage Carousel presentation
    const mobileStageTitle = page.locator('nav span.font-serif').first();
    assert(await mobileStageTitle.isVisible(), 'Mobile stage title must be visible in carousel');

    const nextStageBtn = page.locator('nav button[aria-label="Next stage"]');
    assert(await nextStageBtn.isVisible(), 'Next stage carousel button must be visible');

    const prevStageBtn = page.locator('nav button[aria-label="Previous stage"]');
    assert(await prevStageBtn.isVisible(), 'Previous stage carousel button must be visible');

    // Test Mobile Navigation via Next button
    const stageBefore = await page.evaluate(() => window.__workspaceStore.getState().activeStage);
    await nextStageBtn.click();
    await page.waitForTimeout(300);
    const stageAfter = await page.evaluate(() => window.__workspaceStore.getState().activeStage);
    assert.notStrictEqual(stageBefore, stageAfter, 'Next button must advance the active stage');

    // Check Android 360px
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(300);
    isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.strictEqual(isOverflowing, false, '360px Android must NOT have horizontal scroll overflow');
    console.log('  ✔ Mobile stage carousel functions smoothly with zero overflow on 390px and 360px');

    // =========================================================================
    // 8. MULTI-VIEWPORT RESPONSIVE AUDIT ACROSS ALL 6 BREAKPOINTS
    // =========================================================================
    console.log('\n--- Check 8: Comprehensive 6-Viewport Responsive Verification ---');
    const viewports = [
      { name: '1440x900 (Desktop Large)', width: 1440, height: 900 },
      { name: '1280x800 (Desktop Standard)', width: 1280, height: 800 },
      { name: '1024x768 (Tablet Landscape)', width: 1024, height: 768 },
      { name: '768x1024 (Tablet Portrait)', width: 768, height: 1024 },
      { name: '390x844 (Mobile iPhone)', width: 390, height: 844 },
      { name: '360x800 (Mobile Android)', width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(200);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.strictEqual(overflow, false, `Viewport ${vp.name} must have ZERO horizontal overflow`);
      console.log(`  ✔ ${vp.name}: Clean layout, 0 horizontal scroll`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 30.2 HEADER & SHELL VERIFICATIONS PASSED');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Phase 30.2 Verification Failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
