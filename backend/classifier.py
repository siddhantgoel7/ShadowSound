"""
Shadow-Sound — Sound Classifier (YAMNet)

Uses Google's YAMNet pre-trained model from TensorFlow Hub to classify
short audio clips into safety-relevant categories for the app.

YAMNet recognises 521 AudioSet event classes.  We map the ones that matter
for pedestrian / environmental safety into the app's own category set and
ignore everything else.
"""

import io
import csv
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub

# ── YAMNet settings ───────────────────────────────────────────────────────

TARGET_SR = 16000          # YAMNet requires 16 kHz mono
CONFIDENCE_THRESHOLD = 0.4 # Lower threshold since YAMNet distributes probability across many classes

# ── Map YAMNet AudioSet class names → app categories ──────────────────────
# Keys are substrings matched against YAMNet's 521 class display names.
# Order matters: first match wins.

_YAMNET_TO_APP: list[tuple[str, str]] = [
    # Emergency / sirens
    ("Siren", "emergency_siren"),
    ("Civil defense siren", "emergency_siren"),
    ("Ambulance", "emergency_siren"),
    ("Fire engine", "emergency_siren"),
    ("Police car", "emergency_siren"),

    # Vehicle horns
    ("Vehicle horn", "horn"),
    ("Car horn", "horn"),
    ("Air horn", "horn"),
    ("Honking", "horn"),
    ("Truck horn", "horn"),
    ("Bicycle bell", "bicycle_bell"),

    # Tire / braking
    ("Tire squeal", "tire_screech"),
    ("Skidding", "tire_screech"),

    # Vehicles approaching (engine sounds)
    ("Engine", "vehicle_approaching"),
    ("Motor vehicle", "vehicle_approaching"),
    ("Car", "vehicle_approaching"),
    ("Truck", "vehicle_approaching"),
    ("Bus", "vehicle_approaching"),
    ("Motorcycle", "vehicle_approaching"),

    # Human sounds
    ("Shout", "shouting"),
    ("Yell", "shouting"),
    ("Screaming", "shouting"),
    ("Crying", "shouting"),

    # Dog
    ("Dog", "dog_barking"),
    ("Bark", "dog_barking"),
    ("Growling", "dog_barking"),

    # Glass
    ("Shatter", "glass_breaking"),
    ("Glass", "glass_breaking"),

    # Alarms
    ("Alarm", "car_alarm"),
    ("Buzzer", "car_alarm"),
    ("Smoke detector", "car_alarm"),

    # Construction
    ("Jackhammer", "construction_noise"),
    ("Drill", "construction_noise"),
    ("Sawing", "construction_noise"),
    ("Power tool", "construction_noise"),
    ("Hammer", "construction_noise"),

    # Door
    ("Door", "door_slam"),
    ("Slam", "door_slam"),

    # Train
    ("Train", "train"),
    ("Railroad car", "train"),
    ("Rail transport", "train"),

    # Aircraft
    ("Aircraft", "aircraft"),
    ("Airplane", "aircraft"),
    ("Helicopter", "aircraft"),
    ("Jet engine", "aircraft"),

    # Footsteps
    ("Footsteps", "footsteps_running"),
    ("Run", "footsteps_running"),
    ("Walk", "footsteps_running"),
]

# ── Urgency & haptics (unchanged from original) ──────────────────────────

URGENCY: dict[str, str] = {
    "emergency_siren": "critical",
    "vehicle_approaching": "high",
    "tire_screech": "high",
    "glass_breaking": "high",
    "horn": "high",
    "shouting": "medium",
    "bicycle_bell": "medium",
    "car_alarm": "medium",
    "train": "medium",
    "dog_barking": "low",
    "footsteps_running": "low",
    "construction_noise": "low",
    "door_slam": "low",
    "aircraft": "low",
    "background": "none",
}

HAPTIC_PATTERN: dict[str, str] = {
    "emergency_siren": "rapid_pulse_3x",
    "vehicle_approaching": "double_tap",
    "horn": "double_tap",
    "tire_screech": "rapid_pulse_3x",
    "glass_breaking": "rapid_pulse_3x",
    "car_alarm": "rapid_pulse_3x",
    "shouting": "long_pulse",
    "bicycle_bell": "quick_triple_tap",
    "dog_barking": "gentle_pulse",
    "footsteps_running": "gentle_pulse",
    "construction_noise": "gentle_pulse",
    "door_slam": "single_tap",
    "train": "double_tap",
    "aircraft": "gentle_pulse",
}


class SoundClassifier:
    """Loads YAMNet once and exposes a classify() method."""

    def __init__(self) -> None:
        print("[classifier] Loading YAMNet from TensorFlow Hub …")
        self.model = hub.load("https://tfhub.dev/google/yamnet/1")
        # Load the class map CSV bundled with the model
        class_map_path = self.model.class_map_path().numpy().decode("utf-8")
        with tf.io.gfile.GFile(class_map_path) as f:
            reader = csv.DictReader(f)
            self.class_names = [row["display_name"] for row in reader]
        print(f"[classifier] YAMNet loaded — {len(self.class_names)} classes.")

    # ── public API ─────────────────────────────────────────────────────

    def classify(
        self,
        audio_bytes: bytes,
        sample_rate: int = TARGET_SR,
    ) -> dict | None:
        """
        Classify raw audio bytes using YAMNet.

        Parameters
        ----------
        audio_bytes : bytes
            Raw audio file bytes (WAV, OGG, etc.) or raw PCM int16/float32.
        sample_rate : int
            Sample rate of the incoming audio.

        Returns
        -------
        dict | None
            Detection dict or None if nothing exceeds threshold.
        """
        waveform = self._decode_audio(audio_bytes, sample_rate)
        if waveform is None:
            return None

        # YAMNet expects a 1-D float32 tensor in [-1.0, 1.0]
        scores, _embeddings, _spectrogram = self.model(waveform)
        scores_np = scores.numpy()

        # Average across frames, then pick the top class
        mean_scores = scores_np.mean(axis=0)
        top_idx = int(np.argmax(mean_scores))
        confidence = float(mean_scores[top_idx])
        yamnet_label = self.class_names[top_idx]

        # Map to app category
        app_category = self._map_to_app_category(yamnet_label)

        if app_category is None or confidence < CONFIDENCE_THRESHOLD:
            return None

        return {
            "sound_type": app_category,
            "confidence": round(confidence, 3),
            "urgency": URGENCY.get(app_category, "low"),
            "haptic_pattern": HAPTIC_PATTERN.get(app_category, "single_tap"),
            "yamnet_label": yamnet_label,  # Include original label for debugging
        }

    # ── internals ──────────────────────────────────────────────────────

    @staticmethod
    def _map_to_app_category(yamnet_label: str) -> str | None:
        """Map a YAMNet display name to an app category, or None if irrelevant."""
        label_lower = yamnet_label.lower()
        for substring, category in _YAMNET_TO_APP:
            if substring.lower() in label_lower:
                return category
        return None

    @staticmethod
    def _decode_audio(audio_bytes: bytes, original_sr: int) -> np.ndarray | None:
        """Decode audio bytes → 16 kHz mono float32 waveform in [-1, 1]."""
        try:
            import librosa

            waveform, _ = librosa.load(
                io.BytesIO(audio_bytes), sr=TARGET_SR, mono=True
            )
            # librosa already returns float32 in roughly [-1, 1]
            return waveform.astype(np.float32)
        except Exception:
            pass

        # Fallback: try raw PCM int16
        try:
            pcm = np.frombuffer(audio_bytes, dtype=np.int16)
            waveform = pcm.astype(np.float32) / 32768.0

            # Resample if needed
            if original_sr != TARGET_SR:
                import librosa
                waveform = librosa.resample(
                    waveform, orig_sr=original_sr, target_sr=TARGET_SR
                )
            return waveform
        except Exception as exc:
            print(f"[classifier] Failed to decode audio: {exc}")
            return None
