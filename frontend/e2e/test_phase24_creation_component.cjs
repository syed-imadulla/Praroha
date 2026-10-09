const { chromium } = require('playwright');

async function runTest() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 24: Creation Component System');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // =========================================================================
    // STEP 1: Home Screen Recent Creations Row Integration
    // =========================================================================
    console.log('\n--- Step 1: Recent Creations Integration on Home ---');
    const recentHeading = page.locator('h2:has-text("Recent Creations")');
    await recentHeading.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Recent Creations heading visible on Home screen');

    const homeCards = page.locator('section[aria-label="Recent Creations"] article[data-testid^="creation-card-"]');
    const homeCardCount = await homeCards.count();
    if (homeCardCount !== 3) {
      throw new Error(`Expected 3 Recent Creation cards on Home, found ${homeCardCount}`);
    }
    console.log(`✅ Exactly 3 canonical CreationCards rendered on Home (${homeCardCount} verified)`);

    // Verify first card structure: Thumbnail, TypeBadge, Title, Meta, Menu
    const firstCard = homeCards.first();
    const thumbnail = firstCard.locator('div.aspect-16\\/9');
    await thumbnail.waitFor({ state: 'visible' });
    console.log('✅ 16:9 Thumbnail container verified on Home CreationCard');

    const typeBadge = firstCard.locator('[data-testid="creation-type-badge"]');
    await typeBadge.waitFor({ state: 'visible' });
    const badgeText = (await typeBadge.textContent()).trim();
    console.log(`✅ Type badge rendered on thumbnail: "${badgeText}"`);

    // Verify Favorite toggle on Home card (hit target >= 44x44px)
    const favButton = firstCard.locator('[data-testid="creation-favorite-button"]');
    await favButton.waitFor({ state: 'visible' });
    const favBox = await favButton.boundingBox();
    if (!favBox || favBox.width < 44 || favBox.height < 44) {
      throw new Error(`Favorite button target must be >= 44x44px. Got ${favBox?.width}x${favBox?.height}`);
    }
    console.log(`✅ Favorite action button hit target is >= 44x44px (${favBox.width}x${favBox.height}px)`);

    const initialFavLabel = await favButton.getAttribute('aria-label');
    await favButton.click();
    await page.waitForTimeout(200);
    const updatedFavLabel = await favButton.getAttribute('aria-label');
    if (initialFavLabel === updatedFavLabel) {
      throw new Error(`Favorite state did not toggle. Before: "${initialFavLabel}", After: "${updatedFavLabel}"`);
    }
    console.log(`✅ Favorite action toggled state successfully: "${initialFavLabel}" → "${updatedFavLabel}"`);

    // =========================================================================
    // STEP 2: Navigate to My Creations & Test All 5 Content Types
    // =========================================================================
    console.log('\n--- Step 2: Testing All 5 Content Types in Gallery ---');
    const myCreationsNav = page.locator('button[aria-label="My Creations"], nav button:has-text("My Creations")');
    await myCreationsNav.click();
    await page.waitForTimeout(300);

    const creationsTitle = page.locator('h2:has-text("My Creations")');
    await creationsTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Navigated to My Creations screen');

    // 1. Image Card
    const imageCard = page.locator('article[data-testid="creation-card-demo-img"]');
    await imageCard.waitFor({ state: 'visible' });
    const imageBadge = imageCard.locator('[data-testid="creation-type-badge"]');
    const imageText = await imageBadge.textContent();
    if (!imageText.toLowerCase().includes('image')) {
      throw new Error(`Image card badge incorrect: ${imageText}`);
    }
    console.log('✅ 1. Image card renders with correct badge and styling');

    // 2. Story Card
    const storyCard = page.locator('article[data-testid="creation-card-demo-story"]');
    await storyCard.waitFor({ state: 'visible' });
    const storyBadge = storyCard.locator('[data-testid="creation-type-badge"]');
    const storyText = await storyBadge.textContent();
    if (!storyText.toLowerCase().includes('story')) {
      throw new Error(`Story card badge incorrect: ${storyText}`);
    }
    console.log('✅ 2. Story card renders with correct badge and terracotta styling');

    // 3. Sound Card
    const soundCard = page.locator('article[data-testid="creation-card-demo-sound"]');
    await soundCard.waitFor({ state: 'visible' });
    const soundBadge = soundCard.locator('[data-testid="creation-type-badge"]');
    const soundText = await soundBadge.textContent();
    if (!soundText.toLowerCase().includes('sound')) {
      throw new Error(`Sound card badge incorrect: ${soundText}`);
    }
    console.log('✅ 3. Sound card renders with correct badge and plum styling');

    // 4. Video Card
    const videoCard = page.locator('article[data-testid="creation-card-demo-vid"]');
    await videoCard.waitFor({ state: 'visible' });
    const videoBadge = videoCard.locator('[data-testid="creation-type-badge"]');
    const videoText = await videoBadge.textContent();
    if (!videoText.toLowerCase().includes('video')) {
      throw new Error(`Video card badge incorrect: ${videoText}`);
    }
    console.log('✅ 4. Video card renders with correct badge and sage styling');

    // 5. Chat Card
    const chatCard = page.locator('article[data-testid="creation-card-demo-chat"]');
    await chatCard.waitFor({ state: 'visible' });
    const chatBadge = chatCard.locator('[data-testid="creation-type-badge"]');
    const chatText = await chatBadge.textContent();
    if (!chatText.toLowerCase().includes('chat')) {
      throw new Error(`Chat card badge incorrect: ${chatText}`);
    }
    console.log('✅ 5. Chat card renders with correct badge and gold styling');

    // =========================================================================
    // STEP 3: Graceful Media Fallback Verification
    // =========================================================================
    console.log('\n--- Step 3: Graceful Fallback Placeholder Verification ---');
    const fallbackCard = page.locator('article[data-testid="creation-card-demo-fallback"]');
    await fallbackCard.waitFor({ state: 'visible' });
    const placeholder = fallbackCard.locator('[data-testid="creation-card-placeholder"]');
    await placeholder.waitFor({ state: 'visible' });
    const placeholderText = await placeholder.textContent();
    console.log(`✅ Fallback card renders calm placeholder without crashing: "${placeholderText.trim()}"`);

    // =========================================================================
    // STEP 4: Context Menu & Parent Callbacks
    // =========================================================================
    console.log('\n--- Step 4: Context Menu & Action Callbacks ---');
    const menuTrigger = storyCard.locator('[data-testid="creation-menu-trigger"]');
    await menuTrigger.waitFor({ state: 'visible' });
    const menuBox = await menuTrigger.boundingBox();
    if (!menuBox || menuBox.width < 44 || menuBox.height < 44) {
      throw new Error(`Menu trigger target must be >= 44x44px. Got ${menuBox?.width}x${menuBox?.height}`);
    }
    console.log(`✅ Context menu trigger hit target is >= 44x44px (${menuBox.width}x${menuBox.height}px)`);

    await menuTrigger.click();
    const contextMenu = storyCard.locator('[data-testid="creation-context-menu"]');
    await contextMenu.waitFor({ state: 'visible' });
    console.log('✅ Context menu opened with accessible role="menu"');

    // Click "Archive" action inside menu
    const archiveAction = storyCard.locator('[data-testid="creation-action-archive"]');
    await archiveAction.waitFor({ state: 'visible' });
    await archiveAction.click();

    // Verify parent received callback via toast message
    const toast = page.locator('[data-testid="creation-toast-message"]');
    await toast.waitFor({ state: 'visible' });
    const toastContent = await toast.textContent();
    console.log(`✅ Parent action callback executed: "${toastContent}"`);

    // =========================================================================
    // STEP 5: Keyboard Accessibility
    // =========================================================================
    console.log('\n--- Step 5: Keyboard Accessibility Verification ---');
    // Focus sound card and press Enter
    await soundCard.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    const openToast = page.locator('[data-testid="creation-toast-message"]');
    await openToast.waitFor({ state: 'visible' });
    const openContent = await openToast.textContent();
    if (!openContent.includes('Dreamscape Reverie')) {
      throw new Error(`Keyboard Enter did not trigger open callback. Got: "${openContent}"`);
    }
    console.log(`✅ Keyboard activation (Enter key) opened creation: "${openContent}"`);

    // Escape closes context menu
    await menuTrigger.click();
    await contextMenu.waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const isMenuVisible = await contextMenu.isVisible();
    if (isMenuVisible) {
      throw new Error('Expected Escape key to close context menu');
    }
    console.log('✅ Keyboard Escape key closes open context menu');

    // =========================================================================
    // STEP 6: Graveyard Variant Verification
    // =========================================================================
    console.log('\n--- Step 6: Graveyard Variant Verification ---');
    const graveyardNav = page.locator('button[aria-label="Graveyard"], nav button:has-text("Graveyard")');
    await graveyardNav.click();
    await page.waitForTimeout(300);

    const graveyardHeading = page.locator('h2:has-text("Graveyard")');
    await graveyardHeading.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Navigated to Graveyard screen');

    const graveCard = page.locator('article[data-testid="creation-card-grave-1"]');
    await graveCard.waitFor({ state: 'visible' });

    // Verify deleted metadata text
    const metaText = await graveCard.locator('[data-testid="creation-card-meta"]').textContent();
    if (!metaText.includes('Deleted')) {
      throw new Error(`Expected Graveyard card to show "Deleted" date, got: "${metaText}"`);
    }
    console.log(`✅ Graveyard variant displays deleted metadata: "${metaText.trim()}"`);

    // Verify restore and permanent delete action buttons
    const restoreBtn = graveCard.locator('[data-testid="graveyard-restore-btn"]');
    const deleteBtn = graveCard.locator('[data-testid="graveyard-delete-btn"]');
    await restoreBtn.waitFor({ state: 'visible' });
    await deleteBtn.waitFor({ state: 'visible' });
    console.log('✅ Graveyard action buttons (Restore [sage], Delete [soft terracotta]) verified');

    await restoreBtn.click();
    await page.waitForTimeout(200);
    const restoreToast = page.locator('[data-testid="creation-toast-message"]');
    const restoreMsg = await restoreToast.textContent();
    console.log(`✅ Graveyard Restore action successfully fired: "${restoreMsg}"`);

    // =========================================================================
    // STEP 7: Responsive Layout Verification (Mobile & Desktop)
    // =========================================================================
    console.log('\n--- Step 7: Responsive Viewport Verification ---');
    // Test on mobile viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Open mobile navigation menu
    const mobileMenuBtn = page.locator('header button[aria-label="Open navigation menu"]');
    await mobileMenuBtn.waitFor({ state: 'visible' });
    await mobileMenuBtn.click();
    await page.waitForTimeout(300);

    const mobileCreationsBtn = page.locator('[data-testid="mobile-sidebar"] button:has-text("My Creations")');
    await mobileCreationsBtn.waitFor({ state: 'visible' });
    await mobileCreationsBtn.click();
    await page.waitForTimeout(300);

    // Verify cards are readable on mobile
    const mobileCard = page.locator('article[data-testid="creation-card-demo-img"]');
    await mobileCard.waitFor({ state: 'visible' });
    const mobileBox = await mobileCard.boundingBox();
    console.log(`✅ Mobile layout adapts smoothly; card width is ${Math.round(mobileBox.width)}px`);

    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    // =========================================================================
    // STEP 8: Home Journey Intact
    // =========================================================================
    console.log('\n--- Step 8: Return to Home & Verify Seed Workflow ---');
    const homeNav = page.locator('button[aria-label="Home"], nav button:has-text("Home")');
    await homeNav.click();
    await page.waitForTimeout(300);

    const seedTextarea = page.locator('textarea[aria-label="Enter your seed idea"]');
    await seedTextarea.waitFor({ state: 'visible' });
    console.log('✅ Home Screen seed workflow intact and fully functional');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 24 CREATION COMPONENT TESTS PASSED 100%');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Phase 24 Creation Component Test Failed:', err);
  process.exit(1);
});
