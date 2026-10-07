const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase12E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 12: Origin Ledger (ORIG-01, ORIG-02, ORIG-03)\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR [${msg.type()}]:`, msg.text());
    }
  });
  page.on('pageerror', (err) => console.log('PAGE UNHANDLED ERROR:', err));

  const results = [];
  const screenshotDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';

  try {
    // -------------------------------------------------------------
    // Scenario 1: Instant Canonical Demo Seeding with Diverse Origins
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Instant Canonical Demo Seeding with Diverse Origins ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    const instantDemoBtn = page.locator('button:has-text("Instant Full Universe (Demo)")').first();
    await instantDemoBtn.waitFor({ timeout: 10000 });
    assert(await instantDemoBtn.isVisible(), 'Instant Full Universe button must be visible');

    const startTime = Date.now();
    await instantDemoBtn.click();

    // Verify rapid transition directly to Stage 5 Universe Codex
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 20000 });
    const loadDuration = Date.now() - startTime;
    console.log(`✅ Instant Demo Universe seeded and rendered in ${loadDuration}ms`);

    const screenshot1 = `${screenshotDir}/phase12_instant_demo_seeded.png`;
    await page.screenshot({ path: screenshot1, fullPage: true });
    results.push({ scenario: 'Scenario 1: Demo Seeding with Diverse Origins', status: 'PASS', screenshot: screenshot1 });

    // -------------------------------------------------------------
    // Scenario 2: Universe Codex Origin Badges & Origin Filtering Toolbar
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Universe Codex Origin Badges & Filtering Toolbar (ORIG-01, ORIG-02) ---');

    // Verify Origin Filter Toolbar is present
    const filterToolbar = page.locator('[data-testid="origin-filter-toolbar"]');
    assert(await filterToolbar.isVisible(), 'Origin filter toolbar must be visible in Universe Codex');

    // Tab 1: World Bible & Locations
    const bibleTab = page.locator('#codex-tab-bible');
    await bibleTab.click();
    await page.waitForTimeout(300);

    // Verify Origin badges on locations
    const locationOriginBadges = page.locator('[data-testid*="origin-badge"]');
    const badgeCountTab1 = await locationOriginBadges.count();
    console.log(`✅ Tab 1 World Bible rendered ${badgeCountTab1} OriginBadges (Locations & Canon facts)`);
    assert(badgeCountTab1 >= 2, 'Tab 1 must contain origin badges for locations and canon laws');

    // Tab 2: Characters
    const charTab = page.locator('#codex-tab-characters');
    await charTab.click();
    await page.waitForTimeout(300);

    const altheaBadge = page.locator('text=Dr. Althea Thorne').locator('..').locator('..').locator('[data-testid*="origin-badge"]');
    assert(await altheaBadge.count() > 0, 'Dr. Althea Thorne card must have an OriginBadge');
    const altheaBadgeText = await altheaBadge.first().innerText();
    console.log(`✅ Dr. Althea Thorne origin badge rendered: "${altheaBadgeText}"`);
    assert(altheaBadgeText.includes('Human Choice') || altheaBadgeText.includes('Human Decision'), 'Althea must reflect Human Decision origin');

    // Test Origin Filter Toolbar on Characters
    console.log('Testing interactive Origin Filtering on Characters...');
    const filterHumanDecision = page.locator('[data-testid="origin-filter-human_decision"]');
    await filterHumanDecision.click();
    await page.waitForTimeout(300);

    // Verify only matching character is visible
    const filteredCharCards = page.locator('#codex-characters-grid > div');
    const filteredCount = await filteredCharCards.count();
    console.log(`✅ Filtered characters by HUMAN_DECISION: ${filteredCount} visible`);
    assert(filteredCount === 1, 'Only Dr. Althea Thorne should be visible under HUMAN_DECISION');

    // Reset filter to ALL
    const filterAllBtn = page.locator('[data-testid="origin-filter-all"]');
    await filterAllBtn.click();
    await page.waitForTimeout(300);
    const resetCount = await page.locator('#codex-characters-grid > div').count();
    assert(resetCount === 3, 'All 3 characters should be visible again after reset');

    // Tab 3: Story Beats / Scenes
    const sceneTab = page.locator('#codex-tab-scenes');
    await sceneTab.click();
    await page.waitForTimeout(300);

    const sceneBadges = page.locator('#codex-scenes-grid [data-testid*="origin-badge"]');
    assert(await sceneBadges.count() >= 3, 'All scenes must have OriginBadges');
    console.log(`✅ Tab 3 Story Beats rendered ${await sceneBadges.count()} OriginBadges`);

    const screenshot2 = `${screenshotDir}/phase12_codex_origin_badges.png`;
    await page.screenshot({ path: screenshot2, fullPage: true });
    results.push({ scenario: 'Scenario 2: Codex Badges & Filtering Toolbar', status: 'PASS', screenshot: screenshot2 });

    // -------------------------------------------------------------
    // Scenario 3: "Why is this here?" Deterministic Explainer Modal (ORIG-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: "Why is this here?" Deterministic Explainer Modal (ORIG-03) ---');
    // Click on the OriginBadge of Scene 1
    const firstSceneOriginBadge = sceneBadges.first();
    await firstSceneOriginBadge.click();
    await page.waitForTimeout(400);

    const whyModal = page.locator('[data-testid="why-is-this-here-modal"]');
    await whyModal.waitFor({ timeout: 5000 });
    assert(await whyModal.isVisible(), 'Why is this here modal must appear on OriginBadge click');

    // Check modal content: title, origin tier badge, citation source, causal narrative
    const modalTitle = await page.locator('[data-testid="why-modal-title"]').innerText();
    const modalBadge = await page.locator('[data-testid="why-modal-origin-badge"]').innerText();
    const modalCitation = await page.locator('[data-testid="why-modal-citation"]').innerText();
    const modalExplanation = await page.locator('[data-testid="why-modal-explanation"]').innerText();
    console.log(`✅ Modal Title: "${modalTitle}"`);
    console.log(`✅ Modal Origin Badge: "${modalBadge}"`);
    console.log(`✅ Modal Citation: "${modalCitation}"`);
    console.log(`✅ Modal Narrative: "${modalExplanation.slice(0, 80)}..."`);

    assert(modalTitle.length > 0, 'Modal title must be populated');
    assert(modalExplanation.length > 20, 'Modal must contain substantive causal narrative');
    assert(!modalExplanation.includes('undefined'), 'Modal explanation must not contain undefined');

    const screenshot3 = `${screenshotDir}/phase12_why_is_this_here_modal.png`;
    await page.screenshot({ path: screenshot3 });
    results.push({ scenario: 'Scenario 3: Deterministic Explainer Modal', status: 'PASS', screenshot: screenshot3 });

    // Click "Inspect in Causal DAG" button inside modal
    const jumpToDagBtn = page.locator('[data-testid="why-modal-jump-dag"]');
    assert(await jumpToDagBtn.isVisible(), 'Jump to Causal DAG button must be visible');
    await jumpToDagBtn.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // Scenario 4: Causal Lineage DAG Integration (ORIG-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Causal Lineage DAG Integration (ORIG-02) ---');
    // Verify we navigated to Stage 6 (Trace DAG)
    await page.locator('h1:has-text("Causal Lineage & Provenance DAG")').waitFor({ timeout: 5000 });
    console.log('✅ Navigated to Causal Lineage DAG from modal jump button');

    // Verify DAG Origin Tier Filter Toolbar
    const dagOriginFilterToolbar = page.locator('[data-testid="dag-origin-filter-toolbar"]');
    assert(await dagOriginFilterToolbar.isVisible(), 'DAG Origin filter toolbar must be present');

    // Verify NodeCards render OriginBadges and colored border accents
    const dagNodeCards = page.locator('[data-node-id]');
    const nodeCount = await dagNodeCards.count();
    console.log(`✅ DAG rendered ${nodeCount} trace nodes`);
    assert(nodeCount >= 6, 'DAG must render all pipeline nodes');

    // Check that at least one NodeCard has an Origin accent border class
    const nodeCardClasses = await dagNodeCards.first().getAttribute('class');
    assert(nodeCardClasses.includes('border-l-4'), 'NodeCards must have origin accent border-l-4');
    console.log('✅ NodeCards have distinct origin-tier accent borders');

    // Test DAG Origin Tier filtering
    console.log('Testing DAG Origin Tier filtering (SEED_EXPLICIT)...');
    const dagFilterSeedExplicit = page.locator('[data-testid="dag-origin-filter-seed_explicit"]');
    await dagFilterSeedExplicit.click();
    await page.waitForTimeout(300);

    const filteredDagNodeCount = await page.locator('[data-node-id]').count();
    console.log(`✅ Filtered DAG nodes by SEED_EXPLICIT: ${filteredDagNodeCount} visible`);
    assert(filteredDagNodeCount < nodeCount, 'Filtering should reduce visible nodes in DAG');

    // Reset DAG filter
    await page.locator('[data-testid="dag-origin-filter-all"]').click();
    await page.waitForTimeout(300);

    // Select a node to verify Causal Inspector Card has Origin Tier
    const targetNode = page.locator('[data-node-id="node-char-char-1"]').first();
    if (await targetNode.isVisible()) {
      await targetNode.click();
    } else {
      await page.locator('[data-node-id]').nth(2).click();
    }
    await page.waitForTimeout(300);

    const inspectorOriginBox = page.locator('[data-testid="inspector-origin-box"]');
    assert(await inspectorOriginBox.isVisible(), 'Causal Inspector card must display Origin Tier box');
    const inspectorOriginText = await inspectorOriginBox.innerText();
    console.log(`✅ Causal Inspector Card origin tier: "${inspectorOriginText.replace(/\n/g, ' ')}"`);

    const screenshot4 = `${screenshotDir}/phase12_dag_origin_integration.png`;
    await page.screenshot({ path: screenshot4, fullPage: true });
    results.push({ scenario: 'Scenario 4: Causal Lineage DAG Integration', status: 'PASS', screenshot: screenshot4 });

    // -------------------------------------------------------------
    // Scenario 5: Inspector Drawer Origin Ledger Distribution (ORIG-01, ORIG-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Inspector Drawer Origin Ledger Distribution ---');
    // Open Inspector Drawer
    const inspectLineageBtn = page.locator('button:has-text("Inspect Lineage")').first();
    if (await inspectLineageBtn.isVisible()) {
      await inspectLineageBtn.click();
    } else {
      // Toggle inspector via header or shortcut
      await page.keyboard.press('i');
    }
    await page.waitForTimeout(400);

    // Switch to provenance tab in Inspector Drawer if not active
    const lineageDrawerTab = page.locator('aside button:has-text("Lineage")');
    if (await lineageDrawerTab.isVisible()) {
      await lineageDrawerTab.click();
      await page.waitForTimeout(300);
    }

    // Verify Origin Ledger Breakdown card
    const distributionCard = page.locator('[data-testid="origin-ledger-distribution"]');
    assert(await distributionCard.isVisible(), 'Inspector Drawer must render Origin Ledger Distribution');
    const distributionText = await distributionCard.innerText();
    console.log(`✅ Inspector Drawer Origin Breakdown:\n${distributionText}`);
    assert(distributionText.toUpperCase().includes('ORIGIN LEDGER BREAKDOWN'), 'Breakdown title must appear');

    const screenshot5 = `${screenshotDir}/phase12_inspector_origin_breakdown.png`;
    await page.screenshot({ path: screenshot5 });
    results.push({ scenario: 'Scenario 5: Inspector Drawer Distribution', status: 'PASS', screenshot: screenshot5 });

    console.log('\n=============================================================');
    console.log('🎉 ALL 5 PHASE 12 E2E VERIFICATION SCENARIOS PASSED!');
    console.log('=============================================================');
    results.forEach((r) => console.log(`✓ [${r.status}] ${r.scenario} -> ${r.screenshot}`));

  } catch (err) {
    console.error('❌ Phase 12 E2E Verification failed:', err);
    await page.screenshot({ path: `${screenshotDir}/phase12_error.png`, fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase12E2E();
