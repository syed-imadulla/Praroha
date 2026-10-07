const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase9E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 9: Seed Potential Map (POT-01..04)\n');
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
    // Scenario 1: Load Canonical Demo & Navigate to Stage 2 Understand
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Load Canonical Demo & Navigate to Stage 2 ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Seed instant canonical demo
    const instantDemoBtn = page.locator('button:has-text("Instant Full Universe (Demo)")').first();
    await instantDemoBtn.waitFor({ timeout: 10000 });
    await instantDemoBtn.click();

    // Wait for project hydration (Bio-City in Unfold)
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 25000 });
    console.log('✅ Canonical demo loaded');

    // Press '2' or click Stage 2 to navigate to Understand
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    // Verify Stage 2 Distilled Seed DNA is visible
    const dnaHeading = page.locator('h2:has-text("Distilled Seed DNA")').first();
    assert(await dnaHeading.isVisible(), 'Distilled Seed DNA should be visible in Stage 2');
    console.log('✅ Navigated to Stage 2 Understand');

    // -------------------------------------------------------------
    // Scenario 2: Switch to Seed Potential Map Sub-Tab
    // -------------------------------------------------------------
    console.log('--- Scenario 2: Switch to Seed Potential Map Sub-Tab ---');
    const potentialTabBtn = page.locator('[data-testid="tab-seed-potential"]');
    assert(await potentialTabBtn.isVisible(), 'Seed Potential Map sub-tab button should exist');
    await potentialTabBtn.click();
    await page.waitForTimeout(400);

    // Verify 3 lanes are rendered
    const explicitLane = page.locator('[data-testid="lane-explicit"]');
    const inferredLane = page.locator('[data-testid="lane-inferred"]');
    const openLane = page.locator('[data-testid="lane-open"]');

    assert(await explicitLane.isVisible(), 'Explicit Anchors lane should be visible');
    assert(await inferredLane.isVisible(), 'AI-Inferred Possibilities lane should be visible');
    assert(await openLane.isVisible(), 'Open Creative Questions lane should be visible');
    console.log('✅ 3-Lane Matrix (Explicit, Inferred, Open) successfully rendered');

    // Verify Anchor items
    const childAnchor = page.locator('text=Child Protagonist').first();
    assert(await childAnchor.isVisible(), 'Explicit Anchor "Child Protagonist" should be present');

    const screenshotOverview = `${screenshotDir}/phase9_potential_map_overview.png`;
    await page.screenshot({ path: screenshotOverview, fullPage: true });
    results.push({ scenario: 'POT-01/02: 3-Lane Matrix Rendering', status: 'PASS', screenshot: screenshotOverview });

    // -------------------------------------------------------------
    // Scenario 3: Interactive Decision Controls (Accept / Reject)
    // -------------------------------------------------------------
    console.log('--- Scenario 3: Human Decisions (Accept and Reject) ---');
    // Find accept button for first inferred item
    const acceptButtons = page.locator('button[aria-label^="Accept"]');
    const rejectButtons = page.locator('button[aria-label^="Reject"]');

    assert(await acceptButtons.count() > 0, 'Accept buttons should exist for inferred items');
    assert(await rejectButtons.count() > 0, 'Reject buttons should exist for inferred items');

    // Click Accept on first inferred item
    await acceptButtons.first().click();
    await page.waitForTimeout(400);
    const acceptedBadge = page.locator('text=Accepted by Creator').first();
    assert(await acceptedBadge.isVisible(), 'Item should display "Accepted by Creator" after clicking Accept');
    console.log('✅ Inferred item accepted successfully with glowing confirmation');

    // Click Reject on second inferred item
    await rejectButtons.nth(1).click();
    await page.waitForTimeout(400);
    const rejectedBadge = page.locator('text=Excluded from canon').first();
    assert(await rejectedBadge.isVisible(), 'Item should display "Excluded from canon" after clicking Reject');
    console.log('✅ Inferred item rejected successfully with dimmed styling');

    const screenshotDecisions = `${screenshotDir}/phase9_potential_decisions.png`;
    await page.screenshot({ path: screenshotDecisions, fullPage: true });
    results.push({ scenario: 'POT-03: Accept/Reject Controls', status: 'PASS', screenshot: screenshotDecisions });

    // -------------------------------------------------------------
    // Scenario 4: Category Filters & Advancement to Stage 3
    // -------------------------------------------------------------
    console.log('--- Scenario 4: Category Filters & Advancement to Stage 3 ---');
    // Click "AI-Inferred" filter
    const inferredFilterBtn = page.locator('button:has-text("AI-Inferred")').first();
    await inferredFilterBtn.click();
    await page.waitForTimeout(200);
    assert(await inferredLane.isVisible(), 'Inferred lane visible');
    assert(!(await explicitLane.isVisible()), 'Explicit lane hidden when filtering to Inferred');
    console.log('✅ Filter toggle working as expected');

    // Click "All Categories" filter
    const allFilterBtn = page.locator('button:has-text("All Categories")').first();
    await allFilterBtn.click();
    await page.waitForTimeout(200);

    // Click "Generate 3 Worlds with Seed Potential (Stage 3)"
    const proceedBtn = page.locator('button:has-text("Generate 3 Worlds with Seed Potential")').first();
    assert(await proceedBtn.isVisible(), 'Proceed to Worlds button should be visible');
    await proceedBtn.click();
    await page.waitForTimeout(500);

    // Verify stage transitioned to Stage 3 Worlds
    const worldsHeader = page.locator('text=Three Contrasting Creative Worlds').first();
    await worldsHeader.waitFor({ timeout: 5000 });
    assert(await worldsHeader.isVisible(), 'Should transition smoothly to Stage 3 Three Contrasting Creative Worlds');
    console.log('✅ Successfully advanced to Stage 3 World Candidates');

    const screenshotStage3 = `${screenshotDir}/phase9_advanced_to_worlds.png`;
    await page.screenshot({ path: screenshotStage3, fullPage: true });
    results.push({ scenario: 'POT-04: Stage 3 Transition', status: 'PASS', screenshot: screenshotStage3 });

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 9 PLAYWRIGHT VERIFICATION SCENARIOS PASSED');
    console.log('======================================================');
    results.forEach((r) => console.log(` [${r.status}] ${r.scenario} -> ${r.screenshot}`));

  } catch (err) {
    console.error('❌ E2E VERIFICATION FAILED:', err);
    await page.screenshot({ path: `${screenshotDir}/phase9_error.png`, fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase9E2E();
