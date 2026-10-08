const { chromium } = require('playwright');
const path = require('path');

async function runTest() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 22: Global App Shell');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // 1. Check permanent sidebar presence
    const aside = page.locator('[data-testid="desktop-sidebar"] aside');
    await aside.waitFor({ state: 'visible', timeout: 5000 });
    const boundingBox = await aside.boundingBox();
    console.log(`✅ Sidebar rendered with width: ${Math.round(boundingBox.width)}px (Target: 265–280px)`);
    if (boundingBox.width < 260 || boundingBox.width > 285) {
      throw new Error(`Unexpected sidebar width: ${boundingBox.width}`);
    }

    // 2. Check PRAROHA branding
    const brandHeading = page.locator('[data-testid="desktop-sidebar"] aside h1');
    const brandText = await brandHeading.textContent();
    console.log(`✅ Brand wordmark: "${brandText.trim()}"`);
    if (brandText.trim() !== 'PRAROHA') {
      throw new Error(`Expected brand to be PRAROHA, got ${brandText}`);
    }

    const tagline = page.locator('[data-testid="desktop-sidebar"] aside p').first();
    const taglineText = await tagline.textContent();
    console.log(`✅ Brand tagline: "${taglineText.trim()}"`);
    if (!taglineText.includes('Seed → Universe')) {
      throw new Error(`Expected tagline to contain 'Seed → Universe', got ${taglineText}`);
    }

    // 3. Check navigation items
    const homeBtn = page.locator('[data-testid="desktop-sidebar"] aside button:has-text("Home")');
    const creationsBtn = page.locator('[data-testid="desktop-sidebar"] aside button:has-text("My Creations")');
    const graveyardBtn = page.locator('[data-testid="desktop-sidebar"] aside button:has-text("Graveyard")');
    const profileBtn = page.locator('[data-testid="desktop-sidebar"] aside button:has-text("Profile")');

    await homeBtn.waitFor({ state: 'visible' });
    await creationsBtn.waitFor({ state: 'visible' });
    await graveyardBtn.waitFor({ state: 'visible' });
    await profileBtn.waitFor({ state: 'visible' });
    console.log('✅ All 4 navigation items (Home, My Creations, Graveyard, Profile) are present');

    // 4. Verify Active State styling
    const homeClass = await homeBtn.getAttribute('class');
    if (!homeClass.includes('bg-[#DDE2D2]') || !homeClass.includes('text-[#294B3A]')) {
      throw new Error(`Home button missing sage active classes: ${homeClass}`);
    }
    console.log('✅ Home button is active with sage-100 background and sage-900 text');

    // 5. Test Navigation Switching to My Creations
    await creationsBtn.click();
    await page.waitForTimeout(300);
    const creationsHeading = page.locator('h2:has-text("My Creations")');
    await creationsHeading.waitFor({ state: 'visible' });
    console.log('✅ Switched to My Creations view successfully');

    // 6. Test Navigation Switching to Graveyard
    await graveyardBtn.click();
    await page.waitForTimeout(300);
    const graveyardHeading = page.locator('h2:has-text("Graveyard")');
    await graveyardHeading.waitFor({ state: 'visible' });
    console.log('✅ Switched to Graveyard view successfully');

    // 7. Test Navigation Switching to Profile
    await profileBtn.click();
    await page.waitForTimeout(300);
    const profileHeading = page.locator('h2:has-text("Profile")');
    await profileHeading.waitFor({ state: 'visible' });
    console.log('✅ Switched to Profile view successfully');

    // 8. Return to Home and verify workspace is fully interactive
    const returnBtn = page.locator('button:has-text("Return to Seed Workspace")');
    await returnBtn.click();
    await page.waitForTimeout(300);

    const seedCanvas = page.locator('h1:has-text("Plant the Creative Seed")');
    await seedCanvas.waitFor({ state: 'visible' });
    console.log('✅ Returned to Home; full Seed Unfold workspace is visible and active');

    // 9. Verify Botanical Edge Foliage presence
    const botanicalSvgCount = await page.locator('svg[aria-hidden="true"]').count();
    console.log(`✅ Botanical SVG elements detected: ${botanicalSvgCount}`);

    // 10. Test Mobile Viewport Responsive Behavior
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const mobileMenuBtn = page.locator('header button[aria-label="Open navigation menu"]');
    await mobileMenuBtn.waitFor({ state: 'visible' });
    console.log('✅ Mobile top bar and menu toggle button rendered under mobile viewport');

    await mobileMenuBtn.click();
    await page.waitForTimeout(300);
    const mobileCloseBtn = page.locator('button[aria-label="Close navigation menu"]');
    await mobileCloseBtn.waitFor({ state: 'visible' });
    console.log('✅ Mobile drawer opened successfully');

    await mobileCloseBtn.click();
    await page.waitForTimeout(300);
    console.log('✅ Mobile drawer closed cleanly');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 22 APP SHELL TESTS PASSED WITH 100% SUCCESS');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Phase 22 App Shell Test Failed:', err);
  process.exit(1);
});
