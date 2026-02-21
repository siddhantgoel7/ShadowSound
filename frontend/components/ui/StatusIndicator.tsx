import { StyleSheet, Text, View } from "react-native";

type StatusIndicatorState = "active" | "idle" | "error";

interface StatusIndicatorProps {
    /** Current state controls the dot color */
    state: StatusIndicatorState;
    /** Text shown below the dot */
    label: string;
    /** Optional secondary text below the label */
    subtitle?: string;
}

const DOT_COLORS: Record<StatusIndicatorState, string> = {
    active: "#00FF88",
    idle: "#555",
    error: "#FF4444",
};

/**
 * A pulsing status dot with label text.
 * Used to show system states like "Listening…", "Ready", or permission errors.
 */
export default function StatusIndicator({
    state,
    label,
    subtitle,
}: StatusIndicatorProps) {
    return (
        <View style={styles.container}>
            <View
                style={[styles.dot, { backgroundColor: DOT_COLORS[state] }]}
            />
            <Text style={styles.label}>{label}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginBottom: 16,
    },
    label: {
        fontSize: 22,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },
});
