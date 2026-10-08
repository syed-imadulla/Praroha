const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('🧹 Starting Phase 30.1: Wave 1 P0 Canvas Cleanup & Clutter Reduction Verification...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Load Canonical Demo universe to unlock all stages
    await page.evaluate(async () => {
      if (window.__workspaceStore) {
        await window.__workspaceStore.getState().loadCanonicalDemoUniverse();
      }
    });
    await page.waitForTimeout(1000);
    await page.locator('text=The Sunken City: Bio-City').first().waitFor({ timeout: 15000 });

    // =========================================================================
    // 1. VERIFY ARCHITECTURE CARDS ARE ABSENT ACROSS ALL STAGES
    // =========================================================================
    console.log('--- Check 1: Verifying Architecture Cards Absence Across All Canvases ---');
    const stages = ['seed', 'understand', 'worlds', 'choose', 'unfold', 'trace', 'refine'];

    for (const stg of stages) {
      await page.evaluate((s) => window.__workspaceStore.getState().setActiveStage(s), stg);
      await page.waitForTimeout(300);

      // Check text that used to be in the 3 cards
      const aiProviderHeading = page.locator('text=AI Provider Engine');
      const persistenceHeading = page.locator('text=Persistence Layer');
      const storageHeading = page.locator('text=Cloud Object Storage');

      assert.strictEqual(
        await aiProviderHeading.count(),
        0,
        `Stage ${stg}: "AI Provider Engine" card must NOT be present on creative canvas`
      );
      assert.strictEqual(
        await persistenceHeading.count(),
        0,
        `Stage ${stg}: "Persistence Layer" card must NOT be present on creative canvas`
      );
      assert.strictEqual(
        await storageHeading.count(),
        0,
        `Stage ${stg}: "Cloud Object Storage" card must NOT be present on creative canvas`
      );
      console.log(`  ✔ Stage "${stg}": Architecture cards strictly absent`);
    }

    // =========================================================================
    // 2. VERIFY STAGE 3 PREMATURE MEDIA GENERATION IS ABSENT
    // =========================================================================
    console.log('\n--- Check 2: Verifying Stage 3 Premature Media Controls Absence ---');
    await page.evaluate(() => window.__workspaceStore.getState().setActiveStage('worlds'));
    await page.waitForTimeout(500);

    // Candidate cards comparison should NOT have media generation controls
    const generateMediaBtns = page.locator('#stage-worlds-canvas button:has-text("Generate Visual"), #stage-worlds-canvas button:has-text("Generate Image")');
    assert.strictEqual(
      await generateMediaBtns.count(),
      0,
      'Stage 3 Candidate Cards must NOT render media generation buttons'
    );

    const aspectSelects = page.locator('#stage-worlds-canvas select, #stage-worlds-canvas [data-testid*="aspect-ratio"]');
    assert.strictEqual(
      await aspectSelects.count(),
      0,
      'Stage 3 Candidate Cards must NOT render aspect ratio selects'
    );
    console.log('  ✔ Stage 3: Premature media generation controls strictly absent from candidate cards');

    // =========================================================================
    // 3. VERIFY ONLY ONE DOMINANT PROGRESSION CTA IN STAGE 3
    // =========================================================================
    console.log('\n--- Check 3: Verifying Exactly One Dominant Progression CTA in Stage 3 ---');
    const proceedBtn = page.locator('button:has-text("Proceed to Selection (Stage 4)")');
    assert.strictEqual(await proceedBtn.count(), 1, 'Header Proceed to Selection CTA must exist');
    assert(await proceedBtn.isVisible(), 'Header Proceed to Selection CTA must be visible');

    const duplicateBottomBtn = page.locator('button:has-text("Continue to Stage 4")');
    assert.strictEqual(
      await duplicateBottomBtn.count(),
      0,
      'Duplicate "Continue to Stage 4" button in bottom guidance banner must be removed'
    );
    console.log('  ✔ Stage 3: Exactly one dominant progression CTA present in header; duplicate bottom CTA removed');

    // =========================================================================
    // 4. VERIFY STAGE 5 UNFOLD CODEX HAS NO DUPLICATE BRANCHING CONTROLS
    // =========================================================================
    console.log('\n--- Check 4: Verifying Stage 5 Clean Codex Scope (No Duplicate Branching) ---');
    await page.evaluate(() => window.__workspaceStore.getState().setActiveStage('unfold'));
    await page.waitForTimeout(500);

    // Verify removed header launchers
    const whatIfLauncher = page.locator('#launcher-simulate-what-if-btn');
    assert.strictEqual(await whatIfLauncher.count(), 0, 'Stage 5 header must NOT have "Simulate What If?" launcher');

    const replayLauncher = page.locator('#launcher-counterfactual-replay-btn');
    assert.strictEqual(await replayLauncher.count(), 0, 'Stage 5 header must NOT have "What If I Chose Another World?" launcher');

    // Verify removed tabs
    const mutationTab = page.locator('#codex-tab-mutation');
    assert.strictEqual(await mutationTab.count(), 0, 'Stage 5 Codex must NOT have "Seed Mutation Lab" tab');

    const replayTab = page.locator('#codex-tab-replay');
    assert.strictEqual(await replayTab.count(), 0, 'Stage 5 Codex must NOT have "Counterfactual Replay" tab');

    // Verify canon tabs remain
    const bibleTab = page.locator('#codex-tab-bible');
    const charsTab = page.locator('#codex-tab-characters');
    const scenesTab = page.locator('#codex-tab-scenes');
    assert(await bibleTab.isVisible(), 'Stage 5 World Bible tab must be visible');
    assert(await charsTab.isVisible(), 'Stage 5 Characters tab must be visible');
    assert(await scenesTab.isVisible(), 'Stage 5 Scenes tab must be visible');
    console.log('  ✔ Stage 5: Duplicate mutation/replay launchers and tabs removed; 3 core canon tabs intact');

    // =========================================================================
    // 5. VERIFY STAGE 7 HOUSES REFINEMENT, MUTATION & REPLAY
    // =========================================================================
    console.log('\n--- Check 5: Verifying Stage 7 Refine Houses Mutation Lab & Replay ---');
    await page.evaluate(() => window.__workspaceStore.getState().setActiveStage('refine'));
    await page.waitForTimeout(500);

    const refineTimelineTab = page.locator('#refine-tab-timeline');
    const refineMutationTab = page.locator('#refine-tab-mutation');
    const refineReplayTab = page.locator('#refine-tab-replay');
    assert(await refineTimelineTab.isVisible(), 'Stage 7 Timeline tab must be visible');
    assert(await refineMutationTab.isVisible(), 'Stage 7 Mutation tab must be visible');
    assert(await refineReplayTab.isVisible(), 'Stage 7 Replay tab must be visible');

    // Click mutation tab and ensure mutation lab renders
    await refineMutationTab.click();
    await page.locator('[data-testid="seed-mutation-lab-canvas"], [data-testid*="premise-var-btn"]').first().waitFor({ timeout: 5000 });
    console.log('  ✔ Stage 7: Seed Mutation Lab renders and is operational');

    // Click replay tab and ensure counterfactual replay renders
    await refineReplayTab.click();
    await page.locator('[data-testid="counterfactual-replay-canvas"]').waitFor({ timeout: 5000 });
    console.log('  ✔ Stage 7: Counterfactual Replay renders and is operational');

    // Return to timeline
    await refineTimelineTab.click();
    await page.waitForTimeout(300);

    // =========================================================================
    // 6. MULTI-VIEWPORT RESPONSIVE AUDIT: ZERO HORIZONTAL OVERFLOW
    // =========================================================================
    console.log('\n--- Check 6: Responsive Multi-Viewport Audit (Zero Horizontal Overflow) ---');
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
      await page.waitForTimeout(300);

      // Check overflow on Home (Stage 1), Stage 3, and Stage 5
      for (const stg of ['seed', 'worlds', 'unfold']) {
        await page.evaluate((s) => window.__workspaceStore.getState().setActiveStage(s), stg);
        await page.waitForTimeout(200);

        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        assert.strictEqual(
          isOverflowing,
          false,
          `Viewport ${vp.name} in Stage ${stg} must NOT have horizontal scroll overflow`
        );
      }
      console.log(`  ✔ Viewport ${vp.name}: Zero horizontal overflow across stages`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 30.1 P0 CLUTTER REMOVAL CHECKS PASSED 100%');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Phase 30.1 Verification Failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
