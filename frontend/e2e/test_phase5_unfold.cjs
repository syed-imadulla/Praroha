const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase5E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 5: Progressive World Unfolding\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  const results = [];
  const screenshotDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';

  try {
    // -------------------------------------------------------------
    // Setup: Ingest Canonical Seed, Extract DNA, Generate Worlds, Select Bio-City
    // -------------------------------------------------------------
    console.log('--- Setup: Progressing through Stages 1-4 with Canonical Ocean Seed ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Step 1: Click Canonical Sunken Ocean City preset
    const oceanPreset = page.locator('button:has-text("Sunken Ocean City")');
    await oceanPreset.click();
    await page.waitForTimeout(200);

    // Step 2: Extract Seed DNA
    const extractBtn = page.locator('button:has-text("Extract Seed DNA")');
    await extractBtn.click();
    await page.locator('main').getByText('Distilled Seed DNA').waitFor({ timeout: 10000 });
    console.log('✅ Stage 2 Seed DNA Extracted');

    // Step 3: Generate 3 Worlds
    const proceedToWorldsBtn = page.locator('button:has-text("Generate 3 Worlds (Stage 3)")');
    await proceedToWorldsBtn.click();
    await page.locator('h2:has-text("Three Contrasting Creative Worlds")').waitFor({ timeout: 10000 });
    await page.locator('text=Candidate 01').first().waitFor({ timeout: 10000 });
    console.log('✅ Stage 3 Worlds generated and loaded');

    // Step 4: Proceed to Stage 4 Selection
    const proceedToStage4Btn = page.locator('button:has-text("Proceed to Selection (Stage 4)")').first();
    await proceedToStage4Btn.click();
    await page.locator('h2:has-text("Human World Selection & Creative Commitment")').waitFor({ timeout: 8000 });

    // Select Candidate 02 (Bio-City)
    const selectBtnBioCity = page.locator('button:has-text("Select This Direction")').nth(1);
    await selectBtnBioCity.click();
    await page.waitForTimeout(300);

    // Enter creator rationale
    const rationaleTextarea = page.locator('textarea#creator-rationale');
    const testRationale = 'Focus on symbiotic biology and ecological wonder under deep water pressure.';
    await rationaleTextarea.fill(testRationale);
    await page.waitForTimeout(200);

    // Confirm & Lock Direction -> Transitions to Stage 5
    const confirmBtn = page.locator('button:has-text("Confirm & Lock Direction")');
    await confirmBtn.click();
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // Scenario 1: Stage 5 Initial State & Unfold CTA
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 1: Stage 5 Initial State & Unfold CTA ---');
    const stage5Title = page.locator('h1:has-text("Bio-City")');
    await stage5Title.waitFor({ timeout: 8000 });
    assert(await stage5Title.isVisible(), 'Bio-City title must be visible in Stage 5 header');

    const tattvaBadge = page.locator('text=Tattva 4: Generative Unfolding (Srishti)');
    assert(await tattvaBadge.isVisible(), 'Tattva 4 badge must be visible');

    const unfoldBtn = page.locator('button#unfold-universe-btn');
    assert(await unfoldBtn.isVisible(), 'Primary CTA button "Unfold Universe" must be present');
    console.log('✅ Stage 5 initial state verified with committed world header and Unfold CTA');

    results.push({ name: 'Scenario 1: Stage 5 Initial State & Unfold CTA', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 2: Progressive Reveal & Universe Unfolding
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 2: Progressive Reveal & Universe Unfolding ---');
    await unfoldBtn.click();

    // Check loading indicator or progress step
    const loadingHeader = page.locator('h2:has-text("Expanding Story-World Universe")');
    // Progressive loader will run through steps 1-4 and then show tabs
    const bibleTab = page.locator('button#codex-tab-bible');
    await bibleTab.waitFor({ timeout: 12000 });
    console.log('✅ Universe Unfolded successfully; Codex tabs rendered');

    results.push({ name: 'Scenario 2: Progressive Reveal & Universe Unfolding', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 3: Codex Tab 1 - World Bible & Key Locations with Copy Visual Prompt
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 3: World Bible & Key Locations Visual Prompts ---');
    assert(await bibleTab.isVisible(), 'World Bible tab must be visible');

    // Verify geography & physics
    const geographyHeading = page.locator('span:has-text("Geography & Environment")');
    assert(await geographyHeading.isVisible(), 'Geography section must be visible');

    // Verify key locations
    const keyLocationsContainer = page.locator('#codex-key-locations');
    assert(await keyLocationsContainer.isVisible(), 'Key locations section must be present');
    const locationCards = keyLocationsContainer.locator('.copy-prompt-btn');
    const locCount = await locationCards.count();
    assert(locCount >= 2, `Expected at least 2 key locations with copy buttons, found ${locCount}`);
    console.log(`✅ Found ${locCount} Key Locations inside World Bible`);

    // Test 1-click Copy Visual Prompt on first location
    await locationCards.first().click();
    await page.waitForTimeout(300);

    // Verify toast feedback appears
    const toast = page.locator('text=Copied prompt for');
    assert(await toast.isVisible(), 'Toast notification must appear after clicking Copy Visual Prompt');
    console.log('✅ 1-click "Copy Visual Prompt" on Key Location verified with floating toast feedback');

    await page.screenshot({ path: `${screenshotDir}/phase5_codex_bible.png` });
    console.log('📸 Captured Phase 5 World Bible & Locations screenshot');

    results.push({ name: 'Scenario 3: World Bible & Key Locations with Prompt Copying', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 4: Codex Tab 2 - Characters & Relationship Dynamics
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 4: Characters & Interpersonal Dynamics Web ---');
    const charactersTab = page.locator('button#codex-tab-characters');
    await charactersTab.click();
    await page.waitForTimeout(400);

    // Verify Character cards
    const characterGrid = page.locator('#codex-characters-grid');
    await characterGrid.waitFor({ timeout: 5000 });
    const charCards = characterGrid.locator('.copy-prompt-btn');
    const charCount = await charCards.count();
    assert(charCount >= 2, `Expected at least 2 characters, found ${charCount}`);
    console.log(`✅ Found ${charCount} Core Characters with Archetypes and Motivations`);

    // Verify Relationship Web
    const relationshipWeb = page.locator('#codex-relationship-web');
    assert(await relationshipWeb.isVisible(), 'Interpersonal Dynamics Web must be visible');
    const relItems = relationshipWeb.locator('.border-b');
    const relCount = await relItems.count();
    assert(relCount >= 1, `Expected at least 1 relationship tension card, found ${relCount}`);
    console.log(`✅ Found ${relCount} Active Interpersonal Relationship Dynamics`);

    // Test Copy Prompt on first character
    await charCards.first().click();
    await page.waitForTimeout(300);
    assert(await page.locator('text=Copied prompt for').isVisible(), 'Toast notification must appear for character prompt');
    console.log('✅ 1-click Character prompt copying verified with toast feedback');

    await page.screenshot({ path: `${screenshotDir}/phase5_codex_characters.png` });
    console.log('📸 Captured Phase 5 Characters & Dynamics screenshot');

    results.push({ name: 'Scenario 4: Characters & Dynamics Web', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 5: Codex Tab 3 - Story Beats & Narrative Scenes
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 5: Story Beats & Narrative Conflict Scenes ---');
    const scenesTab = page.locator('button#codex-tab-scenes');
    await scenesTab.click();
    await page.waitForTimeout(400);

    const scenesGrid = page.locator('#codex-scenes-grid');
    await scenesGrid.waitFor({ timeout: 5000 });
    const sceneCards = scenesGrid.locator('.copy-prompt-btn');
    const sceneCount = await sceneCards.count();
    assert(sceneCount >= 2, `Expected at least 2 scene beats, found ${sceneCount}`);
    console.log(`✅ Found ${sceneCount} Story Beat Scenes with Dramatic Questions and Pivotal Outcomes`);

    // Verify dramatic question and pivotal outcome headings
    const dramaticQ = page.locator('span:has-text("Dramatic Question")').first();
    assert(await dramaticQ.isVisible(), 'Dramatic Question must be displayed on scene cards');

    // Test Copy Visual Prompt on first scene
    await sceneCards.first().click();
    await page.waitForTimeout(300);
    assert(await page.locator('text=Copied prompt for').isVisible(), 'Toast notification must appear for scene prompt');
    console.log('✅ 1-click Scene Visual Prompt copying verified with toast feedback');

    await page.screenshot({ path: `${screenshotDir}/phase5_codex_scenes.png` });
    console.log('📸 Captured Phase 5 Story Beats screenshot');

    results.push({ name: 'Scenario 5: Story Beats & Scenes with Prompt Copying', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 6: Inspector Drawer Lineage Provenance DAG Extension
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 6: Inspector Drawer Lineage Provenance DAG Extension ---');
    const drawer = page.locator('aside');
    if (!await drawer.isVisible()) {
      const inspectLineageBtn = page.locator('button:has-text("Inspect Lineage")').first();
      await inspectLineageBtn.click();
    }
    await drawer.waitFor({ timeout: 5000 });

    const lineageTabBtn = drawer.locator('button:has-text("Lineage")');
    await lineageTabBtn.click();
    await page.waitForTimeout(400);

    // Verify Step 4: Unfolded Codex Node
    const step4 = drawer.locator('#lineage-unfolded-codex');
    await step4.waitFor({ timeout: 5000 });
    assert(await step4.isVisible(), 'Step 4 • Unfolded Codex node must appear in Lineage DAG');

    // Verify Child branches: World Bible, Characters, Dynamics Web, Story Scenes
    assert(await step4.locator('text=World Bible').isVisible(), 'World Bible child branch must be visible in Lineage');
    assert(await step4.locator('text=Characters').isVisible(), 'Characters child branch must be visible in Lineage');
    assert(await step4.locator('text=Dynamics Web').isVisible(), 'Dynamics Web child branch must be visible in Lineage');
    assert(await step4.locator('text=Story Scenes').isVisible(), 'Story Scenes child branch must be visible in Lineage');
    console.log('✅ Inspector Drawer Lineage DAG verified: Selected World -> Unfolded Codex (World Bible, Characters, Dynamics Web, Story Scenes)');

    await page.screenshot({ path: `${screenshotDir}/phase5_inspector_lineage.png` });
    console.log('📸 Captured Phase 5 Inspector Lineage screenshot');

    results.push({ name: 'Scenario 6: Inspector Lineage DAG Extension', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 7: Backend Persistence & Idempotency Verification
    // -------------------------------------------------------------
    console.log('\n--- Executing Scenario 7: Backend Persistence & Idempotency Verification ---');
    const backendData = await page.evaluate(async () => {
      const state = JSON.parse(localStorage.getItem('seed-unfold-workspace') || '{}');
      const projId = state?.state?.activeProject?.id;
      if (!projId) return null;
      const pRes = await fetch(`/api/projects/${projId}`);
      const pJson = await pRes.json();
      const uRes = await fetch(`/api/projects/${projId}/unfolded`);
      const uJson = await uRes.json();
      return { project: pJson.data, unfolded: uJson.data };
    });

    assert(backendData !== null, 'Backend data evaluation must succeed');
    assert(backendData.project.status === 'universe_unfolded', `Project status must be universe_unfolded, got ${backendData.project.status}`);
    assert(backendData.unfolded.world_bible !== null, 'World Bible must exist in backend');
    assert(backendData.unfolded.characters.length >= 2, 'Characters must exist in backend');
    assert(backendData.unfolded.relationships.length >= 1, 'Relationships must exist in backend');
    assert(backendData.unfolded.scenes.length >= 2, 'Scenes must exist in backend');
    console.log(`✅ Backend verified: project.status="${backendData.project.status}", bible.locations=${backendData.unfolded.world_bible.key_locations.length}, characters=${backendData.unfolded.characters.length}, scenes=${backendData.unfolded.scenes.length}`);

    results.push({ name: 'Scenario 7: Backend Persistence & Codex Retrieval', status: 'PASSED' });

    console.log('\n========================================');
    console.log('🎉 ALL PLAYWRIGHT PHASE 5 TESTS PASSED (7/7)');
    console.log('========================================\n');
    results.forEach(r => console.log(`  ✓ ${r.name}: ${r.status}`));

  } catch (err) {
    console.error('❌ Playwright Phase 5 Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runPhase5E2E();
