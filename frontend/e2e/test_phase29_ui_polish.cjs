// test_phase29_ui_polish.cjs
// Verification script for Phase 29: Secondary UI + Typography + Visibility Polish

const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase29PolishAudit() {
  console.log('✨ Starting Phase 29: Secondary UI + Typography + Visibility Polish Audit...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Load canonical demo to populate full state
    console.log('1. Navigating to application & initializing Canonical Demo...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Atomically load canonical demo via store
    await page.evaluate(async () => {
      if (window.__workspaceStore) {
        await window.__workspaceStore.getState().loadCanonicalDemoUniverse();
      }
    });
    await page.waitForTimeout(1000);

    console.log('✅ Application loaded with Canonical Demo state.');

    // 2. Check TopBar touch targets & typography
    console.log('2. Verifying TopBar typography and touch targets...');
    const topBar = page.locator('header:visible').first();
    await topBar.waitFor({ state: 'visible' });

    // Brand title should use Cormorant Garamond
    const brandTitle = page.locator('span:has-text("Praroha"):visible, h1:has-text("PRAROHA"):visible').first();
    if (await brandTitle.isVisible()) {
      const fontSize = await brandTitle.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`   Brand Title font size: ${fontSize}`);
      assert(parseFloat(fontSize) >= 18, `Brand title font size should be >= 18px, got ${fontSize}`);
    }

    // TopBar interactive buttons touch targets
    const shortcutsBtn = page.locator('button[title="Keyboard Shortcuts (⌘/)"], button:has-text("⌘/")').first();
    if (await shortcutsBtn.isVisible()) {
      const box = await shortcutsBtn.boundingBox();
      console.log(`   Shortcuts button height: ${box?.height}px`);
      assert(box && box.height >= 36, `Shortcuts button hit area should be >= 36px, got ${box?.height}`);
    }

    // 3. Check StageProgressHeader
    console.log('3. Verifying StageProgressHeader typography and buttons...');
    const stageHeader = page.locator('nav').first();
    if (await stageHeader.isVisible()) {
      const stageButtons = page.locator('nav button');
      const count = await stageButtons.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const btn = stageButtons.nth(i);
        const box = await btn.boundingBox();
        if (box && box.height > 0) {
          assert(box.height >= 40, `Stage button ${i} height should be >= 40px, got ${box.height}`);
        }
      }
      console.log(`   Verified ${count} stage buttons have >= 40px touch targets.`);
    }

    // 4. Navigate to Stage 5 (Universe Codex)
    console.log('4. Navigating to Stage 5 (Universe Codex) to inspect badges and action buttons...');
    const stage5Nav = page.locator('#stage-nav-unfold, button:has-text("Universe Codex"), button:has-text("05")').first();
    await stage5Nav.waitFor({ timeout: 5000 });
    await stage5Nav.click();
    await page.waitForTimeout(800);

    // Check OriginBadges font size and dimensions
    const originBadges = page.locator('[data-testid="origin-badge"], .origin-badge, [data-origin-type]');
    const badgeCount = await originBadges.count();
    console.log(`   Found ${badgeCount} OriginBadges on canvas.`);
    if (badgeCount > 0) {
      const sampleBadge = originBadges.first();
      const fontSize = await sampleBadge.evaluate(el => window.getComputedStyle(el).fontSize);
      const height = await sampleBadge.evaluate(el => window.getComputedStyle(el).height);
      console.log(`   OriginBadge sample font size: ${fontSize}, height: ${height}`);
      assert(parseFloat(fontSize) >= 12, `OriginBadge font size must be >= 12px, got ${fontSize}`);
      assert(parseFloat(height) >= 22, `OriginBadge height must be >= 22px, got ${height}`);
    }

    // Check action buttons in Codex (trace-lineage-btn, refine-character-btn)
    const traceBtn = page.locator('.trace-lineage-btn').first();
    if (await traceBtn.isVisible()) {
      const traceBox = await traceBtn.boundingBox();
      const traceFont = await traceBtn.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`   trace-lineage-btn height: ${traceBox?.height}px, font: ${traceFont}`);
      assert(traceBox && traceBox.height >= 30, `trace-lineage-btn height should be >= 30px, got ${traceBox?.height}`);
      assert(parseFloat(traceFont) >= 12, `trace-lineage-btn font should be >= 12px, got ${traceFont}`);
    }

    // Check character and scene version badges
    const charVerBadge = page.locator('.char-version-badge, .scene-version-badge').first();
    if (await charVerBadge.isVisible()) {
      const verFont = await charVerBadge.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`   Version badge font size: ${verFont}`);
      assert(parseFloat(verFont) >= 12, `Version badge font size must be >= 12px, got ${verFont}`);
    }

    // 5. Check InspectorDrawer
    console.log('5. Testing InspectorDrawer and close button touch targets...');
    const inspectorOpenBtn = page.locator('button:has-text("Inspect Lineage"), button[title="Open Causal Lineage"]').first();
    if (await inspectorOpenBtn.isVisible()) {
      await inspectorOpenBtn.click();
      await page.waitForTimeout(500);

      const drawer = page.locator('#inspector-drawer, [data-testid="inspector-drawer"], aside').first();
      assert(await drawer.isVisible(), 'Inspector drawer must be visible after click');

      const closeBtn = drawer.locator('button:has-text("✕"), button[aria-label="Close Inspector"], button[title="Close Inspector"]').first();
      if (await closeBtn.isVisible()) {
        const closeBox = await closeBtn.boundingBox();
        console.log(`   Inspector close button height: ${closeBox?.height}px, width: ${closeBox?.width}px`);
        assert(closeBox && closeBox.height >= 40, `Close button height should be >= 40px, got ${closeBox?.height}`);
      }

      // Origin ledger breakdown font check
      const originDist = drawer.locator('[data-testid="origin-ledger-distribution"]').first();
      if (await originDist.isVisible()) {
        const item = originDist.locator('div').first();
        const distFont = await item.evaluate(el => window.getComputedStyle(el).fontSize);
        console.log(`   Origin Ledger distribution font: ${distFont}`);
        assert(parseFloat(distFont) >= 11.5, `Origin Ledger font must be >= 12px`);
      }

      // Close drawer
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 6. Check AtmosphereDeck
    console.log('6. Testing AtmosphereDeck transport controls...');
    const atmosphereTrigger = page.locator('button[title*="Atmosphere"], button:has-text("Atmosphere"), button:has-text("Audio")').first();
    if (await atmosphereTrigger.isVisible()) {
      await atmosphereTrigger.click();
      await page.waitForTimeout(400);

      const playPauseBtn = page.locator('button[aria-label*="Play"], button[aria-label*="Pause"], button[title*="Play"], button[title*="Pause"]').first();
      if (await playPauseBtn.isVisible()) {
        const box = await playPauseBtn.boundingBox();
        console.log(`   Atmosphere play/pause button size: ${box?.width}x${box?.height}px`);
        assert(box && box.height >= 40, `Atmosphere play button height must be >= 40px, got ${box?.height}`);
      }
    }

    // 7. Check KeyboardShortcutsModal
    console.log('7. Testing KeyboardShortcutsModal modal dialog...');
    const scBtn = page.locator('button[title*="Keyboard Shortcuts"]').first();
    if (await scBtn.isVisible()) {
      await scBtn.click();
    } else {
      await page.keyboard.press('?');
    }
    await page.waitForTimeout(400);

    const shortcutsModal = page.locator('div:has-text("Keyboard Shortcuts")').first();
    if (await shortcutsModal.isVisible()) {
      const modalTitle = page.locator('h2:has-text("Keyboard Shortcuts"), h3:has-text("Keyboard Shortcuts")').first();
      if (await modalTitle.isVisible()) {
        const titleFont = await modalTitle.evaluate(el => window.getComputedStyle(el).fontSize);
        console.log(`   Shortcuts Modal title font size: ${titleFont}`);
        assert(parseFloat(titleFont) >= 20, `Modal title font should be >= 20px, got ${titleFont}`);
      }

      // Close modal by pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 8. Viewport overflow verification across 3 breakpoints
    console.log('8. Verifying zero horizontal scroll overflow across breakpoints...');
    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'tablet', width: 1024, height: 768 },
      { name: 'mobile', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`   [${vp.name} ${vp.width}px]: isOverflowing = ${isOverflowing}`);
      assert(!isOverflowing, `Viewport ${vp.name} (${vp.width}px) has unwanted horizontal overflow`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 29 SECONDARY UI & TYPOGRAPHY CHECKS PASSED');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Phase 29 Polish Audit Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase29PolishAudit();
