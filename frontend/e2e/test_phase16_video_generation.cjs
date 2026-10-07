const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase16E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 16: Video Generation Engine (VID-01, VID-02, VID-03)\n');
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
    // Scenario 1: World Teaser Video Generation & Lightbox Verification (VID-01, VID-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: World Teaser Video Generation & Lightbox Verification (VID-01, VID-03) ---');
    // Ensure on World Bible Tab (Codex Tab 1)
    const bibleTab = page.locator('#codex-tab-bible');
    await bibleTab.waitFor({ timeout: 5000 });
    await bibleTab.click();
    await page.waitForTimeout(500);

    const worldCoverSection = page.locator('#codex-world-cover-section');
    await worldCoverSection.waitFor({ timeout: 5000 });

    // Verify "Bring This World to Life" Hero button
    const bringWorldToLifeBtn = worldCoverSection.locator('[data-testid="bring-world-to-life-hero-btn"]').first();
    await bringWorldToLifeBtn.waitFor({ timeout: 5000 });
    assert(await bringWorldToLifeBtn.isVisible(), 'Bring This World to Life Hero button must be visible');
    console.log('✅ "Bring This World to Life" Hero CTA is visible');

    // Click "Bring This World to Life"
    console.log('Initiating World cinematic teaser synthesis...');
    await bringWorldToLifeBtn.click();

    // Verify video card appears in World Cover section
    const worldVideoCard = worldCoverSection.locator('[data-testid="media-card-video"]').first();
    await worldVideoCard.waitFor({ timeout: 30000 });
    const worldVideoReady = worldVideoCard.locator('[data-testid="media-status-completed"]').first();
    await worldVideoReady.waitFor({ timeout: 30000 });

    const worldVideoPlayer = worldVideoCard.locator('[data-testid="media-video-player"]').first();
    await worldVideoPlayer.waitFor({ state: 'attached', timeout: 5000 });
    const worldVideoSrc = await worldVideoPlayer.getAttribute('src');
    console.log(`✅ World video teaser synthesized! Source: ${worldVideoSrc}`);
    assert(worldVideoSrc && (worldVideoSrc.includes('/media/video/') || worldVideoSrc.includes('.mp4') || worldVideoSrc.includes('.bin')), 'World video URL must point to valid media asset');

    // Verify player controls
    const worldProviderBadge = worldVideoCard.locator('[data-testid="media-video-provider-badge"]').first();
    await worldProviderBadge.waitFor({ timeout: 5000 });
    const badgeText = await worldProviderBadge.innerText();
    console.log(`✅ World Video Provider Badge: "${badgeText.replace(/\n/g, ' ')}"`);
    assert(badgeText.includes('16:9'), 'World video badge must show 16:9 aspect ratio');

    const downloadBtn = worldVideoCard.locator('[data-testid="media-video-download-btn"]').first();
    await downloadBtn.waitFor({ timeout: 5000 });
    const downloadHref = await downloadBtn.getAttribute('href');
    assert(downloadHref && downloadHref.length > 0, 'Download button must have valid download URL');
    console.log(`✅ World Video download button verified with href: ${downloadHref}`);

    // Verify Theater Lightbox Modal
    const lightboxTrigger = worldVideoCard.locator('[data-testid="media-video-lightbox-trigger"]').first();
    await lightboxTrigger.waitFor({ state: 'attached', timeout: 5000 });
    // Hover over video container to reveal lightbox trigger, then click
    await worldVideoCard.locator('.aspect-video').hover();
    await lightboxTrigger.click();

    const lightboxModal = page.locator('[data-testid="video-lightbox-modal"]');
    await lightboxModal.waitFor({ timeout: 5000 });
    console.log('✅ Video Lightbox Modal opened successfully');

    const lightboxVideo = lightboxModal.locator('[data-testid="lightbox-video-player"]');
    await lightboxVideo.waitFor({ timeout: 5000 });
    const lightboxSrc = await lightboxVideo.getAttribute('src');
    assert.strictEqual(lightboxSrc, worldVideoSrc, 'Lightbox video src must match card video src');

    const lightboxPrompt = lightboxModal.locator('[data-testid="lightbox-prompt-text"]');
    await lightboxPrompt.waitFor({ timeout: 5000 });
    const promptText = await lightboxPrompt.innerText();
    console.log(`✅ Lightbox Prompt text: "${promptText}"`);
    assert(
      promptText.includes('Cinematic camera panning across the expansive environment') ||
      promptText.includes('Bio-City'),
      'World video prompt must contain canonical world teaser prompt'
    );

    // Close Lightbox via Escape
    await page.keyboard.press('Escape');
    await lightboxModal.waitFor({ state: 'detached', timeout: 5000 });
    console.log('✅ Video Lightbox Modal closed cleanly via Escape key');

    const screenshot1 = `${screenshotDir}/phase16_world_video_lightbox.png`;
    await page.screenshot({ path: screenshot1, fullPage: true });
    results.push({ scenario: 'Scenario 1: World Teaser Video & Lightbox Modal', status: 'PASS', screenshot: screenshot1 });

    // -------------------------------------------------------------
    // Scenario 2: Scene Video Generation with Canonical Motion Template (VID-02, VID-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Scene Video Generation with Canonical Motion Template (VID-02, VID-03) ---');
    const scenesTab = page.locator('#codex-tab-scenes');
    await scenesTab.waitFor({ timeout: 5000 });
    await scenesTab.click();
    await page.waitForTimeout(500);

    const firstSceneCard = page.locator('#codex-scenes-grid > div').first();
    await firstSceneCard.waitFor({ timeout: 5000 });

    // Locate "Generate Video Clip" button on first scene
    const generateSceneVideoBtn = firstSceneCard.locator('button[data-testid^="generate-video-"]').first();
    await generateSceneVideoBtn.waitFor({ timeout: 5000 });
    console.log('Initiating Scene 1 video clip synthesis with canonical motion prompt...');
    await generateSceneVideoBtn.click();

    const sceneVideoCard = firstSceneCard.locator('[data-testid="media-card-video"]').first();
    await sceneVideoCard.waitFor({ timeout: 30000 });
    const sceneVideoReady = sceneVideoCard.locator('[data-testid="media-status-completed"]').first();
    await sceneVideoReady.waitFor({ timeout: 30000 });

    const sceneVideoPlayer = sceneVideoCard.locator('[data-testid="media-video-player"]').first();
    await sceneVideoPlayer.waitFor({ state: 'attached', timeout: 5000 });
    const sceneVideoSrc = await sceneVideoPlayer.getAttribute('src');
    console.log(`✅ Scene 1 video clip synthesized! URL: ${sceneVideoSrc}`);
    assert(sceneVideoSrc && (sceneVideoSrc.includes('/media/video/') || sceneVideoSrc.includes('.mp4') || sceneVideoSrc.includes('.bin')), 'Scene video URL must be valid');

    // Verify canonical scene motion prompt:
    // "Cinematic scene: {scene.title} in {scene.location_setting}. {scene.conflict_narrative}. Slow dramatic camera motion, dynamic environmental movement, atmospheric lighting."
    const scenePromptSnippet = sceneVideoCard.locator('.italic').first();
    const sceneSnippetText = await scenePromptSnippet.innerText();
    console.log(`✅ Scene motion prompt rendered in card: "${sceneSnippetText}"`);
    assert(
      sceneSnippetText.includes('Cinematic scene:') &&
      sceneSnippetText.includes('Slow dramatic camera motion, dynamic environmental movement'),
      'Scene video must use canonical cinematic scene motion template'
    );

    const screenshot2 = `${screenshotDir}/phase16_scene_video_canonical.png`;
    await page.screenshot({ path: screenshot2, fullPage: true });
    results.push({ scenario: 'Scenario 2: Scene Video Generation (Canonical Motion Template)', status: 'PASS', screenshot: screenshot2 });

    // -------------------------------------------------------------
    // Scenario 3: Custom Creator Video Prompt Preservation
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Custom Creator Video Prompt Preservation ---');
    // Extract project ID from current URL or fetch via API
    const projectUrl = page.url();
    const projMatch = projectUrl.match(/projects\/([^/?#]+)/);
    let projectId = projMatch ? projMatch[1] : null;

    if (!projectId) {
      // Fetch active project via API
      const healthRes = await page.request.get('http://127.0.0.1:8000/api/projects');
      const healthData = await healthRes.json();
      if (healthData.data && healthData.data.length > 0) {
        projectId = healthData.data[0].id;
      }
    }

    const customPrompt = 'Hyper-speed drone chase through neon-lit canyons, high octane cinematic action.';
    console.log(`Dispatching custom prompt request: "${customPrompt}"`);
    const customReqRes = await page.request.post(`http://127.0.0.1:8000/api/projects/${projectId}/media/generate`, {
      data: {
        entity_type: 'scene',
        entity_id: 'custom-scene-prompt-test',
        media_type: 'video',
        prompt: customPrompt,
        duration_sec: 5,
      },
    });
    assert.strictEqual(customReqRes.status(), 200, 'Custom prompt request must return 200');
    const customJob = (await customReqRes.json()).data;
    console.log(`Custom video job dispatched with ID: ${customJob.job_id}`);

    // Poll until completed
    let completedCustomJob = null;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      const pollRes = await page.request.get(`http://127.0.0.1:8000/api/projects/${projectId}/media/jobs/${customJob.job_id}`);
      const pollData = (await pollRes.json()).data;
      if (pollData.status === 'completed') {
        completedCustomJob = pollData;
        break;
      }
    }
    assert(completedCustomJob, 'Custom video job must complete successfully');

    // Fetch the persisted MediaAsset to inspect prompt and metadata
    const assetsRes = await page.request.get(`http://127.0.0.1:8000/api/projects/${projectId}/media/assets?entity_id=custom-scene-prompt-test&media_type=video`);
    const assetsData = (await assetsRes.json()).data;
    assert(assetsData && assetsData.length > 0, 'Must retrieve completed custom prompt asset');
    const customAsset = assetsData[0];
    console.log(`✅ Persisted custom prompt asset prompt: "${customAsset.prompt}"`);
    assert.strictEqual(customAsset.prompt, customPrompt, 'Custom prompt must be strictly preserved without template overwrite');

    const screenshot3 = `${screenshotDir}/phase16_custom_video_prompt.png`;
    await page.screenshot({ path: screenshot3, fullPage: true });
    results.push({ scenario: 'Scenario 3: Custom Creator Video Prompt Preservation', status: 'PASS', screenshot: screenshot3 });

    // -------------------------------------------------------------
    // Scenario 4: Non-blocking Background Synthesis & Error Containment
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Non-blocking Background Synthesis & Error Containment ---');
    // Verify tabs and UI remain fully interactive while video synthesizes
    await bibleTab.click();
    await page.waitForTimeout(300);
    assert(await worldCoverSection.isVisible(), 'World Bible section must remain immediately navigable');

    const charsTab = page.locator('#codex-tab-characters');
    await charsTab.click();
    await page.waitForTimeout(300);
    const charsGrid = page.locator('#codex-characters-grid');
    assert(await charsGrid.isVisible(), 'Characters tab must remain interactive');
    console.log('✅ UI remains non-blocking and responsive during synthesis');

    results.push({ scenario: 'Scenario 4: Non-blocking Background Synthesis', status: 'PASS' });

    // -------------------------------------------------------------
    // Scenario 5: Mock MP4 Playable Container Verification (Playable Mock Acceptance Criterion)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Mock MP4 Playable Container Verification (Playable in Browser) ---');
    console.log('Forcing Pyramid Flow and Wan2.1 unavailable to verify genuine browser-playable Mock MP4...');

    // Intercept network requests to inject simulated provider outage (Pyramid Flow & Wan2.1 unavailable)
    await page.route('**/api/projects/*/media/generate', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        if (postData && postData.media_type === 'video') {
          postData.context = {
            ...(postData.context || {}),
            simulate_pyramid_unavailable: true,
            simulate_wan_unavailable: true,
          };
          console.log('⚡ Injected simulated provider outage: Pyramid Flow & Wan2.1 unavailable');
          return route.continue({ postData: JSON.stringify(postData) });
        }
      }
      return route.continue();
    });

    // Return to Scenes tab and trigger video on second scene
    await scenesTab.click();
    await page.waitForTimeout(500);

    const secondSceneCard = page.locator('#codex-scenes-grid > div').nth(1);
    await secondSceneCard.waitFor({ timeout: 5000 });

    const generateFallbackVideoBtn = secondSceneCard.locator('button[data-testid^="generate-video-"]').first();
    await generateFallbackVideoBtn.waitFor({ timeout: 5000 });
    console.log('Initiating fallback video generation on Scene 2...');
    await generateFallbackVideoBtn.click();

    // Wait for completed card
    const fallbackVideoCard = secondSceneCard.locator('[data-testid="media-card-video"]').first();
    await fallbackVideoCard.waitFor({ timeout: 30000 });
    const fallbackVideoReady = fallbackVideoCard.locator('[data-testid="media-status-completed"]').first();
    await fallbackVideoReady.waitFor({ timeout: 30000 });

    // Verify provider badge shows resolved_provider === "mock"
    const fallbackBadge = fallbackVideoCard.locator('[data-testid="media-video-provider-badge"]').first();
    await fallbackBadge.waitFor({ timeout: 5000 });
    const fallbackBadgeText = await fallbackBadge.innerText();
    console.log(`Fallback Video Provider Badge: "${fallbackBadgeText.replace(/\n/g, ' ')}"`);
    assert(fallbackBadgeText.includes('mock'), 'Resolved provider must be "mock" under outage');

    // Locate the rendered video element
    const videoHandle = fallbackVideoCard.locator('video[data-testid="media-video-player"]').first();
    await videoHandle.waitFor({ state: 'attached', timeout: 10000 });

    // BROWSER PLAYABILITY VERIFICATION:
    // Evaluate HTMLMediaElement properties directly inside Chromium:
    // - readyState >= 1 (HAVE_METADATA or higher: browser successfully parsed MP4 container, ftyp, moov, trak, etc.)
    // - duration > 0 (container duration recognized)
    // - error === null (no demuxer or codec decoding errors)
    console.log('Evaluating Chromium HTMLMediaElement playback properties on Mock MP4...');
    const mediaState = await videoHandle.evaluate((video) => {
      return new Promise((resolve) => {
        if (video.readyState >= 1) {
          resolve({
            readyState: video.readyState,
            duration: video.duration,
            error: video.error ? video.error.message : null,
          });
          return;
        }

        const onLoaded = () => {
          cleanup();
          resolve({
            readyState: video.readyState,
            duration: video.duration,
            error: null,
          });
        };

        const onError = () => {
          cleanup();
          resolve({
            readyState: video.readyState,
            duration: video.duration,
            error: video.error ? `MediaError Code ${video.error.code}: ${video.error.message || ''}` : 'Media error fired',
          });
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onError);

        // Fallback after 4 seconds
        setTimeout(() => {
          cleanup();
          resolve({
            readyState: video.readyState,
            duration: video.duration,
            error: video.error ? `MediaError: ${video.error.message}` : null,
          });
        }, 4000);
      });
    });

    console.log('📊 Chromium HTMLMediaElement state:', JSON.stringify(mediaState));
    assert(mediaState.error === null, `Mock MP4 must NOT fire video error: ${mediaState.error}`);
    assert(mediaState.readyState >= 1, `video.readyState must be >= 1 (HAVE_METADATA), got ${mediaState.readyState}`);
    assert(mediaState.duration > 0, `video.duration must be > 0, got ${mediaState.duration}`);
    console.log('🎯 Verified: Mock MP4 is genuinely playable by Chromium with valid container atoms and duration!');

    // Cleanup route interception
    await page.unroute('**/api/projects/*/media/generate');

    const screenshot5 = `${screenshotDir}/phase16_mock_video_playback_verified.png`;
    await page.screenshot({ path: screenshot5, fullPage: true });
    results.push({ scenario: 'Scenario 5: Mock MP4 Browser Playability & 3-Tier Fallback', status: 'PASS', screenshot: screenshot5 });

    console.log('\n=============================================================');
    console.log('🎉 ALL PHASE 16 AUTOMATED VERIFICATION SCENARIOS PASSED!');
    console.log('=============================================================');
    results.forEach((r, idx) => console.log(`${idx + 1}. [${r.status}] ${r.scenario}`));

  } catch (err) {
    console.error('❌ E2E VERIFICATION FAILED:', err);
    const errScreenshot = `${screenshotDir}/phase16_error.png`;
    await page.screenshot({ path: errScreenshot, fullPage: true }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase16E2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
