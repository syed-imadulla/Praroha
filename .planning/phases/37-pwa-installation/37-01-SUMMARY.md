# Phase 37 Summary: PWA Installation & Offline Behaviour

## Overview
Phase 37 equipped PRAROHA with complete Progressive Web App (PWA) installation capabilities, brand-aligned iconography, an automated Workbox service worker caching shell assets safely without caching sensitive API tokens or private project data, and transparent offline handling.

## Accomplishments
1. **PWA Integration via `vite-plugin-pwa`**:
   - Configured `VitePWA` in `frontend/vite.config.ts` with `registerType: 'autoUpdate'`.
   - Generated valid `dist/manifest.webmanifest` and `dist/sw.js` precaching 33 core assets (~4MB bundle).
   - Excluded `/api/**` endpoints and backend proxy routes from service worker caching.
2. **Canonical Botanical PWA Icons**:
   - Generated high-resolution icons using PRAROHA botanical leaf emblem:
     - `pwa-192x192.png`
     - `pwa-512x512.png`
     - `maskable-icon-512x512.png` (safe padding on dark sage background)
     - `apple-touch-icon.png` (180x180)
     - `favicon.svg` (brand green `#294B3A` and warm cream `#F8F4E8`).
3. **PWA Meta Tags & iOS Compatibility**:
   - Added theme color `#294B3A`, apple-mobile-web-app-capable, apple-touch-icon, and standalone configuration in `frontend/index.html`.
4. **Offline Transparency & Banner**:
   - Implemented `frontend/src/components/OfflineBanner.tsx` mounted across both unauthenticated auth screens and the workspace `AppShell`.
   - Listens to `window.ononline` and `window.onoffline`.
   - Transparently alerts users that offline mode serves cached pages while Generative AI models and cloud synchronization require an internet connection.
5. **E2E Verification**:
   - Added `frontend/e2e/test_phase37_pwa.mjs` verifying manifest schema, icon endpoints, service worker registration, and offline banner behavior in Chromium.
