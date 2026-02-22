import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";

/**
 * Haptic feedback service for hearing-impaired users.
 *
 * Maps the backend's `haptic_pattern` strings to real device vibration patterns.
 * Uses expo-haptics for fine-grained feedback + Vibration API for longer patterns.
 *
 * Urgency escalation:
 *   critical  → rapid_pulse_3x   — 3 heavy impacts with short pauses
 *   high      → double_tap       — 2 strong impacts
 *   medium    → long_pulse       — sustained vibration
 *   low       → gentle_pulse     — soft single notification
 */

// ── Cooldown to prevent haptic spam ──────────────────────────────────────

/** Minimum ms between haptic triggers to prevent overwhelming the user */
const HAPTIC_COOLDOWN_MS = 2000;
let lastHapticTime = 0;

// ── Pattern implementations ──────────────────────────────────────────────

/**
 * Rapid 3x pulse — for CRITICAL alerts (sirens, glass breaking).
 * Three heavy impacts with short pauses between each.
 */
async function rapidPulse3x(): Promise<void> {
    // Vibration pattern: [pause, vibrate, pause, vibrate, pause, vibrate]
    if (Platform.OS === "android") {
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    }
    // Also fire haptic impacts for devices with haptic engines
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(150);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(150);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Double tap — for HIGH urgency alerts (vehicles, horns).
 * Two strong impacts.
 */
async function doubleTap(): Promise<void> {
    if (Platform.OS === "android") {
        Vibration.vibrate([0, 150, 100, 150]);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(120);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Quick triple tap — for MEDIUM alerts (bicycle bell).
 * Three lighter taps in quick succession.
 */
async function quickTripleTap(): Promise<void> {
    if (Platform.OS === "android") {
        Vibration.vibrate([0, 80, 60, 80, 60, 80]);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Long pulse — for MEDIUM alerts (shouting, alarms).
 * Sustained vibration to get attention.
 */
async function longPulse(): Promise<void> {
    if (Platform.OS === "android") {
        Vibration.vibrate(400);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(100);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Gentle pulse — for LOW urgency (footsteps, construction, dog barking).
 * Soft single notification.
 */
async function gentlePulse(): Promise<void> {
    if (Platform.OS === "android") {
        Vibration.vibrate(100);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Single tap — for minimal alerts (door slam).
 */
async function singleTap(): Promise<void> {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// ── Pattern registry ─────────────────────────────────────────────────────

const PATTERN_MAP: Record<string, () => Promise<void>> = {
    rapid_pulse_3x: rapidPulse3x,
    double_tap: doubleTap,
    quick_triple_tap: quickTripleTap,
    long_pulse: longPulse,
    gentle_pulse: gentlePulse,
    single_tap: singleTap,
};

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Trigger haptic feedback for a detection.
 * Respects a cooldown to prevent overwhelming the user.
 *
 * @param hapticPattern - Pattern name from the backend (e.g. "rapid_pulse_3x")
 * @param urgency      - Urgency level for fallback intensity
 */
export async function triggerHaptic(
    hapticPattern: string,
    urgency: string,
): Promise<void> {
    const now = Date.now();
    if (now - lastHapticTime < HAPTIC_COOLDOWN_MS) {
        return; // still in cooldown
    }
    lastHapticTime = now;

    const patternFn = PATTERN_MAP[hapticPattern];

    if (patternFn) {
        try {
            await patternFn();
            console.log(`[Haptic] Triggered: ${hapticPattern} (${urgency})`);
        } catch (err) {
            console.warn("[Haptic] Error:", err);
            // Fallback to basic notification
            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
            );
        }
    } else {
        // Unknown pattern — choose intensity by urgency
        console.log(`[Haptic] Unknown pattern "${hapticPattern}", using urgency fallback`);
        switch (urgency) {
            case "critical":
                await rapidPulse3x();
                break;
            case "high":
                await doubleTap();
                break;
            case "medium":
                await longPulse();
                break;
            default:
                await gentlePulse();
                break;
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
