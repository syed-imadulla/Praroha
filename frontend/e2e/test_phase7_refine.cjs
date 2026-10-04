const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');

async function runPhase7E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 7: Refine, Branch & Save (Tattva 6: Parinamana & Dharana)\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  page.on('console', (msg) => console.log(`PAGE [${msg.type()}]:`, msg.text()));
  page.on('pageerror', (err) => console.log('PAGE UNHANDLED ERROR:', err));

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
    await page.locator('main').getByText('Distilled Seed DNA').waitFor({ timeout: 45000 });
    console.log('✅ Stage 2 Seed DNA Extracted');

    // Step 3: Generate 3 Worlds
    const proceedToWorldsBtn = page.locator('button:has-text("Generate 3 Worlds (Stage 3)")');
    await proceedToWorldsBtn.click();
    await page.locator('h2:has-text("Three Contrasting Creative Worlds")').waitFor({ timeout: 45000 });
    console.log('✅ Stage 3 Worlds generated and loaded');

    // Step 4: Proceed to Stage 4 Selection
    const proceedToStage4Btn = page.locator('button:has-text("Proceed to Selection (Stage 4)")').first();
    await proceedToStage4Btn.click();
    await page.locator('h2:has-text("Human World Selection & Creative Commitment")').waitFor({ timeout: 20000 });
    await page.waitForTimeout(1000);

    // Select Candidate 02 (Bio-City)
    const selectBtnBioCity = page.locator('button:has-text("Select This Direction")').nth(1);
    await selectBtnBioCity.scrollIntoViewIfNeeded();
    await selectBtnBioCity.click({ force: true });
    await page.waitForTimeout(500);

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
    await unfoldBtn.waitFor({ timeout: 20000 });
    await unfoldBtn.click();

    // Wait for codex tabs to appear
    const bibleTab = page.locator('button#codex-tab-bible');
    await bibleTab.waitFor({ timeout: 60000 });
    console.log('✅ Stage 5 Universe Unfolded successfully');

    // -------------------------------------------------------------
    // Scenario 1: Character Refinement in Stage 5 Codex (PERS-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Character Refinement in Stage 5 Codex (PERS-01) ---');
    const charsTab = page.locator('button#codex-tab-characters');
    await charsTab.click();
    await page.waitForTimeout(400);

    // Check initial version badge on first character
    const charBadgeInitial = page.locator('.char-version-badge').first();
    await charBadgeInitial.waitFor({ timeout: 5000 });
    const initialCharVersion = await charBadgeInitial.textContent();
    assert(initialCharVersion.includes('v1'), `Initial character version must be v1, got: ${initialCharVersion}`);
    console.log(`Initial character badge: ${initialCharVersion.trim()}`);

    // Click "Refine" button on first character
    const refineCharBtn = page.locator('.refine-character-btn').first();
    await refineCharBtn.click();
    await page.waitForTimeout(400);

    // Verify modal is open
    const modal = page.locator('#refinement-modal');
    await modal.waitFor({ timeout: 5000 });
    assert(await modal.isVisible(), 'RefinementModal must be visible');

    // Screenshot modal
    await page.screenshot({ path: `${screenshotDir}/phase7_refinement_modal.png` });
    console.log('📸 Captured: phase7_refinement_modal.png');

    // Edit motivation and fill revision notes
    const motivationInput = page.locator('#refine-motivation-input');
    await motivationInput.fill('Seeks to transcend the biological limitations of humanity through ancient abyssal gene-editing.');

    const notesInput = page.locator('#refine-notes-input');
    await notesInput.fill('Elevated character stakes and personal drive to explore the deep trench ruins.');

    // Save refinement
    const saveRefineBtn = page.locator('#save-refinement-btn');
    await saveRefineBtn.click();
    const updatedCharBadge = page.locator('.char-version-badge').first();
    await updatedCharBadge.filter({ hasText: 'v2' }).waitFor({ timeout: 15000 });

    // Verify character version badge is now v2!
    const updatedCharVersion = await updatedCharBadge.textContent();
    assert(updatedCharVersion.includes('v2'), `Updated character version must be v2, got: ${updatedCharVersion}`);
    console.log(`✅ Character successfully refined to ${updatedCharVersion.trim()} with immutable revision!`);
    results.push('PERS-01 Character Refinement: PASSED');

    // -------------------------------------------------------------
    // Scenario 2: Scene Refinement in Stage 5 Codex (PERS-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Scene Refinement in Stage 5 Codex (PERS-01) ---');
    const scenesTab = page.locator('button#codex-tab-scenes');
    await scenesTab.click();
    await page.waitForTimeout(400);

    // Check initial version badge on first scene
    const sceneBadgeInitial = page.locator('.scene-version-badge').first();
    await sceneBadgeInitial.waitFor({ timeout: 5000 });
    const initialSceneVersion = await sceneBadgeInitial.textContent();
    assert(sceneBadgeInitial && initialSceneVersion.includes('v1'), `Initial scene version must be v1, got: ${initialSceneVersion}`);
    console.log(`Initial scene badge: ${initialSceneVersion.trim()}`);

    // Click "Refine" button on first scene
    const refineSceneBtn = page.locator('.refine-scene-btn').first();
    await refineSceneBtn.click();
    await page.waitForTimeout(400);

    // Verify modal is open for scene
    await modal.waitFor({ timeout: 5000 });
    const sceneOutcomeInput = page.locator('#refine-outcome-input');
    await sceneOutcomeInput.fill('The bio-luminescent reactor reaches critical resonance, fracturing the outer pressure dome.');

    const sceneNotesInput = page.locator('#refine-notes-input');
    await sceneNotesInput.fill('Pivotal climax modified to heighten physical tension and stake in the habitat.');

    // Save scene refinement
    await saveRefineBtn.click();
    const updatedSceneBadge = page.locator('.scene-version-badge').first();
    await updatedSceneBadge.filter({ hasText: 'v2' }).waitFor({ timeout: 15000 });

    // Verify scene version badge is now v2!
    const updatedSceneVersion = await updatedSceneBadge.textContent();
    assert(updatedSceneVersion.includes('v2'), `Updated scene version must be v2, got: ${updatedSceneVersion}`);
    console.log(`✅ Scene successfully refined to ${updatedSceneVersion.trim()}!`);
    results.push('PERS-01 Scene Refinement: PASSED');

    // -------------------------------------------------------------
    // Scenario 3: Version Chaining in Traceability DAG (PERS-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Lineage DAG Version Chaining ---');
    const stage6HeaderBtn = page.locator('button:has-text("Trace")').first();
    await stage6HeaderBtn.click();
    // Diagnostic: inspect nodes in DOM
    await page.waitForTimeout(1000);
    const nodeIds = await page.$$eval('div[data-node-id]', (els) =>
      els.map((e) => ({
        id: e.getAttribute('data-node-id'),
        text: e.innerText.replace(/\n/g, ' ').slice(0, 60),
      }))
    );
    console.log('DOM data-node-id count:', nodeIds.length);
    console.log('Sample node texts:', JSON.stringify(nodeIds.slice(0, 10), null, 2));

    // Look for node with v2 in the DAG
    const refinedNodeV2 = page.locator('div[data-node-id]:has-text("v2")').first();
    await refinedNodeV2.waitFor({ timeout: 15000 });
    assert(await refinedNodeV2.isVisible(), 'Refined v2 lineage node must be present in DAG');

    // Click the refined node to view inspector
    await refinedNodeV2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await refinedNodeV2.click();
    await page.waitForTimeout(400);

    const causalInspectorCard = page.locator('#causal-inspector-card');
    await causalInspectorCard.waitFor({ timeout: 10000 });
    assert(await causalInspectorCard.isVisible(), 'Causal Inspector must open for refined node');
    const inspectorText = await causalInspectorCard.textContent();
    assert(inspectorText.includes('v2') || inspectorText.includes('refined'), 'Inspector must show refinement context');

    await page.screenshot({ path: `${screenshotDir}/phase7_lineage_version_chain.png` });
    console.log('📸 Captured: phase7_lineage_version_chain.png');
    results.push('Lineage DAG Version Chaining: PASSED');

    // -------------------------------------------------------------
    // Scenario 4: Navigate to Stage 7 Refine Canvas & Check Audit Log
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Navigate to Stage 7 Refine Canvas & Audit Log ---');
    // Close inspector drawer to restore full canvas width
    const inspectToggleBtn = page.locator('header button:has-text("Inspect")');
    if (await inspectToggleBtn.isVisible()) {
      await inspectToggleBtn.click();
      await page.waitForTimeout(400);
    }

    const stage7NavBtn = page.locator('#stage-nav-refine');
    await stage7NavBtn.waitFor({ timeout: 12000 });
    await stage7NavBtn.scrollIntoViewIfNeeded();
    await stage7NavBtn.click();
    await page.waitForTimeout(800);

    const stage7Title = page.locator('h1:has-text("Refine, Branch & Save")');
    await stage7Title.waitFor({ timeout: 12000 });
    assert(await stage7Title.isVisible(), 'Stage 7 title must be visible');

    // Check Audit Log shows at least 2 revisions (character + scene)
    const auditLog = page.locator('#refinement-audit-log');
    await auditLog.waitFor({ timeout: 15000 });
    const auditText = await auditLog.textContent();
    assert(auditText.includes('v2'), 'Audit log must display v2 revisions');
    assert(auditText.includes('Elevated character stakes') || auditText.includes('deep trench'), 'Audit log must display creator rationale');

    await page.screenshot({ path: `${screenshotDir}/phase7_audit_log_diffs.png` });
    console.log('📸 Captured: phase7_audit_log_diffs.png');
    results.push('Audit Log & Diff Tracking: PASSED');

    // -------------------------------------------------------------
    // Scenario 5: Timeline Branching with Isolated State (PERS-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Timeline Branching with Isolated State (PERS-02) ---');
    const branchInput = page.locator('#branch-name-input');
    await branchInput.fill('solar-rebellion-fork');

    const forkSubmitBtn = page.locator('#submit-fork-branch-btn');
    await forkSubmitBtn.click();
    await page.waitForTimeout(1200);

    // Verify active timeline changed to solar-rebellion-fork
    const activeTimelineBadge = page.locator('text=solar-rebellion-fork').first();
    await activeTimelineBadge.waitFor({ timeout: 15000 });
    console.log('✅ Active timeline switched to newly forked branch "solar-rebellion-fork"');

    // Verify TopBar branch switcher popover
    const topBarBranchSwitcher = page.locator('#branch-switcher-btn');
    await topBarBranchSwitcher.click();
    await page.waitForTimeout(300);

    const branchPopover = page.locator('#branch-switcher-popover');
    await branchPopover.waitFor({ timeout: 5000 });
    assert(await branchPopover.isVisible(), 'Branch switcher popover must open');
    await page.locator('#branch-switcher-popover').getByText('solar-rebellion-fork').waitFor({ timeout: 15000 });
    const popoverText = await branchPopover.textContent();
    assert(popoverText.includes('solar-rebellion-fork'), 'Popover must contain newly forked branch');

    await page.screenshot({ path: `${screenshotDir}/phase7_branch_navigator.png` });
    console.log('📸 Captured: phase7_branch_navigator.png');

    // Close popover
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    results.push('PERS-02 Timeline Branching: PASSED');

    // -------------------------------------------------------------
    // Scenario 6: Storage Snapshot & Project Bundle (PERS-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Storage Snapshot & Project Bundle (PERS-03) ---');
    const saveSnapshotBtn = page.locator('#save-snapshot-btn');
    await saveSnapshotBtn.click();
    await page.waitForTimeout(1500);

    const snapshotsGrid = page.locator('#storage-snapshots-grid');
    await snapshotsGrid.waitFor({ timeout: 15000 });
    assert(await snapshotsGrid.isVisible(), 'Storage snapshots grid must be visible');
    const snapsText = await snapshotsGrid.textContent();
    assert(snapsText.includes('KB') || snapsText.includes('snapshots/'), 'Snapshot card must display storage details');
    console.log('✅ Storage Snapshot created and listed');

    // Full Overview Screenshot
    await page.screenshot({ path: `${screenshotDir}/phase7_refine_canvas_overview.png`, fullPage: false });
    console.log('📸 Captured: phase7_refine_canvas_overview.png');
    results.push('PERS-03 Storage Snapshot: PASSED');

    console.log('\n=============================================');
    console.log('🎉 ALL PHASE 7 E2E VERIFICATION CHECKS PASSED:');
    results.forEach((r) => console.log(`  ✓ ${r}`));
    console.log('=============================================\n');

  } catch (err) {
    console.error('❌ E2E Verification failed:', err);
    await page.screenshot({ path: `${screenshotDir}/phase7_error.png` });
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase7E2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
