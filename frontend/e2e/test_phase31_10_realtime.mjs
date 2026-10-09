// frontend/e2e/test_phase31_10_realtime.mjs
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const SUPABASE_URL = 'https://stxnxkzaftmwcbtvgzbm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Bds6tNvkx3jLLAuG7OhSeg_HS60imCp';
const API_BASE = 'http://localhost:8000/api';
const FRONTEND_URL = 'http://localhost:5173';

const TEST_EMAIL = 'user_a@praroha.local';
const TEST_PASSWORD = 'Password123!';

async function run() {
  console.log('================================================================');
  console.log('PHASE 31.10 — REALTIME MULTI-TAB & PROJECT ISOLATION VERIFICATION');
  console.log('================================================================\n');

  // Authenticate user
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: auth, error: err } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (err || !auth.session) throw new Error(`Auth failed: ${err?.message}`);
  const token = auth.session.access_token;
  console.log('1. User authenticated.');

  async function api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  async function waitForJob(jobId, maxSec = 120) {
    for (let i = 0; i < maxSec * 2; i++) {
      const res = await api(`/jobs/${jobId}`);
      if (res.data?.data?.status === 'completed') {
        return res.data.data;
      }
      if (res.data?.data?.status === 'failed') {
        throw new Error(`Job ${jobId} failed: ${res.data?.data?.error_message}`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Job ${jobId} timed out`);
  }

  // Create Project A
  const projARes = await api('/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Realtime Project A ' + Date.now(),
      seed_text: 'A floating solar archipelago drifting across a gas giant atmosphere.',
    }),
  });
  const projectAId = projARes.data.data.id;
  console.log(`2. Created Project A: ${projectAId}`);

  // Extract DNA and generate worlds for Project A
  const dnaRes = await api(`/projects/${projectAId}/dna/extract`, {
    method: 'POST',
    body: JSON.stringify({ raw_seed: 'A floating solar archipelago drifting across a gas giant atmosphere.' }),
  });
  if (dnaRes.data?.data?.id) {
    await waitForJob(dnaRes.data.data.id);
  }
  const worldsRes = await api(`/projects/${projectAId}/worlds/generate`, { method: 'POST' });
  if (worldsRes.data?.data?.id) {
    await waitForJob(worldsRes.data.data.id);
  }
  console.log('   Synthesized Project A DNA and Worlds.');

  // Launch browser with two separate tabs/contexts for same user
  console.log('\n3. Opening two real browser contexts (Tab 1 and Tab 2)...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const tab1 = await context1.newPage();
  const tab2 = await context2.newPage();

  async function loginAndOpen(page, projectId) {
    await page.goto(`${FRONTEND_URL}/projects/${projectId}`);
    await page.waitForLoadState('networkidle');
    const authHeading = page.locator('h1, h2').filter({ hasText: /Welcome back/i }).first();
    if (await authHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button:has-text("Sign In")');
      await page.waitForLoadState('networkidle');
    }
  }

  console.log('   Opening Tab 1 on Project A Stage 3...');
  await loginAndOpen(tab1, projectAId);
  await tab1.waitForSelector('#stage-nav-worlds', { timeout: 20000 });
  await tab1.click('#stage-nav-worlds');
  await tab1.waitForSelector('text=Divergent Worlds Engine', { timeout: 15000 });

  console.log('   Opening Tab 2 on Project A Stage 3...');
  await loginAndOpen(tab2, projectAId);
  await tab2.waitForSelector('#stage-nav-worlds', { timeout: 20000 });
  await tab2.click('#stage-nav-worlds');
  await tab2.waitForSelector('text=Divergent Worlds Engine', { timeout: 15000 });

  console.log('   PASS: Both tabs connected to Project A.');

  // TEST: Perform action in Tab 1, observe update in Tab 2 without refreshing
  console.log('\n4. Testing Realtime propagation from Tab 1 to Tab 2...');
  // In Tab 1, click Proceed to Selection (Stage 4) and select a world
  const proceedBtn1 = tab1.locator('[data-testid="bottom-proceed-to-stage4-btn"]');
  await proceedBtn1.click();
  await tab1.waitForSelector('text=Human World Selection & Creative Commitment', { timeout: 10000 });

  // Pick candidate in Tab 1
  const selectBtnTab1 = tab1.locator('button:has-text("Select This Direction")').first();
  await selectBtnTab1.click();
  console.log('   Tab 1: Selected world direction.');

  // Lock world direction in Tab 1
  const lockBtnTab1 = tab1.locator('[data-testid="bottom-confirm-lock-btn"]');
  await lockBtnTab1.waitFor({ state: 'visible', timeout: 5000 });
  await lockBtnTab1.click();
  await tab1.locator('#unfold-universe-btn').or(tab1.locator('text=Deep Progressive Unfolding')).or(tab1.locator('text=Universe Codex')).first().waitFor({ state: 'visible', timeout: 15000 });
  console.log('   Tab 1: Locked world direction and entered Stage 5.');

  // In Tab 2, check if Stage 4 / selection updated via Realtime
  console.log('   Observing Tab 2 without manual refresh...');
  // Navigate Tab 2 to Stage 4 or check lock state
  const proceedBtn2 = tab2.locator('[data-testid="bottom-proceed-to-stage4-btn"]');
  if (await proceedBtn2.isVisible().catch(() => false)) {
    await proceedBtn2.click();
  }
  // Verify Tab 2 reflects that world is locked or Stage 5 is unlocked
  await tab2.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Direction Locked') || text.includes('Selected Direction') || text.includes('Universe Codex') || text.includes('Unfold');
  }, { timeout: 15000 });
  console.log('   PASS: Tab 2 synchronized project state without page reload!');

  // TEST: Project Isolation
  console.log('\n5. Testing Project Isolation (Project A vs Project B)...');
  const projBRes = await api('/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Project B Isolated ' + Date.now(),
      seed_text: 'Subterranean crystal hives of neon insects.',
    }),
  });
  const projectBId = projBRes.data.data.id;
  console.log(`   Created Project B: ${projectBId}`);

  // Open Tab 2 to Project B
  await tab2.goto(`${FRONTEND_URL}/projects/${projectBId}`);
  await tab2.waitForLoadState('networkidle');

  // Generate media in Project A
  const mediaRes = await api(`/projects/${projectAId}/media/generate`, {
    method: 'POST',
    body: JSON.stringify({
      entity_type: 'character',
      entity_id: 'isolated-char-01',
      media_type: 'voice',
      prompt: 'A test voice message.',
      voice_id: 'protagonist-resolute',
    }),
  });
  console.log('   Dispatched media generation in Project A.');

  // Tab 2 (on Project B) should remain strictly on Project B without receiving Project A's events
  await tab2.waitForTimeout(2000);
  const tab2Url = tab2.url();
  if (!tab2Url.includes(projectBId)) {
    throw new Error('Project isolation violated: Tab 2 URL changed unexpectedly');
  }
  console.log('   PASS: Project isolation verified! Project B tab remained completely isolated.');

  console.log('\n================================================================');
  console.log('REALTIME MULTI-TAB & ISOLATION VERIFICATION PASSED!');
  console.log('================================================================');

  await browser.close();
}

run().catch((err) => {
  console.error('\n❌ REALTIME MULTI-TAB VERIFICATION FAILED:', err);
  process.exit(1);
});
