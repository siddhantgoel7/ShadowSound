import { Audio, InterruptionModeIOS, InterruptionModeAndroid, type AudioMode } from "expo-av";
import { File } from "expo-file-system/next";

/** Default chunk duration in milliseconds */
const CHUNK_DURATION_MS = 1500;

/** Audio recording preset optimised for speech/environmental sound classification */
const RECORDING_OPTIONS: Audio.RecordingOptions = {
    isMeteringEnabled: false,
    android: {
        extension: ".wav",
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 16_000,
        numberOfChannels: 1,
        bitRate: 256_000,
    },
    ios: {
        extension: ".wav",
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16_000,
        numberOfChannels: 1,
        bitRate: 256_000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: "audio/wav",
        bitsPerSecond: 256_000,
    },
};

const AUDIO_MODE: AudioMode = {
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
};

export type AudioChunkCallback = (base64: string) => void;

/**
 * Manages a continuous record → stop → base64-encode → restart loop
 * that produces ~1.5 s audio chunks encoded as base64 strings.
 */
export class AudioCaptureService {
    private recording: Audio.Recording | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private _isCapturing = false;
    private onChunk: AudioChunkCallback | null = null;

    /** Whether the capture loop is currently running */
    get isCapturing(): boolean {
        return this._isCapturing;
    }

    // ──────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────

    /**
     * Request microphone permission from the user.
     * @returns `true` if permission was granted.
     */
    async requestPermission(): Promise<boolean> {
        const { status } = await Audio.requestPermissionsAsync();
        return status === "granted";
    }

    /**
     * Check current mic permission status without prompting.
     * @returns `true` if already granted.
     */
    async checkPermission(): Promise<boolean> {
        const { status } = await Audio.getPermissionsAsync();
        return status === "granted";
    }

    /**
     * Start the chunked audio capture loop.
     * Each chunk fires the `onChunk` callback with a base64-encoded string.
     */
    async startCapture(onChunk: AudioChunkCallback): Promise<void> {
        if (this._isCapturing) return;

        this.onChunk = onChunk;
        this._isCapturing = true;

        // Configure the audio session for recording
        await Audio.setAudioModeAsync(AUDIO_MODE);

        // Kick off the first recording cycle
        await this.recordChunk();
    }

    /** Stop the capture loop and clean up resources. */
    async stopCapture(): Promise<void> {
        this._isCapturing = false;

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        await this.stopAndCleanRecording();
        this.onChunk = null;
    }

    // ──────────────────────────────────────────
    // Internal
    // ──────────────────────────────────────────

    /** Single record → stop → base64 → callback cycle */
    private async recordChunk(): Promise<void> {
        if (!this._isCapturing) return;

        try {
            // 1. Create and start a new recording
            const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
            this.recording = recording;

            // 2. Wait for the chunk duration, then harvest the recording
            this.timer = setTimeout(async () => {
                if (!this._isCapturing) return;

                try {
                    await this.harvestChunk();
                } catch (err) {
                    console.warn("[AudioCapture] Error harvesting chunk:", err);
                }

                // 3. Start the next cycle
                this.recordChunk();
            }, CHUNK_DURATION_MS);
        } catch (err) {
            console.error("[AudioCapture] Error starting recording:", err);
            this._isCapturing = false;
        }
    }

    /** Stop the current recording, read it as base64, fire the callback, clean up */
    private async harvestChunk(): Promise<void> {
        if (!this.recording) return;

        const recording = this.recording;
        this.recording = null;

        try {
            // Stop recording
            await recording.stopAndUnloadAsync();

            const uri = recording.getURI();
            if (!uri) return;

            // Read the file as base64
            const file = new File(uri);
            const base64 = await file.base64();

            // Fire callback
            this.onChunk?.(base64);

            // Clean up temp file
            file.delete();
        } catch (err) {
            console.warn("[AudioCapture] Error processing chunk:", err);
        }
    }

    /** Safely stop and unload any in-progress recording */
    private async stopAndCleanRecording(): Promise<void> {
        if (!this.recording) return;

        const recording = this.recording;
        this.recording = null;

        try {
            const status = await recording.getStatusAsync();
            if (status.isRecording) {
                await recording.stopAndUnloadAsync();
            }

            const uri = recording.getURI();
            if (uri) {
                const file = new File(uri);
                if (file.exists) file.delete();
            }
        } catch {
            // Already stopped / unloaded — safe to ignore
        }
    }
}

/** Singleton instance for app-wide use */
export const audioCaptureService = new AudioCaptureService();
