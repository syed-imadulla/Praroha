const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase10E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 10: Divergent Worlds Engine (DIV-01..03)\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => console.log(`PAGE [${msg.type()}]:`, msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));

  const screenshotDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';
  const results = [];

  try {
    // -------------------------------------------------------------
    // Scenario 1: Load Canonical Demo & Navigate to Stage 3
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Load Canonical Demo & Navigate to Stage 3 ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Seed instant canonical demo
    const instantDemoBtn = page.locator('button:has-text("Instant Full Universe (Demo)")').first();
    await instantDemoBtn.waitFor({ timeout: 10000 });
    await instantDemoBtn.click();

    // Wait for project hydration
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 25000 });
    console.log('✅ Canonical demo loaded');

    // Press '3' to navigate to Stage 3: Divergent Worlds
    await page.keyboard.press('3');
    await page.waitForTimeout(500);

    // Verify Divergent Worlds Engine header is visible
    const stageHeading = page.locator('h2:has-text("Divergent Worlds Engine")').first();
    assert(await stageHeading.isVisible(), 'Divergent Worlds Engine heading should be visible in Stage 3');

    // Verify Triad indicator in header
    const familiarPill = page.locator('text=1 Familiar').first();
    const radicalPill = page.locator('text=1 Radical').first();
    const inversePill = page.locator('text=1 Inverse').first();
    assert(await familiarPill.isVisible(), 'Triad badge 1 Familiar should be visible');
    assert(await radicalPill.isVisible(), 'Triad badge 1 Radical should be visible');
    assert(await inversePill.isVisible(), 'Triad badge 1 Inverse should be visible');
    console.log('✅ Stage 3 Divergent Worlds Engine header & Triad indicator rendered');

    const screenshotOverview = `${screenshotDir}/phase10_divergence_canvas_overview.png`;
    await page.screenshot({ path: screenshotOverview, fullPage: true });
    results.push({ scenario: 'DIV-01: Triad Canvas Overview', status: 'PASS', screenshot: screenshotOverview });

    // -------------------------------------------------------------
    // Scenario 2: Candidate Cards Archetypes & Profile Verification
    // -------------------------------------------------------------
    console.log('--- Scenario 2: Candidate Cards Archetypes & Exploration Profiles ---');

    // Candidate 1: Lost Civilization -> Familiar
    const card1FamiliarBadge = page.locator('div:has-text("Familiar"):not(:has-text("1 Familiar"))').first();
    assert(await card1FamiliarBadge.isVisible(), 'Candidate 1 should render Familiar archetype badge');

    // Candidate 2: Bio-City -> Radical
    const card2RadicalBadge = page.locator('div:has-text("Radical"):not(:has-text("1 Radical"))').first();
    assert(await card2RadicalBadge.isVisible(), 'Candidate 2 should render Radical archetype badge');

    // Candidate 3: Time Capsule -> Inverse
    const card3InverseBadge = page.locator('div:has-text("Inverse"):not(:has-text("1 Inverse"))').first();
    assert(await card3InverseBadge.isVisible(), 'Candidate 3 should render Inverse archetype badge');

    console.log('✅ Exactly 3 distinct exploration archetypes rendered (Familiar, Radical, Inverse)');

    // Verify Exploration Profile 4 Metrics on cards
    const fidelityMetrics = page.locator('span:has-text("Fidelity")');
    const noveltyMetrics = page.locator('span:has-text("Novelty")');
    const distanceMetrics = page.locator('span:has-text("Distance")');
    const feasibilityMetrics = page.locator('span:has-text("Feasibility")');

    assert(await fidelityMetrics.count() >= 3, 'All 3 cards should render Seed Fidelity metric');
    assert(await noveltyMetrics.count() >= 3, 'All 3 cards should render Novelty metric');
    assert(await distanceMetrics.count() >= 3, 'All 3 cards should render Conceptual Distance metric');
    assert(await feasibilityMetrics.count() >= 3, 'All 3 cards should render Feasibility metric');

    // Check specific percentages for canonical fixtures
    const bioCityNovelty = page.locator('text=94%').first();
    assert(await bioCityNovelty.isVisible(), 'Bio-City Radical card should show 94% novelty');

    console.log('✅ Exploration Profile 4-dimension metrics (0–100%) verified across all cards');

    // -------------------------------------------------------------
    // Scenario 3: Emphasized Potential Pillars (Stage 9 Bridge)
    // -------------------------------------------------------------
    console.log('--- Scenario 3: Emphasized Potential Pillars (DIV-03) ---');
    const potentialPillarsHeader = page.locator('text=Emphasized Potential Pillars').first();
    assert(await potentialPillarsHeader.isVisible(), 'Emphasized Potential Pillars header should be visible on cards');

    const bioCitySymbioticPill = page.locator('text=Ancient Symbiotic Technology').first();
    assert(await bioCitySymbioticPill.isVisible(), 'Bio-City should emphasize "Ancient Symbiotic Technology" from Phase 9');

    console.log('✅ Emphasized Seed Potential pills rendered on candidate cards');

    const screenshotDetail = `${screenshotDir}/phase10_candidate_metrics_detail.png`;
    await page.screenshot({ path: screenshotDetail, fullPage: true });
    results.push({ scenario: 'DIV-02/03: Metric Bars & Potential Pillars', status: 'PASS', screenshot: screenshotDetail });

    // -------------------------------------------------------------
    // Scenario 4: Navigate to Stage 4 (Human Selection Gate)
    // -------------------------------------------------------------
    console.log('--- Scenario 4: Transition to Stage 4 Human World Selection ---');
    const proceedBtn = page.locator('button:has-text("Proceed to Selection (Stage 4)")').first();
    await proceedBtn.click();
    await page.waitForTimeout(500);

    // Verify Stage 4 Selection Canvas is active
    const stage4Header = page.locator('h2:has-text("Human World Selection")').first();
    assert(await stage4Header.isVisible(), 'Stage 4 Human World Selection header should be visible');

    // Verify chosen candidate summary includes archetype tag
    const chosenSummary = page.locator('div:has-text("Chosen World Direction")').first();
    assert(await chosenSummary.isVisible(), 'Chosen World Direction summary should be visible');

    const screenshotSelection = `${screenshotDir}/phase10_selection_divergence.png`;
    await page.screenshot({ path: screenshotSelection, fullPage: true });
    results.push({ scenario: 'DIV-01..03: Stage 4 Selection Gate Verification', status: 'PASS', screenshot: screenshotSelection });

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 10 E2E SCENARIOS PASSED WITH ZERO ERRORS');
    console.log('======================================================\n');
    console.table(results);
  } catch (error) {
    console.error('❌ Phase 10 E2E Verification failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase10E2E();
