import { useCallback, useEffect, useRef, useState } from "react";
import { audioCaptureService } from "@/src/services/audio-capture.service";

interface UseAudioCaptureReturn {
    /** `null` = not yet checked, `true` = granted, `false` = denied */
    hasPermission: boolean | null;
    /** Whether audio is currently being captured */
    isCapturing: boolean;
    /** Start the chunked capture loop */
    startCapture: () => Promise<void>;
    /** Stop the capture loop */
    stopCapture: () => Promise<void>;
    /** The most recent base64-encoded audio chunk */
    lastChunk: string | null;
    /** Total number of chunks captured in the current session */
    chunkCount: number;
}

/**
 * React hook that wraps the AudioCaptureService for declarative usage.
 *
 * Requests microphone permission on mount and exposes start/stop controls
 * along with the latest captured chunk and a running count.
 */
export function useAudioCapture(): UseAudioCaptureReturn {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [lastChunk, setLastChunk] = useState<string | null>(null);
    const [chunkCount, setChunkCount] = useState(0);

    // Ref to keep the chunk handler stable across renders
    const chunkCountRef = useRef(0);

    // ── Request permission on mount ──
    useEffect(() => {
        let mounted = true;

        (async () => {
            const granted = await audioCaptureService.requestPermission();
            if (mounted) setHasPermission(granted);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            if (audioCaptureService.isCapturing) {
                audioCaptureService.stopCapture();
            }
        };
    }, []);

    const startCapture = useCallback(async (externalOnChunk?: (base64: string) => void) => {
        if (!hasPermission) {
            console.warn("[useAudioCapture] Cannot start — no mic permission");
            return;
        }

        // Reset counters for a new session
        chunkCountRef.current = 0;
        setChunkCount(0);
        setLastChunk(null);

        await audioCaptureService.startCapture((base64) => {
            chunkCountRef.current += 1;
            setLastChunk(base64);
            setChunkCount(chunkCountRef.current);

            // Forward to external callback if provided
            externalOnChunk?.(base64);

            if (__DEV__) {
                console.log(
                    `[AudioCapture] Chunk #${chunkCountRef.current} — ${base64.length} chars`
                );
            }
        });

        setIsCapturing(true);
    }, [hasPermission]);

    const stopCapture = useCallback(async () => {
        await audioCaptureService.stopCapture();
        setIsCapturing(false);
    }, []);

    return {
        hasPermission,
        isCapturing,
        startCapture,
        stopCapture,
        lastChunk,
        chunkCount,
    };
}
