import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioCapture } from "./useAudioCapture";
import {
    webSocketService,
    type Detection,
} from "@/src/services/websocket.service";
import { triggerHaptic } from "@/services/haptic.service";

export interface SoundDetectionState {
    /** Mic permission status: null = pending, true = granted, false = denied */
    hasPermission: boolean | null;
    /** Whether the full pipeline is active (capturing + connected) */
    isListening: boolean;
    /** Whether the WebSocket is connected to the backend */
    isConnected: boolean;
    /** Most recent detection result (null until first detection) */
    lastDetection: Detection | null;
    /** Rolling log of recent detections */
    recentDetections: Detection[];
    /** Total audio chunks sent this session */
    chunksSent: number;
    /** Start the full pipeline: capture audio → send via WS → receive detections */
    startListening: () => Promise<void>;
    /** Stop everything */
    stopListening: () => Promise<void>;
}

/** How many recent detections to keep */
const MAX_RECENT = 20;

/**
 * Combines audio capture + WebSocket into a single hook.
 *
 * Call `startListening()` to:
 * 1. Connect to the backend WebSocket
 * 2. Start capturing audio chunks from the mic
 * 3. Send each chunk to the backend for classification
 * 4. Receive detection results via callback
 *
 * @param backendUrl  Override the default WebSocket URL (e.g. for a remote server)
 * @param mock        Use mock detections instead of the real model
 */
export function useSoundDetection(
    backendUrl?: string,
    mock = false,
): SoundDetectionState {
    const {
        hasPermission,
        isCapturing,
        startCapture,
        stopCapture,
    } = useAudioCapture();

    const [isConnected, setIsConnected] = useState(false);
    const [lastDetection, setLastDetection] = useState<Detection | null>(null);
    const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
    const [chunksSent, setChunksSent] = useState(0);

    const chunksSentRef = useRef(0);

    // ── Start the full pipeline ──────────────────────────────────────

    const startListening = useCallback(async () => {
        if (!hasPermission) {
            console.warn("[useSoundDetection] No mic permission");
            return;
        }

        // Reset state for new session
        chunksSentRef.current = 0;
        setChunksSent(0);
        setLastDetection(null);
        setRecentDetections([]);

        // 1. Connect to backend
        webSocketService.connect(
            // onDetection callback
            (detections, _processingMs) => {
                if (detections.length > 0) {
                    const top = detections[0];
                    setLastDetection(top);
                    setRecentDetections((prev: Detection[]) => [top, ...prev].slice(0, MAX_RECENT));

                    // 🔔 Haptic feedback for hearing-impaired users
                    triggerHaptic(top.haptic_pattern, top.urgency);
                }
            },
            // onConnectionChange callback
            (connected) => {
                setIsConnected(connected);
            },
            mock,
        );

        // 2. Start audio capture — each chunk is sent over the WebSocket
        await startCapture((base64Chunk) => {
            webSocketService.sendAudioChunk(base64Chunk, 16_000);
            chunksSentRef.current += 1;
            setChunksSent(chunksSentRef.current);
        });
    }, [hasPermission, startCapture, mock]);

    // ── Stop everything ──────────────────────────────────────────────

    const stopListening = useCallback(async () => {
        await stopCapture();
        webSocketService.disconnect();
        setIsConnected(false);
    }, [stopCapture]);

    // ── Cleanup on unmount ───────────────────────────────────────────

    useEffect(() => {
        return () => {
            webSocketService.disconnect();
        };
    }, []);

    return {
        hasPermission,
        isListening: isCapturing && isConnected,
        isConnected,
        lastDetection,
        recentDetections,
        chunksSent,
        startListening,
        stopListening,
    };
}
