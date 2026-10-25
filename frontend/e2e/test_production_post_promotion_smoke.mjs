import { chromium } from 'playwright';
import assert from 'assert';
import path from 'path';

const PRODUCTION_URL = 'https://praroha-ai.vercel.app';
const ARTIFACT_DIR = '/home/syed-imadulla/.gemini/antigravity-ide/brain/73d3251e-835d-4023-8490-eb9d867800cc';

async function runProductionSmokeTest() {
  console.log('='.repeat(80));
  console.log('PRAROHA — Post-Promotion Live Production Safety & Verification Audit');
  console.log(`Target Production URL: ${PRODUCTION_URL}`);
  console.log('='.repeat(80));

  let browser;
  const results = [];
  const testErrors = [];

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const networkRequests = [];
    const abortedMutations = [];
    const consoleErrors = [];

    // Enforce strict read-only isolation: intercept and abort ALL mutating HTTP methods
    await page.route('**', (route) => {
      const req = route.request();
      const method = req.method();
      const url = req.url();

      networkRequests.push({ method, url });

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (url.includes('vercel.live') || url.includes('va.vercel-scripts')) {
          return route.abort();
        }
        abortedMutations.push({ method, url });
        console.warn(`[READ-ONLY GUARD] Aborted mutating ${method} request to: ${url}`);
        return route.abort('blockedbyclient');
      }

      return route.continue();
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log(`[Browser Console Error]: ${text}`);
      }
    });

    // -------------------------------------------------------------
    // Test 1: Initial Landing on Auth Screen
    // -------------------------------------------------------------
    console.log('\n[Test 1] Navigating to Production Root...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

    // Verify root rendered
    const guestBtn = page.locator('[data-testid="auth-guest-demo-btn"]');
    await guestBtn.waitFor({ state: 'visible', timeout: 10000 });
    const guestBtnText = (await guestBtn.innerText()).trim();
    assert.strictEqual(
      guestBtnText,
      'Explore in Demo Workspace →',
      'Guest demo button must be visible with correct text on login screen'
    );
    console.log('  PASS: AuthScreen loaded with guest demo button.');
    results.push({ name: 'Initial landing on Production AuthScreen', status: 'PASS' });

    // -------------------------------------------------------------
    // Test 2: Click Guest Entry and Verify Demo Workspace (No 401 bounce)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Clicking "Explore in Demo Workspace →"...');
    await guestBtn.click();
    await page.waitForTimeout(2000);

    // Verify session expired notice is NOT displayed
    const bodyText = await page.locator('body').innerText();
    assert(
      !bodyText.includes('Your session has expired'),
      'Session expired error must NOT appear when clicking guest demo button'
    );

    // Verify main workspace sidebar is visible
    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    assert(await sidebar.isVisible(), 'Main AppShell sidebar must be visible in guest demo workspace');

    // Verify canonical demo universe is loaded
    const projectTitle = page.locator('[data-testid="topbar-project-title"]');
    await projectTitle.waitFor({ state: 'visible', timeout: 10000 });
    const titleText = await projectTitle.innerText();
    console.log(`  Project Title in TopBar: "${titleText}"`);
    assert(titleText.includes('Bio-City'), `Project title must contain Bio-City, got: "${titleText}"`);

    console.log('  PASS: Guest entry lands cleanly in demo workspace without 401 bounce.');
    results.push({ name: 'Guest entry lands in demo workspace without 401 bounce', status: 'PASS' });

    // Save screenshot of guest demo workspace
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'production_post_promotion_guest_workspace.png') });

    // -------------------------------------------------------------
    // Test 3: Verify Scenes Tab & Disabled Cinematic Preview Control
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying Scenes tab and Cinematic Preview (Disabled)...');
    const scenesTab = page.locator('#codex-tab-scenes, button:has-text("Scenes")').first();
    if (await scenesTab.isVisible()) {
      await scenesTab.click();
      await page.waitForTimeout(1000);
    }

    const disabledControl = page.locator('[data-testid^="generate-video-disabled-"]').first();
    await disabledControl.waitFor({ state: 'visible', timeout: 10000 });
    assert(await disabledControl.isVisible(), 'Disabled video control must be visible on demo scene card');

    const controlText = (await disabledControl.innerText()).trim();
    const tooltipText = await disabledControl.getAttribute('title');
    console.log(`  Disabled Control Text: "${controlText}"`);
    console.log(`  Disabled Control Tooltip: "${tooltipText}"`);

    assert.strictEqual(
      controlText,
      'Cinematic Preview (Disabled)',
      'Control text must read "Cinematic Preview (Disabled)" in Production when flag is unset/false'
    );
    assert.strictEqual(
      tooltipText,
      'Cinematic preview generation is currently disabled in production. Awaiting release approval.',
      'Tooltip must explain that cinematic preview is awaiting release approval'
    );

    // Attempt click on disabled control — verify zero mutating requests
    const preClickDispatches = networkRequests.filter(
      (r) => r.method === 'POST' && (r.url.includes('/media') || r.url.includes('/cinematic'))
    ).length;

    await disabledControl.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);

    const postClickDispatches = networkRequests.filter(
      (r) => r.method === 'POST' && (r.url.includes('/media') || r.url.includes('/cinematic'))
    ).length;

    assert.strictEqual(
      postClickDispatches - preClickDispatches,
      0,
      'Clicking disabled control must NOT dispatch any cinematic generation requests'
    );
    console.log('  PASS: Cinematic Preview control disabled; zero dispatches triggered.');
    results.push({ name: 'Disabled cinematic control verified on Production (label, tooltip, 0 dispatches)', status: 'PASS' });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'production_post_promotion_disabled_control.png') });

    // -------------------------------------------------------------
    // Test 4: Navigation to Creations and Graveyard in Guest Mode
    // -------------------------------------------------------------
    console.log('\n[Test 4] Navigating to My Creations and Graveyard in guest mode...');
    const creationsNavBtn = page.locator('button[aria-label="My Creations"], button:has-text("My Creations")').first();
    await creationsNavBtn.click();
    await page.waitForTimeout(800);

    const creationsHeading = page.locator('h2:has-text("My Creations")');
    await creationsHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await creationsHeading.isVisible(), 'My Creations view must open without session expiration');

    const demoCard = page.locator('text=The Sunken City: Bio-City').first();
    assert(await demoCard.isVisible(), 'Canonical demo project must appear in guest creations list');

    const graveyardNavBtn = page.locator('button[aria-label="Graveyard"], button:has-text("Graveyard")').first();
    await graveyardNavBtn.click();
    await page.waitForTimeout(800);

    const graveyardHeading = page.locator('h2:has-text("Graveyard")');
    await graveyardHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await graveyardHeading.isVisible(), 'Graveyard view must open without session expiration');
    console.log('  PASS: Creations and Graveyard views operate without 401 errors.');
    results.push({ name: 'Creations & Graveyard views navigate cleanly without session loss', status: 'PASS' });

    // -------------------------------------------------------------
    // Test 5: Direct Deep Routing to /projects/demo-canonical-bio-city
    // -------------------------------------------------------------
    console.log('\n[Test 5] Direct deep routing to /projects/demo-canonical-bio-city on Production...');
    await page.goto(`${PRODUCTION_URL}/projects/demo-canonical-bio-city`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1500);

    const deepProjectTitle = page.locator('[data-testid="topbar-project-title"]');
    await deepProjectTitle.waitFor({ state: 'visible', timeout: 10000 });
    const deepTitleText = await deepProjectTitle.innerText();
    console.log(`  Deep-routed project title: "${deepTitleText}"`);
    assert(deepTitleText.includes('Bio-City'), `Direct deep routing must hydrate demo universe cleanly (got: "${deepTitleText}")`);
    console.log('  PASS: Direct URL deep routing hydrates demo universe cleanly.');
    results.push({ name: 'Direct deep routing to /projects/demo-canonical-bio-city hydrates successfully', status: 'PASS' });

    // -------------------------------------------------------------
    // Test 6: Verify Guest Session Persistence in sessionStorage
    // -------------------------------------------------------------
    console.log('\n[Test 6] Verifying guest session in sessionStorage on Production...');
    const sessionFlags = await page.evaluate(() => {
      const auth = window.__authStore?.getState();
      const stored = sessionStorage.getItem('praroha_guest_session');
      return {
        isStored: stored === 'true',
        authStatus: auth?.authStatus,
        isGuestMeta: auth?.user?.user_metadata?.is_guest === true,
      };
    });
    console.log('  Session State:', sessionFlags);
    assert(sessionFlags.isStored, 'praroha_guest_session must be "true" in sessionStorage');
    assert.strictEqual(sessionFlags.authStatus, 'AUTHENTICATED', 'Auth status must be AUTHENTICATED');
    assert(sessionFlags.isGuestMeta, 'User metadata must have is_guest === true');
    console.log('  PASS: Guest session correctly persisted in sessionStorage.');
    results.push({ name: 'Guest session persists in sessionStorage and insulated from 401s', status: 'PASS' });

    // -------------------------------------------------------------
    // Test 7: Sign Out Flow Verification
    // -------------------------------------------------------------
    console.log('\n[Test 7] Verifying sign out from guest mode on Production...');
    await page.evaluate(async () => {
      await window.__authStore?.getState()?.signOut();
    });
    await page.waitForTimeout(1000);

    const authScreenReopened = page.locator('[data-testid="auth-guest-demo-btn"]');
    await authScreenReopened.waitFor({ state: 'visible', timeout: 5000 });
    assert(await authScreenReopened.isVisible(), 'Sign out must return user cleanly to AuthScreen');
    console.log('  PASS: Sign out returns cleanly to AuthScreen.');
    results.push({ name: 'Sign out cleanly clears guest session and returns to AuthScreen', status: 'PASS' });

    // -------------------------------------------------------------
    // Test 8: Read-Only Mutation Safety Verification
    // -------------------------------------------------------------
    console.log('\n[Test 8] Verifying zero mutating requests dispatched to production backend...');
    console.log(`  Total intercepted network requests: ${networkRequests.length}`);
    console.log(`  Total aborted mutating requests: ${abortedMutations.length}`);
    assert.strictEqual(abortedMutations.length, 0, 'No mutating backend requests should have been attempted');
    results.push({ name: 'Zero mutating backend requests attempted during production smoke audit', status: 'PASS' });

    console.log('\n' + '='.repeat(80));
    console.log(`PRODUCTION SMOKE SUMMARY: ${results.filter((r) => r.status === 'PASS').length}/${results.length} PASSED`);
    results.forEach((r) => console.log(`  [${r.status}] ${r.name}`));
    console.log('='.repeat(80));

    return { success: true, results, productionUrl: PRODUCTION_URL };
  } catch (err) {
    console.error('\nPRODUCTION SMOKE TEST FAILED:', err);
    testErrors.push(err.message);
    return { success: false, results, error: err.message, productionUrl: PRODUCTION_URL };
  } finally {
    if (browser) await browser.close();
  }
}

runProductionSmokeTest()
  .then((res) => {
    if (!res.success) {
      process.exit(1);
    }
    console.log('\nAll Production post-promotion smoke tests completed successfully.');
  })
  .catch((err) => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
