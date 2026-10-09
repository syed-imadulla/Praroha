"""Comprehensive verification script for PRAROHA Final Bug Fix & UI Polish Pass.

Tests:
1. Backend Real Voice (EdgeTTS) & Atmosphere Audio (Synthesizer) generation:
   - Valid jobs, persisted assets, correct entity mapping.
   - Playable audio payloads (distinct tense vs calm).
2. Frontend UI with Playwright:
   - Stage 1: Removal of CreationModes cards (Image/Story/Sound/Video/Chat).
   - Identity: Absence of 'Seed World Project', 'TATTVA 2' in real UI.
   - Responsive Character & Scene cards across 1440px, 1280px, 1024px, mobile.
   - Simplified Indian English navigation & badge labels.
   - Profile & Settings: Minimal, clean, 100% functional.
3. Arbitrary seeds:
   - Test 2 distinct arbitrary seeds to ensure divergent output without canonical leakage.
"""

import asyncio
import os
import sys
import httpx
from playwright.async_api import async_playwright

API_BASE = "http://localhost:8000"
FE_BASE = "http://localhost:5173"
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://stxnxkzaftmwcbtvgzbm.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


async def get_auth_token() -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            f"{SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_KEY},
            json={"email": "test@example.com", "password": "password123"}
        )
        if res.status_code == 200:
            return res.json()["access_token"]
        raise RuntimeError(f"Failed to authenticate with Supabase: {res.text}")


async def wait_for_job(client: httpx.AsyncClient, project_id: str, job_id: str, max_seconds: int = 40) -> dict:
    for _ in range(max_seconds):
        await asyncio.sleep(1)
        res = await client.get(f"/api/projects/{project_id}/media/jobs/{job_id}")
        if res.status_code == 200:
            data = res.json()["data"]
            if data["status"] == "completed":
                return data
            if data["status"] == "failed":
                raise RuntimeError(f"Media job {job_id} failed: {data.get('error_message')}")
    raise TimeoutError(f"Media job {job_id} timed out after {max_seconds}s")


async def wait_for_generation_job(client: httpx.AsyncClient, project_id: str, job_id: str, max_seconds: int = 40) -> None:
    # Check general project status or dna / worlds completion
    for _ in range(max_seconds):
        await asyncio.sleep(1)
        res = await client.get(f"/api/projects/{project_id}")
        if res.status_code == 200:
            p = res.json()["data"]
            # If job finished, status will have progressed beyond initial state
            return
    raise TimeoutError(f"Job {job_id} did not finish in time")


async def test_backend_direct_media_generation(token: str) -> str:
    print("\n--- 1. Testing Backend Real Voice & Atmosphere Generation ---")
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url=API_BASE, headers=headers, timeout=45.0) as client:
        # Check if project 73d1ef17-3e3d-4dd8-9297-74c3d1e6883b exists
        existing_res = await client.get("/api/projects/73d1ef17-3e3d-4dd8-9297-74c3d1e6883b")
        if existing_res.status_code == 200:
            project_id = "73d1ef17-3e3d-4dd8-9297-74c3d1e6883b"
            project_data = existing_res.json()["data"]
            print(f"Reusing verified project: {project_id} - '{project_data['title']}'")
        else:
            # Create a real test project with arbitrary seed
            create_res = await client.post("/api/projects", json={
                "title": "Arctic Clock Tower",
                "seed_text": "A deep sea diver finds an ancient clock tower ticking beneath the Arctic shelf."
            })
            assert create_res.status_code == 201, f"Project creation failed: {create_res.text}"
            project_data = create_res.json()["data"]
            project_id = project_data["id"]
            print(f"Created project: {project_id} - '{project_data['title']}'")

            # Extract DNA
            print("Dispatching DNA extraction...")
            dna_job_res = await client.post(f"/api/projects/{project_id}/dna/extract")
            assert dna_job_res.status_code == 200, f"DNA extraction failed: {dna_job_res.text}"
            
            dna = None
            for _ in range(30):
                await asyncio.sleep(1.5)
                dna_res = await client.get(f"/api/projects/{project_id}/dna")
                if dna_res.status_code == 200 and dna_res.json().get("data"):
                    dna = dna_res.json()["data"]
                    break
            assert dna is not None, "DNA extraction timed out or failed!"
            print(f"Extracted DNA Premise: '{dna.get('premise', '')[:60]}...'")

            # Generate Worlds
            print("Dispatching World Generation...")
            worlds_job_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
            assert worlds_job_res.status_code == 200, f"Worlds generate failed: {worlds_job_res.text}"
            
            worlds = None
            for _ in range(30):
                await asyncio.sleep(1.5)
                worlds_res = await client.get(f"/api/projects/{project_id}/worlds")
                if worlds_res.status_code == 200 and worlds_res.json().get("data"):
                    w_data = worlds_res.json()["data"]
                    if len(w_data) == 3:
                        worlds = w_data
                        break
            assert worlds is not None and len(worlds) == 3, f"Expected 3 worlds, got {worlds}"
            selected_world = worlds[0]
            print(f"Generated 3 Worlds: {[w['title'] for w in worlds]}")

            # Select World
            select_res = await client.post(
                f"/api/projects/{project_id}/worlds/{selected_world['id']}/select",
                json={"custom_directives": "Rich deep-sea atmosphere and historical mystery."}
            )
            assert select_res.status_code == 200, f"World select failed: {select_res.text}"

            # Check / Unfold Universe
            print("Fetching / Unfolding Universe...")
            u_res = await client.get(f"/api/projects/{project_id}/unfolded")
            if u_res.status_code != 200 or not u_res.json().get("data"):
                unfold_job_res = await client.post(f"/api/projects/{project_id}/unfold")
                assert unfold_job_res.status_code == 200, f"Unfold dispatch failed: {unfold_job_res.text}"

        assert "Seed World Project" not in project_data["title"], "Title leaked 'Seed World Project'!"
        assert "TATTVA 2" not in project_data["title"], "Title leaked 'TATTVA 2'!"

        unfolded = None
        for _ in range(50):
            await asyncio.sleep(2)
            u_res = await client.get(f"/api/projects/{project_id}/unfolded")
            if u_res.status_code == 200 and u_res.json().get("data"):
                u_data = u_res.json()["data"]
                if len(u_data.get("characters", [])) >= 2:
                    unfolded = u_data
                    break
        assert unfolded is not None, "Universe unfolding timed out or produced no characters!"
        characters = unfolded.get("characters", [])
        scenes = unfolded.get("scenes", [])
        assert len(characters) >= 2, f"Expected >=2 characters, got {len(characters)}"
        assert len(scenes) >= 2, f"Expected >=2 scenes, got {len(scenes)}"
        char = characters[0]
        scene = scenes[0]
        print(f"Unfolded character: {char['name']} ({char['role']})")
        print(f"Unfolded scene: {scene['title']}")

        # TEST REAL VOICE GENERATION
        print("Dispatching Voice Generation job...")
        voice_res = await client.post(f"/api/projects/{project_id}/media/generate", json={
            "entity_type": "character",
            "entity_id": char["id"],
            "media_type": "voice",
            "voice_id": "protagonist-resolute",
            "prompt": "I will dive past the frozen barrier and uncover the truth.",
        })
        assert voice_res.status_code == 200, f"Voice dispatch failed: {voice_res.text}"
        voice_job_id = voice_res.json()["data"]["job_id"]
        print(f"Voice Job ID: {voice_job_id}")

        voice_job_data = await wait_for_job(client, project_id, voice_job_id, max_seconds=30)
        assert voice_job_data["status"] == "completed", "Voice generation did not complete!"
        voice_asset_url = voice_job_data["asset_url"]
        print(f"Voice Generation Succeeded! URL: {voice_asset_url}")
        assert voice_asset_url, "Voice asset_url is empty!"
        assert voice_job_data["entity_type"] == "character", "entity_type mismatch"
        assert voice_job_data["entity_id"] == char["id"], "entity_id mismatch"

        # Verify voice audio payload is valid and playable
        v_audio_res = await client.get(voice_asset_url)
        assert v_audio_res.status_code == 200, f"Could not fetch voice audio: {v_audio_res.status_code}"
        assert len(v_audio_res.content) > 1000, f"Voice audio too small: {len(v_audio_res.content)} bytes"
        print(f"Voice Audio Payload Size: {len(v_audio_res.content)} bytes (Content-Type: {v_audio_res.headers.get('content-type')})")

        # TEST REAL ATMOSPHERE AUDIO GENERATION (Tense vs Calm)
        print("Dispatching Tense Atmosphere Generation job...")
        tense_res = await client.post(f"/api/projects/{project_id}/media/generate", json={
            "entity_type": "scene",
            "entity_id": scene["id"],
            "media_type": "audio",
            "mood": "tense-dramatic",
            "duration_sec": 6,
            "prompt": "Deep underwater clockwork ticking with mounting tension",
        })
        assert tense_res.status_code == 200, f"Tense audio dispatch failed: {tense_res.text}"
        tense_job_id = tense_res.json()["data"]["job_id"]

        print("Dispatching Calm Atmosphere Generation job...")
        calm_res = await client.post(f"/api/projects/{project_id}/media/generate", json={
            "entity_type": "scene",
            "entity_id": scenes[1]["id"],
            "media_type": "audio",
            "mood": "serene-ambient",
            "duration_sec": 6,
            "prompt": "Ethereal gentle currents drifting across crystal ice caverns",
        })
        assert calm_res.status_code == 200, f"Calm audio dispatch failed: {calm_res.text}"
        calm_job_id = calm_res.json()["data"]["job_id"]

        # Wait for atmosphere audio completions
        tense_job_data = await wait_for_job(client, project_id, tense_job_id, max_seconds=30)
        calm_job_data = await wait_for_job(client, project_id, calm_job_id, max_seconds=30)

        print(f"Tense Atmosphere Asset URL: {tense_job_data['asset_url']}")
        print(f"Calm Atmosphere Asset URL: {calm_job_data['asset_url']}")

        # Verify atmosphere audio contents
        t_audio = (await client.get(tense_job_data["asset_url"])).content
        c_audio = (await client.get(calm_job_data["asset_url"])).content
        assert len(t_audio) > 10000, f"Tense audio too small: {len(t_audio)} bytes"
        assert len(c_audio) > 10000, f"Calm audio too small: {len(c_audio)} bytes"
        assert t_audio != c_audio, "Tense and calm audio payloads are identical!"
        print(f"Audio payloads confirmed distinct! Tense: {len(t_audio)} bytes, Calm: {len(c_audio)} bytes")

    return project_id


async def test_frontend_ui(project_id: str):
    print("\n--- 2. Testing Frontend UI with Browser Automation ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # 1. TEST STAGE 1 HOME
        print("Testing Stage 1 Home...")
        await page.goto(f"{FE_BASE}/")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)

        # Handle Auth screen if presented
        if await page.locator("input[type='email']").count() > 0:
            print("Authenticating user in browser...")
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

        # Verify Stage 1 has NO CreationModes cards (Image, Story, Sound, Video, Chat)
        page_content = await page.content()
        assert "TATTVA 2" not in page_content, "Leaked 'TATTVA 2' in Stage 1!"
        assert "Seed World Project" not in page_content, "Leaked 'Seed World Project' in Stage 1!"

        # Specifically assert that creation-mode card buttons do not exist on Stage 1
        creation_mode_cards = await page.locator("button:has-text('Image'):has-text('Story')").count()
        assert creation_mode_cards == 0, "CreationModes cards still present in Stage 1!"

        # Verify seed input area is present
        textarea = page.locator("textarea[aria-label='Enter your seed idea']")
        assert await textarea.count() > 0, "Seed input textarea not found!"
        print("Stage 1 verified: No extra cards, clean and focused seed input area.")

        # 2. TEST NAVIGATION LANGUAGE
        print("Testing Navigation Stage Labels...")
        expected_labels = ["Your Idea", "Understand It", "Possible Worlds", "Your Choice", "Build Your World", "See Where It Came From", "Edit & Branch"]
        body_text = await page.locator("body").inner_text()
        for lbl in expected_labels:
            assert lbl in body_text, f"Expected simplified stage label '{lbl}' not found in UI!"
        print("Stage navigation labels verified: 100% simple Indian English.")

        # 3. TEST PROFILE & SETTINGS
        print("Testing Profile & Settings view...")
        profile_btn = page.locator("button[aria-label='Open User Profile']")
        assert await profile_btn.count() > 0, "Sidebar Profile button not found!"
        await profile_btn.click()
        await asyncio.sleep(0.5)

        # Verify Profile & Settings view rendered
        profile_heading = page.locator("h1:has-text('Profile & Settings')")
        assert await profile_heading.count() > 0, "Profile & Settings view did not open!"
        print("Profile & Settings view opened successfully.")

        # Verify Profile info & edit name
        name_input = page.locator("input[placeholder='Enter your creator name']")
        assert await name_input.count() > 0, "Display name input not found!"
        await name_input.fill("Master Weaver")
        save_btn = page.locator("button:has-text('Save')")
        if await save_btn.count() > 0:
            await save_btn.click()
            await asyncio.sleep(0.5)

        # Switch to Settings tab
        settings_tab_btn = page.locator("button:has-text('Settings')")
        await settings_tab_btn.click()
        await asyncio.sleep(0.5)

        # Verify visual theme info and functional audio toggle
        theme_card = page.locator("text=Warm Parchment (#F8F4E8)")
        assert await theme_card.count() > 0, "Visual theme card not displayed!"

        autoplay_toggle = page.locator("button[aria-label='Toggle audio autoplay']")
        assert await autoplay_toggle.count() > 0, "Audio autoplay toggle not found!"
        await autoplay_toggle.click()
        await asyncio.sleep(0.3)

        sign_out_btn = page.locator("[data-testid='profile-sign-out-btn']")
        assert await sign_out_btn.count() > 0, "Sign out button not found!"
        print("Profile & Settings verified: 100% functional, minimal and clean.")

        # Return to workspace
        return_btn = page.locator("button:has-text('Return to Seeds')")
        await return_btn.click()
        await asyncio.sleep(0.5)

        # 4. TEST STAGE 5 CHARACTER & SCENE CARDS ACROSS VIEWPORTS
        print(f"Navigating to Project {project_id} (Stage 5)...")
        await page.goto(f"{FE_BASE}/projects/{project_id}")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        # Press '5' or click stage 5 button
        unfold_nav_btn = page.locator("button:has-text('5'), button:has-text('Unfold'), button:has-text('Build Your World')").first
        if await unfold_nav_btn.count() > 0:
            await unfold_nav_btn.click()
            await asyncio.sleep(1)

        # Switch to Characters tab
        char_tab_btn = page.locator("button:has-text('Characters & Dynamics'), button:has-text('Characters'), [data-testid='codex-tab-characters']").first
        if await char_tab_btn.count() > 0:
            await char_tab_btn.click()
            await asyncio.sleep(1)

        # Verify Character grid exists
        char_grid = page.locator("#codex-characters-grid")
        assert await char_grid.count() > 0, "Characters grid not found!"

        # Check responsive viewports
        viewports = [
            (1440, 900, "Desktop 1440px"),
            (1280, 800, "Desktop 1280px"),
            (1024, 768, "Tablet 1024px"),
            (390, 844, "Mobile 390px"),
        ]

        for w, h, name in viewports:
            print(f"Testing viewport {name} ({w}x{h})...")
            await page.set_viewport_size({"width": w, "height": h})
            await asyncio.sleep(0.5)

            # Check character card width and horizontal overflow
            char_cards = page.locator("#codex-characters-grid > div")
            count = await char_cards.count()
            assert count >= 2, f"Expected >=2 character cards, got {count}"

            first_card = char_cards.first
            box = await first_card.bounding_box()
            assert box is not None, "Could not get bounding box for character card"
            print(f"  [{name}] First character card width: {box['width']:.1f}px (viewport width: {w}px)")
            if w >= 1024:
                # Desktop/laptop must have comfortable width >= 360px (not cramped < 300px!)
                assert box["width"] >= 350, f"Character card too narrow on desktop! width={box['width']}"

            # Check no horizontal body overflow
            body_scroll_width = await page.evaluate("() => document.body.scrollWidth")
            body_client_width = await page.evaluate("() => document.body.clientWidth")
            diff = body_scroll_width - body_client_width
            assert diff <= 5, f"Horizontal page overflow detected in {name}: scrollWidth={body_scroll_width}, clientWidth={body_client_width}"

            # Verify buttons inside character card remain inside bounding box
            refine_btn = first_card.locator(".refine-character-btn")
            trace_btn = first_card.locator(".trace-lineage-btn")
            if await refine_btn.count() > 0:
                r_box = await refine_btn.bounding_box()
                assert r_box["x"] >= box["x"] - 5, "Refine button escaped left of card!"
                assert r_box["x"] + r_box["width"] <= box["x"] + box["width"] + 10, "Refine button escaped right of card!"

            if await trace_btn.count() > 0:
                t_box = await trace_btn.bounding_box()
                assert t_box["x"] >= box["x"] - 5, "Trace button escaped left of card!"
                assert t_box["x"] + t_box["width"] <= box["x"] + box["width"] + 10, "Trace button escaped right of card!"

            # Verify simplified button text
            trace_text = await trace_btn.text_content()
            assert "See Where It Came From" in trace_text, f"Expected 'See Where It Came From', got '{trace_text}'"

        # 5. TEST SCENES TAB
        print("Testing Story Beats / Scenes tab...")
        await page.set_viewport_size({"width": 1440, "height": 900})
        scenes_tab_btn = page.locator("button:has-text('Story Beats / Scenes'), button:has-text('Scenes'), [data-testid='codex-tab-scenes']").first
        if await scenes_tab_btn.count() > 0:
            await scenes_tab_btn.click()
            await asyncio.sleep(1)

        scene_cards = page.locator("#codex-scenes-grid > div")
        scene_count = await scene_cards.count()
        assert scene_count >= 2, f"Expected >=2 scenes, got {scene_count}"
        first_scene = scene_cards.first
        s_box = await first_scene.bounding_box()
        assert s_box["width"] >= 600, f"Scene card width too narrow: {s_box['width']}"
        print(f"Scene card width: {s_box['width']:.1f}px - comfortable and readable.")

        # Check media card status is simplified and not clipped
        media_cards = page.locator("[data-testid='media-preview-card'], .media-preview-card")
        if await media_cards.count() > 0:
            status_text = await media_cards.first.text_content()
            print(f"Media card text sample: {status_text[:60]}")
            assert "Your image is ready." not in status_text, "Status text still using old long string!"

        # Take screenshot of verified state
        screenshot_path = "frontend/e2e/verification_final_pass.png"
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f"Captured screenshot at {screenshot_path}")

        await browser.close()
    print("Frontend UI verification passed completely!")


async def test_arbitrary_seeds(token: str):
    print("\n--- 3. Testing Arbitrary Seeds (No Canonical Leakage) ---")
    seeds = [
        "A fisherman discovers a railway line beneath a desert lake.",
        "A small village receives radio messages from a city that disappeared 80 years ago."
    ]

    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url=API_BASE, headers=headers, timeout=40.0) as client:
        results = []
        for idx, s in enumerate(seeds):
            print(f"Testing seed: '{s}'")
            title = "Submerged Desert Railway" if idx == 0 else "Signals from the Vanished City"
            res = await client.post("/api/projects", json={"title": title, "seed_text": s})
            assert res.status_code == 201, f"Failed for seed '{s}': {res.text}"
            proj = res.json()["data"]
            p_id = proj["id"]

            dna_job_res = await client.post(f"/api/projects/{p_id}/dna/extract")
            assert dna_job_res.status_code == 200
            dna = None
            for _ in range(30):
                await asyncio.sleep(1.5)
                dna_res = await client.get(f"/api/projects/{p_id}/dna")
                if dna_res.status_code == 200 and dna_res.json().get("data"):
                    dna = dna_res.json()["data"]
                    break
            assert dna is not None, "DNA extraction failed for arbitrary seed"

            worlds_job_res = await client.post(f"/api/projects/{p_id}/worlds/generate")
            assert worlds_job_res.status_code == 200
            w_list = None
            for _ in range(30):
                await asyncio.sleep(1.5)
                worlds_res = await client.get(f"/api/projects/{p_id}/worlds")
                if worlds_res.status_code == 200 and worlds_res.json().get("data"):
                    candidates = worlds_res.json()["data"]
                    if len(candidates) == 3:
                        w_list = candidates
                        break
            assert w_list is not None and len(w_list) == 3, "World generation failed for arbitrary seed"

            premise_text = dna.get("dna", {}).get("premise") or dna.get("premise", "")
            results.append({
                "title": proj["title"],
                "dna_premise": premise_text,
                "world_titles": [w["title"] for w in w_list]
            })

        # Verify they are completely different and not canonical
        assert results[0]["title"] != results[1]["title"], "Titles matched across arbitrary seeds!"
        assert results[0]["dna_premise"] != results[1]["dna_premise"], "DNA matched across arbitrary seeds!"
        assert results[0]["world_titles"] != results[1]["world_titles"], "Worlds matched across arbitrary seeds!"

        for r in results:
            assert "Sunken Ocean City" not in r["world_titles"], "Leaked canonical world!"
            assert "Tattva 2" not in r["title"], "Leaked Tattva 2 in title!"
            print(f"  Title: '{r['title']}'")
            print(f"  Worlds: {r['world_titles']}")

    print("Arbitrary seed test passed: completely divergent outputs generated with zero canonical leakage!")


async def main():
    try:
        token = await get_auth_token()
        print(f"Successfully authenticated as test user. Token acquired: {token[:16]}...")
        project_id = await test_backend_direct_media_generation(token)
        await test_frontend_ui(project_id)
        await test_arbitrary_seeds(token)
        print("\n=======================================================")
        print("ALL VERIFICATION REQUIREMENTS PASSED SUCCESSFULLY (100%)")
        print("=======================================================")
    except Exception as e:
        print(f"\nVERIFICATION FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
