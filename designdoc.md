# Shadow-Sound

---

## What We're Building

A React Native app (iOS + Android) that listens to the environment, detects critical safety sounds, and alerts deaf and hard-of-hearing users through haptic vibration patterns on their phone. No extra hardware. Just the phone they already have.

**Stack:**
- React Native (iOS + Android)
- Python + FastAPI backend (WebSocket)
- Pre-trained audio classification model

---

## The Problem

Deaf and hard-of-hearing people can't hear approaching cars, sirens, or people shouting warnings. There's no portable, real-time solution for this today.

---

## How It Works

1. App continuously captures audio via the phone mic
2. Audio chunks are streamed to a Python backend
3. Backend classifies the sound using a pre-trained ML model
4. Result (sound type + urgency) is sent back to the app
5. App triggers a haptic vibration pattern to alert the user

---

## System Architecture

```
Phone (React Native)
  └── mic captures audio (1–2s chunks)
  └── streams via WebSocket →

Python Backend (FastAPI)
  └── classifies sound (pre-trained model)
  └── returns: sound_type, urgency, haptic_pattern →

Phone (React Native)
  └── triggers haptic feedback
  └── shows visual alert on screen
```

---

## What We'll Build in 2 Days

### Day 1 — Core Pipeline

- [ ] React Native app with mic capture (foreground only, no background needed for demo)
- [ ] WebSocket connection to Python backend
- [ ] FastAPI server that accepts audio chunks
- [ ] Custom trained sound classifier
- [ ] Return JSON response to app
- [ ] Trigger phone vibration on detection

### Day 2 — Polish + Demo

- [ ] Basic UI: status indicator, last detected sound, visual alert
- [ ] 3–5 sound categories working reliably (siren, car horn, shouting, dog bark, alarm)
- [ ] Distinct haptic patterns per sound type
- [ ] Test in real environment
- [ ] Demo-ready flow

---

## Tech Choices

**Why pre-trained model?** YAMNet (Google) runs fast, covers 521 sound classes, and needs zero training time. We'll just map its output to our 5 priority categories.

**Why WebSocket?** Simpler than chunked HTTP for real-time streaming. FastAPI supports it natively.

**Why foreground-only for the hackathon?** Background mic on iOS requires a declared audio session and Apple review. For a demo, foreground is fine.

---

## Sound Categories (MVP)

| Label | Haptic Pattern |
|-------|---------------|
| Emergency siren | Rapid pulse × 3 |
| Car horn | Double tap |
| Shouting / yelling | Long single buzz |
| Dog bark | Triple tap |
| Alarm (smoke, car) | Alternating short-long |

---

## Key Libraries

**React Native:**
- `react-native-audio-recorder-player` — mic capture
- `react-native-haptic-feedback` — vibration patterns
- `@react-native-community/netinfo` — connection status
- `react-native-permissions` — mic permission

**Python:**
- `fastapi` + `uvicorn` — WebSocket server
- `tensorflow` + `tensorflow_hub` — YAMNet inference
- `librosa` / `numpy` — audio preprocessing

---

## API

**WebSocket:** `ws://localhost:8000/ws/audio`

App sends:
```json
{
  "audio_data": "<base64>",
  "sample_rate": 16000
}
```

Backend returns:
```json
{
  "sound_type": "siren",
  "confidence": 0.91,
  "urgency": "high",
  "haptic_pattern": "rapid_pulse_3x"
}
```

If nothing detected above threshold (85%), backend returns `null` and app does nothing.

---

## Permissions Needed

**iOS** (`Info.plist`):
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Shadow-Sound listens for safety sounds around you.</string>
```

**Android** (`AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

---

## Demo Script

1. Open app → grant mic permission
2. App shows "Listening..." status
3. Play a siren sound near the phone
4. Phone vibrates with rapid pulse pattern + screen shows "🚨 Siren Detected"
5. Play a car horn → double tap vibration
6. Show the log of recent detections

---

## What We're NOT Doing This Weekend

- Direction estimation (TDOA/mic array) — post-hackathon
- Background mode / always-on listening — post-hackathon
- User accounts, settings, history — post-hackathon
- Model training — using YAMNet as-is
- Production deployment — localhost backend for demo

---

## Risks & Quick Fixes

| Risk | Fix |
|------|-----|
| YAMNet too slow on server | Quantize model or use ONNX runtime |
| WebSocket drops | Simple reconnect loop in app |
| Mic permission denied on test device | Prepare fallback with pre-recorded audio file |
| Haptic feels wrong | Test on real device early — simulators don't vibrate |

---

## Repo Structure

```
shadow-sound/
├── app/                  # React Native
│   ├── src/
│   │   ├── AudioCapture.js
│   │   ├── HapticEngine.js
│   │   ├── WebSocketClient.js
│   │   └── HomeScreen.js
│   └── package.json
└── backend/              # Python
    ├── main.py           # FastAPI app + WebSocket endpoint
    ├── classifier.py     # YAMNet wrapper
    └── requirements.txt
```

---

## Contact

**Project Lead:** Chirayu Shah
**GitHub:** [github.com/hacked26-team-hackers/ShadowSound](https://github.com/hacked26-team-hackers/ShadowSound)

---

*Hackathon Build — February 21–22, 2026*