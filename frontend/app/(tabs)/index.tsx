import { StyleSheet, View } from "react-native";
import { PageContainer } from "@/components/page-container";
import StatusIndicator from "@/components/ui/StatusIndicator";
import PermissionGate from "@/components/ui/PermissionGate";
import Button from "@/components/ui/Button";
import { useAudioCapture } from "@/hooks/useAudioCapture";

export default function HomeScreen() {
  const {
    hasPermission,
    isCapturing,
    startCapture,
    stopCapture,
    chunkCount,
  } = useAudioCapture();

  const indicatorState = isCapturing
    ? "active"
    : hasPermission
      ? "idle"
      : "error";

  const statusLabel =
    hasPermission === null
      ? "Requesting mic access…"
      : !hasPermission
        ? "⚠️ Microphone permission denied"
        : isCapturing
          ? "Listening…"
          : "Ready";

  return (
    <PageContainer>
      <View style={styles.content}>
        <StatusIndicator
          state={indicatorState}
          label={statusLabel}
          subtitle={isCapturing ? `Chunks captured: ${chunkCount}` : undefined}
        />

        <PermissionGate
          status={hasPermission}
          deniedMessage="Please enable microphone access in your device settings."
          pendingMessage="Requesting mic access…"
        >
          <Button
            variant={isCapturing ? "secondary" : "primary"}
            size="large"
            onPress={isCapturing ? stopCapture : startCapture}
          >
            {isCapturing ? "Stop Listening" : "Start Listening"}
          </Button>
        </PermissionGate>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
});
