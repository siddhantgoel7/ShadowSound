import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { PageContainer } from "@/components/page-container";
import StatusIndicator from "@/components/ui/StatusIndicator";
import PermissionGate from "@/components/ui/PermissionGate";
import Button from "@/components/ui/Button";
import AlertFlash from "@/components/ui/AlertFlash";
import { useSharedDetection } from "@/contexts/SoundDetectionContext";
import { triggerHaptic } from "@/services/haptic.service";

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

// ── Mock scenarios for demo ──────────────────────────────────────────────

const DEMO_SCENARIOS = [
  {
    label: "🚨 Siren",
    sound_type: "emergency_siren",
    confidence: 0.97,
    urgency: "critical",
    haptic_pattern: "rapid_pulse_3x",
  },
  {
    label: "🚗 Car Horn",
    sound_type: "horn",
    confidence: 0.91,
    urgency: "high",
    haptic_pattern: "double_tap",
  },
  {
    label: "🗣️ Shouting",
    sound_type: "shouting",
    confidence: 0.88,
    urgency: "medium",
    haptic_pattern: "long_pulse",
  },
  {
    label: "🐕 Dog",
    sound_type: "dog_barking",
    confidence: 0.85,
    urgency: "low",
    haptic_pattern: "gentle_pulse",
  },
  {
    label: "💥 Glass",
    sound_type: "glass_breaking",
    confidence: 0.93,
    urgency: "critical",
    haptic_pattern: "rapid_pulse_3x",
  },
];

export default function HomeScreen() {
  const {
    hasPermission,
    isListening,
    isConnected,
    lastDetection,
    chunksSent,
    startListening,
    stopListening,
    injectMockDetection,
  } = useSharedDetection();

  // Flash state
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [flashUrgency, setFlashUrgency] = useState<string | null>(null);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Demo panel animation
  const demoPanelAnim = useRef(new Animated.Value(0)).current;

  const toggleDemoPanel = () => {
    const toValue = showDemoPanel ? 0 : 1;
    setShowDemoPanel(!showDemoPanel);
    Animated.spring(demoPanelAnim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const fireDemo = (scenario: typeof DEMO_SCENARIOS[0]) => {
    // Flash the screen
    setFlashUrgency(scenario.urgency);
    setFlashTrigger((n) => n + 1);

    // Trigger haptics
    triggerHaptic(scenario.haptic_pattern, scenario.urgency);

    // Inject into the detection context
    injectMockDetection({
      sound_type: scenario.sound_type,
      confidence: scenario.confidence,
      urgency: scenario.urgency,
      haptic_pattern: scenario.haptic_pattern,
    });
  };

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

  // Flash on real detections too
  const prevDetectionRef = useRef<typeof lastDetection>(null);
  if (lastDetection && lastDetection !== prevDetectionRef.current) {
    prevDetectionRef.current = lastDetection;
    if (lastDetection.urgency !== "none" && lastDetection.urgency !== "low") {
      setFlashUrgency(lastDetection.urgency);
      setFlashTrigger((n) => n + 1);
    }
  }

  const demoPanelTranslate = demoPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });
  const demoPanelOpacity = demoPanelAnim;

  return (
    <PageContainer>
      {/* Full-screen alert flash overlay */}
      <AlertFlash urgency={flashUrgency} trigger={flashTrigger} />

      <View style={styles.content}>
        {/* Status */}
        <StatusIndicator
          state={indicatorState}
          label={statusLabel}
          subtitle={subtitle}
        />

        {/* Last detected sound */}
        {lastDetection ? (
          <View
            style={[
              styles.detectionCard,
              { borderColor: URGENCY_COLORS[lastDetection.urgency] ?? "#333" },
            ]}
          >
            <Text style={styles.detectionIcon}>
              {SOUND_ICONS[lastDetection.sound_type] ?? "🔊"}
            </Text>
            <Text
              style={[
                styles.detectionLabel,
                { color: URGENCY_COLORS[lastDetection.urgency] ?? "#fff" },
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
                { backgroundColor: URGENCY_COLORS[lastDetection.urgency] ?? "#555" },
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
            <Text style={styles.waitingText}>Listening for sounds…</Text>
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

        {/* Demo mode trigger — triple tap the subtitle area */}
        <Pressable onPress={toggleDemoPanel} style={styles.demoTrigger}>
          <Text style={styles.demoTriggerText}>
            {showDemoPanel ? "▼ Hide Demo" : "⚡ Demo Mode"}
          </Text>
        </Pressable>
      </View>

      {/* Sliding demo panel */}
      {showDemoPanel && (
        <Animated.View
          style={[
            styles.demoPanel,
            {
              opacity: demoPanelOpacity,
              transform: [{ translateY: demoPanelTranslate }],
            },
          ]}
        >
          <Text style={styles.demoPanelTitle}>Fire a demo alert</Text>
          <View style={styles.demoGrid}>
            {DEMO_SCENARIOS.map((scenario) => (
              <Pressable
                key={scenario.sound_type}
                style={[
                  styles.demoChip,
                  { borderColor: URGENCY_COLORS[scenario.urgency] },
                ]}
                onPress={() => fireDemo(scenario)}
              >
                <Text style={styles.demoChipText}>{scenario.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
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
  demoTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  demoTriggerText: {
    color: "#444",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  demoPanel: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    padding: 20,
  },
  demoPanelTitle: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
    textAlign: "center",
  },
  demoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  demoChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  demoChipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});