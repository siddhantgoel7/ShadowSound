# Shadow-Sound

A React Native app (iOS + Android) that listens to the environment, detects critical safety sounds, and alerts deaf and hard-of-hearing users through haptic vibration patterns on their phone. No extra hardware. Just the phone they already have.

**Stack:** React Native (iOS + Android) · Python + FastAPI (WebSocket) · Custom trained audio classification model

---

## The Problem

Deaf and hard-of-hearing people can't hear approaching cars, sirens, or people shouting warnings. There's no portable, real-time solution for this today.

---

## How It Works

1. App captures audio via phone mic (1–2s chunks)
2. Streams to Python backend via WebSocket
3. Backend classifies the sound using a trained ML model
4. Returns sound type + haptic pattern to app
5. App triggers vibration + shows visual alert

```
Phone (React Native)
  └── mic captures audio (1–2s chunks)
  └── streams via WebSocket →

Python Backend (FastAPI)
  └── classifies sound
  └── returns: sound_type, urgency, haptic_pattern →

Phone (React Native)
  └── triggers haptic feedback
  └── shows visual alert on screen
```

---

## Sound Categories

| Label | Haptic Pattern |
|-------|---------------|
| Emergency siren | Rapid pulse × 3 |
| Car horn | Double tap |
| Shouting / yelling | Long single buzz |
| Dog bark | Triple tap |
| Alarm (smoke, car) | Alternating short-long |

---

## Tasks

### Backend
- [ ] Init FastAPI app with WebSocket endpoint (`/ws/audio`)
- [ ] Load and set up trained classifier (`classifier.py`)
- [ ] Decode base64 audio, resample to 16kHz with `librosa`
- [ ] Run inference, map output to 5 sound categories
- [ ] Return `{ sound_type, confidence, urgency, haptic_pattern }` or `null` if below 85% threshold
- [ ] Test endpoint with a local audio file

### React Native App
- [ ] Init RN project, install dependencies
- [ ] Request mic permission on launch (`react-native-permissions`)
- [ ] Capture audio in 1–2s chunks (`react-native-audio-recorder-player`)
- [ ] Base64 encode and send chunks over WebSocket
- [ ] Parse response and trigger haptic pattern (`react-native-haptic-feedback`)
- [ ] Build home screen: status indicator, last detected sound, recent alerts log
- [ ] Handle WebSocket reconnect on drop

### Integration & Demo
- [ ] Test pipeline end-to-end on real device (simulators don't vibrate)
- [ ] Verify all 5 sound categories trigger correct haptic
- [ ] Confirm <2s detection latency
- [ ] Prep 3–4 audio clips for demo (siren, horn, shout, alarm)

---

## API

**WebSocket:** `ws://localhost:8000/ws/audio`

App sends:
```json
{ "audio_data": "<base64>", "sample_rate": 16000 }
```
Backend returns:
```json
{ "sound_type": "siren", "confidence": 0.91, "urgency": "high", "haptic_pattern": "rapid_pulse_3x" }
```

---

## Key Libraries

**React Native:** `react-native-audio-recorder-player` · `react-native-haptic-feedback` · `react-native-permissions` · `@react-native-community/netinfo`

**Python:** `fastapi` · `uvicorn` · `tensorflow` · `tensorflow_hub` · `librosa` · `numpy`

---

## Permissions

**iOS** `Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Shadow-Sound listens for safety sounds around you.</string>
```
**Android** `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

---

## Repo Structure

```
shadow-sound/
├── app/
│   └── src/
│       ├── AudioCapture.js
│       ├── HapticEngine.js
│       ├── WebSocketClient.js
│       └── HomeScreen.js
└── backend/
    ├── main.py          # FastAPI + WebSocket
    ├── classifier.py    # model wrapper
    └── requirements.txt
```

---

## What We're NOT Doing This Weekend

- Direction estimation — post-hackathon
- Background mode / always-on listening — post-hackathon
- User accounts, settings, history — post-hackathon
- Production deployment — localhost backend for demo

---

## Risks

| Risk | Fix |
|------|-----|
| WebSocket drops | Reconnect loop in app |
| Mic permission fails on test device | Fallback to pre-recorded audio file |
| Haptic feels wrong | Test on real device early |

---

**Project Lead:** Chirayu Shah · [github.com/hacked26-team-hackers/ShadowSound](https://github.com/hacked26-team-hackers/ShadowSound)

*Hackathon Build — February 21–22, 2026*