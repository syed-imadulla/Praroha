import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Mic,
  Video,
  Music,
  Sparkles,
  RotateCw,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useWorkspaceStore } from '../store/workspaceStore';
import { MediaPreviewCard } from './MediaPreviewCard';
import { SoundscapeComposerModal } from './SoundscapeComposerModal';
import { MediaType, MediaProviderHealth, CURATED_VOICE_PERSONAS, CURATED_AUDIO_MOODS } from '../types';

interface EntityMediaSectionProps {
  entityType: 'world' | 'character' | 'location' | 'scene';
  entityId: string;
  defaultPrompt: string;
  availableModalities?: MediaType[];
  compact?: boolean;
  roleHint?: string;
  entityTitle?: string;
}

export const EntityMediaSection: React.FC<EntityMediaSectionProps> = ({
  entityType,
  entityId,
  defaultPrompt,
  availableModalities = ['image', 'voice'],
  compact = false,
  roleHint,
  entityTitle,
}) => {
  const {
    activeProject,
    mediaAssets,
    activeMediaJobs,
    isGeneratingMedia,
    fetchEntityMedia,
    generateMediaAction,
  } = useWorkspaceStore();

  const [isSoundscapeModalOpen, setIsSoundscapeModalOpen] = useState(false);
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

  const [providerHealth, setProviderHealth] = useState<MediaProviderHealth | null>(null);

  useEffect(() => {
    fetchEntityMedia(entityId);
    let isMounted = true;
    apiClient.getMediaProvidersHealth().then((res) => {
      if (isMounted && res.data) {
        setProviderHealth(res.data);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [entityId, fetchEntityMedia]);

  const assets = mediaAssets[entityId] || [];

  // Detect any credit or quota exhaustion errors across active jobs or entity assets
  const creditErrorMsg = React.useMemo(() => {
    const allErrors: string[] = [];
    assets.forEach((a) => {
      if (a.error_message) allErrors.push(a.error_message);
    });
    Object.values(activeMediaJobs).forEach((j) => {
      if (j.error_message) allErrors.push(j.error_message);
    });
    const found = allErrors.find((msg) => {
      const lower = msg.toLowerCase();
      return (
        lower.includes('credit') ||
        lower.includes('payment') ||
        lower.includes('402') ||
        lower.includes('quota') ||
        lower.includes('429') ||
        lower.includes('unauthorized') ||
        lower.includes('401') ||
        lower.includes('403')
      );
    });
    return found || null;
  }, [assets, activeMediaJobs]);

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
      context: mediaType === 'video' ? { provider: 'json2video' } : undefined,
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
        return <ImageIcon className="w-3.5 h-3.5 text-[#355A46]" />;
      case 'voice':
        return <Mic className="w-3.5 h-3.5 text-[#C59A55]" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-[#6A4B67]" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-[#466A55]" />;
    }
  };

  return (
    <div
      data-testid={`entity-media-section-${entityId}`}
      className="mt-3 pt-3 border-t border-[#D8CCB7] space-y-3"
    >
      {/* Credit/Billing Alert Banner if active */}
      {creditErrorMsg && (
        <div
          data-testid="provider-credit-alert"
          className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F5E6DC] border border-[#E2BFAC] text-xs text-[#934520] animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B8734F] mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Provider Credit / Authorization Limit: </span>
            <span>{creditErrorMsg}</span>
          </div>
        </div>
      )}

      {/* Action Header & Modality Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#294B3A]">
          <Sparkles className="w-4 h-4 text-[#355A46]" />
          <span>Multimodal Sensory Assets</span>
          <span
            data-testid="provider-health-badge"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF0E8] text-[#294B3A] border border-[#BACBB8]"
            title={`Spend protection active (${providerHealth?.status || 'healthy'}). Protects against runaway spend and credit exhaustion. Does not guarantee all configured providers are free.`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#466A55] animate-pulse"></span>
            Credit-Safe Routing
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {availableModalities.includes('image') && (
            <div
              className="flex items-center gap-1 bg-[#F2EBDD] p-1 rounded-xl border border-[#D8CCB7] text-xs"
              title="Select aspect ratio for visual generation"
              data-testid={`aspect-ratio-selector-${entityId}`}
            >
              {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setSelectedAspectRatio(ratio)}
                  data-testid={`aspect-ratio-btn-${ratio}-${entityId}`}
                  className={`px-2.5 py-1 rounded-lg font-mono transition-all min-h-[28px] ${
                    selectedAspectRatio === ratio
                      ? 'bg-[#355A46] text-[#F8F4E8] font-bold shadow-xs'
                      : 'text-[#5F6D63] hover:text-[#294B3A]'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}

          {availableModalities.includes('voice') && (
            <div
              className="flex items-center gap-2 bg-[#F2EBDD] px-2.5 py-1 rounded-xl border border-[#D8CCB7] text-xs min-h-[32px]"
              title="Select voice persona archetype"
            >
              <Mic className="w-3.5 h-3.5 text-[#C59A55] shrink-0" />
              <select
                data-testid={`voice-persona-selector-${entityId}`}
                value={selectedVoicePersona}
                onChange={(e) => setSelectedVoicePersona(e.target.value)}
                className="bg-transparent text-[#294B3A] font-semibold text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
              >
                {CURATED_VOICE_PERSONAS.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-[#F8F4E8] text-[#294B3A]"
                    data-testid={`voice-persona-option-${p.id}-${entityId}`}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {availableModalities.includes('audio') && (
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-2 bg-[#F2EBDD] px-2.5 py-1 rounded-xl border border-[#D8CCB7] text-xs min-h-[32px]"
                title="Select atmosphere soundscape mood preset"
              >
                <Music className="w-3.5 h-3.5 text-[#355A46] shrink-0" />
                <select
                  data-testid={`audio-mood-selector-${entityId}`}
                  value={selectedAudioMood}
                  onChange={(e) => setSelectedAudioMood(e.target.value)}
                  className="bg-transparent text-[#294B3A] font-semibold text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
                >
                  {CURATED_AUDIO_MOODS.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="bg-[#F8F4E8] text-[#294B3A]"
                      data-testid={`audio-mood-option-${m.id}-${entityId}`}
                    >
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified Curated CC0 Soundscape Library Button */}
              <button
                type="button"
                onClick={() => setIsSoundscapeModalOpen(true)}
                data-testid={`compose-soundscape-btn-${entityId}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#EAF0E6] hover:bg-[#DDE8D8] text-[#294B3A] border border-[#BACBB8] shadow-2xs transition-all min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
                title="Compose ambient soundscape from verified CC0 audio library (wind, rain, bells, forest, drones)"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#355A46]" />
                <span>Compose Soundscape (CC0)</span>
              </button>
            </div>
          )}

          {availableModalities.map((modality) => {
            if (modality === 'video') {
              const isVideoGenerating = !!isGeneratingMedia[`${entityId}_video`];
              const existingVideo = assets.find((a) => a.media_type === 'video');

              return (
                <div key="video" className="flex items-center gap-2 flex-wrap">
                  {/* Real Generative AI Video - Visibly disabled without free cloud allowance */}
                  <div
                    data-testid={`generate-video-disabled-${entityId}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#EAE4D4] text-[#718875] border border-[#D8CCB7] cursor-not-allowed opacity-80 min-h-[32px]"
                    title="Real generative AI video requires cloud credits. Composed cinematic preview available via JSON2Video."
                  >
                    <Video className="w-3.5 h-3.5 text-[#718875]" />
                    <span>AI Video (Credits Required)</span>
                  </div>

                  {/* Composed Cinematic Preview (JSON2Video) */}
                  {entityType === 'scene' && (
                    <button
                      type="button"
                      onClick={() => handleGenerate('video')}
                      disabled={isVideoGenerating}
                      data-testid={`generate-cinematic-preview-${entityId}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#6A4B67] ${
                        isVideoGenerating
                          ? 'bg-[#EBD8EB] border-[#D4C3D2] text-[#6A4B67] cursor-not-allowed opacity-80'
                          : 'bg-[#F5EDF5] hover:bg-[#EBD8EB] text-[#6A4B67] border-[#D4C3D2] hover:border-[#BFA8BD] shadow-2xs'
                      }`}
                      title="Render composed cinematic preview combining concept art and voice narration via JSON2Video"
                    >
                      {isVideoGenerating ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-[#6A4B67]" />
                      ) : (
                        <Video className="w-3.5 h-3.5 text-[#6A4B67]" />
                      )}
                      <span>
                        {isVideoGenerating
                          ? 'Composing Preview...'
                          : existingVideo
                          ? 'Re-compose Preview'
                          : 'Cinematic Preview (JSON2Video)'}
                      </span>
                    </button>
                  )}
                </div>
              );
            }

            const isGenerating = !!isGeneratingMedia[`${entityId}_${modality}`];
            const existingAsset = assets.find((a) => a.media_type === modality);

            return (
              <button
                key={modality}
                type="button"
                onClick={() => handleGenerate(modality)}
                disabled={isGenerating}
                data-testid={`generate-${modality}-${entityId}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#294B3A] ${
                  isGenerating
                    ? 'bg-[#DDE2D2] border-[#C8D0BE] text-[#294B3A] cursor-not-allowed opacity-80'
                    : 'bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border-[#D8CCB7] hover:border-[#C8D0BE] shadow-2xs'
                }`}
                title={`Generate ${modality} asset via configured MediaProvider`}
              >
                {isGenerating ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-[#355A46]" />
                ) : (
                  getModalityIcon(modality)
                )}
                <span>
                  {isGenerating
                    ? `Generating ${getModalityLabel(modality)}...`
                    : existingAsset
                    ? `Create ${getModalityLabel(modality)} Again`
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
          className={`grid gap-3 min-w-0 ${
            compact || availableModalities.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 2xl:grid-cols-2'
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
                entityType={entityType}
                entityTitle={entityTitle}
              />
            );
          })}
        </div>
      )}

      {/* Curated Soundscape Composer Modal */}
      {activeProject && isSoundscapeModalOpen && (
        <SoundscapeComposerModal
          projectId={activeProject.id}
          entityId={entityId}
          entityType={entityType === 'scene' ? 'scene' : 'project'}
          sceneTitle={entityTitle}
          isOpen={isSoundscapeModalOpen}
          onClose={() => setIsSoundscapeModalOpen(false)}
          onComposed={() => fetchEntityMedia(entityId)}
        />
      )}
    </div>
  );
};
