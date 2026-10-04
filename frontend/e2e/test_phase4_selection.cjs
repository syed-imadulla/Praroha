const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase4E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 4: Human World Selection\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = [];

  try {
    // -------------------------------------------------------------
    // Setup: Ingest Canonical Seed, Extract DNA & Generate Worlds
    // -------------------------------------------------------------
    console.log('--- Setup: Ingesting Canonical Seed & Progressing to Stage 3 ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Click Canonical Sunken Ocean City preset
    const oceanPreset = page.locator('button:has-text("Sunken Ocean City")');
    await oceanPreset.click();
    await page.waitForTimeout(200);

    // Extract Seed DNA
    const extractBtn = page.locator('button:has-text("Extract Seed DNA")');
    await extractBtn.click();
    await page.locator('main').getByText('Distilled Seed DNA').waitFor({ timeout: 10000 });

    // Generate 3 Worlds
    const proceedToWorldsBtn = page.locator('button:has-text("Generate 3 Worlds (Stage 3)")');
    await proceedToWorldsBtn.click();
    await page.locator('h2:has-text("Three Contrasting Creative Worlds")').waitFor({ timeout: 10000 });
    await page.locator('text=Candidate 01').first().waitFor({ timeout: 10000 });
    console.log('✅ Stage 3 Worlds generated and loaded');

    // -------------------------------------------------------------
    // Scenario 1: Transition to Stage 4 ('Choose')
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 1: Transition to Stage 4 Selection ---');
    const proceedToStage4Btn = page.locator('button:has-text("Proceed to Selection (Stage 4)")').first();
    assert(await proceedToStage4Btn.isVisible(), 'Proceed to Selection button must be visible in Stage 3');
    await proceedToStage4Btn.click();

    // Verify Stage 4 Header appears
    const stage4Header = page.locator('h2:has-text("Human World Selection & Creative Commitment")');
    await stage4Header.waitFor({ timeout: 8000 });
    console.log('✅ Stage 4 Human World Selection canvas active');

    // Verify all 3 candidate cards have selection buttons
    const selectButtons = page.locator('button:has-text("Select This Direction")');
    assert(await selectButtons.count() === 3, 'Exactly 3 Select This Direction buttons should appear in Stage 4');
    console.log('✅ Exactly 3 candidate cards rendered with interactive selection buttons');

    results.push({ name: 'Scenario 1: Stage 4 Transition & Candidate Display', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 2: Glow & Dim Visual Hierarchy
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 2: Glow & Dim Visual Hierarchy ---');
    // Select Candidate 02 (Bio-City)
    const card2Btn = page.locator('button:has-text("Select This Direction")').nth(1);
    await card2Btn.click();
    await page.waitForTimeout(400);

    // Verify Candidate 02 has Chosen Direction badge
    const chosenBadge = page.locator('text=Chosen Direction');
    assert(await chosenBadge.first().isVisible(), 'Chosen Direction badge must be visible on selected candidate');
    console.log('✅ "Chosen Direction" badge rendered on Candidate 02');

    // Verify Candidate 01 is dimmed (has opacity-60 class)
    const card1 = page.locator('.group:has-text("Candidate 01")').first();
    const card1Classes = await card1.getAttribute('class');
    assert(card1Classes.includes('opacity-60'), 'Unselected candidate 1 must have opacity-60 dimming');
    console.log('✅ Glow & Dim hierarchy active: Unselected cards dimmed (opacity-60)');

    const screenshotDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';
    await page.screenshot({ path: `${screenshotDir}/stage4_choice_canvas.png` });
    console.log('📸 Captured Stage 4 Choice Canvas screenshot');

    results.push({ name: 'Scenario 2: Glow & Dim Visual Hierarchy', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 3: Creator Rationale & Confirmation Lock
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 3: Creator Rationale & Confirmation Lock ---');
    const rationaleTextarea = page.locator('textarea#creator-rationale');
    assert(await rationaleTextarea.isVisible(), 'Creator rationale textarea must be visible');
    const testRationale = 'Exploring symbiotic coral biology and the ethical dilemma of harvesting the ancient core.';
    await rationaleTextarea.fill(testRationale);
    await page.waitForTimeout(200);

    // Click Confirm & Lock Direction button
    const confirmBtn = page.locator('button:has-text("Confirm & Lock Direction")');
    assert(await confirmBtn.isVisible(), 'Confirm & Lock Direction button must be visible');
    await confirmBtn.click();

    // Wait for Stage 5 transition (unfold stage)
    await page.locator('h2:has-text("Stage: unfold")').waitFor({ timeout: 8000 });
    console.log('✅ Stage 5 (unfold) unlocked and navigated to after locking selection');

    results.push({ name: 'Scenario 3: Creator Rationale & Confirmation Lock', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 4: Backend Status Verification via API
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 4: Verifying Backend Project Status & Selection ---');
    const projectResponse = await page.evaluate(async () => {
      const state = JSON.parse(localStorage.getItem('seed-unfold-workspace') || '{}');
      const projId = state?.state?.activeProject?.id;
      if (!projId) return null;
      const res = await fetch(`/api/projects/${projId}`);
      const data = await res.json();
      const selRes = await fetch(`/api/projects/${projId}/selection`);
      const selData = await selRes.json();
      return { project: data.data, selection: selData.data };
    });

    assert(projectResponse !== null, 'Project response must be valid');
    assert(projectResponse.project.status === 'world_selected', 'Project status must be world_selected');
    assert(projectResponse.project.selected_world_id !== null, 'selected_world_id must be populated on project');
    assert(projectResponse.selection.user_rationale === testRationale, 'Persisted rationale must match input');
    console.log(`✅ Backend verified: status="${projectResponse.project.status}", selected_world_id="${projectResponse.project.selected_world_id.slice(0, 8)}..."`);

    results.push({ name: 'Scenario 4: Backend Selection Persistence', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 5: Inspector Drawer Lineage Provenance Trail
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 5: Inspector Drawer Lineage Provenance Trail ---');
    // Open Inspector Drawer if not open
    const drawer = page.locator('aside');
    if (!await drawer.isVisible()) {
      const inspectToggleBtn = page.locator('button:has-text("Inspector")');
      if (await inspectToggleBtn.isVisible()) {
        await inspectToggleBtn.click();
      }
    }
    await drawer.waitFor({ timeout: 5000 });

    // Switch to Lineage tab
    const lineageTabBtn = drawer.locator('button:has-text("Lineage")');
    await lineageTabBtn.click();
    await page.waitForTimeout(400);

    // Verify Step 1: Root Seed
    const step1 = drawer.locator('text=Step 1 • Root Seed');
    assert(await step1.isVisible(), 'Step 1 • Root Seed must appear in Lineage tab');

    // Verify Step 2: Seed DNA
    const step2 = drawer.locator('text=Step 2 • Seed DNA');
    assert(await step2.isVisible(), 'Step 2 • Seed DNA must appear in Lineage tab');

    // Verify Step 3: Human World Selection with Bio-City & Verified badge
    const step3 = drawer.locator('text=Step 3 • Human World Selection');
    assert(await step3.isVisible(), 'Step 3 • Human World Selection must appear in Lineage tab');
    const humanVerified = drawer.locator('text=Human Verified');
    assert(await humanVerified.isVisible(), '"Human Verified" badge must be displayed');
    const bioCityText = drawer.locator('text=Bio-City');
    assert(await bioCityText.first().isVisible(), 'Selected world "Bio-City" must be listed in Lineage node');
    const lineageRationale = drawer.locator(`text=${testRationale}`);
    assert(await lineageRationale.isVisible(), 'Creator rationale must be rendered in Lineage node');
    console.log('✅ Inspector Drawer Lineage verified: Seed -> Seed DNA -> Selected World DAG with Human Verified badge and rationale');

    await page.screenshot({ path: `${screenshotDir}/stage4_inspector_lineage.png` });
    console.log('📸 Captured Stage 4 Inspector Lineage screenshot');

    results.push({ name: 'Scenario 5: Lineage Provenance DAG Visualization', status: 'PASSED' });

    console.log('\n========================================');
    console.log('🎉 ALL PLAYWRIGHT PHASE 4 TESTS PASSED (5/5)');
    console.log('========================================\n');
    results.forEach(r => console.log(`  ✓ ${r.name}: ${r.status}`));

  } catch (err) {
    console.error('❌ Playwright Phase 4 Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runPhase4E2E();
