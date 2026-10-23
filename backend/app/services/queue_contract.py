"""
Lightweight shared queue message contract and validation module for PRAROHA (Phase 52).

This module contains pure schema validation, credential scanning, and payload decoding
shared across the web backend (dispatcher, outbox sweeper) and the dedicated rendering
worker.

CRITICAL ARCHITECTURAL BOUNDARY:
This module MUST remain strictly pure and lightweight:
- ZERO imports of psutil, ffmpeg, subprocess, or execution libraries.
- ZERO imports of Azure SDK clients or database sessions.
- Safe to import anywhere in the backend without worker-only runtime dependencies.
"""

import base64
import json
import re
from datetime import datetime
from typing import Any, Dict, Set


FORBIDDEN_CREDENTIAL_KEYWORDS: Set[str] = {
    "password", "secret", "token", "credential", "credentials", "api_key",
    "apikey", "connection_string", "conn_str", "database_url", "db_url",
    "sas", "sas_token", "access_key", "auth", "authorization", "private_key",
}

ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")
REQUEST_HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")
ALLOWED_ENTITY_TYPES: Set[str] = {"world", "character", "location", "scene"}
ALLOWED_FPS: Set[int] = {24, 30}
ALLOWED_RESOLUTIONS: Set[str] = {"1280x720", "1920x1080"}
ALLOWED_ASPECT_RATIOS: Set[str] = {"16:9", "1:1", "9:16"}
ALLOWED_MOTION_PRESETS: Set[str] = {"slow_pan", "zoom_in", "static"}

ALLOWED_TOP_LEVEL_KEYS: Set[str] = {
    "$schema", "schema_version", "job_id", "project_id", "entity_type",
    "entity_id", "request_hash", "options", "enqueued_at", "attempt"
}
ALLOWED_OPTION_KEYS: Set[str] = {
    "duration_seconds", "fps", "resolution", "aspect_ratio", "motion_preset"
}


def scan_for_credentials(obj: Any, path: str = "") -> None:
    """Recursively inspect payload for any credential injection attempts."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            k_clean = str(k).lower().strip()
            for forbidden in FORBIDDEN_CREDENTIAL_KEYWORDS:
                if forbidden in k_clean:
                    raise ValueError(f"Forbidden credential field detected: '{k}' at path '{path}'")
            scan_for_credentials(v, f"{path}.{k}" if path else str(k))
    elif isinstance(obj, (list, tuple)):
        for idx, item in enumerate(obj):
            scan_for_credentials(item, f"{path}[{idx}]")


def decode_message_content(raw_content: Any) -> Dict[str, Any]:
    """Decode raw queue message content (JSON string, base64-encoded JSON, or dict)."""
    if isinstance(raw_content, dict):
        return raw_content
    if isinstance(raw_content, bytes):
        raw_text = raw_content.decode("utf-8")
    elif isinstance(raw_content, str):
        raw_text = raw_content
    else:
        raise ValueError(f"Unsupported message content type: {type(raw_content)}")

    raw_text = raw_text.strip()
    try:
        data = json.loads(raw_text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Try base64 decoding
    try:
        decoded_bytes = base64.b64decode(raw_text, validate=True)
        data = json.loads(decoded_bytes.decode("utf-8"))
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    raise ValueError("Message content is neither a valid JSON object nor base64-encoded JSON object")


def validate_queue_message_dict(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate queue message strictly against queue_message_schema.json rules:
    - Zero credentials permitted anywhere in message
    - Reject unexpected fields (additionalProperties: false)
    - Validate regex patterns for IDs and request_hash
    - Validate ranges and enums for options
    """
    if not isinstance(payload, dict):
        raise ValueError("Queue message must be a JSON object")

    # 1. Credential scan
    scan_for_credentials(payload)

    # 2. Check top-level allowed keys (additionalProperties: false)
    extra_keys = set(payload.keys()) - ALLOWED_TOP_LEVEL_KEYS
    if extra_keys:
        raise ValueError(f"Unexpected fields in message payload: {sorted(list(extra_keys))}")

    # 3. Required fields
    required_fields = [
        "schema_version", "job_id", "project_id", "entity_type",
        "entity_id", "request_hash", "enqueued_at", "attempt"
    ]
    missing = [f for f in required_fields if f not in payload]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    # 4. Field validation
    if payload["schema_version"] != "1.0":
        raise ValueError(f"Unsupported schema_version: '{payload['schema_version']}', must be '1.0'")

    job_id = str(payload["job_id"]).strip()
    if not ID_PATTERN.match(job_id):
        raise ValueError(f"Invalid job_id format: '{job_id}'")

    project_id = str(payload["project_id"]).strip()
    if not ID_PATTERN.match(project_id):
        raise ValueError(f"Invalid project_id format: '{project_id}'")

    entity_type = str(payload["entity_type"]).strip()
    if entity_type not in ALLOWED_ENTITY_TYPES:
        raise ValueError(f"Invalid entity_type: '{entity_type}', must be one of {sorted(list(ALLOWED_ENTITY_TYPES))}")

    entity_id = str(payload["entity_id"]).strip()
    if not ID_PATTERN.match(entity_id):
        raise ValueError(f"Invalid entity_id format: '{entity_id}'")

    request_hash = str(payload["request_hash"]).strip()
    if not REQUEST_HASH_PATTERN.match(request_hash):
        raise ValueError(f"Invalid request_hash format: '{request_hash}', must be 64-char hex")

    attempt = payload["attempt"]
    if not isinstance(attempt, int) or attempt < 1:
        raise ValueError(f"Invalid attempt: '{attempt}', must be integer >= 1")

    enqueued_at_str = str(payload["enqueued_at"]).strip()
    try:
        datetime.fromisoformat(enqueued_at_str.replace("Z", "+00:00"))
    except Exception as d_exc:
        raise ValueError(f"Invalid enqueued_at date-time format: '{enqueued_at_str}': {d_exc}")

    # 5. Options validation
    options = payload.get("options")
    validated_options = {
        "duration_seconds": 12,
        "fps": 24,
        "resolution": "1280x720",
        "aspect_ratio": "16:9",
        "motion_preset": "slow_pan",
    }
    if options is not None:
        if not isinstance(options, dict):
            raise ValueError("options must be a JSON object")
        extra_opt_keys = set(options.keys()) - ALLOWED_OPTION_KEYS
        if extra_opt_keys:
            raise ValueError(f"Unexpected fields in options: {sorted(list(extra_opt_keys))}")

        if "duration_seconds" in options:
            dur = options["duration_seconds"]
            if not isinstance(dur, int) or dur < 3 or dur > 60:
                raise ValueError(f"duration_seconds must be integer between 3 and 60, got {dur}")
            validated_options["duration_seconds"] = dur

        if "fps" in options:
            fps = options["fps"]
            if fps not in ALLOWED_FPS:
                raise ValueError(f"fps must be 24 or 30, got {fps}")
            validated_options["fps"] = fps

        if "resolution" in options:
            res = options["resolution"]
            if res not in ALLOWED_RESOLUTIONS:
                raise ValueError(f"resolution must be 1280x720 or 1920x1080, got {res}")
            validated_options["resolution"] = res

        if "aspect_ratio" in options:
            ar = options["aspect_ratio"]
            if ar not in ALLOWED_ASPECT_RATIOS:
                raise ValueError(f"aspect_ratio must be 16:9, 1:1, or 9:16, got {ar}")
            validated_options["aspect_ratio"] = ar

        if "motion_preset" in options:
            mp = options["motion_preset"]
            if mp not in ALLOWED_MOTION_PRESETS:
                raise ValueError(f"motion_preset must be slow_pan, zoom_in, or static, got {mp}")
            validated_options["motion_preset"] = mp

    return {
        "schema_version": payload["schema_version"],
        "job_id": job_id,
        "project_id": project_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "request_hash": request_hash,
        "options": validated_options,
        "enqueued_at": enqueued_at_str,
        "attempt": attempt,
    }


def parse_and_validate_queue_message(raw_content: Any) -> Dict[str, Any]:
    """Decode and validate a queue message payload."""
    decoded = decode_message_content(raw_content)
    return validate_queue_message_dict(decoded)
