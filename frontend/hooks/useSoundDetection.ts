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
    /**
     * Inject a mock detection directly — used by Demo Mode to fire alerts
     * without needing a real sound or backend connection.
     */
    injectMockDetection: (detection: Detection) => void;
}

/** How many recent detections to keep */
const MAX_RECENT = 20;

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

    // ── Shared detection handler ─────────────────────────────────────

    const handleDetection = useCallback((detection: Detection) => {
        setLastDetection(detection);
        setRecentDetections((prev: Detection[]) =>
            [detection, ...prev].slice(0, MAX_RECENT)
        );
        triggerHaptic(detection.haptic_pattern, detection.urgency);
    }, []);

    // ── Inject mock detection (demo mode) ────────────────────────────

    const injectMockDetection = useCallback((detection: Detection) => {
        handleDetection(detection);
    }, [handleDetection]);

    // ── Start the full pipeline ──────────────────────────────────────

    const startListening = useCallback(async () => {
        if (!hasPermission) {
            console.warn("[useSoundDetection] No mic permission");
            return;
        }

        chunksSentRef.current = 0;
        setChunksSent(0);
        setLastDetection(null);
        setRecentDetections([]);

        webSocketService.connect(
            (detections, _processingMs) => {
                if (detections.length > 0) {
                    handleDetection(detections[0]);
                }
            },
            (connected) => {
                setIsConnected(connected);
            },
            mock,
        );

        await startCapture((base64Chunk) => {
            webSocketService.sendAudioChunk(base64Chunk, 16_000);
            chunksSentRef.current += 1;
            setChunksSent(chunksSentRef.current);
        });
    }, [hasPermission, startCapture, mock, handleDetection]);

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
        injectMockDetection,
    };
}