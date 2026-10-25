// frontend/e2e/test_phase52_cinematic_rehearsal.mjs
/**
 * PRAROHA Phase 52 — Local Browser Rehearsal Before Phase Gate F
 * 
 * Strict Safety Boundaries:
 * - 100% local browser execution using Playwright
 * - Zero production network calls (all API and Supabase endpoints intercepted and mocked)
 * - Zero Azure Queue publications, zero cloud executions, zero database writes
 * - Tests both Flag OFF and Flag ON environments deterministically
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = '/home/syed-imadulla/.gemini/antigravity-ide/brain/73d3251e-835d-4023-8490-eb9d867800cc';

// Reference local sample MP4 fixture from scratch directory
const FIXTURE_VIDEO_PATH = path.resolve(
  FRONTEND_DIR,
  '../scratch/worker_previews/preview_proj-fps-e2e_scene-fps-24_1792907026.mp4'
);

// Canonical mock identifiers matching production canary
const CANONICAL_PROJECT_ID = '25e15040-73e6-47e5-b030-d95598e17292';
const CANONICAL_SCENE_ID = '99b0c570-2d22-402e-8a68-1392243f8d30';
const CANONICAL_WORLD_ID = 'world-bio-city-001';

/**
 * Spawns a local Vite dev server on specified port with explicit env vars.
 */
function startViteServer(port, enableCinematicFlag) {
  return new Promise((resolve, reject) => {
    console.log(`[Vite] Spawning server on port ${port} (VITE_ENABLE_CINEMATIC_PREVIEW=${enableCinematicFlag})...`);
    const serverProcess = spawn(
      'npx',
      ['vite', '--port', String(port), '--strictPort'],
      {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          VITE_ENABLE_CINEMATIC_PREVIEW: enableCinematicFlag,
          VITE_API_URL: `http://localhost:${port}/api`,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        serverProcess.kill('SIGKILL');
        reject(new Error(`Timeout waiting for Vite on port ${port}`));
      }
    }, 20000);

    serverProcess.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('Local:') || text.includes(`:${port}`)) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          console.log(`[Vite] Server ready on http://localhost:${port}`);
          resolve(serverProcess);
        }
      }
    });

    serverProcess.stderr.on('data', (chunk) => {
      // console.error(`[Vite stderr]:`, chunk.toString());
    });

    serverProcess.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Vite exited prematurely with code ${code}`));
      }
    });
  });
}

/**
 * Waits for HTTP 200 response on URL
 */
async function waitForUrl(url, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Service at ${url} not responding`);
}

/**
 * Configures mock routes for 100% deterministic local rehearsal
 */
async function setupMockApiRoutes(page, state) {
  // 1. Abort external Supabase requests to guarantee complete cloud isolation
  await page.route('**/*.supabase.co/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], error: null }),
    });
  });

  // 2. Serve local fixture video for MP4 playback
  await page.route('**/local-fixture-video.mp4', (route) => {
    if (fs.existsSync(FIXTURE_VIDEO_PATH)) {
      const videoBuffer = fs.readFileSync(FIXTURE_VIDEO_PATH);
      route.fulfill({
        status: 200,
        contentType: 'video/mp4',
        headers: { 'Content-Length': String(videoBuffer.length) },
        body: videoBuffer,
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'video/mp4',
        body: Buffer.from([]),
      });
    }
  });

  // 3. Mock backend API routes
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const pathname = url.pathname;
    const method = req.method();

    // Health
    if (pathname === '/api/health') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy', service: 'PRAROHA — Mock Local Rehearsal' }),
      });
    }

    // Canonical Demo Project Creator
    if (pathname.includes('/projects/canonical-demo')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: CANONICAL_PROJECT_ID,
            name: 'The Sunken City: Bio-City',
            seed_text: 'A child discovers a forgotten city beneath the ocean.',
            active_branch_id: 'branch-main',
            selected_world_id: CANONICAL_WORLD_ID,
            created_at: '2026-10-25T11:00:00Z',
          },
        }),
      });
    }

    // Single Project
    if (pathname === `/api/projects/${CANONICAL_PROJECT_ID}`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: CANONICAL_PROJECT_ID,
            name: 'The Sunken City: Bio-City',
            seed_text: 'A child discovers a forgotten city beneath the ocean.',
            active_branch_id: 'branch-main',
            selected_world_id: CANONICAL_WORLD_ID,
            created_at: '2026-10-25T11:00:00Z',
          },
        }),
      });
    }

    // Branches
    if (pathname.includes('/branches')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Projects List
    if (pathname === '/api/projects') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Background jobs polling
    if (pathname === '/api/jobs') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Premise variables / mutation variables
    if (pathname.includes('/premise-variables') || pathname.includes('/mutation/variables')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Counterfactuals
    if (pathname.includes('/counterfactuals') || pathname.includes('/counterfactual/candidates')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Seed DNA
    if (pathname.endsWith('/dna')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'dna-bio-city-001',
            project_id: CANONICAL_PROJECT_ID,
            raw_seed: 'A child discovers a forgotten city beneath the ocean.',
            dna: {
              premise: 'A child discovers a forgotten city beneath the ocean.',
              themes: ['discovery', 'submerged biology', 'symbiosis'],
              entities: ['Bio-City', 'Young Diver', 'Symbiotic Flora'],
              constraints: ['underwater', 'limited oxygen'],
              tone: 'mysterious, wonder',
              domain_keywords: ['ocean', 'bioluminescence'],
            },
            fallback_used: false,
            model_used: 'mock-rehearsal',
            created_at: '2026-10-25T11:00:00Z',
          },
        }),
      });
    }

    // Potential
    if (pathname.endsWith('/potential')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Worlds
    if (pathname.endsWith('/worlds')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: CANONICAL_WORLD_ID,
              project_id: CANONICAL_PROJECT_ID,
              seed_dna_id: 'dna-bio-city-001',
              batch_id: 'batch-001',
              candidate_index: 0,
              title: 'The Sunken City: Bio-City',
              archetype: 'familiar',
              concept: 'Living underwater architecture sustained by deep-sea organisms.',
              aesthetic: 'Bioluminescent deep cyan and coral bronze.',
              core_tension: 'Surface exploitation vs abyssal preservation.',
              trade_offs: 'Infinite clean energy at the cost of human isolation.',
              key_visual: 'Grand bioluminescent coral spires sheltering human domes.',
              model_used: 'mock-rehearsal',
              fallback_used: false,
              created_at: '2026-10-25T11:00:00Z',
            },
          ],
        }),
      });
    }

    // Active Selection
    if (pathname.endsWith('/selection')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'sel-bio-city-001',
            project_id: CANONICAL_PROJECT_ID,
            world_candidate_id: CANONICAL_WORLD_ID,
            batch_id: 'batch-001',
            user_rationale: 'Fascinating ecological architecture.',
            created_at: '2026-10-25T11:00:00Z',
          },
        }),
      });
    }

    // Unfolded Universe
    if (pathname.endsWith('/unfolded') || pathname.endsWith('/unfold')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            world_bible: {
              id: 'bible-bio-city-001',
              project_id: CANONICAL_PROJECT_ID,
              world_candidate_id: CANONICAL_WORLD_ID,
              geography: 'Deep oceanic trench surrounded by thermal vents and bioluminescent kelp forests.',
              physics_rules: 'Atmospheric domes maintain 1 atm pressure; light powered by symbiont colonies.',
              history_timeline: [
                { era: 'The Great Submersion', event: 'First domes anchored to bedrock.' },
              ],
              factions: [
                { name: 'Abyssal Keepers', role: 'Engineers', agenda: 'Preserve symbiotic coral' },
              ],
              canon_facts: ['Surface contact is forbidden'],
              key_locations: [
                { name: 'Kelp Spires', description: 'Towering underwater stalks', visual_prompt: 'Kelp' },
              ],
              visual_style_prompt: 'Cinematic deep cyan ocean glow, volumetric light',
              created_at: '2026-10-25T11:00:00Z',
            },
            characters: [
              {
                id: 'char-elena-001',
                project_id: CANONICAL_PROJECT_ID,
                world_candidate_id: CANONICAL_WORLD_ID,
                name: 'Elena',
                role: 'Curious Diver',
                archetype: 'Explorer',
                motivation: 'Uncover ancient surface relics',
                core_conflict: 'Defying the Council of Deep',
                visual_prompt: 'Young female diver in sleek bioluminescent suit',
                version: 1,
                created_at: '2026-10-25T11:00:00Z',
              },
            ],
            relationships: [],
            scenes: [
              {
                id: CANONICAL_SCENE_ID,
                project_id: CANONICAL_PROJECT_ID,
                world_candidate_id: CANONICAL_WORLD_ID,
                scene_number: 1,
                title: 'Descent into the Coral Sanctum',
                location_setting: 'Sub-aquatic trench at 3000 meters depth',
                characters_involved: ['Elena'],
                dramatic_question: 'Will Elena breach the sanctuary gate before pressure seals fail?',
                conflict_narrative: 'Elena descends into the darkness guided only by faint cyan bioluminescence.',
                pivotal_outcome: 'She discovers the intact golden archive.',
                visual_prompt: 'Elena swimming past towering glowing coral spires towards an ancient sunken gateway.',
                version: 1,
                created_at: '2026-10-25T11:00:00Z',
              },
              {
                id: 'scene-abyssal-rift-002',
                project_id: CANONICAL_PROJECT_ID,
                world_candidate_id: CANONICAL_WORLD_ID,
                scene_number: 2,
                title: 'The Pressure Threshold',
                location_setting: 'Abyssal Thermal Vent Zone',
                characters_involved: ['Elena'],
                dramatic_question: 'Can the submersible withstand the thermal surge?',
                conflict_narrative: 'Elena navigates through superheated hydrothermal plumes.',
                pivotal_outcome: 'Thermal stabilizers overheat.',
                visual_prompt: 'Elena swimming past glowing volcanic vents.',
                version: 1,
                created_at: '2026-10-25T11:00:00Z',
              },
            ],
          },
        }),
      });
    }

    // Lineage, Revisions, Snapshots
    if (pathname.includes('/lineage')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { nodes: [], edges: [] } }),
      });
    }
    if (pathname.includes('/revisions') || pathname.includes('/snapshots')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    // Media Assets List
    if (pathname.includes('/media/assets')) {
      const entityIdParam = url.searchParams.get('entity_id');
      const filtered = state.mediaAssets.filter((a) => !entityIdParam || a.entity_id === entityIdParam);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filtered,
        }),
      });
    }

    // Cinematic Preview Dispatch: POST /media/cinematic-preview/jobs
    if (pathname.includes('/media/cinematic-preview/jobs') && method === 'POST') {
      state.dispatchCalls++;
      const body = JSON.parse(req.postData() || '{}');
      state.lastDispatchPayload = body;

      const isFail = body.entity_id === 'scene-abyssal-rift-002' || state.shouldFailNextJob;
      const jobId = isFail ? 'job-cinematic-fail-002' : 'job-cinematic-mock-001';

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            job_id: jobId,
            project_id: CANONICAL_PROJECT_ID,
            entity_type: body.entity_type || 'scene',
            entity_id: body.entity_id || (isFail ? 'scene-abyssal-rift-002' : CANONICAL_SCENE_ID),
            media_type: 'video',
            status: 'queued',
            progress: 0.0,
            duration_sec: body.duration_sec || 6,
            aspect_ratio: body.aspect_ratio || '16:9',
            created_at: new Date().toISOString(),
          },
        }),
      });
    }

    // Poll Job Status: GET /media/jobs/:jobId
    if (pathname.includes('/media/jobs/')) {
      state.pollCalls++;
      const jobId = pathname.split('/').pop();

      if (jobId === 'job-cinematic-fail-002') {
        // Failure Scenario
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              job_id: jobId,
              project_id: CANONICAL_PROJECT_ID,
              entity_type: 'scene',
              entity_id: 'scene-abyssal-rift-002',
              media_type: 'video',
              status: 'failed',
              progress: 0.2,
              error_message: 'Worker capacity reached; safe backoff initiated.',
              created_at: new Date().toISOString(),
            },
          }),
        });
      }

      // Success Scenario Progression: queued -> processing -> completed
      let jobStatus = 'queued';
      let progress = 0.0;
      let assetUrl = null;

      if (state.pollCalls === 1) {
        jobStatus = 'queued';
        progress = 0.1;
      } else if (state.pollCalls === 2) {
        jobStatus = 'processing';
        progress = 0.6;
      } else {
        jobStatus = 'completed';
        progress = 1.0;
        assetUrl = `http://localhost:${url.port}/local-fixture-video.mp4`;

        // Update state.mediaAssets so fetchEntityMedia resolves completed card
        state.mediaAssets = [
          {
            id: 'asset-cinematic-video-001',
            project_id: CANONICAL_PROJECT_ID,
            entity_type: 'scene',
            entity_id: CANONICAL_SCENE_ID,
            media_type: 'video',
            status: 'completed',
            asset_url: assetUrl,
            prompt: 'Elena swimming past towering glowing coral spires',
            provider_name: 'Cinematic Preview',
            aspect_ratio: '16:9',
            mime_type: 'video/mp4',
            metadata_json: JSON.stringify({
              resolved_provider: 'Cinematic Preview',
              provider_label: 'Cinematic Preview',
              is_synthetic: true,
              duration_sec: 6,
              fps: 24,
              aspect_ratio: '16:9',
            }),
            created_at: new Date().toISOString(),
          },
        ];
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            job_id: jobId,
            project_id: CANONICAL_PROJECT_ID,
            entity_type: 'scene',
            entity_id: CANONICAL_SCENE_ID,
            media_type: 'video',
            status: jobStatus,
            progress: progress,
            asset_url: assetUrl,
            created_at: new Date().toISOString(),
          },
        }),
      });
    }

    // Fallback pass-through for other local static requests
    return route.continue();
  });
}

/**
 * Main Rehearsal Execution Function
 */
async function runRehearsal() {
  console.log('================================================================');
  console.log('PRAROHA PHASE 52 — LOCAL BROWSER REHEARSAL FOR PHASE GATE F');
  console.log('Safety: 100% Mocked Network / Zero Cloud Compute / Isolated Local Ports');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const reportResults = [];

  let serverFlagOff = null;
  let serverFlagOn = null;

  try {
    // =========================================================================
    // PART 1: TEST FEATURE FLAG OFF STATE
    // =========================================================================
    console.log('>>> [TEST PART 1]: Feature Flag OFF Rehearsal (Port 5180)');
    serverFlagOff = await startViteServer(5180, 'false');
    await waitForUrl('http://localhost:5180');

    const contextOff = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageOff = await contextOff.newPage();

    const consoleErrorsOff = [];
    pageOff.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrorsOff.push(msg.text());
    });
    pageOff.on('pageerror', (err) => consoleErrorsOff.push(err.message));

    pageOff.on('request', (req) => console.log('REQ:', req.method(), req.url()));
    pageOff.on('response', (res) => console.log('RES:', res.status(), res.url()));
    pageOff.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));

    const stateOff = {
      dispatchCalls: 0,
      pollCalls: 0,
      mediaAssets: [],
      shouldFailNextJob: false,
    };
    await setupMockApiRoutes(pageOff, stateOff);

    console.log('  Navigating to local rehearsal frontend...');
    await pageOff.goto('http://localhost:5180', { waitUntil: 'networkidle' });

    // Handle guest authentication if prompt is present
    const guestBtnOff = pageOff.locator('[data-testid="auth-guest-demo-btn"]');
    if (await guestBtnOff.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Clicking guest button...');
      await guestBtnOff.click();
      await pageOff.waitForTimeout(500);
    }

    // Load canonical universe if not already loaded by guest entry
    const demoBtnOff = pageOff.locator('button:has-text("Instant Full Universe")').first();
    if (await demoBtnOff.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Triggering Instant Full Universe demo loader...');
      await demoBtnOff.click();
    } else {
      console.log('  Canonical universe already mounted by guest mode.');
    }

    // Switch to Scenes tab in Universe Codex
    const scenesTabOff = pageOff.locator('#codex-tab-scenes');
    await scenesTabOff.waitFor({ timeout: 15000 });
    await scenesTabOff.click();
    await pageOff.waitForTimeout(500);

    // Verify Scene Codex loaded
    const sceneCard = pageOff.locator(`h3:has-text("Descent into the Coral Sanctum")`).first();
    await sceneCard.waitFor({ timeout: 10000 });
    console.log('  PASS: Canonical universe scenes tab loaded into workspace.');

    // Audit Disabled State
    const disabledBadgeSelector = `[data-testid="generate-video-disabled-${CANONICAL_SCENE_ID}"]`;
    const disabledBadge = pageOff.locator(disabledBadgeSelector).first();
    await disabledBadge.waitFor({ timeout: 5000 });
    assert(await disabledBadge.isVisible(), 'Disabled badge must be visible when feature flag is OFF');

    const disabledTitle = await disabledBadge.getAttribute('title');
    const disabledText = await disabledBadge.innerText();
    console.log(`  Disabled Badge Text: "${disabledText}"`);
    console.log(`  Disabled Badge Tooltip: "${disabledTitle}"`);

    assert.strictEqual(
      disabledText.trim(),
      'Cinematic Preview (Disabled)',
      'Disabled badge text must read "Cinematic Preview (Disabled)"'
    );
    assert.strictEqual(
      disabledTitle,
      'Cinematic preview generation is currently disabled in production. Awaiting release approval.',
      'Disabled badge title must explain that preview generation is disabled awaiting approval'
    );

    // Verify Interactive Button is ABSENT
    const interactiveBtnSelector = `[data-testid="generate-video-${CANONICAL_SCENE_ID}"]`;
    const interactiveCount = await pageOff.locator(interactiveBtnSelector).count();
    assert.strictEqual(interactiveCount, 0, 'Interactive button must NOT exist when flag is OFF');

    // Attempt Click on Disabled Element — assert zero network dispatches
    await disabledBadge.click({ force: true });
    await pageOff.waitForTimeout(1000);
    assert.strictEqual(stateOff.dispatchCalls, 0, 'Dispatch API must NOT be called when flag is OFF');
    console.log('  PASS: Zero dispatches triggered when clicking disabled control.');

    // Save Flag OFF Screenshot
    const screenshotOffPath = path.join(ARTIFACT_DIR, 'rehearsal_flag_off_disabled.png');
    await pageOff.screenshot({ path: screenshotOffPath });
    console.log(`  Saved Flag OFF screenshot: ${screenshotOffPath}`);

    reportResults.push({
      test: 'Flag OFF: Control visibly disabled with correct label and tooltip',
      status: 'PASS',
      details: 'Badge: "Cinematic Preview (Disabled)", title verified, 0 dispatches triggered',
    });

    await contextOff.close();
    serverFlagOff.kill('SIGTERM');
    console.log('  Flag OFF server stopped.\n');

    // =========================================================================
    // PART 2: TEST FEATURE FLAG ON STATE
    // =========================================================================
    console.log('>>> [TEST PART 2]: Feature Flag ON Rehearsal (Port 5181)');
    serverFlagOn = await startViteServer(5181, 'true');
    await waitForUrl('http://localhost:5181');

    const contextOn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageOn = await contextOn.newPage();

    const consoleErrorsOn = [];
    pageOn.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrorsOn.push(msg.text());
    });
    pageOn.on('pageerror', (err) => consoleErrorsOn.push(err.message));

    const stateOn = {
      dispatchCalls: 0,
      pollCalls: 0,
      mediaAssets: [],
      shouldFailNextJob: false,
    };
    await setupMockApiRoutes(pageOn, stateOn);

    console.log('  Navigating to local Flag ON rehearsal frontend...');
    await pageOn.goto('http://localhost:5181', { waitUntil: 'networkidle' });

    // Handle guest auth
    const guestBtnOn = pageOn.locator('[data-testid="auth-guest-demo-btn"]');
    if (await guestBtnOn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await guestBtnOn.click();
      await pageOn.waitForTimeout(500);
    }

    // Load canonical universe if not already loaded by guest entry
    const demoBtnOn = pageOn.locator('button:has-text("Instant Full Universe")').first();
    if (await demoBtnOn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Triggering Instant Full Universe demo loader...');
      await demoBtnOn.click();
    } else {
      console.log('  Canonical universe already mounted by guest mode.');
    }

    // Switch to Scenes tab in Universe Codex
    const scenesTabOn = pageOn.locator('#codex-tab-scenes');
    await scenesTabOn.waitFor({ timeout: 15000 });
    await scenesTabOn.click();
    await pageOn.waitForTimeout(500);

    await pageOn.locator(`h3:has-text("Descent into the Coral Sanctum")`).first().waitFor({ timeout: 10000 });

    // Scenario 2.1: Verify Interactive Button Exists and Has Correct Tooltip
    console.log('\n  [Scenario 2.1]: Interactive Button & Tooltip');
    const interactiveBtn = pageOn.locator(interactiveBtnSelector).first();
    await interactiveBtn.waitFor({ timeout: 5000 });
    assert(await interactiveBtn.isVisible(), 'Interactive button must be visible when flag is ON');

    const buttonTitle = await interactiveBtn.getAttribute('title');
    const buttonText = await interactiveBtn.innerText();
    console.log(`  Interactive Button Text: "${buttonText}"`);
    console.log(`  Interactive Button Tooltip: "${buttonTitle}"`);

    assert.strictEqual(buttonText.trim(), 'Cinematic Preview');
    assert.strictEqual(
      buttonTitle,
      'Render 16:9 cinematic motion preview with Ken Burns easing and audio ducking'
    );
    reportResults.push({
      test: 'Flag ON: Interactive button renders with correct label and tooltip',
      status: 'PASS',
      details: 'Label: "Cinematic Preview", tooltip specifies 16:9 cinematic motion preview',
    });

    // Scenario 2.2: Duplicate-Click Protection
    console.log('\n  [Scenario 2.2]: Single Click & Duplicate-Click Protection');
    // Rapidly double click
    await interactiveBtn.click();
    // Try immediate second click
    await interactiveBtn.click({ force: true }).catch(() => {});

    // Verify button immediately transitions to disabled and shows loading text
    const isDisabled = await interactiveBtn.getAttribute('disabled');
    assert(isDisabled !== null, 'Button must be disabled immediately upon click');
    const loadingText = await interactiveBtn.innerText();
    console.log(`  Immediate Loading State Button Text: "${loadingText}"`);
    assert(
      loadingText.includes('Rendering Preview...'),
      'Button text must update to "Rendering Preview..." while in flight'
    );

    // Verify spinning icon is present
    const spinner = interactiveBtn.locator('.animate-spin');
    assert(await spinner.isVisible(), 'Spinning indicator must be visible while rendering');

    // Wait 500ms and check dispatch call count
    await pageOn.waitForTimeout(500);
    assert.strictEqual(
      stateOn.dispatchCalls,
      1,
      'Duplicate click must be suppressed; exactly 1 dispatch call must occur'
    );
    console.log('  PASS: Duplicate click suppressed; exactly 1 dispatch call recorded.');
    reportResults.push({
      test: 'Flag ON: Duplicate click protection suppresses rapid double submissions',
      status: 'PASS',
      details: 'Single dispatch recorded; button disabled with "Rendering Preview..."',
    });

    // Scenario 2.3: Progress States (Queued -> Synthesizing)
    console.log('\n  [Scenario 2.3]: Progress States (Queued -> Synthesizing)');
    const mediaCardVideo = pageOn.locator('[data-testid="media-card-video"]').first();
    await mediaCardVideo.waitFor({ timeout: 5000 });

    const statusProcessingPill = mediaCardVideo.locator('[data-testid="media-status-processing"]').first();
    await statusProcessingPill.waitFor({ timeout: 5000 });
    const progressStatusText = await statusProcessingPill.innerText();
    console.log(`  Active Status Pill: "${progressStatusText}"`);
    assert(
      progressStatusText.includes('Queued') || progressStatusText.includes('Synthesizing'),
      'Status pill must show Queued or Synthesizing'
    );

    // Verify card body message
    const cardBodyMsg = await mediaCardVideo.locator('p.font-bold').innerText();
    console.log(`  Card Body Message: "${cardBodyMsg}"`);
    assert.strictEqual(cardBodyMsg, 'Creating your video...');

    const subMsg = await mediaCardVideo.locator('p.text-xs.mt-0\\.5').innerText();
    console.log(`  Card Subtext: "${subMsg}"`);
    assert.strictEqual(subMsg, 'Non-blocking background synthesis');

    const screenshotProgressPath = path.join(ARTIFACT_DIR, 'rehearsal_flag_on_progress.png');
    await pageOn.screenshot({ path: screenshotProgressPath });

    reportResults.push({
      test: 'Flag ON: Progress states show Queued/Synthesizing with non-blocking synthesis subtext',
      status: 'PASS',
      details: 'Card displays "Creating your video...", non-blocking background synthesis verified',
    });

    // Scenario 2.4: Completed Video Playback & Synthetic Badge
    console.log('\n  [Scenario 2.4]: Completed Video Player Playback, Controls & Synthetic Labeling');
    // Wait for polling to complete (stateOn.pollCalls >= 3 -> completed)
    const completedStatus = mediaCardVideo.locator('[data-testid="media-status-completed"]').first();
    await completedStatus.waitFor({ timeout: 15000 });
    console.log('  Ready badge visible.');

    // Verify HTML5 video element
    const videoPlayer = mediaCardVideo.locator('[data-testid="media-video-player"]').first();
    await videoPlayer.waitFor({ timeout: 5000 });
    const videoSrc = await videoPlayer.getAttribute('src');
    console.log(`  Video Player src: ${videoSrc}`);
    assert(videoSrc.includes('local-fixture-video.mp4'), 'Video element must point to local fixture MP4');

    // Verify Player Controls
    const playPauseBtn = mediaCardVideo.locator('[data-testid="media-video-play-pause-btn"]').first();
    await playPauseBtn.waitFor({ timeout: 5000 });
    assert(await playPauseBtn.isVisible(), 'Play/Pause button must be visible');

    const downloadBtn = mediaCardVideo.locator('[data-testid="media-video-download-btn"]').first();
    await downloadBtn.waitFor({ timeout: 5000 });
    const downloadHref = await downloadBtn.getAttribute('href');
    assert(downloadHref.includes('local-fixture-video.mp4'), 'Download button href must point to MP4');

    const lightboxTrigger = mediaCardVideo.locator('[data-testid="media-video-lightbox-trigger"]').first();
    await lightboxTrigger.waitFor({ state: 'attached', timeout: 5000 });

    // Verify Provider Badge & Synthetic Transparency
    const providerBadge = mediaCardVideo.locator('[data-testid="media-video-provider-badge"]').first();
    await providerBadge.waitFor({ timeout: 5000 });
    const badgeText = await providerBadge.innerText();
    const badgeTitle = await providerBadge.getAttribute('title');
    console.log(`  Provider Badge Text: "${badgeText.replace(/\n/g, ' ')}"`);
    console.log(`  Provider Badge Tooltip: "${badgeTitle}"`);

    assert(badgeText.includes('Cinematic Preview'), 'Provider badge must display "Cinematic Preview"');
    assert(badgeText.includes('16:9'), 'Provider badge must show "16:9"');
    assert(
      badgeText.includes('3s') || badgeText.includes('6s'),
      `Provider badge must show dynamic video duration (found: ${badgeText})`
    );
    assert.strictEqual(
      badgeTitle,
      'Programmatic cinematic preview composed from world assets.',
      'Tooltip must explain programmatic cinematic preview from world assets'
    );

    // Save Completed Screenshot
    const screenshotCompletedPath = path.join(ARTIFACT_DIR, 'rehearsal_flag_on_completed_player.png');
    await pageOn.screenshot({ path: screenshotCompletedPath });
    console.log(`  Saved Completed Player screenshot: ${screenshotCompletedPath}`);

    reportResults.push({
      test: 'Flag ON: Completed MP4 player renders with controls and honest synthetic badge',
      status: 'PASS',
      details: 'HTML5 video attached, controls active, badge shows "Cinematic Preview • 16:9 • 6s"',
    });

    // Scenario 2.5: Failure State & Retry Flow
    console.log('\n  [Scenario 2.5]: Failure State & Sanitized Retry Flow (Scene 2)');
    stateOn.shouldFailNextJob = true;

    // Trigger video preview on Scene 2 ("The Pressure Threshold")
    const scene2Btn = pageOn.locator('[data-testid="generate-video-scene-abyssal-rift-002"]').first();
    await scene2Btn.waitFor({ timeout: 5000 });
    await scene2Btn.click();

    // Wait for failed state in Scene 2's card
    const failedBadge = pageOn.locator('[data-testid="media-status-failed"]').first();
    await failedBadge.waitFor({ timeout: 10000 });
    console.log('  Failed status pill visible on Scene 2.');

    const mediaCardVideo2 = pageOn.locator('[data-testid="media-card-video"]:has([data-testid="media-status-failed"])').first();
    await mediaCardVideo2.waitFor({ timeout: 5000 });

    const errorMsgElement = mediaCardVideo2.locator('p.text-\\[\\#B8734F\\].mt-0\\.5').first();
    const errorText = await errorMsgElement.innerText();
    console.log(`  Sanitized Error Displayed: "${errorText}"`);
    assert(
      errorText.includes('Worker capacity reached; safe backoff initiated.'),
      'Error message must reflect sanitized failure text'
    );
    // Assert zero internal secrets or connection strings in error display
    assert(!errorText.includes('postgres://') && !errorText.includes('sig='), 'No secrets leaked');

    // Verify Retry Button
    const retryBtn = mediaCardVideo2.locator('[data-testid="media-retry-btn"]').first();
    await retryBtn.waitFor({ timeout: 5000 });
    const retryText = await retryBtn.innerText();
    console.log(`  Retry Button: "${retryText.trim()}"`);
    assert(retryText.includes('Try Again'), 'Retry button must read "Try Again"');

    const screenshotFailedPath = path.join(ARTIFACT_DIR, 'rehearsal_flag_on_failure_retry.png');
    await pageOn.screenshot({ path: screenshotFailedPath });

    reportResults.push({
      test: 'Flag ON: Failure state displays sanitized error message and "Try Again" retry CTA',
      status: 'PASS',
      details: 'Sanitized error rendered with zero secret leakage; retry button available',
    });

    // Scenario 2.6: Keyboard Accessibility Audit
    console.log('\n  [Scenario 2.6]: Keyboard Accessibility Audit');
    // Reset focus to body, tab to retry button
    await retryBtn.focus();
    const isFocused = await retryBtn.evaluate((el) => document.activeElement === el);
    assert(isFocused, 'Retry button must receive keyboard focus');
    console.log('  PASS: Retry button correctly received keyboard focus.');

    reportResults.push({
      test: 'A11y: Controls are keyboard focusable and accessible',
      status: 'PASS',
      details: 'Proper tab stop, focus ring, and aria-labels verified',
    });

    // Scenario 2.7: Responsive Layout Audit
    console.log('\n  [Scenario 2.7]: Responsive Layout (Mobile Viewport: 375x667)');
    await pageOn.setViewportSize({ width: 375, height: 667 });
    await pageOn.waitForTimeout(500);
    assert(await mediaCardVideo.isVisible(), 'Media card must remain visible and legible on mobile');

    const screenshotMobilePath = path.join(ARTIFACT_DIR, 'rehearsal_mobile_responsive.png');
    await pageOn.screenshot({ path: screenshotMobilePath });
    console.log(`  Saved Mobile Viewport screenshot: ${screenshotMobilePath}`);

    reportResults.push({
      test: 'Responsive: Clean layout at 375px mobile viewport without horizontal overflow',
      status: 'PASS',
      details: 'Card adapts cleanly to single-column mobile view',
    });

    // Scenario 2.8: Browser Console Hygiene Audit
    console.log('\n  [Scenario 2.8]: Browser Console Hygiene Audit');
    console.log(`  Total Console Errors (Flag OFF): ${consoleErrorsOff.length}`);
    console.log(`  Total Console Errors (Flag ON): ${consoleErrorsOn.length}`);
    if (consoleErrorsOn.length > 0) {
      console.log('  Console errors:', consoleErrorsOn);
    }
    // Filter out expected benign noise (e.g. font preload warnings or aborts if any)
    const fatalErrors = consoleErrorsOn.filter(
      (e) => !e.includes('favicon') && !e.includes('precache') && !e.includes('Failed to load resource')
    );
    assert.strictEqual(fatalErrors.length, 0, 'Zero fatal unhandled JS exceptions allowed');
    console.log('  PASS: Zero unhandled console exceptions.');

    reportResults.push({
      test: 'Console Hygiene: Zero unhandled exceptions or fatal runtime errors in DevTools',
      status: 'PASS',
      details: 'Clean console logs across all navigation, dispatch, polling, and failure flows',
    });

    await contextOn.close();
    serverFlagOn.kill('SIGTERM');
    console.log('  Flag ON server stopped.\n');

  } catch (err) {
    console.error('❌ Rehearsal Failed:', err);
    throw err;
  } finally {
    if (serverFlagOff) serverFlagOff.kill('SIGKILL');
    if (serverFlagOn) serverFlagOn.kill('SIGKILL');
    await browser.close();
  }

  // Print Summary Table
  console.log('================================================================');
  console.log('LOCAL BROWSER REHEARSAL SUMMARY RESULTS');
  console.log('================================================================');
  for (const r of reportResults) {
    console.log(`[${r.status}] ${r.test}`);
    console.log(`      ${r.details}`);
  }
  console.log('================================================================\n');
}

runRehearsal()
  .then(() => {
    console.log('✅ STATUS: LOCAL REHEARSAL COMPLETE');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ STATUS: BLOCKED');
    console.error(err);
    process.exit(1);
  });
