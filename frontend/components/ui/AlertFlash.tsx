import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface AlertFlashProps {
    urgency: string | null;
    trigger: number; // increment this to trigger a flash
}

const URGENCY_COLORS: Record<string, string> = {
    critical: "#FF2222",
    high: "#FF8800",
    medium: "#FFCC00",
    low: "#88CC44",
};

/**
 * Full-screen color flash that fires whenever `trigger` changes.
 * Sits as an overlay on top of everything — pointer-events none so
 * it never blocks interaction.
 */
export default function AlertFlash({ urgency, trigger }: AlertFlashProps) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!trigger || !urgency || urgency === "none") return;

        // Number of pulses based on urgency
        const pulses = urgency === "critical" ? 3 : urgency === "high" ? 2 : 1;
        const duration = urgency === "critical" ? 120 : 180;

        const sequence: Animated.CompositeAnimation[] = [];
        for (let i = 0; i < pulses; i++) {
            sequence.push(
                Animated.timing(opacity, { toValue: 0.55, duration, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: duration * 1.5, useNativeDriver: true }),
            );
            if (i < pulses - 1) {
                sequence.push(
                    Animated.delay(60),
                );
            }
        }

        Animated.sequence(sequence).start();
    }, [trigger]);

    const color = URGENCY_COLORS[urgency ?? ""] ?? "#FF2222";

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.overlay, { backgroundColor: color, opacity }]}
        />
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
});