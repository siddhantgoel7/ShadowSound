import { Platform } from "react-native";

// ── Types ────────────────────────────────────────────────────────────────

export interface Detection {
    sound_type: string;
    confidence: number;
    urgency: string;
    haptic_pattern: string;
    direction_degrees?: number;
    direction_label?: string;
    estimated_distance?: string;
}

export interface DetectionMessage {
    type: "detection";
    timestamp: number;
    detections: Detection[];
    processing_time_ms: number;
}

export interface NoDetectionMessage {
    type: "no_detection";
    timestamp: number;
    detections: null;
    processing_time_ms: number;
    message: string;
}

export interface AuthOkMessage {
    type: "auth_ok";
    message: string;
}

export interface ErrorMessage {
    type: "error";
    message: string;
}

type ServerMessage = DetectionMessage | NoDetectionMessage | AuthOkMessage | ErrorMessage;

export type OnDetectionCallback = (detections: Detection[], processingMs: number) => void;
export type OnConnectionChangeCallback = (connected: boolean) => void;

// ── Config ───────────────────────────────────────────────────────────────

/** Default backend URL — change this to your machine's IP for real-device testing */
const DEFAULT_WS_URL = "ws://192.168.1.23:8000/ws/audio";

/** How long to wait before reconnecting (ms) */
const RECONNECT_DELAY_MS = 2000;

/** Max reconnect attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 10;

// ── Service ──────────────────────────────────────────────────────────────

/**
 * Manages a WebSocket connection to the Shadow-Sound backend.
 *
 * - Connects and authenticates automatically
 * - Sends base64-encoded audio chunks for classification
 * - Fires callbacks on detection results
 * - Auto-reconnects on disconnect
 */
export class WebSocketService {
    private ws: WebSocket | null = null;
    private url: string;
    private deviceId: string;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private _isConnected = false;
    private _isAuthenticated = false;

    // Pending chunks queued before auth completes
    private pendingChunks: string[] = [];

    // Callbacks
    private onDetection: OnDetectionCallback | null = null;
    private onConnectionChange: OnConnectionChangeCallback | null = null;

    constructor(url?: string) {
        this.url = url ?? DEFAULT_WS_URL;
        this.deviceId = `${Platform.OS}-${Date.now().toString(36)}`;
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Open a WebSocket connection to the backend.
     * @param mock  If true, appends `?mock=true` so the backend returns random detections.
     */
    connect(
        onDetection: OnDetectionCallback,
        onConnectionChange?: OnConnectionChangeCallback,
        mock = false,
    ): void {
        this.onDetection = onDetection;
        this.onConnectionChange = onConnectionChange ?? null;
        this.reconnectAttempts = 0;

        const wsUrl = mock ? `${this.url}?mock=true` : this.url;
        this.openSocket(wsUrl);
    }

    /** Gracefully close the connection (no auto-reconnect). */
    disconnect(): void {
        this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent reconnect
        this.cleanup();
    }

    /**
     * Send a base64-encoded audio chunk to the backend for classification.
     * Chunks are queued if the connection isn't authenticated yet.
     */
    sendAudioChunk(base64Audio: string, sampleRate = 16_000): void {
        const payload = JSON.stringify({
            type: "audio_chunk",
            audio_data: base64Audio,
            sample_rate: sampleRate,
        });

        if (this._isAuthenticated && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
        } else {
            // Queue it — will be flushed after auth completes
            this.pendingChunks.push(payload);
        }
    }

    // ── Internals ────────────────────────────────────────────────────

    private openSocket(url: string): void {
        this.cleanup();

        console.log(`[WS] Connecting to ${url}…`);
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("[WS] Connected");
            this._isConnected = true;
            this.reconnectAttempts = 0;
            this.onConnectionChange?.(true);

            // Send auth handshake
            ws.send(
                JSON.stringify({
                    type: "auth",
                    device_id: this.deviceId,
                    api_version: "1.0",
                }),
            );
        };

        ws.onmessage = (event) => {
            try {
                const msg: ServerMessage = JSON.parse(event.data);
                this.handleMessage(msg);
            } catch {
                console.warn("[WS] Failed to parse message:", event.data);
            }
        };

        ws.onerror = (err) => {
            console.warn("[WS] Error:", err);
        };

        ws.onclose = () => {
            console.log("[WS] Disconnected");
            this._isConnected = false;
            this._isAuthenticated = false;
            this.onConnectionChange?.(false);
            this.attemptReconnect(url);
        };

        this.ws = ws;
    }

    private handleMessage(msg: ServerMessage): void {
        switch (msg.type) {
            case "auth_ok":
                console.log(`[WS] ${msg.message}`);
                this._isAuthenticated = true;
                this.flushPendingChunks();
                break;

            case "detection":
                this.onDetection?.(msg.detections, msg.processing_time_ms);
                break;

            case "no_detection":
                // Nothing above threshold — we can ignore or log
                break;

            case "error":
                console.warn(`[WS] Server error: ${msg.message}`);
                break;
        }
    }

    private flushPendingChunks(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        for (const payload of this.pendingChunks) {
            this.ws.send(payload);
        }
        this.pendingChunks = [];
    }

    private attemptReconnect(url: string): void {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log("[WS] Max reconnect attempts reached — giving up.");
            return;
        }

        this.reconnectAttempts++;
        const delay = RECONNECT_DELAY_MS * Math.min(this.reconnectAttempts, 5);
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})…`);

        this.reconnectTimer = setTimeout(() => {
            this.openSocket(url);
        }, delay);
    }

    private cleanup(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;

            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }

        this._isConnected = false;
        this._isAuthenticated = false;
        this.pendingChunks = [];
    }
}

/** Singleton instance for app-wide use */
export const webSocketService = new WebSocketService();
