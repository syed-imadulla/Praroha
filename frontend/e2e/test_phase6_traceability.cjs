const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase6E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 6: Traceability & Provenance (Sambandha)\n');
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
    // Setup: Progress through Stages 1-5 with Canonical Ocean Seed
    // -------------------------------------------------------------
    console.log('--- Setup: Progressing through Stages 1-5 with Canonical Ocean Seed ---');
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

    // Unfold Universe in Stage 5
    const unfoldBtn = page.locator('button#unfold-universe-btn');
    await unfoldBtn.waitFor({ timeout: 8000 });
    await unfoldBtn.click();

    // Wait for codex tabs to appear
    const bibleTab = page.locator('button#codex-tab-bible');
    await bibleTab.waitFor({ timeout: 12000 });
    console.log('✅ Stage 5 Universe Unfolded successfully');

    // -------------------------------------------------------------
    // Scenario 1: Navigate to Stage 6 Traceability Canvas via Header
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Navigate to Stage 6 Traceability Canvas ---');
    const stage6HeaderBtn = page.locator('button:has-text("Trace")').first();
    await stage6HeaderBtn.waitFor({ timeout: 5000 });
    await stage6HeaderBtn.click();
    await page.waitForTimeout(600);

    const stage6Title = page.locator('h1:has-text("Causal Lineage & Provenance DAG")');
    await stage6Title.waitFor({ timeout: 8000 });
    assert(await stage6Title.isVisible(), 'Stage 6 Canvas title must be visible');

    const tattva5Badge = page.locator('text=Tattva 5: Causal Lineage (Sambandha)');
    assert(await tattva5Badge.isVisible(), 'Tattva 5 badge must be visible');

    // Check that the 6 pipeline lanes are displayed
    const lane1 = page.locator('text=STAGE 01');
    const lane2 = page.locator('text=STAGE 02');
    const lane3 = page.locator('text=STAGES 03 & 04');
    const lane4 = page.locator('text=STAGE 05A');
    const lane5 = page.locator('text=STAGE 05B');
    const lane6 = page.locator('text=STAGE 05C');

    assert(await lane1.isVisible(), 'Stage 01 Lane must be present');
    assert(await lane2.isVisible(), 'Stage 02 Lane must be present');
    assert(await lane3.isVisible(), 'Stage 03 & 04 Lane must be present');
    assert(await lane4.isVisible(), 'Stage 05A Lane must be present');
    assert(await lane5.isVisible(), 'Stage 05B Lane must be present');
    assert(await lane6.isVisible(), 'Stage 05C Lane must be present');

    await page.screenshot({ path: `${screenshotDir}/phase6_dag_overview.png` });
    console.log('📸 Captured Phase 6 DAG overview screenshot');
    console.log('✅ Scenario 1: Stage 6 Traceability Canvas & 6 pipeline lanes verified');
    results.push({ name: 'Scenario 1: Stage 6 Canvas & 6 Pipeline Lanes', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 2: Node Selection, Ancestor Path Glow & Dimming
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Node Selection, Ancestor Path Glow & Dimming ---');
    // Find a character node in Lane 5
    const charNode = page.locator('div[data-node-id^="node-char-"]').first();
    await charNode.waitFor({ timeout: 5000 });
    const charNodeId = await charNode.getAttribute('data-node-id');
    console.log(`Clicking character node: ${charNodeId}`);
    await charNode.click();
    await page.waitForTimeout(500);

    // Verify selected styling on clicked node
    const isSelectedRing = await charNode.evaluate((el) => el.className.includes('ring-cyan-400'));
    assert(isSelectedRing, 'Clicked node must have ring-cyan-400 active glow');

    // Verify Root Seed node is ancestor-highlighted
    const rootSeedNode = page.locator('div[data-node-id="node-seed"]');
    const isRootHighlighted = await rootSeedNode.evaluate((el) => el.className.includes('ring-emerald-400'));
    assert(isRootHighlighted, 'Root Seed node must be highlighted as an ancestor');

    // Verify unselected world candidates are dimmed
    const candidateNodes = page.locator('div[data-node-id^="node-world-"]');
    const candCount = await candidateNodes.count();
    let hasDimmedCandidate = false;
    for (let i = 0; i < candCount; i++) {
      const isDimmed = await candidateNodes.nth(i).evaluate((el) => el.className.includes('opacity-35'));
      if (isDimmed) hasDimmedCandidate = true;
    }
    assert(hasDimmedCandidate, 'Unselected world candidates must be dimmed with opacity-35');

    await page.screenshot({ path: `${screenshotDir}/phase6_node_ancestor_glow.png` });
    console.log('📸 Captured Phase 6 Ancestor Glow & Dimming screenshot');
    console.log('✅ Scenario 2: Node selection, ancestor path glow, and non-ancestor dimming verified');
    results.push({ name: 'Scenario 2: Ancestor Path Glow & Dimming', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 3: Causal Inspector Card & Zero CoT Leakage (TRAC-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Causal Inspector Card & Zero CoT Leakage ---');
    const inspectorCard = page.locator('#causal-inspector-card');
    assert(await inspectorCard.isVisible(), 'Causal Inspector Card must be visible');

    const whyExistsHeader = inspectorCard.locator('span:has-text("Why Does This Exist?")');
    assert(await whyExistsHeader.isVisible(), 'Why Does This Exist? section must be present in Inspector');

    const causalTextEl = inspectorCard.locator('.bg-emerald-950\\/20 p');
    const causalText = await causalTextEl.innerText();
    assert(causalText && causalText.length > 20, 'Causal explanation text must be descriptive');
    console.log(`Causal Explanation sample: "${causalText.slice(0, 100)}..."`);

    // Verify zero raw CoT tokens
    const forbiddenTokens = [
      '<thought>',
      '</thought>',
      'thinking_process',
      'system prompt',
      'assistant:',
      'user:',
      '```json',
      'chain-of-thought',
    ];
    for (const token of forbiddenTokens) {
      assert(!causalText.includes(token), `Forbidden token "${token}" found in causal explanation!`);
    }

    // Verify Provenance Trail steps list
    const trailSteps = inspectorCard.locator('text=PROVENANCE TRAIL');
    assert(await trailSteps.isVisible(), 'Provenance Trail steps header must be present');

    await page.screenshot({ path: `${screenshotDir}/phase6_causal_inspector_card.png` });
    console.log('📸 Captured Phase 6 Causal Inspector Card screenshot');
    console.log('✅ Scenario 3: Causal Inspector Card and Zero CoT leakage verified');
    results.push({ name: 'Scenario 3: Causal Inspector Card & Zero CoT Leakage', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 4: Cross-Stage Deep Linking from Stage 5 Codex (Scenes)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Cross-Stage Deep Linking from Stage 5 Codex (Scenes) ---');
    const stage5HeaderBtn = page.locator('button:has-text("Unfold")').first();
    await stage5HeaderBtn.click();
    await page.waitForTimeout(400);

    const scenesTab = page.locator('button#codex-tab-scenes');
    await scenesTab.click();
    await page.waitForTimeout(400);

    // Click "Trace Lineage" button on Scene 1
    const sceneTraceBtn = page.locator('.trace-lineage-btn').first();
    assert(await sceneTraceBtn.isVisible(), 'Trace Lineage button must be present on scene cards');
    await sceneTraceBtn.click();
    await page.waitForTimeout(600);

    // Verify automatically navigated to Stage 6
    assert(await stage6Title.isVisible(), 'Clicking Trace Lineage must navigate to Stage 6 Trace');

    // Verify a scene node is selected
    const selectedSceneNode = page.locator('div[data-node-id^="node-scene-"].ring-cyan-400');
    assert(await selectedSceneNode.isVisible(), 'Scene node must be highlighted in Stage 6 DAG');
    console.log('✅ Scenario 4: Cross-stage deep linking from Stage 5 Scene to Stage 6 DAG verified');
    results.push({ name: 'Scenario 4: Deep Linking from Stage 5 Scenes', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 5: Key Location Deep Linking with Deterministic ID
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Key Location Deep Linking with node-loc-0 ---');
    await stage5HeaderBtn.click();
    await page.waitForTimeout(400);

    await bibleTab.click();
    await page.waitForTimeout(400);

    // Click Trace Lineage on Key Location 1
    const locTraceBtn = page.locator('.trace-lineage-btn').first();
    assert(await locTraceBtn.isVisible(), 'Trace Lineage button must be present on location cards');
    await locTraceBtn.click();
    await page.waitForTimeout(600);

    // Verify automatically navigated to Stage 6 with node-loc-0 selected
    assert(await stage6Title.isVisible(), 'Clicking Trace Lineage on location must navigate to Stage 6');
    const selectedLocNode = page.locator('div[data-node-id="node-loc-0"]');
    const isLocSelected = await selectedLocNode.evaluate((el) => el.className.includes('ring-cyan-400'));
    assert(isLocSelected, 'Key Location 0 node (node-loc-0) must be highlighted in DAG');
    console.log('✅ Scenario 5: Key Location deep linking with deterministic node-loc-0 verified');
    results.push({ name: 'Scenario 5: Key Location Deep Linking (Deterministic ID)', status: 'PASSED' });

    // -------------------------------------------------------------
    // Scenario 6: Direct API Lineage & Ancestor Path Verification
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Backend API Verification ---');
    const apiVerification = await page.evaluate(async () => {
      // Get current project id from workspace store
      const storeData = JSON.parse(localStorage.getItem('seed-unfold-workspace') || '{}');
      const projectId = storeData.state?.activeProject?.id;
      if (!projectId) return { error: 'No active project found in store' };

      const graphRes = await fetch(`/api/projects/${projectId}/lineage`);
      const graphJson = await graphRes.json();

      const ancestorsRes = await fetch(`/api/projects/${projectId}/lineage/node/node-loc-0/ancestors`);
      const ancestorsJson = await ancestorsRes.json();

      return {
        graph: graphJson,
        ancestors: ancestorsJson,
      };
    });

    assert(!apiVerification.error, `API verification error: ${apiVerification.error}`);
    assert(apiVerification.graph.success, 'Lineage graph API must return success');
    assert(apiVerification.graph.data.nodes.length >= 6, 'DAG must have at least 6 nodes');
    assert(apiVerification.graph.data.edges.length >= 5, 'DAG must have at least 5 edges');

    const relationTypes = new Set(apiVerification.graph.data.edges.map((e) => e.relation_type));
    console.log('DAG relation types found:', Array.from(relationTypes));
    assert(relationTypes.has('derived_from'), 'Must contain derived_from relation');
    assert(relationTypes.has('selected_by'), 'Must contain selected_by relation');
    assert(relationTypes.has('generated_for'), 'Must contain generated_for relation');

    assert(apiVerification.ancestors.success, 'Ancestor API must return success');
    assert(apiVerification.ancestors.data.ancestor_nodes.length >= 3, 'node-loc-0 must have at least 3 ancestors');
    console.log(`✅ Ancestor path for node-loc-0 has ${apiVerification.ancestors.data.ancestor_nodes.length} nodes`);

    results.push({ name: 'Scenario 6: Backend API Lineage & Ancestor Verification', status: 'PASSED' });

    console.log('\n======================================================');
    console.log('🎉 ALL 6 PHASE 6 SCENARIOS PASSED WITH ZERO ERRORS:');
    results.forEach((r, idx) => console.log(`  ${idx + 1}. [${r.status}] ${r.name}`));
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Phase 6 E2E Verification Failed:', err);
    await page.screenshot({ path: `${screenshotDir}/phase6_failure.png` }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase6E2E();
