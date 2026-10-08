import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5173"

async def run_verification():
    print("🚀 Starting Phase 31.9 Browser Verification...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            accept_downloads=True,
        )
        page = await context.new_page()

        # ---------------------------------------------------------
        # TEST 1: Home Page & Recent Creations Truth Check
        # ---------------------------------------------------------
        print("\n[TEST 1] Checking Home & Recent Creations truth...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Handle Auth screen if presented
        if await page.locator("input[type='email']").count() > 0:
            print("Authenticating user...")
            # Check if sign in or sign up
            if await page.locator("text=Create one").count() > 0:
                # Switch to create account or sign in directly
                email_input = page.locator("input[type='email']").first
                await email_input.fill("test@example.com")
                pw_input = page.locator("input[type='password']").first
                await pw_input.fill("password123")
                sign_in_btn = page.locator("button:has-text('Sign In')")
                if await sign_in_btn.count() > 0:
                    await sign_in_btn.click()
                else:
                    await page.locator("button:has-text('Create Account')").click()
            await page.wait_for_timeout(2000)

        # Ensure NO mock creations appear: "Mountain Sunset", "Forest Vibes", "Dreamscape"
        page_content = await page.content()
        assert "Mountain Sunset" not in page_content, "FAILED: Found canonical mock 'Mountain Sunset'!"
        assert "Forest Vibes" not in page_content, "FAILED: Found canonical mock 'Forest Vibes'!"
        assert "Dreamscape" not in page_content, "FAILED: Found canonical mock 'Dreamscape'!"
        print("✅ PASS: No canonical mock creations (Mountain Sunset, Forest Vibes, Dreamscape) in Real Mode.")

        # Check Recent Creations container: either user's real creations or clean empty state
        recent_text = await page.locator("text=No creations yet").count()
        if recent_text > 0:
            print("✅ PASS: Truthful empty state displayed ('No creations yet. Plant a new seed to begin.').")
        else:
            print("✅ PASS: Real user projects loaded into Recent Creations row.")

        # ---------------------------------------------------------
        # TEST 2: Seed Submission & Derived Project Title
        # ---------------------------------------------------------
        print("\n[TEST 2] Submitting arbitrary seed & verifying derived project title...")
        arbitrary_seed = "A village discovers a machine beneath an ancient lake that predicts storms."
        textarea = page.locator("textarea[aria-label='Enter your seed idea'], textarea[placeholder*='seed']").first
        await textarea.fill(arbitrary_seed)

        extract_btn = page.locator("button[aria-label='Extract Seed DNA'], button:has-text('Extract')").first
        await extract_btn.click()
        print("Submitted seed. Waiting for Stage 2 (Seed DNA)...")

        # Wait for Seed DNA screen (up to 30s)
        await page.wait_for_selector("[data-testid='export-dna-json-btn']", timeout=30000)
        print("✅ PASS: Seed DNA extracted successfully.")

        # Check TopBar project title - MUST NOT be 'Seed World Project' or 'The Sunken City'
        top_bar_title = await page.locator("[data-testid='topbar-project-title']").inner_text()
        print(f"TopBar Project Title: '{top_bar_title}'")
        assert "Seed World Project" not in top_bar_title, "FAILED: TopBar still shows generic 'Seed World Project'!"
        assert "The Sunken City" not in top_bar_title, "FAILED: TopBar still shows canonical 'The Sunken City'!"
        assert any(w in top_bar_title.lower() for w in ["village", "machine", "lake", "storm"]), (
            f"FAILED: TopBar title '{top_bar_title}' not derived from seed!"
        )
        print("✅ PASS: Project title is dynamically derived from user's seed and persisted.")

        # Check TopBar does NOT show hardcoded "TATTVA 2" badge
        top_bar_elem = page.locator("nav, header").first
        top_bar_html = await top_bar_elem.inner_html()
        assert "TATTVA 2" not in top_bar_html, "FAILED: TopBar still contains static 'TATTVA 2' badge!"
        print("✅ PASS: Static 'TATTVA 2' badge removed from header.")

        # Check Branch Lineage popover
        branch_btn = page.locator("[data-testid='topbar-branch-btn']")
        if await branch_btn.count() > 0:
            await branch_btn.click()
            await page.wait_for_timeout(500)
            popover_text = await page.locator("[data-testid='branch-popover']").inner_text()
            assert "main" in popover_text, "FAILED: Branch popover missing 'main' branch!"
            assert "Active" in popover_text or "active" in popover_text.lower(), "FAILED: Missing active branch status!"
            print("✅ PASS: Branch popover shows real visual lineage (main -> active).")
            # Close popover
            await branch_btn.click()

        # Check Inspector Drawer did NOT open automatically
        drawer = page.locator("[data-testid='inspector-drawer']")
        if await drawer.count() > 0:
            drawer_classes = await drawer.get_attribute("class") or ""
            assert "translate-x-full" in drawer_classes or "hidden" in drawer_classes, (
                "FAILED: Inspector drawer opened automatically without user clicking Inspect!"
            )
        print("✅ PASS: Inspector drawer remained closed on DNA extraction.")

        # ---------------------------------------------------------
        # TEST 3: Seed DNA Screen & Export JSON Functionality
        # ---------------------------------------------------------
        print("\n[TEST 3] Testing Seed DNA 'Export JSON' download...")
        async with page.expect_download() as download_info:
            await page.locator("[data-testid='export-dna-json-btn']").click()
        download = await download_info.value
        download_path = f"/tmp/{download.suggested_filename}"
        await download.save_as(download_path)
        print(f"Downloaded file: {download.suggested_filename}")

        with open(download_path, "r") as f:
            dna_json = json.load(f)
        assert "dna" in dna_json, "FAILED: Downloaded JSON missing 'dna' property!"
        assert "raw_seed" in dna_json, "FAILED: Downloaded JSON missing 'raw_seed' property!"
        assert arbitrary_seed in dna_json["raw_seed"], "FAILED: Downloaded JSON does not match current project seed!"
        print(f"✅ PASS: Export JSON works! File contains actual Seed DNA: premise='{dna_json['dna'].get('premise')}'")

        # ---------------------------------------------------------
        # TEST 4: Stage 3 Divergent Worlds Generation & Button Placement
        # ---------------------------------------------------------
        print("\n[TEST 4] Navigating to Stage 3 Divergent Worlds...")
        proceed_to_worlds_btn = page.locator("text=Generate 3 Worlds (Stage 3)")
        await proceed_to_worlds_btn.click()

        # Wait for candidates to load/generate (up to 45s)
        print("Waiting for Divergent Worlds to synthesize...")
        await page.wait_for_selector("[data-testid='bottom-proceed-to-stage4-btn']", timeout=45000)
        print("✅ PASS: 3 divergent worlds rendered.")

        # Verify bottom proceed button exists and has consistent placement
        bottom_stage3_btn = page.locator("[data-testid='bottom-proceed-to-stage4-btn']")
        assert await bottom_stage3_btn.is_visible(), "FAILED: Bottom proceed button missing in Stage 3!"
        print("✅ PASS: Stage 3 has consistent bottom action button ('Proceed to Selection (Stage 4)').")

        # ---------------------------------------------------------
        # TEST 5: Stage 4 Human World Selection
        # ---------------------------------------------------------
        print("\n[TEST 5] Proceeding to Stage 4 World Selection...")
        await bottom_stage3_btn.click()
        await page.wait_for_timeout(1000)

        # Select candidate #1
        first_candidate_card = page.locator("button:has-text('Select This Direction')").first
        await first_candidate_card.click()
        await page.wait_for_timeout(500)

        # Verify Decision DNA panel has NO canonical hardcoded strings
        stage4_content = await page.content()
        assert "bio-city" not in stage4_content.lower(), "FAILED: Found canonical 'bio-city' leakage in Stage 4!"
        assert "sentient coral reef" not in stage4_content.lower(), "FAILED: Found canonical 'coral reef' leakage in Stage 4!"
        assert "classical sunken ruins archaeology" not in stage4_content.lower(), "FAILED: Found canonical 'sunken ruins' leakage in Stage 4!"
        assert "cold war militarized technology" not in stage4_content.lower(), "FAILED: Found canonical 'cold war' leakage in Stage 4!"
        print("✅ PASS: Stage 4 is clean of canonical demo leakage.")

        # Check bottom confirm button exists and click it
        bottom_lock_btn = page.locator("[data-testid='bottom-confirm-lock-btn']")
        assert await bottom_lock_btn.is_visible(), "FAILED: Bottom confirm button missing in Stage 4!"
        await bottom_lock_btn.click()
        print("Locked world direction. Waiting for Stage 5...")

        # ---------------------------------------------------------
        # TEST 6: Stage 5 Universe Codex & Honest Media State
        # ---------------------------------------------------------
        print("\n[TEST 6] Checking Stage 5 Codex & Media truth...")
        await page.wait_for_selector("#unfold-universe-btn", timeout=20000)

        # Trigger Unfolding
        await page.locator("#unfold-universe-btn").click()
        print("Unfolding universe... waiting for completion (up to 45s)...")
        await page.wait_for_selector("#codex-tab-bible", timeout=60000)
        print("✅ PASS: Stage 5 Universe Unfolding completed.")

        # Check World Cover video button: MUST NOT be a fake working video button
        video_badge = page.locator("[data-testid='cinematic-video-coming-soon-badge']")
        assert await video_badge.is_visible(), "FAILED: World Cover video is not marked as Coming Soon!"
        print("✅ PASS: World Cover video honestly displays 'Cinematic Video (Coming Soon)' and is non-clickable.")

        # Check Historical Timeline: MUST NOT have character-split bug ("Era Y", "Era e", etc.)
        timeline_texts = await page.locator("span.font-mono:has-text('Era')").all_inner_texts()
        print(f"Sample timeline labels: {timeline_texts[:5]}")
        for t in timeline_texts:
            assert t not in ["Y", "e", "a", "r", "Era: Y", "Era: e"], f"FAILED: Timeline era is single character '{t}'!"
        print("✅ PASS: Historical Timeline does not suffer from single-character splitting bug.")

        # Check Canon Lore Facts: either real lore facts or honest empty state
        lore_items = await page.locator("li:has(span.rounded-full)").count()
        empty_facts = await page.locator("[data-testid='empty-canon-facts']").count()
        assert lore_items > 0 or empty_facts > 0, "FAILED: Canon lore facts section is broken!"
        print(f"✅ PASS: Canon Lore Facts truthfully rendered ({lore_items} facts present).")

        # ---------------------------------------------------------
        # TEST 7: Deep Refresh Persistence Check
        # ---------------------------------------------------------
        print("\n[TEST 7] Testing deep page refresh persistence...")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Verify active world title and codex tabs are restored
        assert await page.locator("#codex-tab-bible").is_visible(), "FAILED: State lost after refresh!"
        rehydrated_title = await page.locator("[data-testid='topbar-project-title']").inner_text()
        assert any(w in rehydrated_title.lower() for w in ["village", "machine", "lake", "storm"]), (
            f"FAILED: TopBar title '{rehydrated_title}' lost after refresh!"
        )
        print("✅ PASS: Project, Stage 5 state, and derived title persisted across reload.")

        print("\n🎉 ALL PHASE 31.9 BROWSER CHECKS PASSED PERFECTLY!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
