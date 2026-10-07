const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

async function runPhase18E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 18: Seed Mutation Lab\n');
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
    // Scenario 1: Premise Variable Selection & Inspection (MUT-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Premise Variable Selection & Inspection (MUT-01) ---');
    
    // Launch Seed Mutation Lab from header button
    const launcherBtn = page.locator('#launcher-simulate-what-if-btn');
    await launcherBtn.waitFor({ timeout: 5000 });
    await launcherBtn.click();
    console.log('✅ Launched Seed Mutation Lab via header launcher button');

    // Or switch via codex tab
    const mutationTab = page.locator('#codex-tab-mutation');
    await mutationTab.waitFor({ timeout: 5000 });
    assert(await mutationTab.isVisible(), 'Seed Mutation Lab tab must be visible');

    // Verify all 4 premise variable selector buttons exist
    const varTypes = ['core_premise', 'tone_atmosphere', 'central_conflict', 'world_rule'];
    for (const vType of varTypes) {
      const varBtn = page.locator(`[data-testid="premise-var-btn-${vType}"]`);
      await varBtn.waitFor({ timeout: 5000 });
      assert(await varBtn.isVisible(), `Variable button for ${vType} must be visible`);
      
      // Click button and verify original value card updates
      await varBtn.click();
      await page.waitForTimeout(200);

      const origValCard = page.locator('[data-testid="mutation-original-value-card"]');
      await origValCard.waitFor({ timeout: 3000 });
      const origText = await origValCard.innerText();
      assert(origText.length > 5, `Original value card for ${vType} should contain text`);
      console.log(`✅ Premise variable "${vType}" displays original value: ${origText.replace(/\n/g, ' ').slice(0, 70)}...`);
    }

    results.push('Scenario 1: Premise Variable Selection & Inspection PASSED');

    // -------------------------------------------------------------
    // Scenario 2: Canonical Simulation & Causal Impact Matrix (MUT-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Canonical Simulation & Causal Impact Matrix (MUT-02) ---');

    // Select core_premise
    const corePremiseBtn = page.locator('[data-testid="premise-var-btn-core_premise"]');
    await corePremiseBtn.click();

    // Fill hypothesis prompt
    const hypothesisTextarea = page.locator('[data-testid="mutation-hypothesis-textarea"]');
    await hypothesisTextarea.waitFor({ timeout: 5000 });
    await hypothesisTextarea.fill('What if the city was actually a weaponized outpost?');

    // Click Simulate Impact
    const simulateBtn = page.locator('#simulate-mutation-btn');
    await simulateBtn.waitFor({ timeout: 5000 });
    assert(await simulateBtn.isEnabled(), 'Simulate button should be enabled with prompt');
    await simulateBtn.click();

    // Wait for Causal Impact Matrix to appear
    const impactMatrix = page.locator('[data-testid="mutation-impact-matrix"]');
    await impactMatrix.waitFor({ timeout: 15000 });
    console.log('✅ Causal Impact Matrix synthesized and rendered');

    // Verify 3-tier distribution in impact counts
    const matrixText = await impactMatrix.innerText();
    console.log(`Matrix header info: ${matrixText.split('\n').slice(0, 3).join(' | ')}`);
    assert(matrixText.includes('Affected'), 'Impact Matrix must list Affected entities');
    assert(matrixText.includes('Conditional'), 'Impact Matrix must list Conditional entities');
    assert(matrixText.includes('Preserved'), 'Impact Matrix must list Preserved entities');

    // Verify no chain-of-thought leaking in justifications
    assert(!matrixText.includes('Thought:'), 'No CoT leaked in justifications');
    assert(!matrixText.includes('Observation:'), 'No CoT leaked in justifications');
    assert(!matrixText.includes('Thinking Process:'), 'No CoT leaked in justifications');
    console.log('✅ Verified zero Chain-of-Thought leak in impact justifications');

    results.push('Scenario 2: Simulation & Causal Impact Matrix PASSED');

    // -------------------------------------------------------------
    // Scenario 3: Causal Diff DAG & Detail Panel (MUT-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Causal Diff DAG & Detail Panel (MUT-03) ---');

    // Check DAG SVG and nodes
    const dagRootNode = page.locator('text="Mutation Origin"').first();
    await dagRootNode.waitFor({ timeout: 5000 });
    assert(await dagRootNode.isVisible(), 'DAG root origin node must be rendered');

    // Click on an entity in the DAG or in the impact list to trigger detail panel
    const firstImpactCard = impactMatrix.locator('div[class*="cursor-pointer"]').first();
    await firstImpactCard.waitFor({ timeout: 5000 });
    await firstImpactCard.click();

    const detailPanel = page.locator('[data-testid="dag-node-detail-panel"]');
    await detailPanel.waitFor({ timeout: 5000 });
    assert(await detailPanel.isVisible(), 'DAG node detail panel must open upon node selection');

    const panelText = await detailPanel.innerText();
    console.log(`✅ Selected Node Detail: ${panelText.replace(/\n/g, ' ').slice(0, 100)}...`);
    assert(panelText.toLowerCase().includes('causal justification'), 'Panel must include Causal Justification');
    assert(panelText.toLowerCase().includes('projected adaptation'), 'Panel must include Projected Adaptation');

    // Capture screenshot of Causal DAG
    await page.screenshot({
      path: path.join(screenshotDir, 'phase18_mutation_causal_dag.png'),
    });
    console.log('📸 Captured screenshot: phase18_mutation_causal_dag.png');

    results.push('Scenario 3: Causal Diff DAG & Detail Panel PASSED');

    // -------------------------------------------------------------
    // Scenario 4: Fork Mutated Universe & Isolated Child Branch (MUT-04)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Fork Mutated Universe & Isolated Child Branch (MUT-04) ---');

    const customBranchInput = page.locator('[data-testid="custom-branch-name-input"]');
    await customBranchInput.waitFor({ timeout: 5000 });
    const targetBranch = 'mutant-weaponized-outpost';
    await customBranchInput.fill(targetBranch);

    const forkBtn = page.locator('#fork-mutation-btn');
    await forkBtn.waitFor({ timeout: 5000 });
    await forkBtn.click();

    // Wait for branch fork and automatic switch
    console.log('Waiting for child universe creation and switch...');
    await page.waitForFunction(
      (expected) => {
        const branch = window.__workspaceStore?.getState()?.activeProject?.branch_name;
        return branch && branch.includes(expected);
      },
      targetBranch,
      { timeout: 20000 }
    );

    // Verify active project in header / store reflects the child project branch
    const branchText = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.activeProject?.branch_name;
    });
    console.log(`Active Project Branch after fork: "${branchText}"`);
    assert(branchText.includes(targetBranch), `Active branch should include "${targetBranch}"`);

    // Verify mutation metadata survived on the child project
    const childMetadata = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.activeProject?.mutation_metadata_json;
    });
    assert(childMetadata, 'Child project must retain mutation_metadata_json');
    const parsedMetadata = JSON.parse(childMetadata);
    assert.strictEqual(parsedMetadata.mutated_variable, 'core_premise');
    const hasOutpost =
      (parsedMetadata.new_value && parsedMetadata.new_value.toLowerCase().includes('weaponized outpost')) ||
      (parsedMetadata.hypothesis_prompt && parsedMetadata.hypothesis_prompt.toLowerCase().includes('weaponized outpost'));
    assert(hasOutpost, 'Mutation metadata must record the weaponized outpost hypothesis');
    console.log('✅ Mutation metadata successfully verified on child project:', parsedMetadata.mutated_variable);

    // Capture screenshot of forked universe
    await page.screenshot({
      path: path.join(screenshotDir, 'phase18_mutation_forked_universe.png'),
    });
    console.log('📸 Captured screenshot: phase18_mutation_forked_universe.png');

    // Verify parent immutability: switch back to main
    console.log('Testing parent canon immutability by switching back to main...');
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

    const parentDnaPremise = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.seedDNA?.dna?.premise || store?.seedDNA?.premise || store?.seedText || '';
    });
    console.log(`Parent Seed DNA Premise: "${parentDnaPremise}"`);
    assert(
      !parentDnaPremise.toLowerCase().includes('weaponized outpost'),
      'Parent canon must NOT be mutated'
    );
    console.log('✅ Verified parent canon is 100% immutable and intact');

    results.push('Scenario 4: Fork Mutated Universe & Isolated Child Branch PASSED');

    // -------------------------------------------------------------
    // Scenario 5: Origin Citation for Mutated Entities
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Origin Citation for Mutated Entities ---');
    // Switch back to the mutant branch
    await page.evaluate(async (target) => {
      const store = window.__workspaceStore?.getState();
      const branches = store?.projectBranches || [];
      const mutant = branches.find((b) => b.branch_name.includes(target));
      if (mutant) {
        await store.switchBranch(mutant.id);
        await store.fetchLineage();
      }
    }, targetBranch);
    await page.waitForTimeout(2500);

    const lineageGraph = await page.evaluate(() => {
      const store = window.__workspaceStore?.getState();
      return store?.lineageGraph;
    });
    assert(lineageGraph && lineageGraph.nodes.length > 0, 'Lineage graph must be populated');
    console.log(`✅ Lineage graph verified on child branch with ${lineageGraph.nodes.length} nodes`);

    const hasMutationCitation = lineageGraph.nodes.some(
      (n) =>
        n.origin_type === 'USER_ADDED' ||
        (n.origin_source && n.origin_source.includes('Seed Mutation Lab')) ||
        (n.description && n.description.includes('weaponized outpost'))
    );
    assert(hasMutationCitation, 'Lineage must contain nodes reflecting the mutation origin citation');
    console.log('✅ Verified mutation origin citation in lineage DAG');

    results.push('Scenario 5: Origin Citation for Mutated Entities PASSED');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 18 E2E PLAYWRIGHT TESTS PASSED!');
    console.log('======================================================');
    results.forEach((r) => console.log(`  ✓ ${r}`));

  } catch (err) {
    console.error('\n❌ Phase 18 E2E Test Failed:', err);
    await page.screenshot({
      path: path.join(screenshotDir, 'phase18_error.png'),
    });
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase18E2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
