export enum AgentMode {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  SEARCHING = 'SEARCHING',
  SPEAKING = 'SPEAKING',
}

export interface AgentState {
  mode: AgentMode;
  isConnected: boolean;
  error: string | null;
}

export interface AudioLevels {
  input: number;
  output: number;
  inputFrequencies?: Uint8Array;
  outputFrequencies?: Uint8Array;
}

export type ThemeType = 'PARTICLE_CIRCLE' | 'STRAIGHT_LINE' | 'SIMPLE_CIRCLE' | 'CIRCLE_RADIUS' | 'SPHERICAL_PARTICLE';

export interface VisualizerSettings {
  radius: number;               // Base size
  radiusSensitivity: number;    // How much the radius expands with volume
  displacementSensitivity: number; // How much particles/lines jitter or displace
  density: number;              // Particle count or Detail level
  thickness: number;            // Line width

  // New Settings
  rotationSpeed?: number;       // For Sphere
  breathingAmount?: number;     // Idle pulse size (legacy, use breathingAmplitude)
  breathingFrequency?: number;  // Idle pulse speed
  sizeSensitivity?: number;     // How much particle sizes react to audio

  // Particle fade settings
  particleFade?: number;        // 0-1: Amount of natural fade in/out for particles
  noiseScale?: number;          // 0-2: Scale of noise affecting fade timing

  // === SQUID PARTICLE SETTINGS (SPHERICAL_PARTICLE) ===

  // Global Visuals
  baseSize?: number;            // Particle base size (0.5-8.0)
  opacity?: number;             // Base opacity (0-1)

  // Squid Skin Effect
  squidSpeed?: number;          // Pulse speed (0-10)
  squidAmplitude?: number;      // Pulse scale/size variation (0-5)
  squidOpacityVar?: number;     // Pulse opacity variation (0-1)

  // Breathing
  breathingAmplitude?: number;  // Breath amplitude (0-100)

  // Listening Mode
  listeningTriggerSens?: number; // Spike trigger sensitivity (0.001-0.2)
  listeningIntensity?: number;   // Spike intensity (0.1-2.0)

  // Speaking Mode
  speakingRate?: number;        // Voice oscillation rate (1-30)
  speakingIntensity?: number;   // Voice amplitude (0.1-2.0)

  // Searching Mode
  searchingSpeed?: number;      // Search rotation speed (0.1-5.0)
  searchingJitter?: number;     // Jitter amount (0-50)

  // Outer Sphere (Searching)
  enableOuterSphere?: number;   // 0 or 1 toggle
  outerSphereRadius?: number;   // Radius of outer sphere (200-600)
  outerSphereSpeed?: number;    // Rotation speed (1-20)
  outerSphereDensity?: number;  // Particle density (0.05-0.5)

  // === COLOR CUSTOMIZATION ===
  useCustomColors?: number;       // 0 or 1 toggle for custom colors vs grayscale
  // Dark theme colors
  particleColorDark?: string;     // Main particle color for dark theme (hex)
  secondaryColorDark?: string;    // Secondary/accent color for dark theme (hex)
  outerSphereColorDark?: string;  // Outer sphere color for dark theme (hex)
  // Light theme colors
  particleColorLight?: string;    // Main particle color for light theme (hex)
  secondaryColorLight?: string;   // Secondary/accent color for light theme (hex)
  outerSphereColorLight?: string; // Outer sphere color for light theme (hex)

  // === CIRCLE_RADIUS SIGNAL SETTINGS ===
  signalSpeed?: number;         // Speed of signal ring expansion (0.5-5)
  signalMaxRadius?: number;     // Max distance signals travel (50-400)
  signalCount?: number;         // Number of concurrent signals (1-6)
  signalThickness?: number;     // Thickness of signal rings (1-8)
}

export interface VisualizerProfile {
  id: string;
  name: string;
  type: ThemeType;
  settings: VisualizerSettings;
  // Database fields
  is_default?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}