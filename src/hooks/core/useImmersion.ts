
import { useCallback } from 'react';
import { audioEngine, AudioPreset } from '@/services/core/audioEngine';
import { hapticService } from '@/services/core/hapticService';

export function useImmersion() {
  const cast = useCallback((preset: AudioPreset, options?: { haptic?: boolean; volume?: number }) => {
    // Play Sound
    audioEngine.play(preset, options?.volume ?? 1);
    
    // Play Haptic
    if (options?.haptic !== false) {
      switch (preset) {
        case 'magic':
        case 'levelUp':
        case 'wandSwish':
          hapticService.magic();
          break;
        case 'error':
          hapticService.error();
          break;
        case 'coin':
        case 'notify':
          hapticService.success();
          break;
        default:
          hapticService.tap();
      }
    }
  }, []);

  return { cast };
}
