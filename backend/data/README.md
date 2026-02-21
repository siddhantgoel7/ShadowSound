# Training Data

Place audio files (`.wav`, `.mp3`, `.ogg`, `.flac`) in subdirectories named after each class:

```
data/
├── alarm/
├── dog_barking/
├── emergency_siren/
├── horn/
└── shouting/
```

Good sources for training audio:
- [UrbanSound8K](https://urbansounddataset.weebly.com/urbansound8k.html)
- [ESC-50](https://github.com/karolpiczak/ESC-50)
- [AudioSet](https://research.google.com/audioset/) (via YouTube clips)
- Record your own with a phone

Aim for **50+ clips per class** (2 seconds each, 16 kHz mono preferred).
