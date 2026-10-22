#!/usr/bin/env python3
"""
Benchmark script for PRAROHA Cinematic Preview Proof of Concept.
Measures:
- Execution duration (seconds)
- Peak memory usage (RSS in MB)
- CPU utilization (%)
- Output video format, duration, bitrate, and size
"""

import os
import subprocess
import time
import sys
import psutil

IMAGE_PATH = "gallery/gallery_04_stage3_divergent_worlds.png"
VOICE_PATH = "uploads/projects/e3a497bc-5c8d-4283-9384-c781551b6ecb/media/audio/95c392ef-a345-4448-881c-73ab7112c7d3.mp3"
AMBIENT_PATH = "uploads/media/audio/51f7bcd5-6f0a-473f-af4f-dcca5687f390.wav"
OUTPUT_PATH = "scratch/cinematic_preview_benchmark.mp4"

def run_benchmark():
    os.makedirs("scratch", exist_ok=True)
    if os.path.exists(OUTPUT_PATH):
        os.remove(OUTPUT_PATH)

    assert os.path.exists(IMAGE_PATH), f"Image missing: {IMAGE_PATH}"
    assert os.path.exists(VOICE_PATH), f"Voice missing: {VOICE_PATH}"
    assert os.path.exists(AMBIENT_PATH), f"Ambient missing: {AMBIENT_PATH}"

    # Target duration: 12 seconds
    duration = 12

    # FFmpeg command for cinematic preview composition:
    # 1. Image input with Ken Burns pan/zoom to 1280x720 25fps
    # 2. Voice input
    # 3. Ambient input (ducked under voice)
    # 4. Amix filter to combine voice and ambient
    # 5. Drawtext for scene title and caption
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-t", str(duration), "-i", IMAGE_PATH,
        "-i", VOICE_PATH,
        "-stream_loop", "-1", "-i", AMBIENT_PATH,
        "-filter_complex",
        (
            "[0:v]scale=1920:1080,zoompan=z='min(zoom+0.0012,1.15)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=25,"
            "drawtext=text='PRAROHA CINEMATIC PREVIEW':fontcolor=white@0.9:fontsize=22:x=40:y=40:box=1:boxcolor=black@0.5:boxborderw=8,"
            "drawtext=text='Scene - The Crystal Expanse':fontcolor=white:fontsize=32:x=40:y=620:box=1:boxcolor=black@0.6:boxborderw=10[v];"
            "[1:a]volume=1.0[a_voice];"
            "[2:a]volume=0.25[a_amb];"
            "[a_voice][a_amb]amix=inputs=2:duration=first:dropout_transition=2[a]"
        ),
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", str(duration),
        "-movflags", "+faststart",
        OUTPUT_PATH
    ]

    print(f"Starting FFmpeg cinematic preview benchmark ({duration}s target)...")
    start_time = time.perf_counter()

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    ps_proc = psutil.Process(proc.pid)

    max_rss = 0
    max_cpu = 0.0

    while proc.poll() is None:
        try:
            mem = ps_proc.memory_info().rss / (1024 * 1024)
            cpu = ps_proc.cpu_percent(interval=0.1)
            for child in ps_proc.children(recursive=True):
                mem += child.memory_info().rss / (1024 * 1024)
            if mem > max_rss:
                max_rss = mem
            if cpu > max_cpu:
                max_cpu = cpu
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            break
        time.sleep(0.05)

    stdout, stderr = proc.communicate()
    elapsed = time.perf_counter() - start_time

    if proc.returncode != 0:
        print(f"Render failed with code {proc.returncode}")
        print(stderr.decode()[-1000:])
        sys.exit(1)

    file_size_kb = os.path.getsize(OUTPUT_PATH) / 1024

    probe_cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration,size,bit_rate",
        "-of", "default=noprint_wrappers=1:nokey=1", OUTPUT_PATH
    ]
    probe_out = subprocess.check_output(probe_cmd).decode().splitlines()
    actual_duration = float(probe_out[0]) if probe_out else 0.0

    print("=== BENCHMARK RESULTS ===")
    print(f"Render Time:      {elapsed:.2f} seconds")
    print(f"Peak RSS Memory:  {max_rss:.2f} MB")
    print(f"Peak CPU Usage:   {max_cpu:.1f}%")
    print(f"Output File Size: {file_size_kb:.2f} KB ({file_size_kb/1024:.2f} MB)")
    print(f"Actual Duration:  {actual_duration:.2f} seconds")
    print(f"Target Duration:  {duration} seconds")
    print(f"Output Path:      {OUTPUT_PATH}")

if __name__ == "__main__":
    run_benchmark()
