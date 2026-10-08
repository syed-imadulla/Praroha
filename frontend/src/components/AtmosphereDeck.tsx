import React, { useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Radio, Disc } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const AtmosphereDeck: React.FC = () => {
  const activeAsset = useWorkspaceStore((state) => state.activeAtmosphereAsset);
  const isPlaying = useWorkspaceStore((state) => state.isAtmospherePlaying);
  const masterVolume = useWorkspaceStore((state) => state.atmosphereMasterVolume);
  const isMuted = useWorkspaceStore((state) => state.isAtmosphereMuted);
  const blockers = useWorkspaceStore((state) => state.activeMediaBlockers);

  const togglePlay = useWorkspaceStore((state) => state.toggleAtmospherePlay);
  const setMasterVolume = useWorkspaceStore((state) => state.setAtmosphereMasterVolume);
  const toggleMute = useWorkspaceStore((state) => state.toggleAtmosphereMute);
  const closeDeck = useWorkspaceStore((state) => state.closeAtmosphereDeck);
  const getEffectiveVolume = useWorkspaceStore((state) => state.getEffectiveAtmosphereVolume);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const effectiveVolume = getEffectiveVolume();
  const isDucked = blockers.size > 0;

  // Reactively synchronize audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
    }
  }, [effectiveVolume, isMuted, masterVolume, blockers.size]);

  // Reactively synchronize audio element playback
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Atmosphere autoplay prevented by browser policy:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, activeAsset?.asset_url]);

  if (!activeAsset || !activeAsset.asset_url) {
    return null;
  }

  // Parse metadata if available
  let mood = 'ambient';
  try {
    if (activeAsset.metadata_json) {
      const parsed = JSON.parse(activeAsset.metadata_json);
      if (parsed.mood) mood = parsed.mood;
    }
  } catch {
    // ignore
  }

  return (
    <div
      data-testid="atmosphere-deck-bar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F4E8]/95 backdrop-blur-xl border-t border-[#D8CCB7] shadow-xl px-4 sm:px-6 py-3 transition-all duration-300"
    >
      <audio
        ref={audioRef}
        data-testid="atmosphere-deck-audio-element"
        src={activeAsset.asset_url}
        loop
        preload="auto"
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Track Information & Entity Badge */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#E2EBE2] border border-[#BACBB8] text-[#355A46] shrink-0 shadow-inner">
            <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#355A46] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#294B3A]"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#E2EBE2] text-[#294B3A] border border-[#BACBB8] min-h-[26px] inline-flex items-center">
                Atmosphere Deck
              </span>
              <span className="text-xs text-[#394840] font-semibold capitalize px-2.5 py-1 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] min-h-[26px] inline-flex items-center">
                {mood}
              </span>
              {isDucked && (
                <span
                  data-testid="atmosphere-ducking-indicator"
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/40 animate-pulse flex items-center gap-1.5 min-h-[26px]"
                >
                  <Radio className="w-3.5 h-3.5 text-[#805B20]" />
                  Ducked for Narration/Video
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#294B3A] font-medium truncate mt-1 max-w-md">
              {activeAsset.prompt || 'Ambient Soundscape'}
            </p>
          </div>
        </div>

        {/* Center: Play / Pause Control */}
        <div className="flex items-center gap-3">
          <button
            data-testid="atmosphere-deck-play-pause-btn"
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
            title={isPlaying ? 'Pause Atmosphere' : 'Play Atmosphere'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Right: Master Volume Slider, Mute & Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#F2EBDD] px-3 py-1.5 rounded-xl border border-[#D8CCB7]">
            <button
              data-testid="atmosphere-deck-mute-btn"
              onClick={toggleMute}
              className="text-[#5F6D63] hover:text-[#355A46] transition-colors p-1 rounded-md min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
              title={isMuted ? 'Unmute Atmosphere' : 'Mute Atmosphere'}
            >
              {isMuted || effectiveVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#A0522D]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#355A46]" />
              )}
            </button>

            <input
              type="range"
              data-testid="atmosphere-deck-volume"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-2 bg-[#D8CCB7] rounded-lg appearance-none cursor-pointer accent-[#355A46]"
              title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
            />

            <span className="text-xs font-mono font-bold text-[#394840] w-9 text-right tabular-nums">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          <button
            data-testid="close-atmosphere-deck"
            onClick={closeDeck}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#5F6D63] hover:text-[#294B3A] rounded-xl hover:bg-[#F2EBDD] transition-colors focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
            title="Close Atmosphere Deck"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
