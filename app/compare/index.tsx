import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { PRO_SWINGS, YOUTH_SWINGS, type SwingVideoInfo } from "../../src/lib/videos";
import {
  PHASES,
  PHASE_POSITIONS,
  PHASE_LABELS,
  frameForProgress,
  currentPhase,
  type Phase,
  type PhaseMarker,
} from "../../src/lib/swing-phases";

type Side = "pro" | "player";
type ProgressMarkers = Partial<Record<Phase, number>>;

const ACCENT = "#C8F000";
const TRACK_INSET = 18;
const THUMB_SIZE = 28;

const PHASE_COLORS: Record<Phase, string> = {
  stance: "#C8F000",
  load: "#62E6FF",
  launch: "#8D7CFF",
  turn: "#FFB84D",
  contact: "#FF5C7A",
  extension: "#42E891",
  finish: "#F7F8F8",
};

const EMPTY_MARKERS: ProgressMarkers = {};

function clamp(value: number) {
  "worklet";
  return Math.min(1, Math.max(0, value));
}

function progressToPhaseMarkers(
  markers: ProgressMarkers,
  video: SwingVideoInfo
): Record<Phase, PhaseMarker> | null {
  if (!PHASES.every((phase) => typeof markers[phase] === "number")) {
    return null;
  }

  return PHASES.reduce((phaseMarkers, phase) => {
    const progress = markers[phase] ?? 0;
    const frame = Math.round(progress * Math.max(1, video.totalFrames - 1));
    phaseMarkers[phase] = {
      frame,
      timeMs: (frame / video.fps) * 1000,
    };
    return phaseMarkers;
  }, {} as Record<Phase, PhaseMarker>);
}

function seekPlayer(video: SwingVideoInfo, player: ReturnType<typeof useVideoPlayer>, progress: number) {
  const seconds = (video.durationMs / 1000) * clamp(progress);
  player.currentTime = seconds;
}

export default function CompareScreen() {
  const [selectedProIndex, setSelectedProIndex] = useState(0);
  const [selectedYouthIndex, setSelectedYouthIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<Side>("player");
  const [locked, setLocked] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [proFlipped, setProFlipped] = useState(false);
  const [playerFlipped, setPlayerFlipped] = useState(false);
  const [proMarkers, setProMarkers] = useState<ProgressMarkers>(EMPTY_MARKERS);
  const [playerMarkers, setPlayerMarkers] = useState<ProgressMarkers>(EMPTY_MARKERS);
  const [proMarkedPhases, setProMarkedPhases] = useState<Set<Phase>>(() => new Set());
  const [playerMarkedPhases, setPlayerMarkedPhases] = useState<Set<Phase>>(() => new Set());
  const [trackWidth, setTrackWidth] = useState(1);

  const selectedPro = PRO_SWINGS[selectedProIndex];
  const selectedYouth = YOUTH_SWINGS[selectedYouthIndex];

  const progress = useSharedValue(0);
  const trackWidthValue = useSharedValue(1);

  const proPlayer = useVideoPlayer(selectedPro.src, (player) => {
    player.loop = false;
    player.muted = true;
    player.currentTime = 0;
  });

  const youthPlayer = useVideoPlayer(selectedYouth.src, (player) => {
    player.loop = false;
    player.muted = true;
    player.currentTime = 0;
  });

  const proPhaseMarkers = useMemo(
    () => progressToPhaseMarkers(proMarkers, selectedPro),
    [proMarkers, selectedPro]
  );
  const playerPhaseMarkers = useMemo(
    () => progressToPhaseMarkers(playerMarkers, selectedYouth),
    [playerMarkers, selectedYouth]
  );

  const canLock = proMarkedPhases.size === PHASES.length && playerMarkedPhases.size === PHASES.length;
  const scrubPhase = currentPhase(scrubProgress);
  const activeMarkedPhases = activeSide === "pro" ? proMarkedPhases : playerMarkedPhases;

  const seekUnlocked = useCallback(
    (nextProgress: number) => {
      const next = clamp(nextProgress);
      setScrubProgress(next);
      if (activeSide === "pro") {
        seekPlayer(selectedPro, proPlayer, next);
      } else {
        seekPlayer(selectedYouth, youthPlayer, next);
      }
    },
    [activeSide, proPlayer, selectedPro, selectedYouth, youthPlayer]
  );

  const seekLocked = useCallback(
    (nextProgress: number) => {
      if (!proPhaseMarkers || !playerPhaseMarkers) {
        return;
      }

      const next = clamp(nextProgress);
      const proFrame = frameForProgress(next, proPhaseMarkers, PHASE_POSITIONS);
      const playerFrame = frameForProgress(next, playerPhaseMarkers, PHASE_POSITIONS);
      setScrubProgress(next);
      proPlayer.currentTime = proFrame / selectedPro.fps;
      youthPlayer.currentTime = playerFrame / selectedYouth.fps;
    },
    [playerPhaseMarkers, proPhaseMarkers, proPlayer, selectedPro.fps, selectedYouth.fps, youthPlayer]
  );

  const seekToProgress = useCallback(
    (nextProgress: number) => {
      if (locked) {
        seekLocked(nextProgress);
        return;
      }
      seekUnlocked(nextProgress);
    },
    [locked, seekLocked, seekUnlocked]
  );

  useEffect(() => {
    progress.value = 0;
    setScrubProgress(0);
    proPlayer.currentTime = 0;
  }, [progress, proPlayer, selectedPro.id]);

  useEffect(() => {
    progress.value = 0;
    setScrubProgress(0);
    youthPlayer.currentTime = 0;
  }, [progress, selectedYouth.id, youthPlayer]);

  useEffect(() => {
    trackWidthValue.value = trackWidth;
  }, [trackWidth, trackWidthValue]);

  const markPhase = useCallback(
    (phase: Phase) => {
      if (locked) {
        return;
      }

      const nextProgress = scrubProgress;
      if (activeSide === "pro") {
        setProMarkers((previous) => ({ ...previous, [phase]: nextProgress }));
        setProMarkedPhases((previous) => new Set(previous).add(phase));
        return;
      }

      setPlayerMarkers((previous) => ({ ...previous, [phase]: nextProgress }));
      setPlayerMarkedPhases((previous) => new Set(previous).add(phase));
    },
    [activeSide, locked, scrubProgress]
  );

  const toggleLock = useCallback(() => {
    if (!locked && !canLock) {
      return;
    }

    const nextLocked = !locked;
    setLocked(nextLocked);
    if (!nextLocked) {
      return;
    }
    seekLocked(scrubProgress);
  }, [canLock, locked, scrubProgress, seekLocked]);

  const scrubGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((event) => {
          const next = clamp((event.x - TRACK_INSET) / Math.max(1, trackWidthValue.value - TRACK_INSET * 2));
          progress.value = next;
          runOnJS(seekToProgress)(next);
        })
        .onUpdate((event) => {
          const next = clamp((event.x - TRACK_INSET) / Math.max(1, trackWidthValue.value - TRACK_INSET * 2));
          progress.value = next;
          runOnJS(seekToProgress)(next);
        }),
    [progress, seekToProgress, trackWidthValue]
  );

  const thumbStyle = useAnimatedStyle(() => {
    const usableWidth = Math.max(1, trackWidthValue.value - TRACK_INSET * 2);
    return {
      transform: [{ translateX: TRACK_INSET + usableWidth * progress.value - THUMB_SIZE / 2 }],
    };
  });

  const floatingLabelStyle = useAnimatedStyle(() => {
    const usableWidth = Math.max(1, trackWidthValue.value - TRACK_INSET * 2);
    return {
      transform: [{ translateX: TRACK_INSET + usableWidth * progress.value - 42 }],
    };
  });

  const fillStyle = useAnimatedStyle(() => ({
    width: TRACK_INSET + Math.max(1, trackWidthValue.value - TRACK_INSET * 2) * progress.value,
  }));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            Swing<Text style={styles.logoDim}>Lab</Text>
          </Text>
          <Text style={styles.subtitle}>{locked ? "Phase sync locked" : `Marking ${activeSide === "pro" ? "pro" : "player"} phases`}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleLock}
          disabled={!locked && !canLock}
          style={[styles.lockButton, locked && styles.lockButtonActive, !locked && !canLock && styles.lockButtonDisabled]}
        >
          <Text style={[styles.lockButtonText, locked && styles.lockButtonTextActive]}>
            {locked ? "Unlock" : "Lock Sync"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.videoStack}>
        <VideoPanel
          active={!locked && activeSide === "pro"}
          flipped={proFlipped}
          markedCount={proMarkedPhases.size}
          onFlip={() => setProFlipped((value) => !value)}
          onPress={() => !locked && setActiveSide("pro")}
          onSelectVideo={setSelectedProIndex}
          player={proPlayer}
          selectedIndex={selectedProIndex}
          sideLabel="PRO"
          video={selectedPro}
          videos={PRO_SWINGS}
        />

        <VideoPanel
          active={!locked && activeSide === "player"}
          flipped={playerFlipped}
          markedCount={playerMarkedPhases.size}
          onFlip={() => setPlayerFlipped((value) => !value)}
          onPress={() => !locked && setActiveSide("player")}
          onSelectVideo={setSelectedYouthIndex}
          player={youthPlayer}
          selectedIndex={selectedYouthIndex}
          sideLabel="PLAYER"
          video={selectedYouth}
          videos={YOUTH_SWINGS}
        />
      </View>

      <View style={styles.controls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.phaseStrip}
        >
          {PHASES.map((phase) => {
            const marked = activeMarkedPhases.has(phase);
            return (
              <TouchableOpacity
                key={phase}
                activeOpacity={0.82}
                onPress={() => markPhase(phase)}
                disabled={locked}
                style={[
                  styles.phasePill,
                  { borderColor: PHASE_COLORS[phase] },
                  marked && { backgroundColor: PHASE_COLORS[phase] },
                  locked && styles.phasePillDisabled,
                ]}
              >
                <Text style={[styles.phasePillText, marked && styles.phasePillTextMarked]}>
                  {PHASE_LABELS[phase]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <GestureDetector gesture={scrubGesture}>
          <Animated.View
            style={styles.scrubberHitbox}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <Animated.View style={[styles.phaseFloatingLabel, floatingLabelStyle]}>
              <Text style={styles.phaseFloatingText}>{PHASE_LABELS[scrubPhase]}</Text>
            </Animated.View>

            <View style={styles.track}>
              <Animated.View style={[styles.trackFill, fillStyle]} />
              {PHASES.map((phase) => (
                <View
                  key={phase}
                  pointerEvents="none"
                  style={[
                    styles.phaseTick,
                    {
                      left: `${PHASE_POSITIONS[phase] * 100}%`,
                      backgroundColor: PHASE_COLORS[phase],
                    },
                  ]}
                />
              ))}
            </View>

            <Animated.View style={[styles.thumb, thumbStyle]} />
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

function VideoPanel({
  active,
  flipped,
  markedCount,
  onFlip,
  onPress,
  onSelectVideo,
  player,
  selectedIndex,
  sideLabel,
  video,
  videos,
}: {
  active: boolean;
  flipped: boolean;
  markedCount: number;
  onFlip: () => void;
  onPress: () => void;
  onSelectVideo: (index: number) => void;
  player: ReturnType<typeof useVideoPlayer>;
  selectedIndex: number;
  sideLabel: string;
  video: SwingVideoInfo;
  videos: SwingVideoInfo[];
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={[styles.videoPanel, active && styles.videoPanelActive]}
    >
      <View style={[styles.videoMirrorLayer, flipped && styles.videoFlipped]}>
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="cover"
          allowsFullscreen={false}
          surfaceType="textureView"
          style={styles.video}
        />
      </View>

      <View style={styles.topOverlay}>
        <View style={styles.glassBadge}>
          <Text style={styles.badgeKicker}>{sideLabel}</Text>
          <Text style={styles.badgeTitle} numberOfLines={1}>{video.label}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>{video.handedness}H</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={onFlip} style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomOverlay}>
        <Text style={styles.markerCount}>{markedCount}/7 phases</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.videoSelector}
        >
          {videos.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.82}
              onPress={() => onSelectVideo(index)}
              style={[styles.videoChoice, selectedIndex === index && styles.videoChoiceActive]}
            >
              <Text
                style={[styles.videoChoiceText, selectedIndex === index && styles.videoChoiceTextActive]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#08090a",
    paddingTop: 54,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  logo: {
    color: ACCENT,
    fontSize: 25,
    fontStyle: "italic",
    fontWeight: "800",
  },
  logoDim: {
    color: "rgba(247,248,248,0.42)",
    fontWeight: "300",
  },
  subtitle: {
    color: "rgba(247,248,248,0.58)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  lockButton: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 999,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  lockButtonActive: {
    backgroundColor: "#f7f8f8",
  },
  lockButtonDisabled: {
    backgroundColor: "rgba(247,248,248,0.12)",
  },
  lockButtonText: {
    color: "#08090a",
    fontSize: 13,
    fontWeight: "800",
  },
  lockButtonTextActive: {
    color: "#08090a",
  },
  videoStack: {
    flex: 1,
    gap: 10,
    paddingHorizontal: 10,
  },
  videoPanel: {
    backgroundColor: "#111315",
    borderColor: "rgba(247,248,248,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
  },
  videoPanelActive: {
    borderColor: ACCENT,
  },
  videoMirrorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  videoFlipped: {
    transform: [{ scaleX: -1 }],
  },
  video: {
    height: "100%",
    width: "100%",
  },
  topOverlay: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 12,
    position: "absolute",
    right: 12,
    top: 12,
  },
  glassBadge: {
    backgroundColor: "rgba(8,9,10,0.54)",
    borderColor: "rgba(247,248,248,0.18)",
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: "62%",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  badgeKicker: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
  },
  badgeTitle: {
    color: "#f7f8f8",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: "rgba(8,9,10,0.58)",
    borderColor: "rgba(247,248,248,0.18)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 48,
    paddingHorizontal: 10,
  },
  iconBadgeText: {
    color: "#f7f8f8",
    fontSize: 12,
    fontWeight: "800",
  },
  bottomOverlay: {
    bottom: 10,
    left: 12,
    position: "absolute",
    right: 12,
  },
  markerCount: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(8,9,10,0.58)",
    borderColor: "rgba(247,248,248,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    color: "rgba(247,248,248,0.86)",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  videoSelector: {
    gap: 7,
    paddingRight: 12,
  },
  videoChoice: {
    backgroundColor: "rgba(8,9,10,0.58)",
    borderColor: "rgba(247,248,248,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 150,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  videoChoiceActive: {
    backgroundColor: "rgba(200,240,0,0.94)",
    borderColor: ACCENT,
  },
  videoChoiceText: {
    color: "rgba(247,248,248,0.82)",
    fontSize: 12,
    fontWeight: "700",
  },
  videoChoiceTextActive: {
    color: "#08090a",
  },
  controls: {
    paddingBottom: 26,
    paddingTop: 12,
  },
  phaseStrip: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  phasePill: {
    alignItems: "center",
    backgroundColor: "rgba(247,248,248,0.06)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  phasePillDisabled: {
    opacity: 0.72,
  },
  phasePillText: {
    color: "#f7f8f8",
    fontSize: 13,
    fontWeight: "800",
  },
  phasePillTextMarked: {
    color: "#08090a",
  },
  scrubberHitbox: {
    height: 70,
    justifyContent: "center",
    marginHorizontal: 14,
    marginTop: 6,
  },
  phaseFloatingLabel: {
    alignItems: "center",
    backgroundColor: "rgba(247,248,248,0.92)",
    borderRadius: 999,
    bottom: 50,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 84,
    paddingHorizontal: 10,
    position: "absolute",
  },
  phaseFloatingText: {
    color: "#08090a",
    fontSize: 12,
    fontWeight: "900",
  },
  track: {
    backgroundColor: "rgba(247,248,248,0.12)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  trackFill: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  phaseTick: {
    borderRadius: 999,
    height: 18,
    marginLeft: -2,
    marginTop: -5,
    position: "absolute",
    width: 4,
  },
  thumb: {
    backgroundColor: "#f7f8f8",
    borderColor: ACCENT,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 5,
    height: THUMB_SIZE,
    left: 0,
    position: "absolute",
    top: 21,
    width: THUMB_SIZE,
  },
});
