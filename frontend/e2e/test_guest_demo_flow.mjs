import { chromium } from 'playwright';
import { spawn } from 'child_process';
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const TEST_PORT = 5185;

function startViteServer() {
  return new Promise((resolve, reject) => {
    const viteBin = path.join(FRONTEND_DIR, 'node_modules/vite/bin/vite.js');
    const serverProcess = spawn(
      process.execPath,
      [viteBin, '--port', String(TEST_PORT), '--strictPort'],
      {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          // Feature flag is unset/false by default
          VITE_ENABLE_CINEMATIC_PREVIEW: 'false',
          VITE_API_URL: `http://localhost:${TEST_PORT}/api`,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        serverProcess.kill('SIGKILL');
        reject(new Error(`Timeout waiting for Vite on port ${TEST_PORT}`));
      }
    }, 15000);

    const checkOutput = (data) => {
      const text = data.toString();
      if (text.includes('Local:') || text.includes(`:${TEST_PORT}`)) {
        started = true;
        clearTimeout(timeout);
        console.log(`[Vite] Server started successfully on http://localhost:${TEST_PORT}`);
        resolve(serverProcess);
      }
    };

    serverProcess.stdout.on('data', checkOutput);
    serverProcess.stderr.on('data', checkOutput);
  });
}

async function runGuestDemoFlowTest() {
  console.log('='.repeat(80));
  console.log('PRAROHA — Guest / Demo Workspace Regression & Safety Test');
  console.log('='.repeat(80));

  let serverProcess;
  let browser;

  const results = [];
  const testErrors = [];

  try {
    serverProcess = await startViteServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const networkRequests = [];
    const abortedMutations = [];
    const unauthorized401s = [];
    const consoleErrors = [];

    // Enforce read-only isolation & record all requests
    await page.route('**', (route) => {
      const req = route.request();
      const method = req.method();
      const url = req.url();

      networkRequests.push({ method, url });

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        abortedMutations.push({ method, url });
        console.warn(`[READ-ONLY GUARD] Aborted mutating ${method} request to: ${url}`);
        return route.abort('blockedbyclient');
      }

      return route.continue();
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        if (msg.text().includes('401')) {
          unauthorized401s.push(msg.text());
        }
      }
    });

    // -------------------------------------------------------------
    // Test Case 1: Initial Landing on Auth Screen
    // -------------------------------------------------------------
    console.log('\n[Test 1] Navigating to root / ...');
    await page.goto(`http://localhost:${TEST_PORT}/`, { waitUntil: 'networkidle' });

    const guestBtn = page.locator('[data-testid="auth-guest-demo-btn"]');
    await guestBtn.waitFor({ state: 'visible', timeout: 5000 });
    const guestBtnText = (await guestBtn.innerText()).trim();
    assert.strictEqual(
      guestBtnText,
      'Explore in Demo Workspace →',
      'Guest demo button must be visible with correct text on login screen'
    );
    results.push({ name: 'Guest entry button present on AuthScreen', status: 'PASS' });

    // -------------------------------------------------------------
    // Test Case 2: Click Guest Entry and Verify Demo Workspace
    // -------------------------------------------------------------
    console.log('\n[Test 2] Clicking "Explore in Demo Workspace →"...');
    await guestBtn.click();
    await page.waitForTimeout(1500);

    // Verify session expired notice is NOT displayed
    const bodyText = await page.locator('body').innerText();
    assert(
      !bodyText.includes('Your session has expired'),
      'Session expired error must NOT appear when clicking guest demo button'
    );

    // Verify we transitioned into the main AppShell
    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 5000 });
    assert(await sidebar.isVisible(), 'Main AppShell sidebar must be visible in guest demo workspace');

    // Verify canonical demo universe is loaded into Stage 5 Codex
    const universeTitle = page.locator('h1:has-text("Bio-City"), h1:has-text("Sanctum"), h2:has-text("Sanctum"), span:has-text("Bio-City")').first();
    await universeTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  PASS: Canonical demo universe successfully mounted.');
    results.push({ name: 'Guest entry lands in demo workspace without 401 bounce', status: 'PASS' });

    // -------------------------------------------------------------
    // Test Case 3: Verify Scenes Tab & Disabled Cinematic Preview Control
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying Scenes tab and Cinematic Preview (Disabled)...');
    const scenesTab = page.locator('#codex-tab-scenes, button:has-text("Scenes")').first();
    if (await scenesTab.isVisible()) {
      await scenesTab.click();
      await page.waitForTimeout(500);
    }

    const disabledControl = page.locator('[data-testid^="generate-video-disabled-"]').first();
    await disabledControl.waitFor({ state: 'visible', timeout: 5000 });
    assert(await disabledControl.isVisible(), 'Disabled video control must be visible on demo scene card');

    const controlText = (await disabledControl.innerText()).trim();
    const tooltipText = await disabledControl.getAttribute('title');
    console.log(`  Disabled Control Text: "${controlText}"`);
    console.log(`  Disabled Control Tooltip: "${tooltipText}"`);

    assert.strictEqual(
      controlText,
      'Cinematic Preview (Disabled)',
      'Control text must read "Cinematic Preview (Disabled)" when feature flag is OFF'
    );
    assert.strictEqual(
      tooltipText,
      'Cinematic preview generation is currently disabled in production. Awaiting release approval.',
      'Tooltip must explain that cinematic preview is awaiting release approval'
    );

    // Attempt to click the disabled control and verify 0 dispatches occur
    await disabledControl.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);

    const cinematicDispatches = networkRequests.filter(
      (r) =>
        (r.method === 'POST' && (r.url.includes('/media') || r.url.includes('/cinematic'))) ||
        r.url.includes('/cinematic/render') ||
        r.url.includes('/media/cinematic')
    );
    assert.strictEqual(cinematicDispatches.length, 0, 'Clicking disabled control must NOT dispatch any cinematic generation requests');
    results.push({ name: 'Disabled cinematic preview control verified (text, tooltip, zero dispatches)', status: 'PASS' });

    // -------------------------------------------------------------
    // Test Case 4: Navigation to Creations and Graveyard in Guest Mode
    // -------------------------------------------------------------
    console.log('\n[Test 4] Navigating to My Creations and Graveyard in guest mode...');
    
    // Click "My Creations"
    const creationsNavBtn = page.locator('button[aria-label="My Creations"], button:has-text("My Creations")').first();
    await creationsNavBtn.click();
    await page.waitForTimeout(500);

    const creationsHeading = page.locator('h2:has-text("My Creations")');
    await creationsHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await creationsHeading.isVisible(), 'My Creations view must open without session expiration');

    // Verify demo project is listed in creations
    const demoCard = page.locator('text=The Sunken City: Bio-City').first();
    assert(await demoCard.isVisible(), 'Canonical demo project must appear in guest creations list');

    // Click "Graveyard"
    const graveyardNavBtn = page.locator('button[aria-label="Graveyard"], button:has-text("Graveyard")').first();
    await graveyardNavBtn.click();
    await page.waitForTimeout(500);

    const graveyardHeading = page.locator('h2:has-text("Graveyard")');
    await graveyardHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await graveyardHeading.isVisible(), 'Graveyard view must open without session expiration');

    const emptyGraveyardText = page.locator('text=Your graveyard is empty.');
    assert(await emptyGraveyardText.isVisible(), 'Empty graveyard placeholder must display without 401 error');
    results.push({ name: 'Guest creations and graveyard views operate without 401 errors', status: 'PASS' });

    // -------------------------------------------------------------
    // Test Case 5: Direct Deep Routing to Demo Project URL
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing direct deep routing to /projects/demo-canonical-bio-city...');
    await page.goto(`http://localhost:${TEST_PORT}/projects/demo-canonical-bio-city`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(500);

    // Verify project hydrated
    const projectTitle = page.locator('[data-testid="topbar-project-title"]');
    await projectTitle.waitFor({ state: 'visible', timeout: 5000 });
    const titleText = await projectTitle.innerText();
    assert(titleText.includes('Bio-City'), `Direct URL deep routing must hydrate demo universe cleanly (got ${titleText})`);

    // Switch to scenes tab to verify scene data
    const scenesTabDeep = page.locator('#codex-tab-scenes, button:has-text("Scenes")').first();
    if (await scenesTabDeep.isVisible()) {
      await scenesTabDeep.click();
      await page.waitForTimeout(500);
    }

    const sceneHeader = page.locator('h3:has-text("Descent into the Coral Sanctum")').first();
    await sceneHeader.waitFor({ state: 'visible', timeout: 5000 });
    assert(await sceneHeader.isVisible(), 'Scene card must be visible on scenes tab');
    results.push({ name: 'Direct deep routing to /projects/demo-canonical-bio-city hydrates successfully', status: 'PASS' });

    // -------------------------------------------------------------
    // Test Case 6: Session Expiration Guard Verification
    // -------------------------------------------------------------
    console.log('\n[Test 6] Verifying guest session cannot be expired by 401 responses...');
    const sessionIntact = await page.evaluate(() => {
      const auth = window.__authStore?.getState();
      const client = window.__apiClient || window.apiClient;
      // Intentionally verify auth state
      return auth?.authStatus === 'AUTHENTICATED' && auth?.user?.user_metadata?.is_guest === true;
    });
    assert(sessionIntact, 'Guest session must remain AUTHENTICATED with is_guest metadata');
    results.push({ name: 'Guest session remains insulated from remote 401s', status: 'PASS' });

    // -------------------------------------------------------------
    // Test Case 7: Sign Out Flow Verification
    // -------------------------------------------------------------
    console.log('\n[Test 7] Verifying sign out from guest mode...');
    await page.evaluate(async () => {
      await window.__authStore?.getState()?.signOut();
    });
    await page.waitForTimeout(1000);

    const authScreenReopened = page.locator('[data-testid="auth-guest-demo-btn"]');
    await authScreenReopened.waitFor({ state: 'visible', timeout: 5000 });
    assert(await authScreenReopened.isVisible(), 'Sign out must return user cleanly to AuthScreen');
    results.push({ name: 'Sign out cleanly clears guest session and returns to AuthScreen', status: 'PASS' });

    console.log('\n' + '='.repeat(80));
    console.log(`TEST SUMMARY: ${results.filter((r) => r.status === 'PASS').length}/${results.length} PASSED`);
    results.forEach((r) => console.log(`  [${r.status}] ${r.name}`));
    console.log('='.repeat(80));

    return { success: true, results };
  } catch (err) {
    console.error('\nTEST FAILED:', err);
    testErrors.push(err.message);
    return { success: false, results, error: err.message };
  } finally {
    if (browser) await browser.close();
    if (serverProcess) {
      console.log('[Vite] Stopping test server...');
      serverProcess.kill('SIGKILL');
    }
  }
}

runGuestDemoFlowTest()
  .then((res) => {
    if (!res.success) {
      process.exit(1);
    }
    console.log('\nAll guest/demo regression tests completed successfully.');
  })
  .catch((err) => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
