// Video metadata for React Native — asset paths use require()

export interface SwingVideoInfo {
  id: string;
  label: string;
  src: number; // require() returns a number in RN
  fps: number;
  durationMs: number;
  width: number;
  height: number;
  handedness: "R" | "L";
  isPro: boolean;
  totalFrames: number;
  defaultPhaseFrames: Record<string, number>;
}

export const PRO_SWINGS: SwingVideoInfo[] = [
  {
    id: "jacjson-holiday",
    label: "Jaclson Holiday",
    src: require("../../assets/pro-swings/Jaclson Holiday.mp4"),
    fps: 30,
    durationMs: 38220,
    width: 800,
    height: 800,
    handedness: "L",
    isPro: true,
    totalFrames: 1147,
    defaultPhaseFrames: {
      stance: 420, load: 500, launch: 560, turn: 620,
      contact: 680, extension: 730, finish: 800,
    },
  },
  {
    id: "pro-79cd",
    label: "Pro Swing 02",
    src: require("../../assets/pro-swings/optimized_79cd08c2-f901-47b4-9e80-fc8296fc601b_optimized.mp4"),
    fps: 120,
    durationMs: 33600,
    width: 1080,
    height: 1080,
    handedness: "R",
    isPro: true,
    totalFrames: 4032,
    defaultPhaseFrames: {
      stance: 400, load: 500, launch: 580, turn: 650,
      contact: 720, extension: 780, finish: 850,
    },
  },
  {
    id: "pro-8f95",
    label: "Pro Swing 03",
    src: require("../../assets/pro-swings/optimized_8f95d8a1-1d19-4387-ba30-1df57b81c259_optimized.mp4"),
    fps: 120,
    durationMs: 36660,
    width: 1080,
    height: 1080,
    handedness: "R",
    isPro: true,
    totalFrames: 4400,
    defaultPhaseFrames: {
      stance: 400, load: 500, launch: 580, turn: 650,
      contact: 720, extension: 780, finish: 850,
    },
  },
];

export const YOUTH_SWINGS: SwingVideoInfo[] = [
  {
    id: "youth-nov2023",
    label: "Youth Swing Nov 2023",
    src: require("../../assets/youth-swings/youth-nov2023.mp4"),
    fps: 30,
    durationMs: 13610,
    width: 760,
    height: 780,
    handedness: "R",
    isPro: false,
    totalFrames: 408,
    defaultPhaseFrames: {
      stance: 60, load: 100, launch: 140, turn: 180,
      contact: 220, extension: 260, finish: 310,
    },
  },
  {
    id: "youth-jul2024",
    label: "Youth Swing Jul 2024",
    src: require("../../assets/youth-swings/20240721_101054.mp4"),
    fps: 30,
    durationMs: 8960,
    width: 1440,
    height: 1440,
    handedness: "L",
    isPro: false,
    totalFrames: 269,
    defaultPhaseFrames: {
      stance: 50, load: 80, launch: 110, turn: 140,
      contact: 170, extension: 200, finish: 240,
    },
  },
  {
    id: "youth-opt",
    label: "Youth Swing (Opt)",
    src: require("../../assets/youth-swings/optimized_38a9bdbd-6417-4d00-b133-fe33a7668b25_optimized.mp4"),
    fps: 120,
    durationMs: 2590,
    width: 1080,
    height: 1080,
    handedness: "R",
    isPro: false,
    totalFrames: 311,
    defaultPhaseFrames: {
      stance: 10, load: 35, launch: 60, turn: 85,
      contact: 110, extension: 130, finish: 160,
    },
  },
];

export function getProSwing(id: string): SwingVideoInfo | undefined {
  return PRO_SWINGS.find((s) => s.id === id);
}

export function getYouthSwing(id: string): SwingVideoInfo | undefined {
  return YOUTH_SWINGS.find((s) => s.id === id);
}
