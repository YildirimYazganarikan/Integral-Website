import { SimulationSettings } from './types';

export const DEFAULT_SETTINGS: SimulationSettings = {
  // Global
  density: 0.1,
  radius: 160,
  baseSize: 3.9,
  opacity: 0.6,
  rotationSpeed: 0.2,

  // Squid
  squidSpeed: 3.3,
  squidAmplitude: 2.2,
  squidOpacityVar: 0.45,

  // Breathing
  breathingFrequency: 0.3,
  breathingAmplitude: 29,

  // Listening
  listeningTriggerSens: 0.078,
  listeningIntensity: 0.8,

  // Speaking
  speakingRate: 16,
  speakingIntensity: 0.4,

  // Searching
  searchingSpeed: 0.8,
  searchingJitter: 23,
  
  // Outer Sphere (Searching)
  enableOuterSphere: 0,
  outerSphereRadius: 300,
  outerSphereSpeed: 8.0,
  outerSphereDensity: 0.2,
};

export const MIN_MAX_SETTINGS: Record<keyof SimulationSettings, { min: number; max: number; step: number; label: string; type?: 'range' | 'toggle' }> = {
  // Global
  density: { min: 0.1, max: 1.0, step: 0.01, label: 'Density' },
  radius: { min: 50, max: 400, step: 10, label: 'Radius' },
  baseSize: { min: 0.5, max: 8.0, step: 0.1, label: 'Particle Size' },
  opacity: { min: 0.0, max: 1.0, step: 0.05, label: 'Base Opacity' },
  rotationSpeed: { min: 0, max: 2.0, step: 0.05, label: 'Idle Rotation' },

  // Squid
  squidSpeed: { min: 0, max: 10.0, step: 0.1, label: 'Pulse Speed' },
  squidAmplitude: { min: 0, max: 5.0, step: 0.1, label: 'Pulse Scale' },
  squidOpacityVar: { min: 0, max: 1.0, step: 0.05, label: 'Pulse Fade' },

  // Breathing
  breathingFrequency: { min: 0.1, max: 5.0, step: 0.1, label: 'Breath Freq' },
  breathingAmplitude: { min: 0, max: 100, step: 1, label: 'Breath Amp' },

  // Listening
  listeningTriggerSens: { min: 0.001, max: 0.2, step: 0.001, label: 'Sensitivity' },
  listeningIntensity: { min: 0.1, max: 2.0, step: 0.1, label: 'Spike Intensity' },

  // Speaking
  speakingRate: { min: 1.0, max: 30.0, step: 0.5, label: 'Voice Rate' },
  speakingIntensity: { min: 0.1, max: 2.0, step: 0.1, label: 'Voice Amp' },

  // Searching
  searchingSpeed: { min: 0.1, max: 5.0, step: 0.1, label: 'Search Speed' },
  searchingJitter: { min: 0, max: 50, step: 1, label: 'Jitter' },
  
  // Outer Sphere
  enableOuterSphere: { min: 0, max: 1, step: 1, label: 'Outer Sphere', type: 'toggle' },
  outerSphereRadius: { min: 200, max: 600, step: 10, label: 'Outer Radius' },
  outerSphereSpeed: { min: 1, max: 20, step: 0.5, label: 'Outer Speed' },
  outerSphereDensity: { min: 0.05, max: 0.5, step: 0.01, label: 'Outer Density' },
};