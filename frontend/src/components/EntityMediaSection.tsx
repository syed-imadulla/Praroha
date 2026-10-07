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
import { MediaType } from '../types';

interface EntityMediaSectionProps {
  entityType: 'world' | 'character' | 'location' | 'scene';
  entityId: string;
  defaultPrompt: string;
  availableModalities?: MediaType[];
  compact?: boolean;
}

export const EntityMediaSection: React.FC<EntityMediaSectionProps> = ({
  entityType,
  entityId,
  defaultPrompt,
  availableModalities = ['image', 'voice'],
  compact = false,
}) => {
  const {
    mediaAssets,
    activeMediaJobs,
    isGeneratingMedia,
    fetchEntityMedia,
    generateMediaAction,
  } = useWorkspaceStore();

  useEffect(() => {
    fetchEntityMedia(entityId);
  }, [entityId, fetchEntityMedia]);

  const assets = mediaAssets[entityId] || [];

  const handleGenerate = async (mediaType: MediaType) => {
    await generateMediaAction({
      entity_type: entityType,
      entity_id: entityId,
      media_type: mediaType,
      prompt: defaultPrompt,
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
        return 'Soundscape';
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
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
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

        <div className="flex items-center gap-1.5 flex-wrap">
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
