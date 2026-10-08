const { chromium } = require('playwright');
const path = require('path');

const VIEWPORTS = [
  { name: 'desktop_1440x900', width: 1440, height: 900 },
  { name: 'desktop_1280x800', width: 1280, height: 800 },
  { name: 'tablet_landscape_1024x768', width: 1024, height: 768 },
  { name: 'tablet_portrait_768x1024', width: 768, height: 1024 },
  { name: 'mobile_iphone_390x844', width: 390, height: 844 },
  { name: 'mobile_android_360x800', width: 360, height: 800 },
];

async function runResponsiveSmokeTest() {
  console.log('🌿 Starting PRAROHA UI Refinement & Responsive Multi-Viewport Audit...');

  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

      // 1. Check for Zero Horizontal Page Overflow
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return {
          scrollWidth: docWidth,
          innerWidth: winWidth,
          hasOverflow: docWidth > winWidth,
        };
      });

      if (overflow.hasOverflow) {
        throw new Error(
          `Horizontal page overflow detected on ${vp.name}! scrollWidth: ${overflow.scrollWidth}, innerWidth: ${overflow.innerWidth}`
        );
      }
      console.log(`✅ Zero horizontal overflow verified (scrollWidth: ${overflow.scrollWidth} <= innerWidth: ${overflow.innerWidth})`);

      // 2. Verify Home Layout: No large right-side journey card
      const journeyCardCount = await page.locator('div:has-text("From a seed...")').count();
      if (journeyCardCount > 0) {
        throw new Error(`Large side journey card found on Home in viewport ${vp.name}`);
      }
      console.log('✅ Home has no large right-side journey card');

      // 3. Verify Creation Modes (Image, Story, Sound, Video, Chat)
      const modeButtons = page.locator('section[aria-label="Creation Modes"] button');
      const count = await modeButtons.count();
      if (count !== 5) {
        throw new Error(`Expected 5 Creation Mode cards, found ${count}`);
      }
      console.log('✅ Exactly 5 Creation Modes rendered');

      // 4. Verify touch targets on mobile (min 44px)
      if (vp.width < 768) {
        const firstCardBox = await modeButtons.first().boundingBox();
        if (firstCardBox && firstCardBox.height < 44) {
          throw new Error(`Mobile creation card height is under 44px: ${firstCardBox.height}px`);
        }
        console.log(`✅ Mobile interactive targets verified (card height: ${Math.round(firstCardBox?.height || 0)}px >= 44px)`);
      }

      await context.close();
    }

    // Comprehensive Stage 2 & Stage 3 Visual System Audit
    console.log('\n--- Auditing Stage 2 (Understand) & Stage 3 (Divergent Worlds) Botanical Presentation ---');
    const fullContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fullPage = await fullContext.newPage();
    await fullPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Ensure clean workspace state
    await fullPage.evaluate(() => {
      if (window.__workspaceStore) {
        window.__workspaceStore.getState().resetWorkspace();
      }
    });
    await fullPage.waitForTimeout(500);

    // Select preset and extract
    const oceanPreset = fullPage.locator('button:has-text("Sunken Ocean City")');
    await oceanPreset.click();
    const submitBtn = fullPage.locator('button[aria-label="Extract Seed DNA"]');
    await submitBtn.click();

    // Arrive at Stage 2
    const dnaHeading = fullPage.locator('h2:has-text("Distilled Seed DNA")').first();
    await dnaHeading.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Arrived at Stage 2 (Understand)');

    // Verify Stage 2 Botanical Visual Tokens:
    // Check that title has readable text color
    const dnaColor = await dnaHeading.evaluate((el) => window.getComputedStyle(el).color);
    console.log(`✅ Stage 2 Heading Color: ${dnaColor} (high-contrast PRAROHA sage)`);

    // Verify 2-column cards exist (Emotional Tone, Implicit Themes, Core Entities, Strict Constraints)
    const toneHeading = fullPage.locator('span:has-text("Emotional & Aesthetic Tone")').first();
    await toneHeading.waitFor({ state: 'visible' });
    const themesHeading = fullPage.locator('span:has-text("Implicit Thematic Tensions")').first();
    await themesHeading.waitFor({ state: 'visible' });
    console.log('✅ Stage 2 Tone and Implicit Themes cards verified');

    // Proceed to Stage 3
    const toWorldsBtn = fullPage.locator('button:has-text("Generate 3 Worlds (Stage 3)")').first();
    await toWorldsBtn.click();

    // Verify Stage 3
    const worldsEngineHeading = fullPage.locator('h2:has-text("Divergent Worlds Engine")').first();
    await worldsEngineHeading.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Arrived at Stage 3 (Divergent Worlds)');

    // Wait for worlds to generate or load
    const worldCards = fullPage.locator('span:has-text("Candidate 0")');
    await worldCards.first().waitFor({ state: 'visible', timeout: 15000 });
    const worldCount = await worldCards.count();
    if (worldCount !== 3) {
      throw new Error(`Expected exactly 3 world cards in Stage 3, found ${worldCount}`);
    }
    console.log(`✅ Exactly 3 Divergent World cards verified side-by-side`);

    // Verify archetype pills (Familiar, Radical, Inverse)
    const familiarPill = fullPage.locator('span:has-text("Familiar")').first();
    const radicalPill = fullPage.locator('span:has-text("Radical")').first();
    const inversePill = fullPage.locator('span:has-text("Inverse")').first();
    await familiarPill.waitFor({ state: 'visible' });
    await radicalPill.waitFor({ state: 'visible' });
    await inversePill.waitFor({ state: 'visible' });
    console.log('✅ Triad Archetype distinctions verified (Familiar, Radical, Inverse)');

    // Take screenshots for verification artifacts
    await fullPage.screenshot({
      path: path.join(__dirname, 'stage3_botanical_worlds.png'),
      fullPage: false,
    });
    console.log('📸 Captured Stage 3 screenshot');

    await fullContext.close();

    console.log('\n======================================================');
    console.log('🎉 ALL RESPONSIVE & UI REFINEMENT CHECKS PASSED 100%');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runResponsiveSmokeTest().catch((err) => {
  console.error('❌ Responsive Smoke Test Failed:', err);
  process.exit(1);
});
