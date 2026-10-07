const { chromium } = require('playwright');
const assert = require('assert');

async function runPhase15E2E() {
  console.log('🚀 Starting Automated Playwright Verification for Phase 15: Voice Generation Engine & Custom Narrative Audio Player (VOX-01, VOX-02, VOX-03)\n');
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
    // Scenario 1: Character Voice Monologue Generation & Persona Selection (VOX-02, VOX-03)
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Character Voice Monologue Generation with Curated Persona (VOX-02, VOX-03) ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    // Seed canonical demo universe
    const instantDemoBtn = page.locator('button:has-text("Instant Full Universe (Demo)")').first();
    await instantDemoBtn.waitFor({ timeout: 10000 });
    await instantDemoBtn.click();
    await page.locator('h1:has-text("Bio-City")').first().waitFor({ timeout: 25000 });
    console.log('✅ Demo universe loaded successfully');

    // Navigate to Characters Tab (Codex Tab 2)
    const charTab = page.locator('#codex-tab-characters');
    await charTab.waitFor({ timeout: 5000 });
    await charTab.click();
    await page.waitForTimeout(500);

    const firstCharCard = page.locator('#codex-characters-grid > div').first();
    await firstCharCard.waitFor({ timeout: 5000 });

    // Locate voice persona selector on character card
    const charPersonaSelect = firstCharCard.locator('select[data-testid^="voice-persona-selector-"]').first();
    await charPersonaSelect.waitFor({ timeout: 5000 });
    assert(await charPersonaSelect.isVisible(), 'Voice persona selector must be visible on Character card');

    // Select custom persona: inquiring-youth
    await charPersonaSelect.selectOption('inquiring-youth');
    console.log('✅ Selected "Inquiring Youth" persona for character monologue');

    // Click "Generate Voice" button
    const generateVoiceBtn = firstCharCard.locator('button[data-testid^="generate-voice-"]').first();
    await generateVoiceBtn.waitFor({ timeout: 5000 });
    console.log('Initiating character monologue synthesis...');
    await generateVoiceBtn.click();

    // Verify audio player card appears and finishes synthesis
    const voiceCard = firstCharCard.locator('[data-testid="media-card-voice"]').first();
    await voiceCard.waitFor({ timeout: 25000 });
    const readyStatus = voiceCard.locator('[data-testid="media-status-completed"]').first();
    await readyStatus.waitFor({ timeout: 25000 });

    const audioPlayer = voiceCard.locator('[data-testid="media-voice-player"]').first();
    await audioPlayer.waitFor({ state: 'attached', timeout: 5000 });
    const audioSrc = await audioPlayer.getAttribute('src');
    console.log(`✅ Character voice synthesized successfully! Audio source: ${audioSrc}`);
    assert(audioSrc && (audioSrc.includes('/media/voice/') || audioSrc.includes('.wav') || audioSrc.includes('.mp3') || audioSrc.includes('.bin')), 'Audio URL must point to valid media path');

    // Verify persona badge displays selected persona
    const charPersonaBadge = voiceCard.locator('[data-testid="media-voice-persona-badge"]').first();
    await charPersonaBadge.waitFor({ timeout: 5000 });
    const badgeText = await charPersonaBadge.innerText();
    console.log(`✅ Voice Persona Badge: "${badgeText.replace(/\n/g, ' ')}"`);
    assert(badgeText.includes('Inquiring Youth') || badgeText.includes('inquiring-youth') || badgeText.includes('JennyNeural'), 'Persona badge must reflect character persona');

    // Verify deterministic canonical character monologue template: "I am {name}, {role}. My motivation: {motivation}. My core conflict: {core_conflict}."
    const charSnippet = voiceCard.locator('.italic').first();
    const charScriptText = await charSnippet.innerText();
    console.log(`✅ Synthesized character monologue script: ${charScriptText}`);
    assert(
      charScriptText.startsWith('"I am ') &&
      charScriptText.includes('. My motivation: ') &&
      charScriptText.includes('. My core conflict: '),
      'Character script must follow locked canonical template: "I am {name}, {role}. My motivation: {motivation}. My core conflict: {core_conflict}."'
    );

    const screenshot1 = `${screenshotDir}/phase15_character_voice_persona.png`;
    await page.screenshot({ path: screenshot1, fullPage: true });
    results.push({ scenario: 'Scenario 1: Character Voice & Persona Selection', status: 'PASS', screenshot: screenshot1 });

    // -------------------------------------------------------------
    // Scenario 2: Scene Dramatic Voice Narration in Story Beats Tab (VOX-02, VOX-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Scene Dramatic Voice Narration in Story Beats Tab (VOX-02, VOX-03) ---');
    const scenesTab = page.locator('#codex-tab-scenes');
    await scenesTab.waitFor({ timeout: 5000 });
    await scenesTab.click();
    await page.waitForTimeout(500);

    const firstSceneCard = page.locator('#codex-scenes-grid > div').first();
    await firstSceneCard.waitFor({ timeout: 5000 });

    // Verify Scene has Voice generation control
    const scenePersonaSelect = firstSceneCard.locator('select[data-testid^="voice-persona-selector-"]').first();
    await scenePersonaSelect.waitFor({ timeout: 5000 });
    const selectedScenePersona = await scenePersonaSelect.inputValue();
    console.log(`✅ Scene default persona auto-selected: "${selectedScenePersona}"`);
    assert(selectedScenePersona === 'narrator-deep', 'Scene should default to narrator-deep persona');

    // Generate Scene Narration
    const generateSceneVoiceBtn = firstSceneCard.locator('button[data-testid^="generate-voice-"]').first();
    await generateSceneVoiceBtn.waitFor({ timeout: 5000 });
    console.log('Initiating scene dramatic narration synthesis...');
    await generateSceneVoiceBtn.click();

    const sceneVoiceCard = firstSceneCard.locator('[data-testid="media-card-voice"]').first();
    await sceneVoiceCard.waitFor({ timeout: 25000 });
    const sceneReadyStatus = sceneVoiceCard.locator('[data-testid="media-status-completed"]').first();
    await sceneReadyStatus.waitFor({ timeout: 25000 });

    const sceneAudioPlayer = sceneVoiceCard.locator('[data-testid="media-voice-player"]').first();
    const sceneAudioSrc = await sceneAudioPlayer.getAttribute('src');
    console.log(`✅ Scene voice narration synthesized successfully! URL: ${sceneAudioSrc}`);
    assert(sceneAudioSrc && (sceneAudioSrc.includes('/media/voice/') || sceneAudioSrc.includes('.wav') || sceneAudioSrc.includes('.mp3') || sceneAudioSrc.includes('.bin')), 'Scene audio URL must be valid');

    // Verify deterministic canonical scene narration template: "Scene {scene_number}: {title}. In {location_setting}. {conflict_narrative}. Outcome: {pivotal_outcome}."
    const sceneSnippet = sceneVoiceCard.locator('.italic').first();
    const sceneScriptText = await sceneSnippet.innerText();
    console.log(`✅ Synthesized scene dramatic script: ${sceneScriptText}`);
    assert(
      sceneScriptText.startsWith('"Scene 1:') &&
      sceneScriptText.includes('. In ') &&
      sceneScriptText.includes('. Outcome: '),
      'Scene script must follow locked canonical template: "Scene {scene_number}: {title}. In {location_setting}. {conflict_narrative}. Outcome: {pivotal_outcome}."'
    );

    const screenshot2 = `${screenshotDir}/phase15_scene_voice_narration.png`;
    await page.screenshot({ path: screenshot2, fullPage: true });
    results.push({ scenario: 'Scenario 2: Scene Dramatic Voice Narration', status: 'PASS', screenshot: screenshot2 });

    // -------------------------------------------------------------
    // Scenario 3: Custom Narrative Audio Player Controls & Seek Verification (VOX-03)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Strengthened Narrative Audio Player Controls & Seek Verification (VOX-03) ---');
    const activePlayerCard = sceneVoiceCard;

    // 1. Play / Pause Toggle
    const playPauseBtn = activePlayerCard.locator('[data-testid="media-voice-play-pause-btn"]').first();
    await playPauseBtn.waitFor({ timeout: 5000 });
    assert(await playPauseBtn.isVisible(), 'Play/Pause toggle must be visible');

    // Time display before playing
    const timeDisplay = activePlayerCard.locator('[data-testid="media-voice-time"]').first();
    await timeDisplay.waitFor({ timeout: 5000 });
    const initialTimeText = await timeDisplay.innerText();
    console.log(`Initial time display: ${initialTimeText}`);

    // Click Play
    await playPauseBtn.click();
    console.log('✅ Clicked Play button');
    await page.waitForTimeout(600);

    // 2. Interactive Seek Bar Control (Jump to ~50%)
    const progressSlider = activePlayerCard.locator('input[data-testid="media-voice-progress"]').first();
    await progressSlider.waitFor({ timeout: 5000 });
    const maxVal = parseFloat(await progressSlider.getAttribute('max') || '10');
    const seekTarget = (maxVal / 2).toFixed(1);
    console.log(`Testing Seek Control: max duration = ${maxVal}s, seeking to ~50% (${seekTarget}s)...`);

    await progressSlider.evaluate((el, val) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, seekTarget);

    await page.waitForTimeout(300);
    const seekedTimeText = await timeDisplay.innerText();
    console.log(`Time display after seek: ${seekedTimeText}`);
    assert(seekedTimeText !== initialTimeText, 'Time display must update upon seek to ~50%');

    // 3. Pause
    await playPauseBtn.click();
    console.log('✅ Clicked Pause button');
    await page.waitForTimeout(300);

    // 4. Download Action
    const downloadBtn = activePlayerCard.locator('a[data-testid="media-voice-download-btn"]').first();
    await downloadBtn.waitFor({ timeout: 5000 });
    const downloadHref = await downloadBtn.getAttribute('href');
    const downloadAttr = await downloadBtn.getAttribute('download');
    console.log(`✅ Download action verified: href="${downloadHref}", download="${downloadAttr}"`);
    assert(downloadHref && downloadAttr, 'Download button must have valid href and download attribute');

    // 5. Script Snippet Copy Action
    const copyBtn = activePlayerCard.locator('button[data-testid="media-voice-copy-btn"]').first();
    await copyBtn.waitFor({ timeout: 5000 });
    await copyBtn.click();
    console.log('✅ Script copy action triggered');

    const screenshot3 = `${screenshotDir}/phase15_audio_player_controls.png`;
    await page.screenshot({ path: screenshot3, fullPage: true });
    results.push({ scenario: 'Scenario 3: Narrative Audio Player Controls & Seek', status: 'PASS', screenshot: screenshot3 });

    // -------------------------------------------------------------
    // Scenario 4: Database Persistence & Offline Audio Playback Across Reload (VOX-02)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Database Persistence Across Page Reload (VOX-02) ---');
    console.log('Reloading page to test audio asset persistence...');
    await page.reload({ waitUntil: 'networkidle' });

    // Switch back to Characters tab
    const persistedCharTab = page.locator('#codex-tab-characters');
    await persistedCharTab.waitFor({ timeout: 5000 });
    await persistedCharTab.click();
    await page.waitForTimeout(500);

    const reloadedFirstChar = page.locator('#codex-characters-grid > div').first();
    const persistedVoiceCard = reloadedFirstChar.locator('[data-testid="media-card-voice"]').first();
    await persistedVoiceCard.waitFor({ timeout: 10000 });

    const persistedReadyStatus = persistedVoiceCard.locator('[data-testid="media-status-completed"]').first();
    await persistedReadyStatus.waitFor({ timeout: 5000 });
    const persistedAudioSrc = await persistedVoiceCard.locator('[data-testid="media-voice-player"]').first().getAttribute('src');
    console.log(`✅ Persisted voice asset verified! Source: ${persistedAudioSrc}`);
    assert(persistedAudioSrc && (persistedAudioSrc.includes('/media/voice/') || persistedAudioSrc.includes('.wav') || persistedAudioSrc.includes('.mp3') || persistedAudioSrc.includes('.bin')), 'Persisted audio URL must be valid');

    const screenshot4 = `${screenshotDir}/phase15_voice_persistence.png`;
    await page.screenshot({ path: screenshot4, fullPage: true });
    results.push({ scenario: 'Scenario 4: Database Persistence Across Reload', status: 'PASS', screenshot: screenshot4 });

    // -------------------------------------------------------------
    // Scenario 5: Strengthened 3-Tier Fallback Verification (VOX-01, VOX-02)
    // Forces Edge TTS unavailable and Kokoro unavailable -> Mock Voice succeeds
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Strengthened 3-Tier Fallback Verification (Edge TTS fails -> Kokoro fails -> Mock Voice succeeds) ---');

    // Intercept network request to inject simulated provider outage (Edge TTS and Kokoro unavailable)
    await page.route('**/api/projects/*/media/generate', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        if (postData && postData.media_type === 'voice') {
          postData.context = {
            ...(postData.context || {}),
            simulate_edgetts_unavailable: true,
            simulate_kokoro_unavailable: true,
          };
          console.log('⚡ Injected simulated provider outage: Edge TTS unavailable & Kokoro unavailable');
          return route.continue({ postData: JSON.stringify(postData) });
        }
      }
      return route.continue();
    });

    // Locate second character card
    const secondCharCard = page.locator('#codex-characters-grid > div').nth(1);
    await secondCharCard.waitFor({ timeout: 5000 });

    const secondCharPersonaSelect = secondCharCard.locator('select[data-testid^="voice-persona-selector-"]').first();
    await secondCharPersonaSelect.waitFor({ timeout: 5000 });
    await secondCharPersonaSelect.selectOption('mentor-sage');
    console.log('✅ Selected "mentor-sage" persona for fallback character synthesis');

    const generateFallbackVoiceBtn = secondCharCard.locator('button[data-testid^="generate-voice-"]').first();
    await generateFallbackVoiceBtn.waitFor({ timeout: 5000 });
    console.log('Initiating voice generation with simulated primary cloud & local provider outage...');
    await generateFallbackVoiceBtn.click();

    // Verify audio player card appears and finishes synthesis under fallback
    const fallbackVoiceCard = secondCharCard.locator('[data-testid="media-card-voice"]').first();
    await fallbackVoiceCard.waitFor({ timeout: 25000 });
    const fallbackReadyStatus = fallbackVoiceCard.locator('[data-testid="media-status-completed"]').first();
    await fallbackReadyStatus.waitFor({ timeout: 25000 });

    const fallbackAudioPlayer = fallbackVoiceCard.locator('[data-testid="media-voice-player"]').first();
    await fallbackAudioPlayer.waitFor({ state: 'attached', timeout: 5000 });
    const fallbackAudioSrc = await fallbackAudioPlayer.getAttribute('src');
    console.log(`✅ Fallback voice synthesized successfully! Audio source: ${fallbackAudioSrc}`);
    assert(fallbackAudioSrc && (fallbackAudioSrc.includes('/media/voice/') || fallbackAudioSrc.includes('.wav') || fallbackAudioSrc.includes('.bin')), 'Fallback audio URL must be valid');

    // Verify persona badge displays resolved_provider === "mock" and persona remains meaningful
    const fallbackBadge = fallbackVoiceCard.locator('[data-testid="media-voice-persona-badge"]').first();
    await fallbackBadge.waitFor({ timeout: 5000 });
    const fallbackBadgeText = await fallbackBadge.innerText();
    console.log(`Fallback persona badge text: "${fallbackBadgeText.replace(/\n/g, ' ')}"`);

    assert(fallbackBadgeText.includes('mock'), 'Resolved provider must be "mock" under outage');
    assert(
      fallbackBadgeText.includes('mentor-sage') ||
      fallbackBadgeText.includes('Contemplative Mentor'),
      'Persona identifier must remain meaningful under fallback'
    );
    console.log('✅ Fallback verification confirmed: Edge TTS failed -> Kokoro failed -> Mock Voice succeeded!');

    // Cleanup route interceptor
    await page.unroute('**/api/projects/*/media/generate');

    const screenshot5 = `${screenshotDir}/phase15_provider_fallback_resilience.png`;
    await page.screenshot({ path: screenshot5, fullPage: true });
    results.push({ scenario: 'Scenario 5: Strengthened 3-Tier Fallback Verification (Mock Succeeded)', status: 'PASS', screenshot: screenshot5 });

    console.log('\n=============================================================');
    console.log('🎉 ALL PHASE 15 AUTOMATED VERIFICATION SCENARIOS PASSED!');
    console.log('=============================================================');
    results.forEach((r, idx) => console.log(`${idx + 1}. [${r.status}] ${r.scenario}`));

  } catch (err) {
    console.error('❌ E2E VERIFICATION FAILED:', err);
    const errScreenshot = `${screenshotDir}/phase15_error.png`;
    await page.screenshot({ path: errScreenshot, fullPage: true }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runPhase15E2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
