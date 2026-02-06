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
  breathingAmount?: number;     // Idle pulse size
  breathingFrequency?: number;  // Idle pulse speed
}

export interface VisualizerProfile {
  id: string;
  name: string;
  type: ThemeType;
  settings: VisualizerSettings;
}