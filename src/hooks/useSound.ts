// ============================================================================
// Sound Hook - Casino sound effects with intelligent mixing
// ============================================================================

import { useCallback, useRef, useEffect, useState } from 'react';

type SoundType = 'deal' | 'chip' | 'win' | 'lose' | 'blackjack' | 'bust' | 'push' | 'flip' | 'button-hover' | 'button-click';
type SoundPriority = 'low' | 'medium' | 'high';

const SOUND_FILES: Record<SoundType, string> = {
  deal: '/sounds/deal.mp3',
  chip: '/sounds/chip.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  blackjack: '/sounds/blackjack.mp3',
  bust: '/sounds/bust.mp3',
  push: '/sounds/push.mp3',
  flip: '/sounds/card-flip.mp3',
  'button-hover': '/sounds/button-hover.mp3',
  'button-click': '/sounds/button-click.mp3',
};

const SOUND_PRIORITIES: Record<SoundType, SoundPriority> = {
  blackjack: 'high',
  win: 'high',
  lose: 'high',
  bust: 'high',
  push: 'medium',
  deal: 'medium',
  flip: 'medium',
  chip: 'low',
  'button-hover': 'low',
  'button-click': 'low',
};

interface UseSoundOptions {
  enabled?: boolean;
  volume?: number;
  musicVolume?: number;
}

interface PlayingSound {
  type: SoundType;
  audio: HTMLAudioElement;
  priority: SoundPriority;
  startTime: number;
}

export function useSound(options: UseSoundOptions = {}) {
  const { enabled = false, volume = 0.5, musicVolume = 0.3 } = options;
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const playingSounds = useRef<Set<PlayingSound>>(new Set());
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [soundVolume, setSoundVolume] = useState(volume);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const MAX_CONCURRENT_SOUNDS = 3;

  // Preload audio files
  useEffect(() => {
    if (!isEnabled) return;

    Object.entries(SOUND_FILES).forEach(([type, src]) => {
      if (!audioRefs.current.has(type as SoundType)) {
        const audio = new Audio(src);
        audio.volume = soundVolume;
        audio.preload = 'auto';
        audio.onerror = () => {
          console.warn(`Sound file not found: ${src}`);
        };
        audio.onended = () => {
          // Remove from playing sounds when finished
          playingSounds.current.forEach(sound => {
            if (sound.audio === audio) {
              playingSounds.current.delete(sound);
            }
          });
        };
        audioRefs.current.set(type as SoundType, audio);
      } else {
        audioRefs.current.get(type as SoundType)!.volume = soundVolume;
      }
    });

    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
      playingSounds.current.clear();
    };
  }, [isEnabled, soundVolume]);

  // Music management
  useEffect(() => {
    if (!musicEnabled || !isEnabled) {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      return;
    }

    if (!musicRef.current) {
      const music = new Audio('/sounds/ambient-casino.mp3');
      music.loop = true;
      music.volume = musicVolume;
      music.preload = 'auto';
      music.onerror = () => {
        console.warn('Music file not found: /sounds/ambient-casino.mp3');
      };
      musicRef.current = music;
      
      // Try to play music (may fail due to autoplay restrictions)
      music.play().catch(() => {
        // Music will play after user interaction
      });
    } else {
      musicRef.current.volume = musicVolume;
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
      }
    };
  }, [musicEnabled, isEnabled, musicVolume]);

  const playSound = useCallback((type: SoundType) => {
    if (!isEnabled) return;

    const audio = audioRefs.current.get(type);
    if (!audio) return;

    const priority = SOUND_PRIORITIES[type];
    
    // Check if we're at max concurrent sounds
    if (playingSounds.current.size >= MAX_CONCURRENT_SOUNDS) {
      // If high priority, stop a low priority sound
      if (priority === 'high') {
        const lowPrioritySound = Array.from(playingSounds.current).find(s => s.priority === 'low');
        if (lowPrioritySound) {
          lowPrioritySound.audio.pause();
          lowPrioritySound.audio.currentTime = 0;
          playingSounds.current.delete(lowPrioritySound);
        } else {
          // If no low priority, don't play
          return;
        }
      } else {
        // Low/medium priority sounds wait if max reached
        return;
      }
    }

    // Duck music for high priority sounds
    if (priority === 'high' && musicRef.current) {
      musicRef.current.volume = musicVolume * 0.3;
      setTimeout(() => {
        if (musicRef.current) {
          musicRef.current.volume = musicVolume;
        }
      }, 1000);
    }

    // Reset and play
    audio.currentTime = 0;
    const playingSound: PlayingSound = {
      type,
      audio,
      priority,
      startTime: Date.now(),
    };
    
    playingSounds.current.add(playingSound);
    
    audio.play().catch(err => {
      console.warn(`Could not play sound ${type}:`, err);
      playingSounds.current.delete(playingSound);
    });
  }, [isEnabled, musicVolume]);

  return {
    playSound,
    enabled: isEnabled,
    setEnabled: setIsEnabled,
    volume: soundVolume,
    setVolume: setSoundVolume,
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume: (vol: number) => {
      if (musicRef.current) {
        musicRef.current.volume = vol;
      }
    },
  };
}
