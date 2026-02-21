"""
Shadow-Sound — Model Training Script

Trains a CNN on mel-spectrograms to classify 5 safety-critical sounds.

Usage
-----
1. Organise training data:

    backend/data/
    ├── alarm/          ← WAV files of alarms
    ├── dog_barking/    ← WAV files of dogs barking
    ├── emergency_siren/← WAV files of sirens
    ├── horn/           ← WAV files of car horns
    └── shouting/       ← WAV files of shouting

2. Run:
    python train.py

3. Output → backend/model/sound_model.keras
"""

import os
import numpy as np
import librosa
import tensorflow as tf
from sklearn.model_selection import train_test_split

# ── Settings (must match classifier.py) ───────────────────────────────────

TARGET_SR = 16000
CLIP_DURATION = 2.0
N_MELS = 128
HOP_LENGTH = 512

CLASS_NAMES = ["alarm", "dog_barking", "emergency_siren", "horn", "shouting"]

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "sound_model.keras")

BATCH_SIZE = 32
EPOCHS = 30
VALIDATION_SPLIT = 0.2


# ── Data loading ──────────────────────────────────────────────────────────

def audio_to_spectrogram(file_path: str) -> np.ndarray:
    """Load a WAV file and return a normalised mel-spectrogram."""
    waveform, _ = librosa.load(file_path, sr=TARGET_SR, mono=True)

    # Pad or trim to fixed duration
    target_len = int(TARGET_SR * CLIP_DURATION)
    if len(waveform) < target_len:
        waveform = np.pad(waveform, (0, target_len - len(waveform)))
    else:
        waveform = waveform[:target_len]

    mel_spec = librosa.feature.melspectrogram(
        y=waveform, sr=TARGET_SR, n_mels=N_MELS, hop_length=HOP_LENGTH,
    )
    log_mel = librosa.power_to_db(mel_spec, ref=np.max)

    # Normalise to [0, 1]
    log_mel = (log_mel - log_mel.min()) / (log_mel.max() - log_mel.min() + 1e-8)

    return log_mel.astype(np.float32)


def load_dataset():
    """Walk data/ subdirectories and build X, y arrays."""
    X, y = [], []
    for label_idx, class_name in enumerate(CLASS_NAMES):
        class_dir = os.path.join(DATA_DIR, class_name)
        if not os.path.isdir(class_dir):
            print(f"⚠  Missing directory: {class_dir} — skipping")
            continue

        files = [f for f in os.listdir(class_dir) if f.endswith((".wav", ".mp3", ".ogg", ".flac"))]
        print(f"  {class_name}: {len(files)} files")

        for fname in files:
            try:
                spec = audio_to_spectrogram(os.path.join(class_dir, fname))
                X.append(spec)
                y.append(label_idx)
            except Exception as exc:
                print(f"    ✗ {fname}: {exc}")

    X = np.array(X)[..., np.newaxis]  # add channel dim → (N, n_mels, time, 1)
    y = np.array(y)
    return X, y


# ── Model architecture ────────────────────────────────────────────────────

def build_model(input_shape: tuple, num_classes: int) -> tf.keras.Model:
    """Small CNN suitable for fast inference on a server or edge device."""
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=input_shape),

        # Block 1
        tf.keras.layers.Conv2D(32, (3, 3), activation="relu", padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.25),

        # Block 2
        tf.keras.layers.Conv2D(64, (3, 3), activation="relu", padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.25),

        # Block 3
        tf.keras.layers.Conv2D(128, (3, 3), activation="relu", padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.3),

        # Head
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


# ── Training ──────────────────────────────────────────────────────────────

def main():
    print("Loading dataset …")
    X, y = load_dataset()
    print(f"Dataset: {X.shape[0]} samples, shape {X.shape[1:]}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=VALIDATION_SPLIT, stratify=y, random_state=42,
    )
    print(f"Train: {len(X_train)} — Val: {len(X_val)}")

    model = build_model(X_train.shape[1:], len(CLASS_NAMES))
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3,
        ),
    ]

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        callbacks=callbacks,
    )

    # Evaluate
    loss, acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\nValidation accuracy: {acc:.2%}")

    # Save
    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save(MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    main()
