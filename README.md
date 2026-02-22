# 🔊 Shadow Sound

> Your phone, listening so you don't have to.

Shadow Sound translates dangerous sounds — sirens, horns, shouting, glass breaking — into haptic vibration patterns for deaf and hard-of-hearing users. No extra hardware. Just the phone you already have.

Built at **HackED 2026** in 24 hours.

---

## How It Works

```
Phone mic (1.5s chunks)
  └── WebSocket → Python backend
        └── YAMNet ML model
              └── sound_type + urgency + haptic_pattern
                    └── haptic feedback + screen flash
```

1. App captures audio in 1.5-second chunks via the device mic
2. Chunks are base64-encoded and streamed to the backend over WebSocket
3. YAMNet classifies the audio across 521 AudioSet event classes
4. Backend maps relevant classes to 14 safety categories and returns a detection
5. App fires a distinct haptic pattern and flashes the screen

End-to-end latency: **< 2 seconds**

---

## Sound Categories

| Sound | Haptic Pattern | Urgency |
|-------|---------------|---------|
| Emergency siren | Rapid pulse × 3 | 🔴 Critical |
| Glass breaking | Rapid pulse × 3 | 🔴 Critical |
| Car horn | Double tap | 🟠 High |
| Vehicle approaching | Double tap | 🟠 High |
| Tire screech | Rapid pulse × 3 | 🟠 High |
| Shouting / yelling | Long buzz | 🟡 Medium |
| Bicycle bell | Quick triple tap | 🟡 Medium |
| Car alarm | Rapid pulse × 3 | 🟡 Medium |
| Train | Double tap | 🟡 Medium |
| Dog barking | Gentle pulse | 🟢 Low |
| Footsteps running | Gentle pulse | 🟢 Low |
| Construction noise | Gentle pulse | 🟢 Low |
| Door slam | Single tap | 🟢 Low |
| Aircraft | Gentle pulse | 🟢 Low |

---

## Stack

**Frontend**
- React Native (Expo) — iOS + Android
- `expo-av` — audio capture
- `expo-haptics` — haptic feedback
- `expo-router` — navigation
- TypeScript throughout

**Backend**
- Python 3.12 + FastAPI
- WebSocket endpoint (`/ws/audio`)
- YAMNet via TensorFlow Hub — pre-trained audio classification
- pydub + librosa — audio decoding and resampling
- Docker — containerized, hardened, non-root

---

## Repo Structure

```
shadow-sound/
├── frontend/
│   ├── app/
│   │   └── (tabs)/
│   │       ├── index.tsx          # Home — listening + alerts
│   │       ├── explore.tsx        # Explore tab
│   │       └── profile.tsx        # Detection history
│   ├── components/
│   │   └── ui/
│   │       ├── AlertFlash.tsx     # Full-screen urgency flash
│   │       ├── StatusIndicator.tsx
│   │       ├── PermissionGate.tsx
│   │       └── Button.tsx
│   ├── hooks/
│   │   ├── useSoundDetection.ts   # Main pipeline hook
│   │   └── useAudioCapture.ts     # Mic capture hook
│   ├── services/
│   │   └── haptic.service.ts      # Haptic pattern definitions
│   └── src/services/
│       ├── audio-capture.service.ts  # Audio recording loop
│       └── websocket.service.ts      # WS connection + auth
└── backend/
    ├── main.py                    # FastAPI app + WebSocket endpoint
    ├── classifier.py              # YAMNet wrapper
    ├── requirements.txt
    └── Dockerfile
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- Docker (for backend)
- Expo Go app on a physical device (simulators don't vibrate)

### Backend

```bash
# With Docker (recommended)
docker compose up

# Or locally
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

The first run downloads the YAMNet model (~25MB) from TensorFlow Hub. Subsequent runs use the cached version.

### Frontend

```bash
cd frontend
npm install
npm start
```

Scan the QR code with Expo Go. **Test on a real device** — haptics don't work in simulators.

### Connecting to your backend

Update the WebSocket URL in `frontend/src/services/websocket.service.ts`:

```typescript
const DEFAULT_WS_URL = "ws://<your-machine-ip>:8000/ws/audio";
```

Use your local network IP (not `localhost`) when testing on a physical device.

### Mock mode

The backend supports mock detections for frontend development without a real ML model:

```
ws://localhost:8000/ws/audio?mock=true
```

Or use the **⚡ Demo Mode** button in the app to fire test alerts instantly without any backend connection.

---

## API

### WebSocket `/ws/audio`

**Auth handshake** (client → server):
```json
{ "type": "auth", "device_id": "ios-abc123", "api_version": "1.0" }
```

**Audio chunk** (client → server):
```json
{ "type": "audio_chunk", "audio_data": "<base64>", "sample_rate": 16000 }
```

**Detection** (server → client):
```json
{
  "type": "detection",
  "timestamp": 1740000000,
  "detections": [{
    "sound_type": "emergency_siren",
    "confidence": 0.91,
    "urgency": "critical",
    "haptic_pattern": "rapid_pulse_3x"
  }],
  "processing_time_ms": 340
}
```

### REST

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/settings/{device_id}` | Get device settings |
| PUT | `/api/v1/settings/{device_id}` | Update device settings |
| POST | `/api/v1/feedback` | Submit detection feedback |

---

## Permissions

**iOS** — add to `Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Shadow Sound listens for safety sounds around you.</string>
```

**Android** — add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

Both are already configured in `app.json`.

---

## Team

Built by **Chirayu Shah** at HackED 2026 — February 21–22, 2026.

---

## What's Next

- ⌚ Wear OS / Apple Watch companion app
- 🧭 Directional detection — compass showing where the sound came from
- 📱 Always-on background mode
- 🧠 On-device inference with TensorFlow Lite (no backend required)
- 🎚️ Personalized sensitivity per sound category