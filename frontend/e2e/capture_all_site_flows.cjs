const { chromium } = require('playwright');
const path = require('path');

const outDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';

async function captureAllFlows() {
  console.log('📸 Starting Complete Site Flows & Stages Capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // FLOW 1: Stage 1 Seed Input Canvas
    // -------------------------------------------------------------------------
    console.log('Capturing Stage 1: Seed Input Canvas...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(outDir, 'gallery_01_stage1_seed_input.png'),
    });

    // -------------------------------------------------------------------------
    // FLOW 2: Guided Tour Modal
    // -------------------------------------------------------------------------
    console.log('Capturing Guided Tour Overlay...');
    const tourBtn = page.locator('#guided-tour-btn').first();
    if (await tourBtn.isVisible()) {
      await tourBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(outDir, 'gallery_14_flow_guided_tour.png'),
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // -------------------------------------------------------------------------
    // FLOW 3: Keyboard Shortcuts Modal
    // -------------------------------------------------------------------------
    console.log('Capturing Keyboard Shortcuts Modal...');
    const shortcutsBtn = page.locator('#keyboard-shortcuts-btn').first();
    if (await shortcutsBtn.isVisible()) {
      await shortcutsBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(outDir, 'gallery_15_flow_keyboard_shortcuts.png'),
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // -------------------------------------------------------------------------
    // Select Preset & Advance to Stage 2 Seed DNA
    // -------------------------------------------------------------------------
    console.log('Extracting Seed DNA for Stage 2...');
    const oceanPreset = page.locator('button:has-text("Sunken Ocean City")').first();
    await oceanPreset.click();
    await page.waitForTimeout(300);

    const extractBtn = page.locator('button:has-text("Extract Seed DNA")').first();
    await extractBtn.click();
    await page.locator('button:has-text("Generate 3 Worlds (Stage 3)")').first().waitFor({ timeout: 15000 });

    await page.screenshot({
      path: path.join(outDir, 'gallery_02_stage2_seed_dna.png'),
    });

    // -------------------------------------------------------------------------
    // Stage 2.5: Seed Potential Map
    // -------------------------------------------------------------------------
    console.log('Checking Seed Potential Map tab...');
    const potentialTab = page.locator('[data-testid="tab-seed-potential"]').first();
    if (await potentialTab.isVisible()) {
      await potentialTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(outDir, 'gallery_03_stage2_seed_potential_map.png'),
      });

      // Switch back to DNA tab to proceed cleanly
      const dnaTab = page.locator('button:has-text("Seed DNA Blueprint")').first();
      if (await dnaTab.isVisible()) {
        await dnaTab.click();
        await page.waitForTimeout(400);
      }
    }

    // -------------------------------------------------------------------------
    // Stage 3: 3 Divergent Worlds Canvas
    // -------------------------------------------------------------------------
    console.log('Generating 3 Worlds for Stage 3...');
    const proceedToWorldsBtn = page.locator('button:has-text("Generate 3 Worlds (Stage 3)")').first();
    await proceedToWorldsBtn.click();
    await page.locator('button:has-text("Proceed to Selection (Stage 4)")').first().waitFor({ timeout: 25000 });

    await page.screenshot({
      path: path.join(outDir, 'gallery_04_stage3_divergent_worlds.png'),
    });

    // -------------------------------------------------------------------------
    // Stage 4: World Selection & Human-Only Zones
    // -------------------------------------------------------------------------
    console.log('Advancing to Stage 4 Choice Gate & Human-Only Zones...');
    const proceedToStage4Btn = page.locator('button:has-text("Proceed to Selection (Stage 4)")').first();
    await proceedToStage4Btn.click();
    await page.locator('h2:has-text("Human World Selection & Creative Commitment")').first().waitFor({ timeout: 10000 });

    // Select Bio-City candidate
    const selectButtons = page.locator('button:has-text("Select This Direction")');
    await selectButtons.nth(1).click();
    await page.waitForTimeout(500);

    // Suggest and Lock HOZ
    const suggestBtn = page.locator('#hoz-suggest-btn');
    if (await suggestBtn.isVisible()) {
      await suggestBtn.click();
      await page.waitForTimeout(300);
      const lockToggleBtn = page.locator('#hoz-lock-toggle-btn');
      await lockToggleBtn.click();
      await page.waitForTimeout(300);
    }

    // Scroll to see Human-Only Zones panel clearly
    const hozPanel = page.locator('#human-only-zones-panel');
    if (await hozPanel.isVisible()) {
      await hozPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: path.join(outDir, 'gallery_05_stage4_world_selection_hoz.png'),
    });

    // -------------------------------------------------------------------------
    // Stage 5: Unfolded Universe via Canonical Demo for Full Richness
    // -------------------------------------------------------------------------
    console.log('Loading Canonical Demo for full rich media and codex...');
    const demoBtn = page.locator('#instant-demo-topbar-btn').first();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/projects/canonical-demo') && res.status() === 201),
      demoBtn.click(),
    ]);
    await page.locator('text=The Sunken City: Bio-City').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);

    // Close inspector if open
    const closeInspector = page.locator('button[title*="Close Inspector"], button[aria-label*="Close Inspector"]').first();
    if (await closeInspector.isVisible()) await closeInspector.click();

    // Tab 1: World Bible
    console.log('Capturing Stage 5: World Bible Codex...');
    const bibleTab = page.locator('#codex-tab-bible').first();
    await bibleTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(outDir, 'gallery_06_stage5_codex_world_bible.png'),
    });

    // Tab 2: Characters
    console.log('Capturing Stage 5: Characters Codex...');
    const charsTab = page.locator('#codex-tab-characters').first();
    await charsTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(outDir, 'gallery_07_stage5_codex_characters.png'),
    });

    // Tab 3: Story Beats
    console.log('Capturing Stage 5: Story Beats Codex...');
    const scenesTab = page.locator('#codex-tab-scenes').first();
    await scenesTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(outDir, 'gallery_08_stage5_codex_story_beats.png'),
    });

    // "Why is this here?" Modal
    console.log('Capturing Why Is This Here Modal...');
    const sceneOriginBadge = page.locator('#codex-scenes-grid [data-testid*="origin-badge"]').last();
    if (await sceneOriginBadge.isVisible()) {
      await sceneOriginBadge.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(outDir, 'gallery_11_flow_why_is_this_here_modal.png'),
      });
      const closeWhyBtn = page.locator('[data-testid="close-why-modal-btn"]');
      if (await closeWhyBtn.isVisible()) await closeWhyBtn.click();
      await page.waitForTimeout(400);
    }

    // -------------------------------------------------------------------------
    // Stage 6: Causal Lineage DAG
    // -------------------------------------------------------------------------
    console.log('Capturing Stage 6: Causal Lineage DAG...');
    await page.keyboard.press('6');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(outDir, 'gallery_09_stage6_provenance_dag.png'),
    });

    // -------------------------------------------------------------------------
    // Stage 7: Refine & Branch Canvas
    // -------------------------------------------------------------------------
    console.log('Capturing Stage 7: Refine & Branch Canvas...');
    await page.keyboard.press('7');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(outDir, 'gallery_10_stage7_refine_branch.png'),
    });

    // -------------------------------------------------------------------------
    // Return to Stage 5 for Modals / Specialized Canvases
    // -------------------------------------------------------------------------
    await page.keyboard.press('5');
    await page.waitForTimeout(800);

    // FLOW: Counterfactual Replay Canvas
    console.log('Capturing Counterfactual Replay Canvas...');
    const replayLauncher = page.locator('#launcher-counterfactual-replay-btn').first();
    if (await replayLauncher.isVisible()) {
      await replayLauncher.click();
      await page.locator('[data-testid="counterfactual-replay-canvas"]').waitFor({ timeout: 5000 });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(outDir, 'gallery_13_flow_counterfactual_replay.png'),
      });
      const closeReplay = page.locator('button:has-text("Back to Universe Codex"), button:has-text("Close")').first();
      if (await closeReplay.isVisible()) await closeReplay.click();
      await page.waitForTimeout(400);
    }

    // FLOW: Seed Mutation Lab Canvas
    console.log('Capturing Seed Mutation Lab Canvas...');
    const mutationLauncher = page.locator('#launcher-simulate-what-if-btn').first();
    if (await mutationLauncher.isVisible()) {
      await mutationLauncher.click();
      await page.locator('[data-testid="seed-mutation-lab-canvas"], #codex-tab-mutation').first().waitFor({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outDir, 'gallery_12_flow_seed_mutation_lab.png'),
      });
    }

    // FLOW: Workspace Inspector Drawer
    console.log('Capturing Workspace Inspector Drawer...');
    await page.keyboard.press('i');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(outDir, 'gallery_16_flow_workspace_inspector.png'),
    });

    console.log('🎉 All site flows and stages captured successfully!');
  } catch (err) {
    console.error('❌ Capture error:', err);
  } finally {
    await browser.close();
  }
}

captureAllFlows();
