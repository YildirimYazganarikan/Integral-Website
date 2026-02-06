export enum SimulationMode {
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  SEARCHING = 'SEARCHING',
}

export interface SimulationSettings {
  // Global Visuals
  density: number;
  radius: number;
  baseSize: number;
  opacity: number;
  
  // Squid Skin Effect
  squidSpeed: number;
  squidAmplitude: number;
  squidOpacityVar: number;
  
  // Breathing
  breathingFrequency: number;
  breathingAmplitude: number;

  // Base Motion
  rotationSpeed: number;

  // Mode: Listening
  listeningTriggerSens: number; // Probability of sound spike
  listeningIntensity: number;   // Height of spike

  // Mode: Speaking
  speakingRate: number;
  speakingIntensity: number;

  // Mode: Searching
  searchingSpeed: number;
  searchingJitter: number;
  
  // Mode: Searching (Outer Sphere)
  enableOuterSphere: number; // 0 or 1, treated as boolean
  outerSphereRadius: number;
  outerSphereSpeed: number;
  outerSphereDensity: number;
}

export interface Particle {
  theta: number;
  phi: number;
  baseSize: number;
  phase: number;
  randomX: number;
  randomY: number;
}