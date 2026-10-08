const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve(__dirname, '../../.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04');
const LOCAL_ARTIFACT_DIR = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(LOCAL_ARTIFACT_DIR)) {
  fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });
}

async function runVisualAndResponsiveAudit() {
  console.log('🌿 Starting Phase 28 Botanical Workspace Multi-Viewport Visual Audit...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Navigate to App and load Canonical Instant Demo
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Atomically load canonical demo via store to ensure all 7 stages are fully unlocked
    await page.evaluate(async () => {
      await window.__workspaceStore.getState().loadCanonicalDemoUniverse();
    });
    await page.waitForTimeout(1000);

    // Wait for canonical project title to settle
    await page.locator('text=The Sunken City: Bio-City').first().waitFor({ timeout: 15000 });
    console.log('✅ Canonical Demo loaded successfully with all 7 stages unlocked');

    const viewports = [
      { name: 'desktop_1440', width: 1440, height: 900 },
      { name: 'tablet_1024', width: 1024, height: 768 },
      { name: 'mobile_390', width: 390, height: 844 },
    ];

    const stages = [
      { id: 'choose', num: 4, name: 'Stage 4: Human Gate & Selection', navId: '#stage-nav-choose' },
      { id: 'unfold', num: 5, name: 'Stage 5: Universe Codex', navId: '#stage-nav-unfold' },
      { id: 'trace', num: 6, name: 'Stage 6: Causal Lineage DAG', navId: '#stage-nav-trace' },
      { id: 'refine', num: 7, name: 'Stage 7: Refine & Mutation Lab', navId: '#stage-nav-refine' },
    ];

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`📱 Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);

      for (const stg of stages) {
        console.log(`\n--- ${stg.name} [${vp.name}] ---`);
        const navButton = page.locator(stg.navId);
        await navButton.waitFor({ timeout: 5000 });
        await navButton.click();
        await page.waitForTimeout(800);

        // Check horizontal overflow
        const overflowCheck = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const workspace = document.querySelector('main') || document.querySelector('.flex-1') || body;
          return {
            windowWidth: window.innerWidth,
            docScrollWidth: docEl.scrollWidth,
            bodyScrollWidth: body.scrollWidth,
            workspaceScrollWidth: workspace ? workspace.scrollWidth : 0,
          };
        });

        const hasDocOverflow = overflowCheck.docScrollWidth > overflowCheck.windowWidth + 2; // Allow subpixel rounding
        assert(!hasDocOverflow, `Horizontal page overflow detected on ${stg.id} at ${vp.name}: scrollWidth=${overflowCheck.docScrollWidth}, innerWidth=${overflowCheck.windowWidth}`);
        console.log(`✅ Zero page overflow verified (scrollWidth: ${overflowCheck.docScrollWidth} <= innerWidth: ${overflowCheck.windowWidth})`);

        // Capture screenshot
        const screenshotName = `phase28_${stg.id}_${vp.name}.png`;
        const localPath = path.join(LOCAL_ARTIFACT_DIR, screenshotName);
        await page.screenshot({ path: localPath, fullPage: false });
        console.log(`📸 Saved screenshot: ${localPath}`);

        if (fs.existsSync(ARTIFACT_DIR)) {
          const globalPath = path.join(ARTIFACT_DIR, screenshotName);
          fs.copyFileSync(localPath, globalPath);
        }

        // Specific stage feature assertions
        if (stg.id === 'choose') {
          const hozPanel = page.locator('#human-only-zones-panel');
          const isHozVisible = await hozPanel.isVisible();
          assert(isHozVisible, 'Stage 4 must render Human-Only Zones panel');
        } else if (stg.id === 'unfold') {
          const summaryBanner = page.locator('#human-only-zones-summary-banner');
          assert(await summaryBanner.isVisible(), 'Stage 5 must render Human-Only Zones summary banner');
          const charsTab = page.locator('#codex-tab-characters');
          assert(await charsTab.isVisible(), 'Stage 5 must render Characters tab button');
          
          // Test Mutation Lab tab in Stage 5
          const mutationTab = page.locator('#codex-tab-mutation');
          if (await mutationTab.isVisible()) {
            await mutationTab.click();
            await page.waitForTimeout(300);
            const mutationScreenshot = `phase28_mutation_${vp.name}.png`;
            const mutPath = path.join(LOCAL_ARTIFACT_DIR, mutationScreenshot);
            await page.screenshot({ path: mutPath, fullPage: false });
            if (fs.existsSync(ARTIFACT_DIR)) {
              fs.copyFileSync(mutPath, path.join(ARTIFACT_DIR, mutationScreenshot));
            }
            // Return to bible tab
            await page.locator('#codex-tab-bible').click();
            await page.waitForTimeout(300);
          }
        } else if (stg.id === 'trace') {
          // Lineage DAG lanes or canvas
          const dagHeader = page.locator('text=Causal Lineage & Provenance DAG').first();
          assert(await dagHeader.isVisible(), 'Stage 6 Lineage DAG title must be visible');
        } else if (stg.id === 'refine') {
          // Refine stage header
          const refineTitle = page.locator('text=Refine, Branch & Save').first();
          assert(await refineTitle.isVisible(), 'Stage 7 Refine title must be visible');
        }
        console.log(`✅ ${stg.name} botanical UI and functional checks passed`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 28 BOTANICAL WORKSPACE CHECKS PASSED 100%');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runVisualAndResponsiveAudit().catch((err) => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
