import { FlatList, StyleSheet, Text, View } from "react-native";
import { PageContainer } from "@/components/page-container";
import StatusIndicator from "@/components/ui/StatusIndicator";
import PermissionGate from "@/components/ui/PermissionGate";
import Button from "@/components/ui/Button";
import { useSoundDetection } from "@/hooks/useSoundDetection";
import type { Detection } from "@/src/services/websocket.service";

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
    recentDetections,
    chunksSent,
    startListening,
    stopListening,
  } = useSoundDetection(); // real YAMNet classification

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

  // ── Render a single detection row ────────────────────────────────

  const renderDetection = ({ item }: { item: Detection }) => {
    const icon = SOUND_ICONS[item.sound_type] ?? "🔊";
    const color = URGENCY_COLORS[item.urgency] ?? "#555";
    const label = item.sound_type.replace(/_/g, " ");

    return (
      <View style={styles.detectionRow}>
        <Text style={styles.detectionIcon}>{icon}</Text>
        <View style={styles.detectionInfo}>
          <Text style={[styles.detectionLabel, { color }]}>{label}</Text>
          <Text style={styles.detectionMeta}>
            {(item.confidence * 100).toFixed(0)}% · {item.urgency}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <PageContainer>
      <View style={styles.content}>
        {/* Status */}
        <StatusIndicator
          state={indicatorState}
          label={statusLabel}
          subtitle={subtitle}
        />

        {/* Last detected sound */}
        {lastDetection && (
          <View style={styles.lastDetection}>
            <Text style={styles.lastDetectionIcon}>
              {SOUND_ICONS[lastDetection.sound_type] ?? "🔊"}
            </Text>
            <Text style={[
              styles.lastDetectionLabel,
              { color: URGENCY_COLORS[lastDetection.urgency] ?? "#fff" },
            ]}>
              {lastDetection.sound_type.replace(/_/g, " ")}
            </Text>
            <Text style={styles.lastDetectionConfidence}>
              {(lastDetection.confidence * 100).toFixed(0)}% confidence
            </Text>
          </View>
        )}

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

        {/* Recent alerts log */}
        {recentDetections.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recent Alerts</Text>
            <FlatList
              data={recentDetections}
              renderItem={renderDetection}
              keyExtractor={(_, idx) => idx.toString()}
              style={styles.recentList}
              scrollEnabled={true}
            />
          </View>
        )}
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
  lastDetection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  lastDetectionIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  lastDetectionLabel: {
    fontSize: 22,
    fontWeight: "700",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  lastDetectionConfidence: {
    fontSize: 14,
    color: "#999",
  },
  recentContainer: {
    width: "100%",
    paddingHorizontal: 20,
    maxHeight: 200,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ccc",
    marginBottom: 8,
  },
  recentList: {
    flexGrow: 0,
  },
  detectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  detectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  detectionInfo: {
    flex: 1,
  },
  detectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detectionMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});
