# Shadow-Sound: Directional Haptic Feedback System
## Design Document v1.0

---

## Executive Summary

Shadow-Sound is a safety-focused wearable application that provides directional environmental awareness for deaf and hard-of-hearing individuals through haptic feedback. The system detects critical safety sounds (sirens, vehicles, footsteps, shouting) and translates them into directional vibration patterns on a smartwatch, reducing anxiety and increasing autonomy in public spaces.

**Tech Stack:**
- Frontend: React Native (iOS/Android)
- Backend: Python (Audio Classification Service)
- Target Device: Smartwatch with haptic feedback capability

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [System Architecture](#system-architecture)
4. [Technical Specifications](#technical-specifications)
5. [User Experience](#user-experience)
6. [Implementation Phases](#implementation-phases)
7. [Privacy & Security](#privacy--security)
8. [Accessibility Considerations](#accessibility-considerations)
9. [Testing Strategy](#testing-strategy)
10. [Future Enhancements](#future-enhancements)

---

## Problem Statement

### Context
Deaf and hard-of-hearing individuals face significant safety challenges in public spaces where critical audio information goes undetected. While stationary visual fire alarms exist, there is no portable solution for detecting directional sounds like approaching vehicles, emergency sirens, or warning shouts.

### User Impact
- **Safety Risk:** Inability to detect approaching vehicles, cyclists, or emergency situations
- **Mental Burden:** Constant hyper-vigilance and anxiety when navigating public spaces
- **Reduced Autonomy:** Hesitation to walk alone, especially at night or in unfamiliar areas

### Success Metrics
- Reduce reaction time to critical environmental sounds by 80%
- Decrease user-reported anxiety levels in public spaces by 60%
- Achieve 95%+ accuracy in critical sound detection and direction
- Support independent navigation for 10,000+ users within first year

---

## Solution Overview

### Core Concept
A smartwatch application that continuously monitors environmental audio, classifies safety-critical sounds using ML, determines their direction, and provides haptic feedback that matches the sound's location.

### Key Features

**1. Real-time Audio Monitoring**
- Continuous microphone array listening
- Low-power mode for extended battery life
- Adjustable sensitivity levels

**2. Intelligent Sound Classification**
- Emergency sirens (ambulance, police, fire)
- Vehicle sounds (cars, motorcycles, bicycles)
- Human alerts (shouting, calling)
- Environmental warnings (tire screeching, horns)

**3. Directional Haptic Feedback**
- 360° directional awareness
- Variable intensity based on proximity
- Distinct patterns for different sound types

**4. Customization**
- User-defined priority sounds
- Adjustable haptic intensity
- Environment profiles (urban, suburban, quiet)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Smartwatch Device                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │         React Native App (Frontend)                │ │
│  │  - Audio Capture (Microphone Array)                │ │
│  │  - Haptic Control                                  │ │
│  │  - User Interface                                  │ │
│  │  - Local Audio Buffering                           │ │
│  └──────────────┬─────────────────────────────────────┘ │
└─────────────────┼───────────────────────────────────────┘
                  │
                  │ WebSocket / HTTP
                  │ (Audio Chunks + Metadata)
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Python Backend Service                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Audio Processing Pipeline                         │ │
│  │  - Sound Classification (ML Model)                 │ │
│  │  - Direction Estimation (Microphone Array Analysis)│ │
│  │  - Priority Scoring                                │ │
│  │  - Response Generation                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Model Management                                  │ │
│  │  - TensorFlow Lite / PyTorch Mobile Models         │ │
│  │  - Model Versioning & Updates                      │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Frontend (React Native)

**Audio Capture Module**
- Interfaces with smartwatch microphone array (typically 2-4 mics)
- Samples audio at 16kHz or 44.1kHz
- Buffers audio in 1-2 second chunks for processing
- Implements noise cancellation preprocessing

**Haptic Engine**
- Translates directional data (0-360°) to haptic patterns
- Maps sound categories to vibration signatures
- Manages haptic intensity based on urgency/proximity
- Queue management for multiple simultaneous alerts

**UI Components**
- Real-time status indicator
- Sound history log (visual)
- Settings and customization interface
- Calibration wizard

**Local Processing**
- Basic audio filtering
- Connection management
- Offline mode detection handling

#### Backend (Python)

**Audio Classification Service**

```python
# Core Pipeline Structure
AudioChunk → Preprocessing → Feature Extraction → Classification → Direction Estimation → Response
```

**Key Components:**

1. **Preprocessing Module**
   - Noise reduction (spectral subtraction)
   - Normalization
   - Feature extraction (MFCC, mel-spectrograms)

2. **Classification Engine**
   - Pre-trained CNN model (e.g., ResNet, MobileNet)
   - Sound event detection (SED)
   - Multi-label classification for overlapping sounds

3. **Direction Estimation**
   - Time Difference of Arrival (TDOA) analysis
   - Beamforming algorithms
   - 8-direction quantization (N, NE, E, SE, S, SW, W, NW)

4. **Priority Scoring**
   - Urgency weighting (sirens > vehicles > ambient)
   - Proximity estimation from amplitude
   - User preference integration

---

## Technical Specifications

### Frontend Technologies

**Framework:** React Native 0.72+

**Key Libraries:**
- `react-native-audio`: Audio capture
- `react-native-haptic-feedback`: Haptic control
- `@react-native-community/netinfo`: Connectivity monitoring
- `react-native-permissions`: Microphone access
- `react-native-background-fetch`: Background processing
- `@react-navigation/native`: Navigation
- `react-native-async-storage`: Local settings storage

**Platform Requirements:**
- iOS 14+ (Apple Watch Series 4+)
- Wear OS 3.0+ (watches with haptic engines)
- Microphone array support
- Bluetooth connectivity to companion phone

### Backend Technologies

**Framework:** Python 3.10+

**Core Libraries:**

Audio Processing:
- `librosa`: Audio analysis
- `scipy`: Signal processing
- `numpy`: Numerical operations
- `soundfile`: Audio I/O

Machine Learning:
- `tensorflow` or `pytorch`: Model inference
- `onnx`: Model optimization
- `scikit-learn`: Preprocessing utilities

Web Framework:
- `fastapi`: REST API and WebSocket server
- `uvicorn`: ASGI server
- `pydantic`: Data validation

Infrastructure:
- `redis`: Caching and session management
- `celery`: Asynchronous task processing (optional)
- `prometheus_client`: Metrics and monitoring

### Data Flow

**Real-time Processing Pipeline:**

1. **Capture** (Watch): Microphone array records 2-second audio chunks
2. **Transmit**: Audio sent to backend via WebSocket (compressed)
3. **Process** (Backend): 
   - Extract features (MFCC, spectrograms)
   - Run classification model (~50-100ms inference)
   - Estimate direction using TDOA
   - Calculate priority score
4. **Respond**: Send JSON response with sound type, direction, urgency
5. **Feedback** (Watch): Trigger appropriate haptic pattern

**Response Format:**
```json
{
  "timestamp": 1234567890,
  "detections": [
    {
      "sound_type": "vehicle_approaching",
      "confidence": 0.94,
      "direction_degrees": 225,
      "direction_label": "SW",
      "urgency": "high",
      "estimated_distance": "close",
      "haptic_pattern": "pulse_intense_3x"
    }
  ],
  "processing_time_ms": 87
}
```

### Audio Classification Model

**Model Architecture:**
- Base: MobileNetV3 or EfficientNet (mobile-optimized)
- Input: Mel-spectrogram (128 mel bins, 2-second window)
- Output: 15-20 sound classes + confidence scores

**Sound Classes:**
1. Emergency sirens (ambulance, police, fire)
2. Vehicle engine (car, motorcycle, truck)
3. Bicycle bell
4. Horn/beep
5. Tire screech
6. Footsteps (running, walking)
7. Shouting/yelling
8. Dog barking
9. Construction noise
10. Door slam
11. Glass breaking
12. Alarm (building, car)
13. Train/subway
14. Aircraft
15. Background/no threat

**Training Approach:**
- Base dataset: UrbanSound8K, ESC-50, AudioSet
- Custom dataset: Field recordings in various environments
- Data augmentation: Time stretching, pitch shifting, noise injection
- Class balancing for critical safety sounds

### Direction Estimation

**Method:** TDOA (Time Difference of Arrival)

For a 2-microphone array:
```
θ = arcsin((c × Δt) / d)

Where:
- θ = angle of arrival
- c = speed of sound (343 m/s)
- Δt = time difference between microphones
- d = distance between microphones
```

**Quantization:** 8 cardinal directions (45° sectors)
- Reduces complexity for haptic mapping
- Sufficient granularity for safety awareness

**Fallback:** If TDOA fails (omnidirectional sound), use amplitude-only detection with generic "alert" haptic

---

## User Experience

### Haptic Feedback Design

**Directional Mapping:**

The watch vibrates on the side corresponding to the sound's direction:

```
        N (12 o'clock)
         ↑
    NW  │  NE
        │
W ──────┼────── E (watch facing user)
        │
    SW  │  SE
         ↓
        S (6 o'clock)
```

**Vibration Patterns:**

| Sound Type | Pattern | Intensity | Duration |
|------------|---------|-----------|----------|
| Emergency Siren | Rapid pulse (3x) | High | 1.5s |
| Vehicle Approaching | Double tap | Medium-High | 0.8s |
| Bicycle Bell | Quick triple tap | Medium | 0.6s |
| Shouting/Alert | Long pulse | High | 1.0s |
| Footsteps (close) | Gentle pulse | Low-Medium | 0.5s |
| General Alert | Single tap | Medium | 0.4s |

**Intensity Scaling:**
- Close proximity: 100% intensity
- Medium distance: 60% intensity
- Far distance: 30% intensity (optional, user-configurable)

### User Interface

**Main Screen (Watch Face Complication):**
- Status indicator (active/paused/error)
- Battery impact indicator
- Quick access to pause/resume

**Full App Interface:**

1. **Home View**
   - Live status
   - Recent alerts log (last 10)
   - Sound environment indicator (quiet/moderate/loud)

2. **Settings**
   - Sound priorities (toggle each category on/off)
   - Haptic intensity (1-10 scale)
   - Environment profiles (urban, park, quiet, custom)
   - Battery optimization mode

3. **History**
   - Timeline of detected sounds (past 24 hours)
   - Visual representation with timestamps
   - Filter by sound type

4. **Calibration**
   - Test each haptic direction
   - Adjust sensitivity
   - Microphone array test

### Onboarding Flow

1. **Welcome & Purpose** - Explain app functionality
2. **Permissions** - Request microphone, background processing
3. **Calibration Wizard**
   - Test directional haptics (user physically turns to verify)
   - Adjust intensity to comfort level
   - Test with sample sounds
4. **Environment Setup** - Select typical use cases (city walking, cycling paths, etc.)
5. **Quick Start Guide** - 3-4 essential tips

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-8)

**Goals:**
- Prove core concept with basic functionality
- 5 critical sound types
- 4 directions (N, E, S, W)
- Foreground-only operation

**Deliverables:**
- React Native app with basic UI
- Python backend with simple CNN model
- WebSocket communication
- Haptic feedback for 5 sounds

**Success Criteria:**
- 80%+ accuracy on test sounds
- <200ms latency from detection to haptic
- Works in controlled environment

### Phase 2: Enhanced Detection (Weeks 9-14)

**Goals:**
- Expand to 15 sound classes
- 8-direction precision
- Improved model accuracy
- Background operation

**Deliverables:**
- Enhanced ML model (transfer learning)
- Refined TDOA algorithm
- Background processing capability
- Battery optimization

**Success Criteria:**
- 90%+ accuracy on critical sounds
- <150ms latency
- <15% battery drain per hour

### Phase 3: User Experience (Weeks 15-20)

**Goals:**
- Polish UI/UX
- Add customization options
- Implement environment profiles
- User testing with deaf community

**Deliverables:**
- Complete settings interface
- Profile system
- Alert history
- Beta testing program

**Success Criteria:**
- 4.5+ user satisfaction rating
- <5% false positive rate
- Positive feedback from accessibility advocates

### Phase 4: Production (Weeks 21-24)

**Goals:**
- Performance optimization
- Edge case handling
- App store submission
- Launch preparation

**Deliverables:**
- Production-ready apps (iOS, Wear OS)
- Scalable backend infrastructure
- Documentation and support materials
- Marketing website

**Success Criteria:**
- App store approval
- 99.5% uptime
- Support for 1000+ concurrent users

---

## Privacy & Security

### Data Handling Principles

**Privacy-First Design:**
- Audio is processed in real-time, NOT stored
- No permanent recordings on device or server
- Minimal metadata retention (timestamps, sound types only)
- No user identification in audio data

### Data Flow

**Audio Transmission:**
- Encrypted WebSocket (WSS) connection
- Audio chunks deleted after processing (<3 seconds retention)
- No cloud storage of raw audio

**Metadata:**
- Anonymized detection logs (for model improvement)
- User ID separated from audio data
- Opt-in for analytics

**User Controls:**
- Explicit consent for data collection
- Option to disable analytics entirely
- Clear privacy policy in plain language

### Security Measures

1. **Encryption:**
   - TLS 1.3 for all API communication
   - End-to-end encryption for audio streams
   - Encrypted local storage for settings

2. **Authentication:**
   - Device-level authentication tokens
   - No personal information required
   - Optional anonymous mode

3. **Infrastructure:**
   - Regular security audits
   - GDPR/CCPA compliance
   - Data minimization practices

---

## Accessibility Considerations

### Design for Deaf Users

**Visual Feedback:**
- All haptic alerts also shown visually (optional)
- Clear iconography for sound types
- High-contrast UI elements

**Customization:**
- User-defined haptic intensities
- Ability to disable specific sound categories
- Multiple sensitivity presets

**Language Support:**
- ASL-friendly interface design
- Video tutorials in sign language
- Text alternatives for all audio content

### Inclusive Testing

**Co-design Approach:**
- Partner with deaf community organizations
- Beta testing with diverse user group
- Iterative feedback incorporation
- Accessibility expert review

**Testing Scenarios:**
- Urban navigation (busy streets)
- Quiet environments (parks, suburbs)
- Indoor/outdoor transitions
- Various weather conditions

---

## Testing Strategy

### Unit Testing

**Frontend (Jest, React Native Testing Library):**
- Haptic pattern generation
- Audio buffer management
- State management
- UI component rendering

**Backend (pytest):**
- Audio preprocessing functions
- Model inference pipeline
- Direction calculation
- API endpoints

### Integration Testing

**End-to-End Scenarios:**
1. Audio capture → Classification → Haptic response
2. Connection failure → Offline mode → Recovery
3. Multiple simultaneous sounds → Priority handling
4. Battery optimization → Performance impact

### Field Testing

**Real-world Validation:**
- Urban environment (traffic, pedestrians)
- Suburban environment (quieter, occasional vehicles)
- Park/recreational paths (cyclists, runners)
- Indoor/outdoor transitions

**Performance Metrics:**
- Detection accuracy per environment
- False positive/negative rates
- Latency measurements
- Battery consumption profiles

### User Acceptance Testing

**Participant Criteria:**
- Deaf and hard-of-hearing individuals
- Various age groups (18-65+)
- Different levels of tech familiarity
- Urban and suburban residents

**Test Protocol:**
1. Onboarding completion rate
2. Feature discovery and usage
3. Customization adoption
4. Safety improvement (self-reported)
5. Anxiety reduction (standardized scale)

---

## Future Enhancements

### Short-term (6-12 months)

**1. Offline Mode**
- On-device ML model (TensorFlow Lite)
- Reduced accuracy but no network dependency
- Essential for areas with poor connectivity

**2. Smart Alerts**
- Machine learning to reduce false positives over time
- Adaptive sensitivity based on environment
- User feedback loop for model improvement

**3. Social Features**
- Community-reported danger zones
- Shared environment profiles
- Peer support network

### Medium-term (1-2 years)

**1. Multi-device Support**
- Phone + watch coordination
- Bone conduction headphones integration
- Smart glasses compatibility

**2. Advanced Sound Differentiation**
- Distinguish friend's voice from stranger
- Recognize specific vehicle types (emergency, motorcycle)
- Pet sound recognition (own dog vs. others)

**3. Location-Aware Intelligence**
- Adjust sensitivity by GPS location
- Sidewalk vs. street detection
- Building entry/exit awareness

### Long-term (2+ years)

**1. Predictive Alerts**
- Anticipate vehicle approach based on traffic patterns
- Construction zone warnings
- Event-based sensitivity (concerts, protests)

**2. Integration Ecosystem**
- Smart home integration (doorbell, alarms)
- Public transit alerts
- Emergency services coordination

**3. AI Personalization**
- Individual sound "fingerprinting"
- Custom model training per user
- Predictive urgency scoring

---

## Technical Challenges & Solutions

### Challenge 1: Battery Life

**Problem:** Continuous microphone use and processing drains battery quickly

**Solutions:**
- Adaptive sampling rate (reduce when environment is quiet)
- On-device preprocessing to reduce data transmission
- Battery-saver mode with reduced functionality
- Efficient haptic patterns (shorter when possible)

**Target:** <20% battery drain per hour in active mode

### Challenge 2: False Positives

**Problem:** Misclassifying sounds leads to alert fatigue

**Solutions:**
- Confidence threshold tuning (only alert above 85% confidence)
- Contextual filtering (ignore car sounds when user is in car)
- User feedback mechanism to improve model
- Temporal filtering (require sustained sound for some categories)

**Target:** <3% false positive rate for critical sounds

### Challenge 3: Latency

**Problem:** Delay between sound occurrence and haptic feedback reduces safety value

**Solutions:**
- Edge processing where possible (on-device for critical sounds)
- Optimized WebSocket communication
- Model quantization for faster inference
- Parallel processing pipeline

**Target:** <150ms total latency (capture to haptic)

### Challenge 4: Direction Accuracy

**Problem:** Limited microphone array on smartwatches reduces directional precision

**Solutions:**
- 8-direction quantization (realistic for hardware)
- Amplitude-based fallback when TDOA is unreliable
- User calibration process
- Fusion with phone sensors if available

**Target:** ±30° accuracy for 90% of directional sounds

---

## Development Environment Setup

### Frontend Setup

```bash
# React Native environment
npm install -g react-native-cli
npx react-native init ShadowSound

# Core dependencies
cd ShadowSound
npm install --save react-native-audio \
  react-native-haptic-feedback \
  @react-native-community/netinfo \
  react-native-permissions \
  react-native-background-fetch \
  @react-navigation/native \
  @react-native-async-storage/async-storage

# Platform-specific setup
cd ios && pod install && cd ..
```

### Backend Setup

```bash
# Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Core dependencies
pip install fastapi uvicorn websockets \
  librosa soundfile numpy scipy \
  tensorflow scikit-learn \
  pydantic redis prometheus-client

# Development tools
pip install pytest black flake8 mypy
```

### Development Workflow

**Frontend:**
```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Lint
npm run lint
```

**Backend:**
```bash
# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest tests/ -v

# Format code
black src/

# Type checking
mypy src/
```

---

## API Specification

### WebSocket Connection

**Endpoint:** `wss://api.shadowsound.app/ws/audio`

**Authentication:**
```json
{
  "type": "auth",
  "device_id": "unique-device-identifier",
  "api_version": "1.0"
}
```

**Audio Stream Message:**
```json
{
  "type": "audio_chunk",
  "timestamp": 1234567890,
  "sample_rate": 16000,
  "channels": 2,
  "audio_data": "base64-encoded-audio",
  "metadata": {
    "battery_level": 0.75,
    "environment_profile": "urban"
  }
}
```

**Detection Response:**
```json
{
  "type": "detection",
  "timestamp": 1234567890,
  "detections": [
    {
      "sound_type": "vehicle_approaching",
      "confidence": 0.94,
      "direction_degrees": 225,
      "direction_label": "SW",
      "urgency": "high",
      "estimated_distance": "close",
      "haptic_pattern": "pulse_intense_3x"
    }
  ],
  "processing_time_ms": 87
}
```

### REST API

**POST /api/v1/feedback**
User provides feedback on detection accuracy

Request:
```json
{
  "detection_id": "uuid",
  "correct": false,
  "actual_sound": "bicycle_bell",
  "comment": "Misidentified car horn"
}
```

**GET /api/v1/settings/{device_id}**
Retrieve user settings

**PUT /api/v1/settings/{device_id}**
Update user settings

---

## Deployment Architecture

### Production Infrastructure

**Frontend:**
- App Store (iOS)
- Google Play Store (Wear OS)
- TestFlight for beta releases

**Backend:**
- Cloud provider: AWS/GCP
- Container orchestration: Kubernetes
- Load balancing: NGINX
- CDN: CloudFlare (for static assets)

**Scaling Strategy:**
- Auto-scaling based on WebSocket connections
- Model inference on GPU instances
- Redis for session management
- Horizontal scaling of WebSocket servers

**Monitoring:**
- Prometheus + Grafana for metrics
- Sentry for error tracking
- CloudWatch/Stackdriver for logs
- Uptime monitoring: Pingdom

---

## Success Metrics & KPIs

### Technical Metrics

- **Detection Accuracy:** >90% for critical sounds
- **Latency:** <150ms end-to-end
- **False Positive Rate:** <3%
- **Uptime:** 99.5%
- **Battery Impact:** <20% per hour

### User Metrics

- **Active Users:** 10,000+ within 12 months
- **Daily Active Usage:** >30 minutes average
- **User Satisfaction:** 4.5+ stars
- **Retention:** 70% at 30 days

### Impact Metrics

- **Anxiety Reduction:** 60% decrease (self-reported)
- **Safety Incidents Avoided:** 1000+ reported near-misses detected
- **Independent Mobility:** 80% of users report increased confidence

---

## Budget Estimate

### Development Costs (6 months)

- **Engineering (2 mobile + 1 backend + 1 ML):** $300,000
- **UX/UI Design:** $40,000
- **Accessibility Consulting:** $20,000
- **Beta Testing Program:** $15,000
- **Total Development:** $375,000

### Infrastructure (Annual)

- **Cloud Hosting:** $30,000
- **ML Model Training:** $10,000
- **Third-party Services:** $5,000
- **Total Infrastructure:** $45,000/year

### Ongoing (Annual)

- **Maintenance & Updates:** $120,000
- **Support & Community:** $40,000
- **Marketing:** $60,000
- **Total Ongoing:** $220,000/year

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low detection accuracy | High | Medium | Extensive training data, iterative model improvement |
| Battery drain too high | High | Medium | Aggressive optimization, battery-saver modes |
| Latency exceeds threshold | High | Low | Edge processing, optimized pipeline |
| Privacy concerns | Medium | Low | Transparent policies, minimal data retention |
| False sense of security | High | Medium | Clear user education, disclaimers |
| Limited smartwatch adoption | Medium | Medium | Phone-based fallback mode |

---

## Conclusion

Shadow-Sound represents a meaningful advancement in assistive technology for the deaf and hard-of-hearing community. By translating environmental audio awareness into directional haptic feedback, we can significantly reduce anxiety and increase autonomy for millions of users.

The combination of modern ML techniques, ubiquitous smartwatch hardware, and thoughtful UX design makes this solution both technically feasible and deeply impactful.

**Next Steps:**
1. Secure initial funding or partnership
2. Assemble core development team
3. Begin Phase 1 MVP development
4. Establish partnerships with deaf advocacy organizations
5. Launch beta testing program

---

## Appendix

### A. Related Research

- "Deep Learning for Environmental Sound Classification" (Piczak, 2015)
- "Sound Event Detection in Urban Environments" (Stowell et al., 2015)
- "Haptic Interfaces for Accessibility" (Kaczmarek et al., 1991)

### B. Dataset Sources

- UrbanSound8K: https://urbansounddataset.weebly.com/
- ESC-50: https://github.com/karolpiczak/ESC-50
- AudioSet: https://research.google.com/audioset/
- FSD50K: https://zenodo.org/record/4060432

### C. Regulatory Considerations

- FDA classification (likely Class I medical device)
- HIPAA compliance (minimal PHI)
- ADA compliance
- GDPR/CCPA for data privacy

### D. Contact Information

**Project Lead:** [Chirayu Shah]
**Email:** [update email]
**GitHub:** [github.com/shadowsound](https://github.com/hacked26-team-hackers/ShadowSound)

---

*Document Version: 1.0*
*Last Updated: February 21, 2026*
*Status: Design Phase*