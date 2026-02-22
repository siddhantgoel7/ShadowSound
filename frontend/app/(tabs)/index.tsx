import { StyleSheet, Text, View } from "react-native";
import { PageContainer } from "@/components/page-container";
import StatusIndicator from "@/components/ui/StatusIndicator";
import PermissionGate from "@/components/ui/PermissionGate";
import Button from "@/components/ui/Button";
import { useSharedDetection } from "@/contexts/SoundDetectionContext";

// ── Emoji map for sound types ────────────────────────────────────────────

const SOUND_ICONS: Record<string, string> = {
  emergency_siren: "🚨",
  horn: "📯",
  shouting: "🗣️",
  dog_barking: "🐕",
  alarm: "🔔",
  vehicle_approaching: "🚗",
  bicycle_bell: "🔔",
  tire_screech: "⚠️",
  footsteps_running: "👟",
  glass_breaking: "💥",
  car_alarm: "🚨",
  construction_noise: "🔨",
  door_slam: "🚪",
  train: "🚂",
  aircraft: "✈️",
};

const URGENCY_COLORS: Record<string, string> = {
  critical: "#FF4444",
  high: "#FF8800",
  medium: "#FFCC00",
  low: "#88CC44",
  none: "#555",
};

export default function HomeScreen() {
  const {
    hasPermission,
    isListening,
    isConnected,
    lastDetection,
    chunksSent,
    startListening,
    stopListening,
  } = useSharedDetection();

  // ── Status indicator state ───────────────────────────────────────

  const indicatorState = isListening
    ? "active"
    : hasPermission
      ? "idle"
      : "error";

  const statusLabel =
    hasPermission === null
      ? "Requesting mic access…"
      : !hasPermission
        ? "⚠️ Microphone permission denied"
        : isListening
          ? "Listening…"
          : "Ready";

  const subtitle = isListening
    ? `${isConnected ? "🟢 Connected" : "🔴 Connecting…"} · Chunks: ${chunksSent}`
    : undefined;

  return (
    <PageContainer>
      <View style={styles.content}>
        {/* Status */}
        <StatusIndicator
          state={indicatorState}
          label={statusLabel}
          subtitle={subtitle}
        />

        {/* Last detected sound — single large card */}
        {lastDetection ? (
          <View
            style={[
              styles.detectionCard,
              {
                borderColor:
                  URGENCY_COLORS[lastDetection.urgency] ?? "#333",
              },
            ]}
          >
            <Text style={styles.detectionIcon}>
              {SOUND_ICONS[lastDetection.sound_type] ?? "🔊"}
            </Text>
            <Text
              style={[
                styles.detectionLabel,
                {
                  color:
                    URGENCY_COLORS[lastDetection.urgency] ?? "#fff",
                },
              ]}
            >
              {lastDetection.sound_type.replace(/_/g, " ")}
            </Text>
            <Text style={styles.detectionConfidence}>
              {(lastDetection.confidence * 100).toFixed(0)}% confidence
            </Text>
            <View
              style={[
                styles.urgencyBadge,
                {
                  backgroundColor:
                    URGENCY_COLORS[lastDetection.urgency] ?? "#555",
                },
              ]}
            >
              <Text style={styles.urgencyText}>
                {lastDetection.urgency?.toUpperCase()}
              </Text>
            </View>
          </View>
        ) : isListening ? (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingIcon}>👂</Text>
            <Text style={styles.waitingText}>
              Listening for sounds…
            </Text>
          </View>
        ) : null}

        {/* Start / Stop button */}
        <PermissionGate
          status={hasPermission}
          deniedMessage="Please enable microphone access in your device settings."
          pendingMessage="Requesting mic access…"
        >
          <Button
            variant={isListening ? "secondary" : "primary"}
            size="large"
            onPress={isListening ? stopListening : startListening}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
        </PermissionGate>
      </View>
    </PageContainer>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingVertical: 32,
  },
  detectionCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.05)",
    width: "85%",
  },
  detectionIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  detectionLabel: {
    fontSize: 24,
    fontWeight: "700",
    textTransform: "capitalize",
    marginBottom: 6,
    textAlign: "center",
  },
  detectionConfidence: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
  waitingCard: {
    alignItems: "center",
    paddingVertical: 32,
    opacity: 0.6,
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 16,
    color: "#888",
  },
});
