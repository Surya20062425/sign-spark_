export type NodeType = 'learn' | 'challenge' | 'branch' | 'boss' | 'rest';

export type GameScreen = 
  | 'map' 
  | 'prompt' 
  | 'detecting' 
  | 'matched' 
  | 'star_reveal' 
  | 'boss_mode' 
  | 'rest_stop' 
  | 'watch_tap';

export interface FingerConfig {
  thumb: number;   // 0: curled/closed, 1: extended/open, 2: across/pinched
  index: number;   // 0: curled, 1: extended, 2: hooked
  middle: number;  // 0: curled, 1: extended, 2: crossed
  ring: number;    // 0: curled, 1: extended
  pinky: number;   // 0: curled, 1: extended
}

export interface MotionConfig {
  type: 'trace_j' | 'trace_z' | 'wave_hello' | 'nod_yes' | 'snap_no' | 'circle_please' | 'chin_forward';
  minDurationMs?: number;
}

export interface SignDefinition {
  id: string;
  label: string;
  aslLetterOrWord: string;
  region: number;
  node: number;
  isStatic: boolean;
  dominantHand: 'right' | 'left' | 'either';
  description: string;
  instruction: string;
  tip: string;
  fingerConfig: FingerConfig;
  palmOrientation?: 'forward' | 'inward' | 'left' | 'right' | 'up' | 'down';
  motion?: MotionConfig;
  tolerance: number; // 0.65 to 0.85
  demoSvgType?: string;
  choices?: string[]; // For Watch & Tap mode
}

export interface RegionInfo {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  startNode: number;
  endNode: number;
  colorAccent: string;
  bgGradient: string;
  description: string;
}

export interface MapNode {
  id: number;
  regionId: number;
  type: NodeType;
  title: string;
  subtitle?: string;
  signIds: string[];
  x: number; // percentage (15% to 85%)
  y: number; // vertical pixel offset on the canvas
  parents?: number[]; // IDs of prerequisite parent nodes (unlocked if any parent completed)
  children?: number[]; // IDs of downstream next nodes
  branchType?: 'main' | 'branch_left' | 'branch_right' | 'converge';
  branchLabel?: string;
  shortcutTo?: number;
  requiredStarsForShortcut?: number;
}

export interface NodeProgress {
  stars: number; // 0 to 3
  attempts: number;
  bestConfidence: number;
  completedAt?: string;
}

export interface SaveData {
  version: number;
  nodes: Record<number, NodeProgress>;
  totalStars: number;
  currentStreak: number;
  bestStreak: number;
  shortcutsUnlocked: number[];
  soundEnabled: boolean;
  lastPlayed: string;
  unlockedRegion: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface RecognitionResult {
  matched: boolean;
  confidence: number;
  feedback: 'match' | 'close' | 'try_again' | 'no_hand';
  details: string;
  landmarks?: HandLandmark[];
  detectedSignId?: string;
  fingerStates?: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
}

export interface UserProfile {
  id: string;
  email?: string;
  isGuest: boolean;
  name?: string;
}
