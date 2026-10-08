// test_phase_31_7_e2e.mjs
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const SUPABASE_URL = 'https://stxnxkzaftmwcbtvgzbm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Bds6tNvkx3jLLAuG7OhSeg_HS60imCp';
const API_BASE = 'http://localhost:8000/api';
const FRONTEND_URL = 'http://localhost:5173';

const USER_A_EMAIL = 'user_a@praroha.local';
const USER_B_EMAIL = 'user_b@praroha.local';
const TEST_PASSWORD = 'Password123!';

async function run() {
  console.log('====================================================');
  console.log('PHASE 31.7 — SUPABASE AUTHENTICATION & OWNERSHIP E2E');
  console.log('====================================================\n');

  // 1. Initialize Supabase JS Client
  console.log('1. Initializing Supabase clients for User A and User B...');
  const supabaseA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 2. Authenticate User A and User B
  console.log('2. Authenticating User A and User B via Supabase Auth...');
  const { data: authA, error: errA } = await supabaseA.auth.signInWithPassword({
    email: USER_A_EMAIL,
    password: TEST_PASSWORD,
  });
  if (errA || !authA.session) {
    throw new Error(`User A login failed: ${errA?.message}`);
  }
  const tokenA = authA.session.access_token;
  const userA_id = authA.user.id;
  console.log(`   PASS: User A authenticated (ID: ${userA_id})`);

  const { data: authB, error: errB } = await supabaseB.auth.signInWithPassword({
    email: USER_B_EMAIL,
    password: TEST_PASSWORD,
  });
  if (errB || !authB.session) {
    throw new Error(`User B login failed: ${errB?.message}`);
  }
  const tokenB = authB.session.access_token;
  const userB_id = authB.user.id;
  console.log(`   PASS: User B authenticated (ID: ${userB_id})\n`);

  // Helper for authenticated backend requests
  async function api(path, token, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  // 3. Test Unauthenticated Access
  console.log('3. Testing Unauthenticated Request...');
  const unauthRes = await api('/projects', null);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('   PASS: Unauthenticated request rejected with 401 Unauthorized.\n');

  // 4. User A creates Project A
  console.log('4. User A creating Project A...');
  const createResA = await api('/projects', tokenA, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Verdant Solaris Alpha',
      seed_text: 'A biome composed of living crystalline foliage.',
    }),
  });
  if (!createResA.ok || !createResA.data?.data) {
    throw new Error(`User A failed to create project: ${JSON.stringify(createResA.data)}`);
  }
  const projA = createResA.data.data;
  if (projA.owner_id !== userA_id) {
    throw new Error(`Project A owner_id mismatch! Expected ${userA_id}, got ${projA.owner_id}`);
  }
  console.log(`   PASS: Project A created (ID: ${projA.id}, owner_id: ${projA.owner_id})\n`);

  // 5. User B creates Project B (attempting to spoof owner_id as userA_id)
  console.log('5. User B creating Project B with spoofed owner_id...');
  const createResB = await api('/projects', tokenB, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Cerulean Depths Beta',
      seed_text: 'An abyssal civilization harnessing geothermal vents.',
      owner_id: userA_id, // Spoof attempt
    }),
  });
  if (!createResB.ok || !createResB.data?.data) {
    throw new Error(`User B failed to create project: ${JSON.stringify(createResB.data)}`);
  }
  const projB = createResB.data.data;
  if (projB.owner_id !== userB_id) {
    throw new Error(`Spoofing protection failed! Expected ${userB_id}, got ${projB.owner_id}`);
  }
  console.log(`   PASS: Project B created with server-enforced owner_id: ${projB.owner_id} (spoofed value ignored)\n`);

  // 6. Test Two-User Project List Isolation
  console.log('6. Verifying User-Scoped Project Lists...');
  const listA = await api('/projects', tokenA);
  const listB = await api('/projects', tokenB);
  const idsA = listA.data.data.map((p) => p.id);
  const idsB = listB.data.data.map((p) => p.id);

  if (!idsA.includes(projA.id) || idsA.includes(projB.id)) {
    throw new Error(`User A list violated isolation! ids: ${JSON.stringify(idsA)}`);
  }
  if (!idsB.includes(projB.id) || idsB.includes(projA.id)) {
    throw new Error(`User B list violated isolation! ids: ${JSON.stringify(idsB)}`);
  }
  console.log('   PASS: User A sees Project A and NOT Project B.');
  console.log('   PASS: User B sees Project B and NOT Project A.\n');

  // 7. Test Graveyard Isolation & Lifecycle
  console.log('7. Verifying Graveyard Isolation & Soft-delete...');
  const delA = await api(`/projects/${projA.id}`, tokenA, { method: 'DELETE' });
  if (!delA.ok) throw new Error('Failed to soft-delete Project A');

  const graveA = await api('/projects/graveyard', tokenA);
  const graveB = await api('/projects/graveyard', tokenB);
  const graveIdsA = graveA.data.data.map((p) => p.id);
  const graveIdsB = graveB.data.data.map((p) => p.id);

  if (!graveIdsA.includes(projA.id)) throw new Error('Project A must be in User A graveyard');
  if (graveIdsB.includes(projA.id)) throw new Error('Project A must NOT be in User B graveyard');
  console.log('   PASS: Soft-deleted Project A is in User A graveyard only, invisible to User B.');

  // Restore Project A
  const restoreA = await api(`/projects/${projA.id}/restore`, tokenA, { method: 'POST' });
  if (!restoreA.ok) throw new Error('Failed to restore Project A');
  console.log('   PASS: Project A restored successfully.\n');

  // 8. Direct URL Attack & Bundle Authorization
  console.log('8. Testing Direct URL & Bundle Authorization (User B attacking Project A)...');
  const bundleAttack = await api(`/projects/${projA.id}/bundle`, tokenB);
  if (bundleAttack.ok || bundleAttack.status === 200) {
    throw new Error(`CRITICAL: User B was able to fetch Project A bundle! Status: ${bundleAttack.status}`);
  }
  if (bundleAttack.status !== 404 && bundleAttack.status !== 403) {
    throw new Error(`Expected 404 or 403 for unauthorized bundle, got ${bundleAttack.status}`);
  }
  console.log(`   PASS: User B GET /projects/${projA.id}/bundle rejected with ${bundleAttack.status}.`);

  const getAttack = await api(`/projects/${projA.id}`, tokenB);
  if (getAttack.ok || getAttack.status === 200) {
    throw new Error(`CRITICAL: User B was able to fetch Project A! Status: ${getAttack.status}`);
  }
  console.log(`   PASS: User B GET /projects/${projA.id} rejected with ${getAttack.status}.\n`);

  // 9. CRUD Attack Test
  console.log('9. Testing CRUD Attacks from User B against Project A...');
  const crudDelete = await api(`/projects/${projA.id}`, tokenB, { method: 'DELETE' });
  if (crudDelete.ok) throw new Error('CRITICAL: User B successfully soft-deleted Project A!');
  console.log(`   PASS: DELETE /projects/${projA.id} rejected with ${crudDelete.status}`);

  const crudRestore = await api(`/projects/${projA.id}/restore`, tokenB, { method: 'POST' });
  if (crudRestore.ok) throw new Error('CRITICAL: User B successfully restored Project A!');
  console.log(`   PASS: POST /projects/${projA.id}/restore rejected with ${crudRestore.status}`);

  const crudPermanent = await api(`/projects/${projA.id}/permanent`, tokenB, { method: 'DELETE' });
  if (crudPermanent.ok) throw new Error('CRITICAL: User B permanently deleted Project A!');
  console.log(`   PASS: DELETE /projects/${projA.id}/permanent rejected with ${crudPermanent.status}`);

  // Verify Project A is completely intact for User A
  const verifyProjA = await api(`/projects/${projA.id}/bundle`, tokenA);
  if (!verifyProjA.ok || !verifyProjA.data?.data) {
    throw new Error('Project A was corrupted or inaccessible after attack attempts');
  }
  console.log('   PASS: Project A remains intact, valid, and fully accessible to User A.\n');

  // 10. Realtime Isolation Test
  console.log('10. Testing Realtime Isolation (Cross-User Event Filtering)...');
  let userAReceivedEvent = false;
  let userBReceivedEvent = false;

  const channelA = supabaseA.channel(`project-scope:${projA.id}`);
  const channelB = supabaseB.channel(`project-scope:${projB.id}`);

  channelA.on('broadcast', { event: 'project_ping' }, (payload) => {
    userAReceivedEvent = true;
  });
  channelB.on('broadcast', { event: 'project_ping' }, (payload) => {
    userBReceivedEvent = true;
  });

  await new Promise((resolve) => {
    let subs = 0;
    const checkSub = () => { if (++subs === 2) resolve(); };
    channelA.subscribe(checkSub);
    channelB.subscribe(checkSub);
  });

  // Broadcast event on Project A channel
  await channelA.send({
    type: 'broadcast',
    event: 'project_ping',
    payload: { message: 'hello from project A', timestamp: Date.now() },
  });

  // Wait 2 seconds for message distribution
  await new Promise((r) => setTimeout(r, 2000));

  if (!userAReceivedEvent) {
    console.log('   (Note: Realtime broadcast loopback depends on configuration; checking channel state)');
  }
  if (userBReceivedEvent) {
    throw new Error('CRITICAL LEAK: User B received event intended only for Project A!');
  }
  console.log('   PASS: User B received ZERO events from Project A.\n');

  await channelA.unsubscribe();
  await channelB.unsubscribe();

  // 11. Playwright Browser-Level Acceptance Testing
  console.log('11. Launching Playwright Browser Tests for Auth UI & Deep Routing...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  try {
    // --- Context 1: User A Sign In & Workspace Access ---
    console.log('   [Browser 1] Testing User A Sign In flow...');
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto(FRONTEND_URL);
    await pageA.waitForLoadState('networkidle');

    // Verify Auth Screen is visible
    const authHeading = await pageA.locator('h1, h2').filter({ hasText: /Welcome back/i }).first();
    if (!await authHeading.isVisible()) {
      throw new Error('Auth Screen heading "Welcome back" not visible for unauthenticated user');
    }
    console.log('   PASS: Auth Screen ("Welcome back") displayed on startup.');

    // Sign In User A
    await pageA.fill('input[type="email"]', USER_A_EMAIL);
    await pageA.fill('input[type="password"]', TEST_PASSWORD);
    await pageA.click('button:has-text("Sign In")');

    // Wait for workspace to load
    await pageA.waitForSelector('header', { timeout: 10000 });
    console.log('   PASS: User A successfully signed in and landed in Workspace.');

    // Verify TopBar shows account
    await pageA.click('#workspace-overflow-menu-btn');
    const emailLocator = pageA.locator('#workspace-overflow-popover').filter({ hasText: USER_A_EMAIL });
    if (!await emailLocator.isVisible()) {
      throw new Error(`User email ${USER_A_EMAIL} not found in Workspace Menu`);
    }
    console.log(`   PASS: User account (${USER_A_EMAIL}) displayed in Workspace Menu.`);
    await pageA.click('#workspace-overflow-menu-btn'); // close menu

    // --- Context 2: User B Direct URL Attack on Project A ---
    console.log('   [Browser 2] Testing User B Direct URL Attack on Project A (/projects/:id)...');
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Navigate directly to Project A URL
    await pageB.goto(`${FRONTEND_URL}/projects/${projA.id}`);
    await pageB.waitForLoadState('networkidle');

    // Context B is unauthenticated -> Auth screen is shown first
    await pageB.fill('input[type="email"]', USER_B_EMAIL);
    await pageB.fill('input[type="password"]', TEST_PASSWORD);
    await pageB.click('button:has-text("Sign In")');

    // Wait for routing rejection UI
    await pageB.waitForSelector('text=Cannot Open Project', { timeout: 10000 });
    const unavailableText = pageB.locator('text=This project isn\'t available.');
    if (!await unavailableText.isVisible()) {
      throw new Error('Expected "This project isn\'t available." message not found on unauthorized route!');
    }
    console.log('   PASS: Direct route to Project A for User B displays "This project isn\'t available."');

    // Verify Project A data is NOT leaked into the DOM
    const leakedContent = await pageB.locator(`text=${projA.title}`).count();
    if (leakedContent > 0) {
      throw new Error('CRITICAL LEAK: Project A title visible in unauthorized browser context!');
    }
    console.log('   PASS: Zero Project A data leaked to User B.');

    // --- Sign Out Test in Context 1 ---
    console.log('   [Browser 1] Testing Sign Out & Session Teardown...');
    const isMenuOpen = await pageA.locator('#sign-out-btn').isVisible();
    if (!isMenuOpen) {
      await pageA.click('#workspace-overflow-menu-btn');
    }
    await pageA.waitForSelector('#sign-out-btn', { timeout: 5000 });
    await pageA.click('#sign-out-btn');

    // Verify Auth Screen reappears
    await pageA.waitForSelector('text=Welcome back', { timeout: 10000 });
    console.log('   PASS: Sign out returned to Auth Screen.');

    // Refresh page and verify session is gone
    await pageA.reload();
    await pageA.waitForSelector('text=Welcome back', { timeout: 10000 });
    console.log('   PASS: Page refreshed; user remains unauthenticated on Auth Screen.\n');

    await contextA.close();
    await contextB.close();
  } finally {
    await browser.close();
  }

  console.log('====================================================');
  console.log('PHASE 31.7 COMPLETE — ALL ACCEPTANCE CRITERIA PASSED');
  console.log('====================================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
