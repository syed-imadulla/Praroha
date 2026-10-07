const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase17E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 17: Audio & Atmosphere Subsystem\n');
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
    // Scenario 1: World Ambient Soundscape Generation & In-Card Player (AUD-01)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: World Ambient Soundscape Generation & In-Card Player (AUD-01) ---');
    const bibleTab = page.locator('#codex-tab-bible');
    await bibleTab.waitFor({ timeout: 5000 });
    await bibleTab.click();
    await page.waitForTimeout(500);

    const worldCoverSection = page.locator('#codex-world-cover-section');
    await worldCoverSection.waitFor({ timeout: 5000 });

    // Look for audio generation button in World Cover section
    const generateAudioBtn = worldCoverSection.locator('button[data-testid^="generate-audio-"]').first();
    await generateAudioBtn.waitFor({ timeout: 5000 });
    console.log('Initiating World ambient soundscape synthesis...');
    await generateAudioBtn.click();

    // Verify audio card appears and reaches completed status
    const worldAudioCard = worldCoverSection.locator('[data-testid="media-card-audio"]').first();
    await worldAudioCard.waitFor({ timeout: 30000 });
    const worldAudioReady = worldAudioCard.locator('[data-testid="media-status-completed"]').first();
    await worldAudioReady.waitFor({ timeout: 30000 });
    console.log('✅ World audio soundscape synthesized successfully');

    // Verify player controls
    const playPauseBtn = worldAudioCard.locator('[data-testid="media-audio-play-pause-btn"]').first();
    await playPauseBtn.waitFor({ timeout: 5000 });
    assert(await playPauseBtn.isVisible(), 'Play/Pause button must be visible');

    const progressSlider = worldAudioCard.locator('[data-testid="media-audio-progress"]').first();
    await progressSlider.waitFor({ timeout: 5000 });
    assert(await progressSlider.isVisible(), 'Progress slider must be visible');

    const inCardVolume = worldAudioCard.locator('[data-testid="media-audio-volume"]').first();
    await inCardVolume.waitFor({ timeout: 5000 });
    assert(await inCardVolume.isVisible(), 'In-card volume slider must be visible');

    const moodBadge = worldAudioCard.locator('[data-testid="media-audio-mood-badge"]').first();
    await moodBadge.waitFor({ timeout: 5000 });
    const moodText = await moodBadge.innerText();
    console.log(`✅ Audio Mood Badge: "${moodText}"`);

    const providerBadge = worldAudioCard.locator('[data-testid="media-audio-provider-badge"]').first();
    await providerBadge.waitFor({ timeout: 5000 });
    const providerBadgeText = await providerBadge.innerText();
    console.log(`✅ Audio Provider Badge: "${providerBadgeText.replace(/\n/g, ' ')}"`);

    // Verify download action uses correct extension derived from mime_type (.wav or .mp3)
    const downloadBtn = worldAudioCard.locator('[data-testid="media-audio-download-btn"]').first();
    await downloadBtn.waitFor({ timeout: 5000 });
    const downloadHref = await downloadBtn.getAttribute('href');
    const downloadAttr = await downloadBtn.getAttribute('download');
    console.log(`✅ Download button href: ${downloadHref}, filename: ${downloadAttr}`);
    assert(downloadAttr && (downloadAttr.endsWith('.wav') || downloadAttr.endsWith('.mp3')), 'Download filename must end with valid audio extension');

    // Verify send to deck button
    const sendToDeckBtn = worldAudioCard.locator('[data-testid="media-audio-send-to-deck-btn"]').first();
    await sendToDeckBtn.waitFor({ timeout: 5000 });
    assert(await sendToDeckBtn.isVisible(), 'Send to Deck button must be visible');

    await page.screenshot({ path: `${screenshotDir}/phase17_world_soundscape_generated.png` });
    results.push({ scenario: 'Scenario 1: World Soundscape & In-Card Player', status: 'PASS' });

    // -------------------------------------------------------------
    // Scenario 2: Scene Dramatic Underscore with Curated Mood Preset (AUD-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Scene Dramatic Underscore with Curated Mood Preset (AUD-02) ---');
    const scenesTab = page.locator('#codex-tab-scenes');
    await scenesTab.waitFor({ timeout: 5000 });
    await scenesTab.click();
    await page.waitForTimeout(500);

    const firstSceneCard = page.locator('#codex-scenes-grid > div').first();
    await firstSceneCard.waitFor({ timeout: 5000 });

    // Select mood preset: tense-dramatic
    const sceneMoodSelector = firstSceneCard.locator('select[data-testid^="audio-mood-selector-"]').first();
    await sceneMoodSelector.waitFor({ timeout: 5000 });
    await sceneMoodSelector.selectOption('tense-dramatic');
    console.log('Selected mood preset: tense-dramatic');

    // Generate scene audio
    const generateSceneAudioBtn = firstSceneCard.locator('button[data-testid^="generate-audio-"]').first();
    await generateSceneAudioBtn.waitFor({ timeout: 5000 });
    await generateSceneAudioBtn.click();

    const sceneAudioCard = firstSceneCard.locator('[data-testid="media-card-audio"]').first();
    await sceneAudioCard.waitFor({ timeout: 30000 });
    const sceneAudioReady = sceneAudioCard.locator('[data-testid="media-status-completed"]').first();
    await sceneAudioReady.waitFor({ timeout: 30000 });

    const sceneMoodBadge = sceneAudioCard.locator('[data-testid="media-audio-mood-badge"]').first();
    const sceneMoodText = await sceneMoodBadge.innerText();
    console.log(`✅ Scene Audio Mood Badge: "${sceneMoodText}"`);
    assert(sceneMoodText.toLowerCase().includes('tense') || sceneMoodText.toLowerCase().includes('dramatic'), 'Mood badge must reflect tense-dramatic preset');

    await page.screenshot({ path: `${screenshotDir}/phase17_scene_underscore_generated.png` });
    results.push({ scenario: 'Scenario 2: Scene Underscore & Mood Preset', status: 'PASS' });

    // -------------------------------------------------------------
    // Scenario 3: Custom Creator Acoustic Prompt Preservation (AUD-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Custom Creator Acoustic Prompt Preservation (AUD-03) ---');
    const customPromptText = 'Ethereal underwater glass harp harmony with resonant sub-frequencies';
    const directRes = await page.evaluate(async (prompt) => {
      const store = window.__workspaceStore.getState();
      const projectId = store.activeProject.id;
      const res = await fetch(`/api/projects/${projectId}/media/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'world',
          entity_id: 'custom-world-audio',
          media_type: 'audio',
          prompt: prompt,
          mood: 'mystic-ethereal',
          duration_sec: 15,
        }),
      });
      const data = await res.json();
      return data;
    }, customPromptText);

    assert(directRes.success && directRes.data && directRes.data.job_id, 'Direct audio generation dispatch must succeed');
    console.log(`Dispatched custom prompt job: ${directRes.data.job_id}`);

    // Poll until completed
    let completedCustomAsset = null;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      const pollRes = await page.evaluate(async (jobId) => {
        const store = window.__workspaceStore.getState();
        const res = await fetch(`/api/projects/${store.activeProject.id}/media/jobs/${jobId}`);
        return await res.json();
      }, directRes.data.job_id);

      if (pollRes.success && pollRes.data && (pollRes.data.status === 'completed' || pollRes.data.status === 'failed')) {
        completedCustomAsset = pollRes.data;
        break;
      }
    }

    assert(completedCustomAsset && completedCustomAsset.status === 'completed', 'Custom prompt audio asset must complete');

    // Query asset directly to verify prompt was preserved exactly
    const assetQueryRes = await page.evaluate(async (jobId) => {
      const store = window.__workspaceStore.getState();
      const res = await fetch(`/api/projects/${store.activeProject.id}/media/assets?entity_id=custom-world-audio&media_type=audio`);
      return await res.json();
    }, directRes.data.job_id);

    assert(assetQueryRes.success && assetQueryRes.data && assetQueryRes.data.length > 0, 'Must retrieve custom asset');
    const savedCustomPrompt = assetQueryRes.data[0].prompt;
    console.log(`✅ Saved Asset Prompt: "${savedCustomPrompt}"`);
    assert.strictEqual(savedCustomPrompt, customPromptText, 'Creator prompt must be strictly preserved without alteration');
    results.push({ scenario: 'Scenario 3: Custom Acoustic Prompt Preservation', status: 'PASS' });

    // -------------------------------------------------------------
    // Scenario 4: Persistent Atmosphere Deck, Multi-Stream Blocker Set Ducking & Real Audio Element Inspection (AUD-04)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Atmosphere Deck, Category Blocker Ducking & Real audio.volume Inspection (AUD-04) ---');
    // Return to World Bible tab
    await bibleTab.click();
    await page.waitForTimeout(500);

    const worldCover = page.locator('#codex-world-cover-section');
    await worldCover.waitFor({ timeout: 5000 });
    const deckBtn = worldCover.locator('[data-testid="media-audio-send-to-deck-btn"]').first();
    await deckBtn.waitFor({ timeout: 5000 });

    // Send world soundscape to Atmosphere Deck
    await deckBtn.click();
    console.log('Clicked "Send to Deck"');

    const atmosphereDeckBar = page.locator('[data-testid="atmosphere-deck-bar"]');
    await atmosphereDeckBar.waitFor({ timeout: 5000 });
    assert(await atmosphereDeckBar.isVisible(), 'Atmosphere Deck bar must be docked and visible');
    console.log('✅ Atmosphere Deck bar is docked at bottom');

    // Helper to inspect actual DOM audio element volume
    const getRealAudioVolume = async () => {
      return await page.evaluate(() => {
        const audio = document.querySelector('[data-testid="atmosphere-deck-audio-element"]');
        return audio ? audio.volume : null;
      });
    };

    // Helper to get stored master volume
    const getStoredMasterVolume = async () => {
      return await page.evaluate(() => window.__workspaceStore.getState().atmosphereMasterVolume);
    };

    // 1. Set master volume to 0.35 (35%)
    await page.evaluate(() => window.__workspaceStore.getState().setAtmosphereMasterVolume(0.35));
    await page.waitForTimeout(200);

    let currentVol = await getRealAudioVolume();
    console.log(`Initial volume with 0 blockers: ${currentVol}`);
    assert(Math.abs(currentVol - 0.35) < 0.01, `Expected volume ~0.35, got ${currentVol}`);

    // 2. Voice narration starts (category "voice" registered)
    console.log('Registering category "voice" blocker...');
    await page.evaluate(() => window.__workspaceStore.getState().registerMediaBlocker('voice'));
    await page.waitForTimeout(200);

    const duckingIndicator = page.locator('[data-testid="atmosphere-ducking-indicator"]');
    await duckingIndicator.waitFor({ timeout: 5000 });
    assert(await duckingIndicator.isVisible(), 'Ducking indicator must be visible when voice is active');

    currentVol = await getRealAudioVolume();
    console.log(`Ducked volume with Voice active: ${currentVol}`);
    assert(Math.abs(currentVol - 0.07) < 0.01, `Expected ducked volume ~0.07, got ${currentVol}`);

    // 3. Video starts while Voice is still playing (category "video" registered)
    console.log('Registering category "video" blocker while Voice is still active...');
    await page.evaluate(() => window.__workspaceStore.getState().registerMediaBlocker('video'));
    await page.waitForTimeout(200);

    currentVol = await getRealAudioVolume();
    console.log(`Ducked volume with Voice + Video active: ${currentVol}`);
    assert(Math.abs(currentVol - 0.07) < 0.01, `Expected volume to remain ducked at ~0.07, got ${currentVol}`);

    // 4. Voice narration ends while Video is still active (category "voice" unregistered)
    console.log('Unregistering category "voice" blocker (Video remains active)...');
    await page.evaluate(() => window.__workspaceStore.getState().unregisterMediaBlocker('voice'));
    await page.waitForTimeout(200);

    currentVol = await getRealAudioVolume();
    console.log(`Volume after Voice ends (Video still active): ${currentVol}`);
    assert(Math.abs(currentVol - 0.07) < 0.01, `Expected volume to remain ducked at ~0.07 while Video is active, got ${currentVol}`);
    assert(await duckingIndicator.isVisible(), 'Ducking indicator must remain visible while Video is active');

    // 5. Video playback ends (category "video" unregistered -> Set becomes empty)
    console.log('Unregistering category "video" blocker (all blockers cleared)...');
    await page.evaluate(() => window.__workspaceStore.getState().unregisterMediaBlocker('video'));
    await page.waitForTimeout(200);

    currentVol = await getRealAudioVolume();
    console.log(`Restored volume after Video ends (0 blockers): ${currentVol}`);
    assert(Math.abs(currentVol - 0.35) < 0.01, `Expected volume to restore to configured ~0.35, got ${currentVol}`);
    assert(!(await duckingIndicator.isVisible()), 'Ducking indicator must disappear when all blockers cleared');

    // 6. Manual Mute Intent Invariance
    console.log('Testing manual mute intent invariance...');
    await page.evaluate(() => window.__workspaceStore.getState().toggleAtmosphereMute());
    await page.waitForTimeout(200);

    currentVol = await getRealAudioVolume();
    console.log(`Volume when manually muted: ${currentVol}`);
    assert.strictEqual(currentVol, 0, 'Volume must be 0 when manually muted');

    // Voice starts and ends during manual mute
    console.log('Voice starts and ends while Atmosphere is muted...');
    await page.evaluate(() => window.__workspaceStore.getState().registerMediaBlocker('voice'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.__workspaceStore.getState().unregisterMediaBlocker('voice'));
    await page.waitForTimeout(200);

    currentVol = await getRealAudioVolume();
    console.log(`Volume after Voice ends on muted track: ${currentVol}`);
    assert.strictEqual(currentVol, 0, 'Volume must remain 0 (never automatically unmuted)');

    const storedMaster = await getStoredMasterVolume();
    console.log(`Stored master volume remains: ${storedMaster}`);
    assert.strictEqual(storedMaster, 0.35, 'Stored master volume must remain 0.35');

    // Unmute to restore
    await page.evaluate(() => window.__workspaceStore.getState().toggleAtmosphereMute());
    await page.waitForTimeout(200);
    currentVol = await getRealAudioVolume();
    console.log(`Volume restored after manual unmute: ${currentVol}`);
    assert(Math.abs(currentVol - 0.35) < 0.01, `Volume must restore to ~0.35 on manual unmute, got ${currentVol}`);

    await page.screenshot({ path: `${screenshotDir}/phase17_atmosphere_deck_ducking_verified.png` });
    results.push({ scenario: 'Scenario 4: Multi-Stream Blocker Ducking & Real Element Inspection', status: 'PASS' });

    // -------------------------------------------------------------
    // Scenario 5: Mock WAV Browser Playability & Media Element Validation (AUD-05)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Mock WAV Browser Playability & Media Element Validation (AUD-05) ---');
    const mediaElementEvaluation = await page.evaluate(() => {
      const audio = document.querySelector('[data-testid="atmosphere-deck-audio-element"]');
      if (!audio) return null;
      return {
        hasSource: Boolean(audio.src && audio.src.length > 0),
        src: audio.src,
        readyState: audio.readyState,
        duration: audio.duration,
        error: audio.error,
        paused: audio.paused,
      };
    });

    console.log('Audio Element Evaluation:', JSON.stringify(mediaElementEvaluation, null, 2));
    assert(mediaElementEvaluation, 'Audio element must exist in DOM');
    assert(mediaElementEvaluation.hasSource, 'Audio element must have valid src');
    assert(mediaElementEvaluation.error === null, 'Audio element must not report media error');
    assert(mediaElementEvaluation.duration > 0 || mediaElementEvaluation.readyState >= 1, 'Audio duration or readyState must indicate playable media');

    await page.screenshot({ path: `${screenshotDir}/phase17_mock_audio_playability_verified.png` });
    results.push({ scenario: 'Scenario 5: Mock WAV Browser Playability Evaluation', status: 'PASS' });

    console.log('\n======================================================');
    console.log('🎉 ALL 5 PHASE 17 E2E SCENARIOS PASSED WITH ZERO ERRORS');
    console.log('======================================================');
    results.forEach((r, idx) => console.log(`${idx + 1}. [${r.status}] ${r.scenario}`));

  } catch (error) {
    console.error('\n❌ E2E Execution Failed:', error);
    await page.screenshot({ path: `${screenshotDir}/phase17_error.png` });
    throw error;
  } finally {
    await browser.close();
  }
}

runPhase17E2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
