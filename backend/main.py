"""
Shadow-Sound Backend — FastAPI Application
Mock endpoints for frontend development and integration testing.
"""

import time
import json
import uuid
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="Shadow-Sound API",
    description="Directional Haptic Feedback System — Audio Classification Service",
    version="0.1.0",
)

# -- CORS (allow the React Native app to connect) --
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mock data helpers
# ---------------------------------------------------------------------------

SOUND_TYPES = [
    "emergency_siren",
    "vehicle_approaching",
    "bicycle_bell",
    "horn",
    "tire_screech",
    "footsteps_running",
    "shouting",
    "dog_barking",
    "construction_noise",
    "door_slam",
    "glass_breaking",
    "car_alarm",
    "train",
    "aircraft",
    "background",
]

DIRECTIONS = [
    {"degrees": 0, "label": "N"},
    {"degrees": 45, "label": "NE"},
    {"degrees": 90, "label": "E"},
    {"degrees": 135, "label": "SE"},
    {"degrees": 180, "label": "S"},
    {"degrees": 225, "label": "SW"},
    {"degrees": 270, "label": "W"},
    {"degrees": 315, "label": "NW"},
]

HAPTIC_PATTERNS = {
    "emergency_siren": "rapid_pulse_3x",
    "vehicle_approaching": "double_tap",
    "bicycle_bell": "quick_triple_tap",
    "shouting": "long_pulse",
    "footsteps_running": "gentle_pulse",
    "horn": "double_tap",
    "tire_screech": "rapid_pulse_3x",
    "dog_barking": "gentle_pulse",
    "glass_breaking": "rapid_pulse_3x",
    "car_alarm": "rapid_pulse_3x",
}

URGENCY_MAP = {
    "emergency_siren": "critical",
    "vehicle_approaching": "high",
    "tire_screech": "high",
    "glass_breaking": "high",
    "horn": "high",
    "shouting": "medium",
    "bicycle_bell": "medium",
    "dog_barking": "low",
    "footsteps_running": "low",
    "car_alarm": "medium",
    "construction_noise": "low",
    "door_slam": "low",
    "train": "medium",
    "aircraft": "low",
    "background": "none",
}


def _mock_detection():
    """Generate a single mock detection result."""
    sound = random.choice([s for s in SOUND_TYPES if s != "background"])
    direction = random.choice(DIRECTIONS)
    return {
        "sound_type": sound,
        "confidence": round(random.uniform(0.75, 0.99), 2),
        "direction_degrees": direction["degrees"],
        "direction_label": direction["label"],
        "urgency": URGENCY_MAP.get(sound, "low"),
        "estimated_distance": random.choice(["close", "medium", "far"]),
        "haptic_pattern": HAPTIC_PATTERNS.get(sound, "single_tap"),
    }


# ---------------------------------------------------------------------------
# WebSocket endpoint  —  /ws/audio
# ---------------------------------------------------------------------------

@app.websocket("/ws/audio")
async def websocket_audio(ws: WebSocket):
    """
    Accepts audio chunks over WebSocket and returns mock detection results.

    Protocol:
      1. Client sends an auth message:  {"type": "auth", "device_id": "...", "api_version": "1.0"}
      2. Client sends audio chunks:     {"type": "audio_chunk", "timestamp": ..., ...}
      3. Server responds with detections after each chunk.
    """
    await ws.accept()
    device_id: Optional[str] = None

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)

            # --- Auth handshake ---
            if msg.get("type") == "auth":
                device_id = msg.get("device_id", "unknown")
                await ws.send_json({
                    "type": "auth_ok",
                    "message": f"Device {device_id} authenticated (mock).",
                })
                continue

            # --- Audio chunk processing (mock) ---
            if msg.get("type") == "audio_chunk":
                # Simulate processing latency
                processing_start = time.time()

                # Generate 1-3 random mock detections
                num_detections = random.randint(1, 3)
                detections = [_mock_detection() for _ in range(num_detections)]

                processing_ms = round((time.time() - processing_start) * 1000, 1)

                await ws.send_json({
                    "type": "detection",
                    "timestamp": int(time.time()),
                    "detections": detections,
                    "processing_time_ms": processing_ms,
                })
                continue

            # --- Unknown message type ---
            await ws.send_json({
                "type": "error",
                "message": f"Unknown message type: {msg.get('type')}",
            })

    except WebSocketDisconnect:
        print(f"Device {device_id} disconnected.")
    except json.JSONDecodeError:
        await ws.send_json({"type": "error", "message": "Invalid JSON"})


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

# -- Health check --
@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


# -- Feedback --
class FeedbackRequest(BaseModel):
    detection_id: str
    correct: bool
    actual_sound: Optional[str] = None
    comment: Optional[str] = None


@app.post("/api/v1/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Accept user feedback on a detection (stubbed)."""
    return {
        "status": "received",
        "detection_id": feedback.detection_id,
        "message": "Feedback recorded (mock). Thank you!",
    }


# -- Settings --
MOCK_SETTINGS: dict = {}


class SettingsPayload(BaseModel):
    haptic_intensity: int = 5
    environment_profile: str = "urban"
    enabled_sounds: list[str] = SOUND_TYPES
    battery_saver: bool = False


@app.get("/api/v1/settings/{device_id}")
async def get_settings(device_id: str):
    """Retrieve settings for a device (stubbed)."""
    settings = MOCK_SETTINGS.get(device_id, SettingsPayload().model_dump())
    return {"device_id": device_id, "settings": settings}


@app.put("/api/v1/settings/{device_id}")
async def update_settings(device_id: str, payload: SettingsPayload):
    """Update settings for a device (stubbed)."""
    MOCK_SETTINGS[device_id] = payload.model_dump()
    return {
        "device_id": device_id,
        "settings": payload.model_dump(),
        "message": "Settings updated (mock).",
    }
