import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedDetection } from "@/contexts/SoundDetectionContext";
import type { Detection } from "@/src/services/websocket.service";

// ── Emoji & color maps ───────────────────────────────────────────────────

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

export default function ProfileScreen() {
  const { recentDetections, isListening } = useSharedDetection();

  const renderDetection = ({ item, index }: { item: Detection; index: number }) => {
    const icon = SOUND_ICONS[item.sound_type] ?? "🔊";
    const color = URGENCY_COLORS[item.urgency] ?? "#555";
    const label = item.sound_type.replace(/_/g, " ");

    return (
      <View style={styles.detectionRow}>
        <Text style={styles.detectionIndex}>{index + 1}</Text>
        <Text style={styles.detectionIcon}>{icon}</Text>
        <View style={styles.detectionInfo}>
          <Text style={[styles.detectionLabel, { color }]}>{label}</Text>
          <Text style={styles.detectionMeta}>
            {(item.confidence * 100).toFixed(0)}% · {item.urgency}
          </Text>
        </View>
        <View
          style={[
            styles.urgencyDot,
            { backgroundColor: color },
          ]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Detection History</Text>
          <Text style={styles.subtitle}>
            {isListening ? "🟢 Live" : "⚪ Idle"} ·{" "}
            {recentDetections.length} alert{recentDetections.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Detection list */}
        {recentDetections.length > 0 ? (
          <FlatList
            data={recentDetections}
            renderItem={renderDetection}
            keyExtractor={(_, idx) => idx.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No detections yet</Text>
            <Text style={styles.emptySubtext}>
              Start listening on the Home tab to detect sounds
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  detectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  detectionIndex: {
    width: 24,
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  detectionIcon: {
    fontSize: 28,
    marginHorizontal: 12,
  },
  detectionInfo: {
    flex: 1,
  },
  detectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detectionMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
