import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

const ACCENT = "#C8F000";
const MAX_RECORDING_SECONDS = 8;

export default function CaptureScreen() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewfinderSize, setViewfinderSize] = useState({ width: 0, height: 0 });
  const recordingStartedAt = useRef<number | null>(null);
  const hasNavigatedAfterCapture = useRef(false);
  const reticleSize = Math.max(
    0,
    Math.min(viewfinderSize.width - 48, viewfinderSize.height * 0.58, 430)
  );

  const finishRecording = useCallback(() => {
    if (hasNavigatedAfterCapture.current) {
      return;
    }

    hasNavigatedAfterCapture.current = true;
    setIsRecording(false);
    setElapsedSeconds(MAX_RECORDING_SECONDS);
    router.push("/compare");
  }, [router]);

  const startRecording = useCallback(() => {
    hasNavigatedAfterCapture.current = false;
    recordingStartedAt.current = Date.now();
    setElapsedSeconds(0);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }

    finishRecording();
  }, [finishRecording, isRecording]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const timer = setInterval(() => {
      if (!recordingStartedAt.current) {
        return;
      }

      const nextElapsed = (Date.now() - recordingStartedAt.current) / 1000;
      if (nextElapsed >= MAX_RECORDING_SECONDS) {
        setElapsedSeconds(MAX_RECORDING_SECONDS);
        finishRecording();
        return;
      }

      setElapsedSeconds(nextElapsed);
    }, 100);

    return () => clearInterval(timer);
  }, [finishRecording, isRecording]);

  return (
    <View style={styles.screen}>
      <View
        style={styles.viewfinder}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setViewfinderSize({ width, height });
        }}
      >
        <View style={styles.topInstruction}>
          <Text style={styles.instructionText}>Center hitter inside frame</Text>
        </View>

        {isRecording && (
          <View style={styles.timer}>
            <View style={styles.recordingDot} />
            <Text style={styles.timerText}>
              {Math.min(elapsedSeconds, MAX_RECORDING_SECONDS).toFixed(1)}s
            </Text>
          </View>
        )}

        <View style={styles.reticleLayer} pointerEvents="none">
          <View style={styles.dimTop} />
          <View style={[styles.middleDimRow, { height: reticleSize }]}>
            <View style={styles.dimSide} />
            <View style={[styles.reticle, { width: reticleSize, height: reticleSize }]}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.dimSide} />
          </View>
          <View style={styles.dimBottom} />
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.recordButton, isRecording && styles.stopButton]}
        >
          {isRecording ? <View style={styles.stopIcon} /> : <View style={styles.recordCore} />}
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#08090a",
  },
  viewfinder: {
    flex: 1,
    backgroundColor: "#111417",
    overflow: "hidden",
  },
  topInstruction: {
    position: "absolute",
    top: 72,
    left: 24,
    right: 24,
    zIndex: 4,
    alignItems: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  timer: {
    position: "absolute",
    top: 62,
    right: 22,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF2F3D",
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    minWidth: 34,
    textAlign: "right",
  },
  reticleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dimTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  middleDimRow: {
    flexDirection: "row",
  },
  dimSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  dimBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  reticle: {
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: ACCENT,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  controls: {
    minHeight: 152,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34,
    backgroundColor: "#08090a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secondaryButton: {
    width: 84,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  recordButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FF2F3D",
    borderWidth: 5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.32)",
  },
  recordCore: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FF2F3D",
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
});
