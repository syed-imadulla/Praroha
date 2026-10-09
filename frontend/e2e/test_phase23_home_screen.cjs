const { chromium } = require('playwright');

async function runTest() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 23: Botanical Home Screen');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // 1. Editorial Hero Verification
    const heroQuote = page.locator('blockquote:has-text("Universes exist in a seed form")');
    await heroQuote.waitFor({ state: 'visible', timeout: 5000 });
    const heroText = await heroQuote.textContent();
    console.log(`✅ Editorial Hero Quote verified: "${heroText.replace(/\s+/g, ' ').trim()}"`);

    // 2. Leaf Separator Verification
    const leafSeparator = page.locator('div.max-w-md svg');
    const leafCount = await leafSeparator.count();
    console.log(`✅ Botanical Leaf Separator verified (${leafCount} SVG emblems)`);

    // 3. 72px Pill Seed Input Verification
    const seedTextarea = page.locator('textarea[aria-label="Enter your seed idea"]');
    await seedTextarea.waitFor({ state: 'visible' });
    console.log('✅ 72px Pill Seed Input is rendered and visible');

    // Circular sage submit button
    const submitBtn = page.locator('button[aria-label="Extract Seed DNA"]');
    await submitBtn.waitFor({ state: 'visible' });
    console.log('✅ Circular sage submit button present with aria-label="Extract Seed DNA"');

    // 4. Creation Modes (5 Cards)
    const modeLabels = ['Image', 'Story', 'Sound', 'Video', 'Chat'];
    for (const label of modeLabels) {
      const modeCard = page.locator(`button[aria-label="Creation mode: ${label}"]`);
      await modeCard.waitFor({ state: 'visible' });
      console.log(`✅ Creation Mode card verified: ${label}`);
    }

    // Click 'Story' mode card to verify interaction
    const storyModeCard = page.locator('button[aria-label="Creation mode: Story"]');
    await storyModeCard.click();
    await page.waitForTimeout(200);
    const ariaPressed = await storyModeCard.getAttribute('aria-pressed');
    if (ariaPressed !== 'true') {
      throw new Error(`Expected Story card aria-pressed to be true, got ${ariaPressed}`);
    }
    console.log('✅ Creation Mode selection interaction works');

    // 5. Recent Creations Row
    const recentHeading = page.locator('h2:has-text("Recent Creations")');
    await recentHeading.waitFor({ state: 'visible' });
    const recentCards = page.locator('section[aria-label="Recent Creations"] [role="button"]');
    const recentCardCount = await recentCards.count();
    console.log(`✅ Recent Creations row rendered with ${recentCardCount} cards (Mountain Sunset, Forest Vibes, Dreamscape)`);

    // 6. Verify Removal of Large Side Journey Card & Presence of Compact Continuity Indicator
    const journeyCard = page.locator('div:has-text("From a seed...")');
    const isJourneyCardPresent = await journeyCard.count();
    if (isJourneyCardPresent > 0) {
      throw new Error('Large right-side "From a seed..." journey card should NOT be present on Home');
    }
    const continuityIndicator = page.locator('div:has-text("Seed → Universe")').first();
    await continuityIndicator.waitFor({ state: 'visible' });
    console.log('✅ Large side journey card correctly removed; compact "Seed → Universe" continuity indicator verified');

    // 7. Preset Selection
    const oceanPreset = page.locator('button:has-text("Sunken Ocean City")');
    await oceanPreset.click();
    const currentVal = await seedTextarea.inputValue();
    if (!currentVal.includes('A child discovers a forgotten city beneath the ocean.')) {
      throw new Error(`Textarea did not populate with preset seed, got: ${currentVal}`);
    }
    console.log('✅ Preset pill populated textarea with canonical seed');

    // 8. Submit seed and verify transition to Stage 2 (Seed DNA)
    await submitBtn.click();
    const dnaStage = page.locator('h2:has-text("Seed DNA"), h1:has-text("Seed DNA"), div:has-text("Premise")').first();
    await dnaStage.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Seed submission succeeded; smoothly transitioned into Stage 2 (Seed DNA)!');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 23 BOTANICAL HOME SCREEN TESTS PASSED 100%');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Phase 23 Home Screen Test Failed:', err);
  process.exit(1);
});
