const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

async function runPhase19E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 19: Counterfactual Replay\n');
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
    // Setup: Seed Demo Universe
    // -------------------------------------------------------------
    console.log('--- Initial Setup: Loading Demo Universe ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    const instantDemoBtn = page.locator('button:has-text("Instant Full Universe (Demo)")').first();
    await instantDemoBtn.waitFor({ timeout: 10000 });
    await instantDemoBtn.click();
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 25000 });
    console.log('✅ Demo universe loaded successfully');

    // -------------------------------------------------------------
    // Scenario 1: Launch Counterfactual Replay via Header & Tab (CNTR-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Launch Counterfactual Replay via Header & Tab (CNTR-01) ---');
    
    // Header launcher button
    const launcherBtn = page.locator('#launcher-counterfactual-replay-btn');
    await launcherBtn.waitFor({ timeout: 5000 });
    assert(await launcherBtn.isVisible(), 'Header launcher button must be visible');
    await launcherBtn.click();
    console.log('✅ Clicked header launcher button "What If I Chose Another World?"');

    // Tab active verification
    const replayTab = page.locator('#codex-tab-replay');
    await replayTab.waitFor({ timeout: 5000 });
    assert(await replayTab.isVisible(), 'Counterfactual Replay tab must be visible');

    // Canvas container verification
    const canvas = page.locator('[data-testid="counterfactual-replay-canvas"]');
    await canvas.waitFor({ timeout: 5000 });
    assert(await canvas.isVisible(), 'Counterfactual Replay canvas must be rendered');
    console.log('✅ Counterfactual Replay canvas is active and visible');

    results.push('Scenario 1: Launch Counterfactual Replay via Header & Tab PASSED');

    // -------------------------------------------------------------
    // Scenario 2: Candidate Selector Strip (CNTR-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Candidate Selector Strip (CNTR-01) ---');
    
    const candidateStrip = page.locator('[data-testid="counterfactual-candidate-strip"]');
    await candidateStrip.waitFor({ timeout: 10000 });
    assert(await candidateStrip.isVisible(), 'Candidate selector strip must be visible');

    // Check that candidates are rendered (should be 2 rejected candidates)
    const candidateButtons = candidateStrip.locator('button');
    const count = await candidateButtons.count();
    console.log(`Found ${count} rejected candidate world buttons in selector strip`);
    assert(count >= 1, 'At least 1 rejected candidate world must be available for comparison');

    // Inspect candidate card text
    const firstCandText = await candidateButtons.first().innerText();
    console.log(`First candidate card: ${firstCandText.replace(/\n/g, ' ').slice(0, 80)}...`);
    assert(firstCandText.includes('WORLD #') || firstCandText.includes('Archetype'), 'Candidate card must display metadata');

    // Click candidate and verify selection indicator
    if (count > 1) {
      await candidateButtons.nth(1).click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked second candidate card; comparison updated');
      await candidateButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Switched back to first candidate');
    }

    results.push('Scenario 2: Candidate Selector Strip PASSED');

    // -------------------------------------------------------------
    // Scenario 3: 50/50 Dual-Column Side-by-Side Comparative Matrix (CNTR-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: 50/50 Dual-Column Comparative Matrix (CNTR-02) ---');

    const matrix = page.locator('[data-testid="counterfactual-comparative-matrix"]');
    await matrix.waitFor({ timeout: 15000 });
    assert(await matrix.isVisible(), 'Comparative matrix must be visible');

    const matrixText = await matrix.innerText();
    assert(matrixText.toUpperCase().includes('CURRENT COMMITTED CANON'), 'Matrix must show Current Committed Canon on left');
    assert(matrixText.toUpperCase().includes('COUNTERFACTUAL ALTERNATIVE'), 'Matrix must show Counterfactual Alternative on right');
    assert(matrixText.toLowerCase().includes('bio-city') || matrixText.toLowerCase().includes('committed world'), 'Matrix must reference active world');
    console.log('✅ Side-by-side comparative matrix renders Current Canon and Alternative World');

    results.push('Scenario 3: 50/50 Dual-Column Comparative Matrix PASSED');

    // -------------------------------------------------------------
    // Scenario 4: Divergence Delta Cards & Profile Meters (CNTR-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Divergence Delta Cards & Profile Meters (CNTR-02) ---');

    const deltaCards = page.locator('[data-testid="counterfactual-delta-cards"]');
    await deltaCards.waitFor({ timeout: 10000 });
    assert(await deltaCards.isVisible(), 'Divergence delta cards must be visible');

    // Verify key dimensions
    const requiredDims = ['protagonist', 'tone_atmosphere', 'central_conflict', 'world_rules'];
    for (const dim of requiredDims) {
      const card = page.locator(`[data-testid="delta-card-${dim}"]`);
      await card.waitFor({ timeout: 5000 });
      assert(await card.isVisible(), `Delta card for '${dim}' must be visible`);
      const cardText = await card.innerText();
      assert(cardText.includes('CANON FOCUS'), `Card '${dim}' must display CANON FOCUS`);
      assert(cardText.includes('ALTERNATIVE SHIFT'), `Card '${dim}' must display ALTERNATIVE SHIFT`);
      console.log(`✅ Delta card '${dim}' displays structured divergence analysis`);
    }

    // Verify exploration profile deltas
    const profileDeltas = page.locator('[data-testid="exploration-profile-deltas"]');
    await profileDeltas.waitFor({ timeout: 5000 });
    assert(await profileDeltas.isVisible(), 'Exploration profile divergence meters must be visible');
    const profileText = await profileDeltas.innerText();
    assert(profileText.includes('Seed Fidelity'), 'Must display Seed Fidelity meter');
    assert(profileText.includes('Novelty'), 'Must display Novelty meter');
    assert(profileText.includes('Conceptual Distance'), 'Must display Conceptual Distance meter');
    console.log('✅ Exploration profile divergence meters verified');

    // Capture screenshot of comparative matrix and delta cards
    await page.screenshot({
      path: path.join(screenshotDir, 'phase19_counterfactual_matrix.png'),
    });
    console.log('📸 Captured screenshot: phase19_counterfactual_matrix.png');

    results.push('Scenario 4: Divergence Delta Cards & Profile Meters PASSED');

    // -------------------------------------------------------------
    // Scenario 5: Actionable Timeline Branching ("Fork Timeline from Alternative World")
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Actionable Timeline Branching ---');

    const branchInput = page.locator('[data-testid="counterfactual-branch-name-input"]');
    await branchInput.waitFor({ timeout: 5000 });
    await branchInput.fill('counterfactual/sunken-archive-timeline');

    const forkBtn = page.locator('#fork-counterfactual-branch-btn');
    await forkBtn.waitFor({ timeout: 5000 });
    assert(await forkBtn.isEnabled(), 'Fork button must be enabled');
    console.log('Clicking "Fork Timeline from This World"...');
    await forkBtn.click();

    // Wait for branch switch in store
    const targetBranch = 'sunken-archive-timeline';
    await page.waitForFunction(
      (target) => {
        const store = window.__workspaceStore?.getState();
        const activeBranch = store?.activeProject?.branch_name;
        return activeBranch && activeBranch.includes(target);
      },
      targetBranch,
      { timeout: 25000 }
    );

    const childBranchName = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.activeProject?.branch_name;
    });
    console.log(`✅ Successfully switched to counterfactual branch: "${childBranchName}"`);
    assert(childBranchName && childBranchName.includes(targetBranch), 'Must be on child branch');

    // Verify counterfactual metadata on child project
    const childMetadata = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.activeProject?.counterfactual_metadata_json;
    });
    assert(childMetadata, 'Child project must retain counterfactual_metadata_json');
    const parsedMetadata = JSON.parse(childMetadata);
    assert(parsedMetadata.parent_project_id, 'Metadata must record parent_project_id');
    assert(parsedMetadata.counterfactual_candidate_id, 'Metadata must record counterfactual_candidate_id');
    assert(parsedMetadata.counterfactual_title, 'Metadata must record counterfactual_title');
    console.log(`✅ Counterfactual metadata verified on child branch: exploring "${parsedMetadata.counterfactual_title}"`);

    // Capture screenshot of forked timeline
    await page.screenshot({
      path: path.join(screenshotDir, 'phase19_counterfactual_forked_timeline.png'),
    });
    console.log('📸 Captured screenshot: phase19_counterfactual_forked_timeline.png');

    // Verify parent immutability: switch back to main
    console.log('Verifying parent canon immutability by switching back to main...');
    const switchBackSuccess = await page.evaluate(async () => {
      const store = window.__workspaceStore?.getState();
      const branches = store?.projectBranches || [];
      const mainBranch = branches.find((b) => b.branch_name === 'main' || !b.parent_id);
      if (mainBranch) {
        return await store.switchBranch(mainBranch.id);
      }
      return false;
    });
    assert(switchBackSuccess, 'Must successfully switch back to main branch');
    await page.waitForTimeout(2000);

    const parentBranch = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.activeProject?.branch_name;
    });
    console.log(`Active branch after switching back: "${parentBranch}"`);
    assert(parentBranch === 'main' || !parentBranch, 'Parent branch must be active');

    // Verify parent project selection remains Bio-City
    const parentTitle = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      const selId = store?.activeProject?.selected_world_id;
      const w = store?.worlds?.find((cand) => cand.id === selId);
      return w?.title || '';
    });
    console.log(`Parent committed world title: "${parentTitle}"`);
    assert(parentTitle.toLowerCase().includes('bio-city'), 'Parent world selection must remain Bio-City');
    console.log('✅ Verified parent canon is 100% immutable and intact');

    results.push('Scenario 5: Actionable Timeline Branching PASSED');

  } catch (error) {
    console.error('❌ E2E Test Failure:', error);
    await page.screenshot({
      path: path.join(screenshotDir, 'phase19_failure_debug.png'),
    });
    throw error;
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('🏆 Phase 19 Playwright E2E Verification Complete!');
  console.log('Results:');
  results.forEach((r) => console.log('  ✅ ' + r));
  console.log('======================================================\n');
}

runPhase19E2E().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
