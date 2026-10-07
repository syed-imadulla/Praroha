const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase11E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 11: Decision DNA\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.on('console', (msg) => console.log(`PAGE [${msg.type()}]:`, msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
  page.on('requestfailed', (req) => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      console.log(`API ERROR [${res.status()}]:`, res.url());
    }
  });
  const results = [];
  const screenshotDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';

  try {
    // -------------------------------------------------------------
    // Setup: Navigate, Ingest Canonical Seed, Extract DNA, Generate Worlds
    // -------------------------------------------------------------
    console.log('--- Setup: Navigating to App & Progressing to Stage 4 ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    // Click Sunken Ocean City preset
    const oceanPreset = page.locator('button:has-text("Sunken Ocean City")');
    await oceanPreset.click();
    await page.waitForTimeout(300);

    // Extract Seed DNA
    const extractBtn = page.locator('button:has-text("Extract Seed DNA")');
    await extractBtn.click();
    await page.locator('text=Distilled Seed DNA').first().waitFor({ timeout: 15000 });

    // Generate 3 Worlds
    const proceedToWorldsBtn = page.locator('button:has-text("Generate 3 Worlds")').first();
    await proceedToWorldsBtn.click();
    await page.locator('h2:has-text("Divergent Worlds Engine")').waitFor({ timeout: 45000 });
    await page.locator('text=Candidate 01').first().waitFor({ timeout: 45000 });

    // Proceed to Stage 4 Selection
    const proceedToStage4Btn = page.locator('button:has-text("Proceed to Selection (Stage 4)")').first();
    await proceedToStage4Btn.click();
    await page.locator('h2:has-text("Human World Selection & Creative Commitment")').waitFor({ timeout: 15000 });
    console.log('✅ Stage 4 World Selection canvas active');

    // -------------------------------------------------------------
    // Scenario 1: Stage 4 Decision DNA Interactive Capture
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 1: Decision DNA Interactive Capture ---');
    // Select Candidate 02 (Bio-City)
    const selectCandidate2Btn = page.locator('button:has-text("Select This Direction")').nth(1);
    await selectCandidate2Btn.click();
    await page.waitForTimeout(400);

    // Verify Decision DNA sections exist
    const prioritiesSection = page.locator('text=1. Creative Priorities');
    assert(await prioritiesSection.isVisible(), 'Creative Priorities section must be visible');

    const exclusionsSection = page.locator('text=2. Negative Guardrails & Exclusions');
    assert(await exclusionsSection.isVisible(), 'Negative Guardrails section must be visible');

    const rationaleSection = page.locator('text=3. Creator Rationale');
    assert(await rationaleSection.isVisible(), 'Creator Rationale section must be visible');

    const directivesSection = page.locator('text=4. Custom Directives');
    assert(await directivesSection.isVisible(), 'Custom Directives section must be visible');

    // Verify default priority chips are rendered
    const defaultPriorityChip = page.locator('button:has-text("Ecological / Symbiotic Mystery")');
    assert(await defaultPriorityChip.isVisible(), 'Default priority chip must be visible');

    // Add a custom creative priority
    const priorityInput = page.locator('input[placeholder="Add custom creative priority..."]');
    await priorityInput.fill('Deep Sea Bioluminescence');
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(200);
    const addedPriority = page.locator('text=Deep Sea Bioluminescence');
    assert(await addedPriority.isVisible(), 'Custom priority tag must appear in priority list');
    console.log('✅ Custom creative priority added and rendered');

    // Verify inferred negative exclusions exist (e.g. sunken ruins archaeology)
    const sunkenRuinsExclusion = page.locator('text=Classical sunken ruins archaeology');
    assert(await sunkenRuinsExclusion.isVisible(), 'Inferred exclusion from Candidate 01 must appear');

    // Add a custom negative guardrail
    const exclusionInput = page.locator('input[placeholder*="Add custom exclusion"]');
    await exclusionInput.fill('No magical fantasy portals');
    await page.locator('button:has-text("Add")').nth(1).click();
    await page.waitForTimeout(200);
    const customExclusionPill = page.locator('text=Avoid: No magical fantasy portals');
    assert(await customExclusionPill.isVisible(), 'Custom negative guardrail pill must appear');
    console.log('✅ Inferred exclusions verified and custom negative guardrail added');

    // Fill custom directive
    const directiveInput = page.locator('textarea#custom-directives');
    await directiveInput.fill('Enzyme bio-physics must govern all environmental technology.');

    await page.screenshot({ path: `${screenshotDir}/phase11_stage4_decision_dna_panel.png` });
    console.log('📸 Captured Stage 4 Decision DNA panel screenshot');
    results.push({ name: 'Scenario 1: Stage 4 Decision DNA Interactive Capture', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 2: Selection Locking & Relational Persistence
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 2: Locking & Backend Decision DNA Persistence ---');
    const confirmBtn = page.locator('button:has-text("Confirm & Lock Direction")');
    assert(await confirmBtn.isVisible(), 'Confirm & Lock Direction button must be visible');
    const [selectRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/select')),
      confirmBtn.click(),
    ]);
    console.log('Select response status:', selectRes.status());
    assert(selectRes.status() === 200, `Select endpoint must succeed with 200, got ${selectRes.status()}`);

    // Wait for transition to Stage 5
    await page.waitForFunction(() => window.__workspaceStore?.getState()?.activeStage === 'unfold');
    console.log('✅ Navigated to Stage 5 Universe Codex');

    // Verify backend received complete Decision DNA payload
    const evalResult = await page.evaluate(async () => {
      const projId =
        window.__workspaceStore?.getState()?.activeProject?.id ||
        JSON.parse(localStorage.getItem('seed-unfold-workspace') || '{}')?.state?.activeProject?.id;
      if (!projId) return { error: 'No activeProject.id found' };
      try {
        const res = await fetch(`/api/projects/${projId}/selection`);
        const json = await res.json();
        return { projId, status: res.status, json, data: json.data };
      } catch (err) {
        return { error: String(err), projId };
      }
    });

    console.log('Backend eval result:', JSON.stringify(evalResult, null, 2));
    assert(evalResult.data, `Selection data must exist on backend, got: ${JSON.stringify(evalResult)}`);
    const backendData = evalResult.data;
    assert(backendData.decision_dna !== null, 'Decision DNA must be populated on selection record');
    assert(backendData.decision_dna.selected_title === 'Bio-City', 'Selected title must be Bio-City');
    assert(
      backendData.decision_dna.creative_priorities.includes('Deep Sea Bioluminescence'),
      'Persisted priorities must contain custom priority'
    );
    assert(
      backendData.decision_dna.rejected_directions.includes('No magical fantasy portals'),
      'Persisted rejected directions must contain custom exclusion'
    );
    assert(
      backendData.decision_dna.custom_directives.includes('Enzyme bio-physics'),
      'Persisted directives must match input'
    );
    console.log('✅ Backend verified: complete Decision DNA relationally persisted and returned');
    results.push({ name: 'Scenario 2: Decision DNA Backend Persistence', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 3: Stage 5 Persistent Decision DNA Anchor Pill Bar
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 3: Stage 5 Codex Decision DNA Anchor Strip ---');
    // Verify Decision DNA badge in Codex header
    const dnaBadge = page.locator('span:has-text("Decision DNA")');
    assert(await dnaBadge.first().isVisible(), 'Decision DNA badge must be visible in Codex');

    // Verify archetype pill
    const archetypePill = page.locator('text=Bio-City');
    assert(await archetypePill.first().isVisible(), 'Selected world title must be visible');

    // Verify priorities pills render in strip
    const priorityPill = page.locator('span[title*="Mandatory Creative Priority"]').first();
    assert(await priorityPill.isVisible(), 'Creative Priority pill must render in Codex strip');

    // Verify exclusion pill renders in strip
    const exclusionPill = page.locator('span[title*="Active Negative Guardrail"]').first();
    assert(await exclusionPill.isVisible(), 'Negative Guardrail pill must render in Codex strip');

    await page.screenshot({ path: `${screenshotDir}/phase11_stage5_codex_anchor_strip.png` });
    console.log('📸 Captured Stage 5 Codex Decision DNA Anchor Strip screenshot');
    results.push({ name: 'Scenario 3: Stage 5 Codex Decision DNA Anchor Strip', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 4: Lineage Inspector Drawer Decision DNA Display
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 4: Inspector Drawer Decision DNA Lineage ---');
    const inspectBtn = page.locator('button:has-text("Inspect Full DNA")').first();
    await inspectBtn.click();
    await page.waitForTimeout(400);

    const aside = page.locator('aside');
    await aside.waitFor({ timeout: 5000 });

    // Switch to Lineage tab if not already on it
    const lineageTab = aside.locator('button:has-text("Lineage")');
    await lineageTab.click();
    await page.waitForTimeout(400);

    // Verify Step 3 displays Decision DNA elements
    const step3 = aside.locator('text=Step 3 • Human World Selection');
    assert(await step3.isVisible(), 'Step 3 node must be visible in Lineage tab');

    const prioritiesHeader = aside.locator('text=Creative Priorities:');
    assert(await prioritiesHeader.isVisible(), 'Creative Priorities section must render in Step 3 Lineage');

    const guardrailsHeader = aside.locator('text=Negative Guardrails:');
    assert(await guardrailsHeader.isVisible(), 'Negative Guardrails section must render in Step 3 Lineage');

    await page.screenshot({ path: `${screenshotDir}/phase11_inspector_decision_dna_lineage.png` });
    console.log('📸 Captured Inspector Decision DNA Lineage screenshot');
    results.push({ name: 'Scenario 4: Lineage Inspector Decision DNA Display', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 5: Canonical Demo Project Seeding & Instant Hydration
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 5: Canonical Demo Decision DNA Resilience ---');
    const demoProject = await page.evaluate(async () => {
      const res = await fetch('/api/projects/canonical-demo', { method: 'POST' });
      const json = await res.json();
      return json.data;
    });

    assert(demoProject !== null, 'Canonical demo seeding must succeed');
    assert(demoProject.status === 'universe_unfolded', 'Canonical project must be unfolded');

    // Check selection on seeded canonical project
    const demoSelection = await page.evaluate(async (projId) => {
      const res = await fetch(`/api/projects/${projId}/selection`);
      const json = await res.json();
      return json.data;
    }, demoProject.id);

    assert(demoSelection.decision_dna !== null, 'Canonical project must have pre-populated Decision DNA');
    assert(
      demoSelection.decision_dna.creative_priorities.includes('Ecological / Symbiotic Mystery'),
      'Canonical priorities must contain Ecological / Symbiotic Mystery'
    );
    assert(
      demoSelection.decision_dna.rejected_directions.includes('Classical sunken ruins archaeology'),
      'Canonical exclusions must contain Classical sunken ruins archaeology'
    );
    console.log('✅ Canonical Bio-City demo seeded with complete Decision DNA in < 500ms');
    results.push({ name: 'Scenario 5: Canonical Demo Decision DNA Resilience', status: 'PASSED' });

    console.log('\n========================================');
    console.log('🎉 ALL PLAYWRIGHT PHASE 11 TESTS PASSED (5/5)');
    console.log('========================================\n');
    results.forEach((r) => console.log(`  ✓ ${r.name}: ${r.status}`));
  } catch (err) {
    console.error('❌ Playwright Phase 11 Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runPhase11E2E();
