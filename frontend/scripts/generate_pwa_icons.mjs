import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const svgContent = (isMaskable = false) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      background-color: ${isMaskable ? '#294B3A' : '#F8F4E8'};
      overflow: hidden;
    }
    svg {
      width: ${isMaskable ? '70%' : '80%'};
      height: ${isMaskable ? '70%' : '80%'};
    }
  </style>
</head>
<body>
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" fill="${isMaskable ? '#F8F4E8' : '#294B3A'}" />
    <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" fill="${isMaskable ? '#EAE4D4' : '#355A46'}" />
    <circle cx="18" cy="31" r="2.2" fill="#B85C46" />
  </svg>
</body>
</html>
`;

async function generateIcons() {
  const browser = await chromium.launch({ headless: true });
  
  const iconConfigs = [
    { name: 'pwa-192x192.png', size: 192, maskable: false },
    { name: 'pwa-512x512.png', size: 512, maskable: false },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
  ];

  for (const config of iconConfigs) {
    const page = await browser.newPage({
      viewport: { width: config.size, height: config.size },
    });
    await page.setContent(svgContent(config.maskable));
    const targetPath = path.join(publicDir, config.name);
    await page.screenshot({ path: targetPath, omitBackground: false });
    await page.close();
    console.log(`Generated: ${config.name} (${config.size}x${config.size})`);
  }

  await browser.close();
  console.log('All PWA icons generated successfully.');
}

generateIcons().catch((err) => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
