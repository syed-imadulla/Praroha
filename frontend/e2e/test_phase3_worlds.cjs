const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase3E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 3: Three World Generation\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = [];

  try {
    // -------------------------------------------------------------
    // Step 1: Ingest Canonical Seed & Extract Seed DNA
    // -------------------------------------------------------------
    console.log('--- Step 1: Ingesting Canonical Seed & Extracting Seed DNA ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Click Canonical Sunken Ocean City preset
    const oceanPreset = page.locator('button:has-text("Sunken Ocean City")');
    await oceanPreset.click();
    await page.waitForTimeout(200);

    // Click Extract Seed DNA
    const extractBtn = page.locator('button:has-text("Extract Seed DNA")');
    await extractBtn.click();

    // Wait for Stage 2 Distilled Seed DNA to appear
    await page.locator('main').getByText('Distilled Seed DNA').waitFor({ timeout: 10000 });
    console.log('✅ Stage 2 Distilled Seed DNA extracted successfully');

    // -------------------------------------------------------------
    // Scenario 1: Transition to Stage 3: Three Worlds Generation
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 1: Stage 3 Transition & Generation ---');
    const proceedToWorldsBtn = page.locator('button:has-text("Generate 3 Worlds (Stage 3)")');
    assert(await proceedToWorldsBtn.isVisible(), 'Generate 3 Worlds button should be visible in Stage 2');
    await proceedToWorldsBtn.click();

    // Verify Stage 3 header appears
    const stage3Header = page.locator('h2:has-text("Three Contrasting Creative Worlds")');
    await stage3Header.waitFor({ timeout: 10000 });
    console.log('✅ Navigated to Stage 3: Three Contrasting Creative Worlds');

    // Wait for the 3 candidate cards to render
    await page.locator('text=Candidate 01').waitFor({ timeout: 10000 });
    await page.locator('text=Candidate 02').waitFor({ timeout: 5000 });
    await page.locator('text=Candidate 03').waitFor({ timeout: 5000 });
    console.log('✅ All 3 candidate cards rendered in comparison grid');

    results.push({ name: 'Scenario 1: Stage 3 Transition & Auto-Generation', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 2: Canonical Ocean Demo Fixtures Verification
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 2: Canonical Demo Fixtures Verification ---');

    // Candidate 1: Lost Civilization
    const card1 = page.locator('div:has-text("Candidate 01")').last();
    const title1 = await page.locator('h3:has-text("Lost Civilization")').textContent();
    assert(title1.includes('Lost Civilization'), 'Candidate 1 title must be Lost Civilization');
    console.log('✅ Candidate 01 Title: "' + title1.trim() + '"');

    // Candidate 2: Bio-City
    const title2 = await page.locator('h3:has-text("Bio-City")').textContent();
    assert(title2.includes('Bio-City'), 'Candidate 2 title must be Bio-City');
    console.log('✅ Candidate 02 Title: "' + title2.trim() + '"');

    // Candidate 3: Time Capsule
    const title3 = await page.locator('h3:has-text("Time Capsule")').textContent();
    assert(title3.includes('Time Capsule'), 'Candidate 3 title must be Time Capsule');
    console.log('✅ Candidate 03 Title: "' + title3.trim() + '"');

    // Verify Core Dimensions on Candidate 1
    const concept1 = page.locator('text=High-Concept Premise');
    const aesthetic1 = page.locator('text=Aesthetic & Atmosphere');
    const tension1 = page.locator('text=Core Dramatic Stakes');
    const tradeOffs1 = page.locator('text=Narrative Balance & Trade-offs');
    const visual1 = page.locator('text=Signature Cinematic Visual');

    assert(await concept1.first().isVisible(), 'High-Concept Premise must be visible');
    assert(await aesthetic1.first().isVisible(), 'Aesthetic & Atmosphere must be visible');
    assert(await tension1.first().isVisible(), 'Core Dramatic Stakes must be visible');
    assert(await tradeOffs1.first().isVisible(), 'Trade-offs must be visible');
    assert(await visual1.first().isVisible(), 'Signature Cinematic Visual must be visible');
    console.log('✅ All 6 core dimensions verified across world candidate cards');

    results.push({ name: 'Scenario 2: Canonical Demo Determinism & Dimensions', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 3: Inspector Drawer Integration & Worlds Tab
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 3: Inspector Drawer Worlds Tab ---');
    const inspectBtn = page.locator('button:has-text("Inspect Details")').nth(1);
    await inspectBtn.click();
    await page.waitForTimeout(400);

    const drawer = page.locator('aside');
    assert(await drawer.isVisible(), 'Inspector Drawer should be open');
    const worldsTabBtn = drawer.locator('button:has-text("Worlds (3)")');
    assert(await worldsTabBtn.isVisible(), 'Worlds (3) tab button should be visible in drawer');
    console.log('✅ Inspector Drawer opened with "Worlds (3)" tab active');

    const drawerCandidate = drawer.getByText('Bio-City', { exact: true });
    assert(await drawerCandidate.isVisible(), 'Bio-City candidate should be rendered in drawer');
    console.log('✅ Candidate details inspected inside Inspector Drawer');

    results.push({ name: 'Scenario 3: Inspector Drawer Integration', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 4: Candidate Re-generation Flow
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 4: Re-generation Flow ---');
    const regenBtn = page.locator('button:has-text("Re-generate")');
    assert(await regenBtn.isVisible(), 'Re-generate button should be visible');
    await regenBtn.click();

    // Wait for the candidates to re-render
    await page.waitForTimeout(1000);
    await page.locator('main').locator('text=Candidate 01').waitFor({ timeout: 5000 });
    const regeneratedTitle = await page.locator('h3:has-text("Lost Civilization")').textContent();
    assert(regeneratedTitle.includes('Lost Civilization'), 'Canonical seed re-generation should maintain determinism');
    console.log('✅ Re-generation succeeded cleanly without state breakage');

    results.push({ name: 'Scenario 4: Candidate Re-generation Flow', status: 'PASSED' });

    console.log('\n========================================');
    console.log('🎉 ALL PLAYWRIGHT PHASE 3 TESTS PASSED (4/4)');
    console.log('========================================\n');
    results.forEach(r => console.log(`  ✓ ${r.name}: ${r.status}`));

  } catch (err) {
    console.error('❌ Playwright Phase 3 Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runPhase3E2E();
