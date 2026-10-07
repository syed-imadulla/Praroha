import React, { useEffect } from 'react';
import {
  Image as ImageIcon,
  Mic,
  Video,
  Music,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { MediaPreviewCard } from './MediaPreviewCard';
import { MediaType, CURATED_VOICE_PERSONAS, CURATED_AUDIO_MOODS } from '../types';

interface EntityMediaSectionProps {
  entityType: 'world' | 'character' | 'location' | 'scene';
  entityId: string;
  defaultPrompt: string;
  availableModalities?: MediaType[];
  compact?: boolean;
  roleHint?: string;
}

export const EntityMediaSection: React.FC<EntityMediaSectionProps> = ({
  entityType,
  entityId,
  defaultPrompt,
  availableModalities = ['image', 'voice'],
  compact = false,
  roleHint,
}) => {
  const {
    mediaAssets,
    activeMediaJobs,
    isGeneratingMedia,
    fetchEntityMedia,
    generateMediaAction,
  } = useWorkspaceStore();

  const [selectedAspectRatio, setSelectedAspectRatio] = React.useState<'1:1' | '16:9' | '9:16'>(
    entityType === 'character' ? '1:1' : '16:9'
  );

  // Auto-suggest persona based on entity type and role
  const getInitialPersona = () => {
    if (entityType === 'scene') return 'narrator-deep';
    const hint = `${roleHint || ''} ${defaultPrompt}`.toLowerCase();
    if (hint.includes('mentor') || hint.includes('elder') || hint.includes('guide') || hint.includes('sage')) {
      return 'mentor-sage';
    }
    if (hint.includes('mystic') || hint.includes('spiritual') || hint.includes('oracle')) {
      return 'calm-mystic';
    }
    if (hint.includes('youth') || hint.includes('scientist') || hint.includes('child') || hint.includes('explor')) {
      return 'inquiring-youth';
    }
    if (hint.includes('antagonist') || hint.includes('villain') || hint.includes('commander') || hint.includes('rival')) {
      return 'brooding-antagonist';
    }
    return 'protagonist-resolute';
  };

  const [selectedVoicePersona, setSelectedVoicePersona] = React.useState<string>(getInitialPersona);
  const [selectedAudioMood, setSelectedAudioMood] = React.useState<string>(
    entityType === 'scene' ? 'tense-dramatic' : 'serene-ambient'
  );

  useEffect(() => {
    fetchEntityMedia(entityId);
  }, [entityId, fetchEntityMedia]);

  const assets = mediaAssets[entityId] || [];

  const handleGenerate = async (mediaType: MediaType) => {
    await generateMediaAction({
      entity_type: entityType,
      entity_id: entityId,
      media_type: mediaType,
      prompt: (mediaType === 'voice' || mediaType === 'video' || mediaType === 'audio') ? '' : defaultPrompt,
      aspect_ratio: mediaType === 'image' ? selectedAspectRatio : undefined,
      voice_id: mediaType === 'voice' ? selectedVoicePersona : undefined,
      duration_sec: mediaType === 'video' ? 5 : (mediaType === 'audio' ? 15 : undefined),
      mood: mediaType === 'audio' ? selectedAudioMood : undefined,
    });
  };

  const getModalityLabel = (type: MediaType) => {
    switch (type) {
      case 'image':
        return entityType === 'character' ? 'Portrait' : 'Concept Art';
      case 'voice':
        return 'Voice';
      case 'video':
        return 'Video Clip';
      case 'audio':
        return 'Atmosphere';
    }
  };

  const getModalityIcon = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />;
      case 'voice':
        return <Mic className="w-3.5 h-3.5 text-amber-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div
      data-testid={`entity-media-section-${entityId}`}
      className="mt-3 pt-3 border-t border-slate-800/80 space-y-3"
    >
      {/* Action Header & Modality Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Multimodal Sensory Assets</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {availableModalities.includes('image') && (
            <div
              className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[10px]"
              title="Select aspect ratio for visual generation"
              data-testid={`aspect-ratio-selector-${entityId}`}
            >
              {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setSelectedAspectRatio(ratio)}
                  data-testid={`aspect-ratio-btn-${ratio}-${entityId}`}
                  className={`px-2 py-0.5 rounded font-mono transition-all ${
                    selectedAspectRatio === ratio
                      ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-700/60 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}

          {availableModalities.includes('voice') && (
            <div
              className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]"
              title="Select voice persona archetype"
            >
              <Mic className="w-3 h-3 text-amber-400 shrink-0" />
              <select
                data-testid={`voice-persona-selector-${entityId}`}
                value={selectedVoicePersona}
                onChange={(e) => setSelectedVoicePersona(e.target.value)}
                className="bg-transparent text-slate-300 font-medium text-[11px] focus:outline-none cursor-pointer pr-1 py-0.5"
              >
                {CURATED_VOICE_PERSONAS.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-slate-900 text-slate-200"
                    data-testid={`voice-persona-option-${p.id}-${entityId}`}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {availableModalities.includes('audio') && (
            <div
              className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]"
              title="Select atmosphere soundscape mood preset"
            >
              <Music className="w-3 h-3 text-cyan-400 shrink-0" />
              <select
                data-testid={`audio-mood-selector-${entityId}`}
                value={selectedAudioMood}
                onChange={(e) => setSelectedAudioMood(e.target.value)}
                className="bg-transparent text-slate-300 font-medium text-[11px] focus:outline-none cursor-pointer pr-1 py-0.5"
              >
                {CURATED_AUDIO_MOODS.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    className="bg-slate-900 text-slate-200"
                    data-testid={`audio-mood-option-${m.id}-${entityId}`}
                  >
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}


          {availableModalities.map((modality) => {
            const isGenerating = !!isGeneratingMedia[`${entityId}_${modality}`];
            const existingAsset = assets.find((a) => a.media_type === modality);

            return (
              <button
                key={modality}
                type="button"
                onClick={() => handleGenerate(modality)}
                disabled={isGenerating}
                data-testid={`generate-${modality}-${entityId}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  isGenerating
                    ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 cursor-not-allowed opacity-80'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/80 hover:border-slate-600'
                }`}
                title={`Generate ${modality} asset via configured MediaProvider`}
              >
                {isGenerating ? (
                  <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
                ) : (
                  getModalityIcon(modality)
                )}
                <span>
                  {isGenerating
                    ? `Generating ${getModalityLabel(modality)}...`
                    : existingAsset
                    ? `Regenerate ${getModalityLabel(modality)}`
                    : `Generate ${getModalityLabel(modality)}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Cards Grid */}
      {availableModalities.some(
        (m) =>
          assets.some((a) => a.media_type === m) ||
          isGeneratingMedia[`${entityId}_${m}`]
      ) && (
        <div
          className={`grid gap-3 ${
            compact || availableModalities.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {availableModalities.map((modality) => {
            const asset = assets.find((a) => a.media_type === modality);
            const isGenerating = !!isGeneratingMedia[`${entityId}_${modality}`];
            // Find active job if any
            const activeJob = Object.values(activeMediaJobs).find(
              (j) => j.entity_id === entityId && j.media_type === modality
            );

            if (!asset && !isGenerating && !activeJob) {
              return null;
            }

            return (
              <MediaPreviewCard
                key={modality}
                mediaType={modality}
                asset={asset}
                job={activeJob}
                isGenerating={isGenerating}
                onRetry={() => handleGenerate(modality)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
