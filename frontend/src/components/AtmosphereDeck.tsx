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
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/30 shadow-2xl shadow-cyan-950/50 px-4 py-2.5 transition-all duration-300"
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shrink-0 shadow-inner">
            <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Atmosphere Deck
              </span>
              <span className="text-xs text-slate-400 capitalize px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                {mood}
              </span>
              {isDucked && (
                <span
                  data-testid="atmosphere-ducking-indicator"
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1"
                >
                  <Radio className="w-3 h-3 text-amber-400" />
                  Ducked for Narration/Video
                </span>
              )}
            </div>
            <p className="text-xs text-slate-200 truncate font-mono mt-0.5 max-w-md">
              {activeAsset.prompt || 'Ambient Soundscape'}
            </p>
          </div>
        </div>

        {/* Center: Play / Pause Control */}
        <div className="flex items-center gap-3">
          <button
            data-testid="atmosphere-deck-play-pause-btn"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause Atmosphere' : 'Play Atmosphere'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Right: Master Volume Slider, Mute & Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <button
              data-testid="atmosphere-deck-mute-btn"
              onClick={toggleMute}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-0.5"
              title={isMuted ? 'Unmute Atmosphere' : 'Mute Atmosphere'}
            >
              {isMuted || effectiveVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
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
              className="w-20 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
            />

            <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          <button
            data-testid="close-atmosphere-deck"
            onClick={closeDeck}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Atmosphere Deck"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
