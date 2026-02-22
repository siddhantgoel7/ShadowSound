import React, { createContext, useContext, type ReactNode } from "react";
import {
    useSoundDetection,
    type SoundDetectionState,
} from "@/hooks/useSoundDetection";

const SoundDetectionContext = createContext<SoundDetectionState | null>(null);

/**
 * Wrap tab layout with this provider so all screens share the same
 * detection pipeline (audio capture, WebSocket, haptics).
 */
export function SoundDetectionProvider({ children }: { children: ReactNode }) {
    const state = useSoundDetection();
    return (
        <SoundDetectionContext.Provider value={state}>
            {children}
        </SoundDetectionContext.Provider>
    );
}

/** Access the shared detection state from any tab screen. */
export function useSharedDetection(): SoundDetectionState {
    const ctx = useContext(SoundDetectionContext);
    if (!ctx) {
        throw new Error(
            "useSharedDetection must be used within <SoundDetectionProvider>",
        );
    }
    return ctx;
}