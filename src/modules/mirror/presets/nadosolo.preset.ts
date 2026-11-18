import { createMirrorEngine } from '../core';
import { MirrorModulePreset } from '../types';

export const NADOSOLO_MIRROR_PRESET: MirrorModulePreset = {
  namespace: 'nadosolo',
  defaultRequiredPeerCount: 5,
  enforceSingleNounRule: true,
  defaultFallbackScore100: 85,
  strengthTopCount: 3,
  growthPointCount: 2,
};

export const nadosoloMirrorEngine = createMirrorEngine(NADOSOLO_MIRROR_PRESET);
