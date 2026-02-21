"""
Shadow-Sound — Sound Classifier

Loads a custom-trained CNN model (Keras .keras / .h5) that classifies
short audio clips into the 5 safety-critical categories used by the app.

Expected model:
  - Input : mel-spectrogram (128 mel bins × N time frames, 1 channel)
  - Output: softmax over 5 classes
"""

import io
import os
import numpy as np
import librosa
import tensorflow as tf

# ── Class labels (indices must match training label order) ────────────────

CLASS_NAMES: list[str] = [
    "alarm",
    "dog_barking",
    "emergency_siren",
    "horn",
    "shouting",
]

# Urgency per category
URGENCY: dict[str, str] = {
    "emergency_siren": "critical",
    "horn": "high",
    "shouting": "medium",
    "dog_barking": "low",
    "alarm": "medium",
}

# Haptic pattern per category
HAPTIC_PATTERN: dict[str, str] = {
    "emergency_siren": "rapid_pulse_3x",
    "horn": "double_tap",
    "shouting": "long_pulse",
    "dog_barking": "triple_tap",
    "alarm": "alternating_short_long",
}

# ── Audio settings (must match training config) ──────────────────────────

TARGET_SR = 16000       # 16 kHz mono
CLIP_DURATION = 2.0     # seconds
N_MELS = 128            # mel bins
HOP_LENGTH = 512        # spectrogram hop
CONFIDENCE_THRESHOLD = 0.85

# Default model path (relative to this file)
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "sound_model.keras")


class SoundClassifier:
    """Loads a custom Keras model once and exposes a classify() method."""

    def __init__(self, model_path: str | None = None) -> None:
        path = model_path or DEFAULT_MODEL_PATH
        print(f"[classifier] Loading model from {path} …")
        self.model = tf.keras.models.load_model(path)
        print(f"[classifier] Model loaded — {len(CLASS_NAMES)} classes.")

    # ── public API ─────────────────────────────────────────────────────

    def classify(
        self,
        audio_bytes: bytes,
        sample_rate: int = TARGET_SR,
    ) -> dict | None:
        """
        Classify raw audio bytes.

        Parameters
        ----------
        audio_bytes : bytes
            Raw audio file bytes (WAV, OGG, etc.).
        sample_rate : int
            Sample rate of the incoming audio.

        Returns
        -------
        dict | None
            Detection dict or None if nothing exceeds threshold.
        """
        spectrogram = self._audio_to_spectrogram(audio_bytes, sample_rate)
        if spectrogram is None:
            return None

        # Model expects batch dimension: (1, n_mels, time_frames, 1)
        input_tensor = np.expand_dims(spectrogram, axis=(0, -1))

        predictions = self.model.predict(input_tensor, verbose=0)[0]
        top_idx = int(np.argmax(predictions))
        confidence = float(predictions[top_idx])

        if confidence < CONFIDENCE_THRESHOLD:
            return None

        sound_type = CLASS_NAMES[top_idx]
        return {
            "sound_type": sound_type,
            "confidence": round(confidence, 3),
            "urgency": URGENCY.get(sound_type, "low"),
            "haptic_pattern": HAPTIC_PATTERN.get(sound_type, "single_tap"),
        }

    # ── internals ──────────────────────────────────────────────────────

    def _audio_to_spectrogram(
        self, audio_bytes: bytes, original_sr: int
    ) -> np.ndarray | None:
        """Decode audio bytes → 16 kHz mono → mel-spectrogram."""
        try:
            waveform, _ = librosa.load(
                io.BytesIO(audio_bytes), sr=TARGET_SR, mono=True
            )

            # Pad or trim to fixed duration
            target_len = int(TARGET_SR * CLIP_DURATION)
            if len(waveform) < target_len:
                waveform = np.pad(waveform, (0, target_len - len(waveform)))
            else:
                waveform = waveform[:target_len]

            # Compute mel-spectrogram (log scale)
            mel_spec = librosa.feature.melspectrogram(
                y=waveform,
                sr=TARGET_SR,
                n_mels=N_MELS,
                hop_length=HOP_LENGTH,
            )
            log_mel = librosa.power_to_db(mel_spec, ref=np.max)

            # Normalize to [0, 1]
            log_mel = (log_mel - log_mel.min()) / (log_mel.max() - log_mel.min() + 1e-8)

            return log_mel.astype(np.float32)

        except Exception as exc:
            print(f"[classifier] Failed to process audio: {exc}")
            return None
