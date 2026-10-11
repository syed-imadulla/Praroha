import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Music, Sparkles, RotateCw, ShieldCheck } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { apiClient } from '../api/client';

interface LayerOption {
  id: string;
  name: string;
  category: string;
  description: string;
  license: string;
  defaultVolume: number;
}

const CURATED_LAYERS: LayerOption[] = [
  {
    id: 'temple_bells',
    name: 'Tibetan Singing Bowls & Temple Bells',
    category: 'Spiritual',
    description: 'Resonant modal bell chimes with long acoustic decay and tranquil harmonics.',
    license: 'CC0 1.0 Universal (Public Domain)',
    defaultVolume: 0.8,
  },
  {
    id: 'wind_mountain',
    name: 'Alpine Mountain Wind',
    category: 'Weather',
    description: 'Subtle low-frequency mountain wind with gentle resonant gusts.',
    license: 'CC0 1.0 Universal (Public Domain)',
    defaultVolume: 0.5,
  },
  {
    id: 'rain_monsoon',
    name: 'Monsoon Rainfall',
    category: 'Weather',
    description: 'Continuous soothing rainfall textures and calming precipitation.',
    license: 'CC0 1.0 Universal (Public Domain)',
    defaultVolume: 0.6,
  },
  {
    id: 'forest_dawn',
    name: 'Ancient Forest Canopy',
    category: 'Nature',
    description: 'Tranquil canopy leaf rustle with gentle intermittent dawn chirps.',
    license: 'CC0 1.0 Universal (Public Domain)',
    defaultVolume: 0.5,
  },
  {
    id: 'astral_drone',
    name: 'Cosmic Harmonic Drone',
    category: 'Drone',
    description: 'Deep meditative triad chord drone with slow acoustic warmth and beating.',
    license: 'CC0 1.0 Universal (Public Domain)',
    defaultVolume: 0.4,
  },
];

interface SoundscapeComposerModalProps {
  projectId: string;
  entityId: string;
  entityType?: 'scene' | 'project';
  sceneTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onComposed?: () => void;
}

export const SoundscapeComposerModal: React.FC<SoundscapeComposerModalProps> = ({
  projectId,
  entityId,
  entityType = 'scene',
  sceneTitle,
  isOpen,
  onClose,
  onComposed,
}) => {
  const [selectedLayers, setSelectedLayers] = useState<Record<string, { enabled: boolean; volume: number }>>({
    temple_bells: { enabled: true, volume: 0.8 },
    wind_mountain: { enabled: true, volume: 0.5 },
    rain_monsoon: { enabled: false, volume: 0.6 },
    forest_dawn: { enabled: false, volume: 0.5 },
    astral_drone: { enabled: true, volume: 0.4 },
  });

  const [durationSec, setDurationSec] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEntityMedia = useWorkspaceStore((state) => state.fetchEntityMedia);

  const toggleLayer = (id: string) => {
    setSelectedLayers((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        enabled: !prev[id]?.enabled,
      },
    }));
  };

  const setLayerVolume = (id: string, volume: number) => {
    setSelectedLayers((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        volume,
      },
    }));
  };

  const handleComposeAndAttach = async () => {
    setErrorMsg(null);
    const activeLayers = Object.entries(selectedLayers)
      .filter(([_, cfg]) => cfg.enabled)
      .map(([id, cfg]) => ({ id, volume: cfg.volume }));

    if (activeLayers.length === 0) {
      setErrorMsg('Please select at least one ambient layer to compose.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.composeSoundscape(projectId, {
        entity_id: entityId,
        entity_type: entityType,
        layers: activeLayers,
        duration_sec: durationSec,
        title: sceneTitle ? `Soundscape: ${sceneTitle}` : undefined,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Composition failed');
      }

      await fetchEntityMedia(entityId);
      if (onComposed) onComposed();
      onClose();
    } catch (err: any) {
      console.error('Failed to compose soundscape:', err);
      setErrorMsg(err.message || 'Failed to compose soundscape.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3326]/60 backdrop-blur-sm"
        data-testid="soundscape-composer-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-xl bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D8CCB7]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E8EFE9] border border-[#C8D0BE] flex items-center justify-center text-[#355A46]">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#294B3A]">
                  Curated Soundscape Composer
                </h3>
                <p className="text-xs text-[#5F6D63]">
                  {sceneTitle ? `Scene: ${sceneTitle}` : 'Multi-layered CC0 public domain ambient audio'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="close-soundscape-composer"
              className="p-1.5 rounded-lg text-[#5F6D63] hover:text-[#294B3A] hover:bg-[#EAE4D4] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* License transparency notice */}
          <div className="my-3 p-2.5 rounded-xl bg-[#EFECE1] border border-[#DFD8C7] flex items-center gap-2 text-xs text-[#5F6D63]">
            <ShieldCheck className="w-4 h-4 text-[#355A46] shrink-0" />
            <span>
              All layers verified <strong>CC0 1.0 Universal (Public Domain)</strong>. 100% free, legally unencumbered, and truthfully labeled as a <em>Composed Soundscape</em> (never AI audio).
            </span>
          </div>

          {/* Layer List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
            {CURATED_LAYERS.map((layer) => {
              const state = selectedLayers[layer.id] || { enabled: false, volume: layer.defaultVolume };
              return (
                <div
                  key={layer.id}
                  data-testid={`soundscape-layer-${layer.id}`}
                  className={`p-3 rounded-xl border transition-all ${
                    state.enabled
                      ? 'bg-[#F2EBDD] border-[#355A46]/40 shadow-2xs'
                      : 'bg-[#FAF7EE] border-[#E2D8C6] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={state.enabled}
                        onChange={() => toggleLayer(layer.id)}
                        className="w-4 h-4 rounded text-[#355A46] focus:ring-[#355A46] accent-[#355A46]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#294B3A] block">
                          {layer.name}
                        </span>
                        <span className="text-[11px] text-[#5F6D63] block">
                          {layer.description}
                        </span>
                      </div>
                    </label>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#E8EFE9] text-[#294B3A] font-semibold">
                      {layer.category}
                    </span>
                  </div>

                  {state.enabled && (
                    <div className="mt-2.5 pt-2 border-t border-[#DFD8C7] flex items-center gap-3">
                      <Volume2 className="w-3.5 h-3.5 text-[#5F6D63] shrink-0" />
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={state.volume}
                        onChange={(e) => setLayerVolume(layer.id, parseFloat(e.target.value))}
                        className="w-full accent-[#355A46] h-1.5 bg-[#DFD8C7] rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-mono text-[#294B3A] font-semibold w-8 text-right">
                        {Math.round(state.volume * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Duration Selector */}
          <div className="mt-4 pt-3 border-t border-[#D8CCB7] flex items-center justify-between">
            <span className="text-xs font-bold text-[#294B3A]">Clip Duration:</span>
            <div className="flex items-center gap-1.5">
              {[10, 15, 30].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDurationSec(dur)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition-all ${
                    durationSec === dur
                      ? 'bg-[#355A46] text-[#F8F4E8]'
                      : 'bg-[#EAE4D4] text-[#5F6D63] hover:text-[#294B3A]'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 p-2 rounded-lg bg-[#F5E6DC] text-[#B8734F] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-[#D8CCB7] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#5F6D63] hover:text-[#294B3A] hover:bg-[#EAE4D4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleComposeAndAttach}
              disabled={isSubmitting}
              data-testid="compose-soundscape-confirm-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mixing & Attaching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compose & Attach to Scene</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
