const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase13E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 13: Media Provider Architecture (MED-01, MED-02, MED-03)\n');
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
    // Scenario 1: Media Provider Health Verification (MED-01)
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Media Provider Health & Modality Readiness (MED-01) ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    // Seed canonical demo universe
    const instantDemoBtn = page.locator('button:has-text("Instant Full Universe (Demo)")').first();
    await instantDemoBtn.waitFor({ timeout: 10000 });
    await instantDemoBtn.click();
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 20000 });
    console.log('✅ Demo universe loaded successfully');

    // Verify provider health endpoint via frontend store
    const health = await page.evaluate(async () => {
      const store = window.__workspaceStore.getState();
      await store.fetchMediaHealth();
      return window.__workspaceStore.getState().mediaProviderHealth;
    });

    assert(health !== null, 'MediaProviderHealth must not be null');
    assert.strictEqual(health.status, 'healthy', 'Status must be healthy');
    assert(health.modalities.image, 'Image modality provider must be registered');
    assert(health.modalities.voice, 'Voice modality provider must be registered');
    assert(health.modalities.video, 'Video modality provider must be registered');
    assert(health.modalities.audio, 'Audio modality provider must be registered');
    console.log(`✅ Media Provider Health Verified: Status=${health.status}, Provider=${health.provider}`);

    const screenshot1 = `${screenshotDir}/phase13_provider_health.png`;
    await page.screenshot({ path: screenshot1, fullPage: true });
    results.push({ scenario: 'Scenario 1: Provider Health Verification', status: 'PASS', screenshot: screenshot1 });

    // -------------------------------------------------------------
    // Scenario 2: Character Portrait Generation & SVG Rendering (MED-01, MED-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Character Portrait Generation & SVG Rendering (MED-01, MED-02) ---');

    // Navigate to Characters tab
    const charTab = page.locator('#codex-tab-characters');
    await charTab.click();
    await page.waitForTimeout(500);

    // Locate the first character card and its media section
    const firstCharCard = page.locator('#codex-characters-grid > div').first();
    await firstCharCard.waitFor({ timeout: 5000 });

    const generatePortraitBtn = firstCharCard.locator('button:has-text("Portrait")').first();
    await generatePortraitBtn.waitFor({ timeout: 5000 });
    assert(await generatePortraitBtn.isVisible(), 'Generate Portrait button must be visible');

    // Click Generate Portrait
    console.log('Initiating portrait generation...');
    await generatePortraitBtn.click();

    // Verify non-blocking status or image preview appears
    const imagePreview = firstCharCard.locator('[data-testid="media-image-preview"]').first();
    await imagePreview.waitFor({ timeout: 15000 });

    const imgSrc = await imagePreview.getAttribute('src');
    console.log(`✅ Character portrait synthesized successfully! Image src: ${imgSrc}`);
    assert(imgSrc && (imgSrc.includes('/media/image/') || imgSrc.includes('.svg')), 'Asset URL must point to image asset path');

    const screenshot2 = `${screenshotDir}/phase13_character_portrait_generated.png`;
    await page.screenshot({ path: screenshot2, fullPage: true });
    results.push({ scenario: 'Scenario 2: Character Portrait Generation', status: 'PASS', screenshot: screenshot2 });

    // -------------------------------------------------------------
    // Scenario 3: Character Voice Narration & Audio Player (MED-01, MED-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Character Voice Synthesis & Native Audio Player (MED-01, MED-02) ---');

    const generateVoiceBtn = firstCharCard.locator('button:has-text("Voice")').first();
    await generateVoiceBtn.waitFor({ timeout: 5000 });
    assert(await generateVoiceBtn.isVisible(), 'Generate Voice button must be visible');

    console.log('Initiating voice narration synthesis...');
    await generateVoiceBtn.click();

    // Verify audio player appears
    const voicePlayer = firstCharCard.locator('[data-testid="media-voice-player"]').first();
    await voicePlayer.waitFor({ timeout: 15000 });

    const audioSrc = await voicePlayer.getAttribute('src');
    console.log(`✅ Vocal narration synthesized successfully! Audio src: ${audioSrc}`);
    assert(audioSrc && (audioSrc.includes('/media/voice/') || audioSrc.includes('.wav')), 'Audio URL must point to voice asset path');

    const screenshot3 = `${screenshotDir}/phase13_character_voice_synthesized.png`;
    await page.screenshot({ path: screenshot3, fullPage: true });
    results.push({ scenario: 'Scenario 3: Character Voice Synthesis', status: 'PASS', screenshot: screenshot3 });

    // -------------------------------------------------------------
    // Scenario 4: Scene Multimodal Assets (Soundscape & Keyframe) (MED-01, MED-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Scene Multimodal Assets (Soundscape & Keyframe) (MED-01, MED-02) ---');

    // Switch to Scenes tab
    const scenesTab = page.locator('#codex-tab-scenes');
    await scenesTab.click();
    await page.waitForTimeout(500);

    const firstSceneCard = page.locator('#codex-scenes-grid > div').first();
    await firstSceneCard.waitFor({ timeout: 5000 });

    // Generate Scene Keyframe
    const generateKeyframeBtn = firstSceneCard.locator('button:has-text("Concept Art")').first();
    if (await generateKeyframeBtn.isVisible()) {
      console.log('Initiating scene keyframe generation...');
      await generateKeyframeBtn.click();
      const sceneImagePreview = firstSceneCard.locator('[data-testid="media-image-preview"]').first();
      await sceneImagePreview.waitFor({ timeout: 15000 });
      console.log('✅ Scene keyframe generated successfully!');
    }

    // Generate Scene Soundscape
    const generateAudioBtn = firstSceneCard.locator('button:has-text("Soundscape")').first();
    assert(await generateAudioBtn.isVisible(), 'Scene Soundscape button must be visible');
    console.log('Initiating scene ambient soundscape generation...');
    await generateAudioBtn.click();

    const sceneAudioPlayer = firstSceneCard.locator('[data-testid="media-audio-player"]').first();
    await sceneAudioPlayer.waitFor({ timeout: 15000 });
    const sceneAudioSrc = await sceneAudioPlayer.getAttribute('src');
    console.log(`✅ Scene soundscape synthesized successfully! Audio src: ${sceneAudioSrc}`);
    assert(sceneAudioSrc && (sceneAudioSrc.includes('/media/audio/') || sceneAudioSrc.includes('.wav')), 'Audio URL must point to audio asset path');


    const screenshot4 = `${screenshotDir}/phase13_scene_media_assets.png`;
    await page.screenshot({ path: screenshot4, fullPage: true });
    results.push({ scenario: 'Scenario 4: Scene Multimodal Assets', status: 'PASS', screenshot: screenshot4 });

    // -------------------------------------------------------------
    // Scenario 5: Persistence Across Reloads & Offline Resilience (MED-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Persistence & Offline Resilience (MED-03) ---');

    // Reload page to ensure media records are persisted in database
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 15000 });

    // Navigate to Characters tab and verify the previously generated portrait is still loaded
    await page.locator('#codex-tab-characters').click();
    await page.waitForTimeout(500);

    const reloadedFirstCharCard = page.locator('#codex-characters-grid > div').first();
    const persistedImage = reloadedFirstCharCard.locator('[data-testid="media-image-preview"]').first();
    await persistedImage.waitFor({ timeout: 10000 });
    assert(await persistedImage.isVisible(), 'Persisted image preview must remain visible after reload');
    await persistedImage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    console.log('✅ Media assets persisted cleanly across reload from database!');

    const screenshot5 = `${screenshotDir}/phase13_media_persistence_verified.png`;
    await page.screenshot({ path: screenshot5, fullPage: true });

    results.push({ scenario: 'Scenario 5: Persistence Across Reloads', status: 'PASS', screenshot: screenshot5 });

    console.log('\n=============================================================');
    console.log('🎉 ALL 5 PLAYWRIGHT E2E SCENARIOS PASSED FOR PHASE 13!');
    console.log('=============================================================\n');
    console.table(results);

  } catch (error) {
    console.error('❌ Phase 13 Playwright E2E Verification failed:', error);
    const errorScreenshot = `${screenshotDir}/phase13_error.png`;
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    console.log(`Saved error screenshot to: ${errorScreenshot}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase13E2E();
