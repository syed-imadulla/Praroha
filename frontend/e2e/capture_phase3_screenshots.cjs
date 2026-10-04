const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const artifactDir = '/home/syed-imadulla/.gemini/antigravity-ide/brain/673909d6-31c3-46fd-be51-2fffe4acec04';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 1. Ingest ocean preset
  await page.locator('button:has-text("Sunken Ocean City")').click();
  await page.waitForTimeout(200);

  // 2. Extract Seed DNA
  await page.locator('button:has-text("Extract Seed DNA")').click();
  await page.locator('main').getByText('Distilled Seed DNA').waitFor({ timeout: 10000 });

  // 3. Navigate to Stage 3
  await page.locator('button:has-text("Generate 3 Worlds (Stage 3)")').click();
  await page.locator('h2:has-text("Three Contrasting Creative Worlds")').waitFor({ timeout: 10000 });
  await page.locator('main').locator('text=Candidate 01').waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);

  // Close inspector if open to get full width hero shot
  const closeBtn = page.locator('aside button[title="Close Inspector"]');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // Screenshot 1: Full-width 3-Column Comparison Grid
  const shot1Path = path.join(artifactDir, 'phase3_three_worlds_canvas.png');
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log('Saved screenshot 1:', shot1Path);

  // 4. Open Inspector on Bio-City
  await page.locator('button:has-text("Inspect Details")').nth(1).click();
  await page.waitForTimeout(400);

  // Screenshot 2: Stage 3 with Inspector Drawer Open
  const shot2Path = path.join(artifactDir, 'phase3_worlds_inspector_drawer.png');
  await page.screenshot({ path: shot2Path, fullPage: false });
  console.log('Saved screenshot 2:', shot2Path);

  await browser.close();
}

capture();
