import { chromium } from 'playwright';
import assert from 'assert';
import fs from 'fs';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

async function verifyPWA() {
  console.log('📱 Starting Phase 37 PWA Installation & Offline Behavior Audit...\n');

  // 1. Verify Manifest HTTP Endpoint
  console.log('1. Checking manifest.webmanifest HTTP endpoint...');
  const manifestRes = await fetch(`${FRONTEND_URL}/manifest.webmanifest`);
  assert.strictEqual(manifestRes.status, 200, 'manifest.webmanifest must return 200 OK');
  const manifest = await manifestRes.json();
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Short Name: ${manifest.short_name}`);
  console.log(`   Theme Color: ${manifest.theme_color}`);
  console.log(`   Display: ${manifest.display}`);
  assert.strictEqual(manifest.short_name, 'PRAROHA', 'short_name must be PRAROHA');
  assert.strictEqual(manifest.theme_color, '#294B3A', 'theme_color must be #294B3A');
  assert.strictEqual(manifest.display, 'standalone', 'display must be standalone');
  assert.strictEqual(manifest.icons.length >= 3, true, 'manifest must have at least 3 icons');
  console.log('   PASS: Web app manifest is valid.');

  // 2. Verify Icons HTTP Endpoints
  console.log('\n2. Checking PWA icon HTTP endpoints...');
  for (const icon of manifest.icons) {
    const iconRes = await fetch(`${FRONTEND_URL}${icon.src}`);
    assert.strictEqual(iconRes.status, 200, `Icon ${icon.src} must return 200 OK`);
    console.log(`   PASS: Icon ${icon.src} (${icon.sizes}) returns HTTP 200 OK`);
  }

  // 3. Verify Service Worker Script
  console.log('\n3. Checking sw.js endpoint...');
  const swRes = await fetch(`${FRONTEND_URL}/sw.js`);
  let swText = '';
  if (swRes.status === 200) {
    swText = await swRes.text();
  }
  if (!swText.includes('workbox') && !swText.includes('precache')) {
    const distSw = fs.readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf-8');
    assert(distSw.includes('workbox') || distSw.includes('precache'), 'dist/sw.js must contain workbox/precache runtime');
    console.log('   PASS: Verified sw.js with workbox precaching in production build bundle.');
  } else {
    console.log('   PASS: sw.js endpoint is valid.');
  }

  // 4. Verify Browser Context & Service Worker Registration
  console.log('\n4. Launching browser to verify SW registration and offline shell...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

  // Authenticate / continue as guest
  const guestBtn = page.locator('[data-testid="auth-guest-demo-btn"]');
  if (await guestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await guestBtn.click();
    await page.waitForTimeout(500);
  }

  // Wait for Service Worker registration
  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      return !!reg.active;
    } catch {
      return false;
    }
  });
  console.log(`   Service Worker registered in browser: ${swRegistered}`);
  assert(swRegistered, 'Service Worker must be active and registered');
  console.log('   PASS: Service Worker actively running in browser context.');

  // 5. Test Offline Mode & Transparency Banner
  console.log('\n5. Simulating Offline Network Condition...');
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.waitForTimeout(500);

  const offlineBanner = page.locator('[data-testid="pwa-offline-banner"]');
  const isVisible = await offlineBanner.isVisible();
  assert(isVisible, 'Offline banner must appear when offline');
  const bannerText = await offlineBanner.textContent();
  console.log(`   Offline Banner Content: "${bannerText.trim()}"`);
  assert(bannerText.includes('Offline Mode'), 'Banner must indicate Offline Mode');
  assert(bannerText.includes('Generative AI'), 'Banner must explicitly communicate that Generative AI requires internet');
  console.log('   PASS: Offline banner cleanly communicates network limitation and AI requirements.');

  // Restore online state
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForTimeout(300);
  assert(!(await offlineBanner.isVisible()), 'Offline banner should dismiss automatically upon reconnecting');
  console.log('   PASS: Offline banner dismissed automatically when back online.');

  await browser.close();
  console.log('\n================================================================');
  console.log('PHASE 37 PWA AUDIT: ALL TESTS PASSED!');
  console.log('================================================================');
}

verifyPWA().catch((err) => {
  console.error('\n❌ PWA Audit Failed:', err);
  process.exit(1);
});
