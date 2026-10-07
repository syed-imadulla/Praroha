import React from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Mic,
  Video,
  Music,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MediaAsset, MediaJobResponse, MediaType } from '../types';

interface MediaPreviewCardProps {
  asset?: MediaAsset;
  job?: MediaJobResponse;
  mediaType: MediaType;
  isGenerating?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  asset,
  job,
  mediaType,
  isGenerating = false,
  onRetry,
  className = '',
}) => {
  const status = isGenerating
    ? 'processing'
    : job?.status || asset?.status || 'idle';
  const assetUrl = job?.asset_url || asset?.asset_url;
  const errorMessage = job?.error_message || asset?.error_message;

  const renderIcon = () => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'voice':
        return <Mic className="w-4 h-4 text-amber-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getMediaTitle = () => {
    switch (mediaType) {
      case 'image':
        return 'Visual Concept Art';
      case 'voice':
        return 'Vocal Narration';
      case 'video':
        return 'Cinematic Clip';
      case 'audio':
        return 'Ambient Soundscape';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`media-card-${mediaType}`}
      className={`rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden flex flex-col p-3 transition-all duration-200 hover:border-slate-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
          {renderIcon()}
          <span>{getMediaTitle()}</span>
        </div>

        {/* Status Pill */}
        <div>
          {status === 'processing' || status === 'queued' ? (
            <span
              data-testid="media-status-processing"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 animate-pulse"
            >
              <RotateCw className="w-2.5 h-2.5 animate-spin" />
              <span>{status === 'queued' ? 'Queued' : 'Synthesizing'}</span>
            </span>
          ) : status === 'completed' ? (
            <span
              data-testid="media-status-completed"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Ready</span>
            </span>
          ) : status === 'failed' ? (
            <span
              data-testid="media-status-failed"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60"
            >
              <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
              <span>Failed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              <span>Not synthesized</span>
            </span>
          )}
        </div>
      </div>

      {/* Body / Content */}
      <div className="relative min-h-[110px] flex items-center justify-center bg-slate-950/70 rounded-lg border border-slate-800/40 overflow-hidden">
        {status === 'processing' || status === 'queued' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="relative w-8 h-8 mb-2">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-[11px] text-cyan-300 font-medium">Generating multimodal asset</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Non-blocking background synthesis</p>
          </div>
        ) : status === 'failed' ? (
          <div className="flex flex-col items-center justify-center p-3 text-center w-full">
            <AlertCircle className="w-6 h-6 text-rose-400 mb-1" />
            <p className="text-[11px] text-rose-300 font-medium">Synthesis Encountered Error</p>
            <p className="text-[9px] text-rose-400/80 mt-0.5 max-w-[200px] truncate" title={errorMessage || 'Provider generation failed'}>
              {errorMessage || 'Generation error'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                data-testid="media-retry-btn"
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-700/60 transition-colors"
              >
                <RotateCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        ) : assetUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {mediaType === 'image' && (
              <div className="relative group w-full h-full min-h-[120px] flex items-center justify-center overflow-hidden">
                <img
                  src={assetUrl}
                  alt={asset?.prompt || 'Generated Asset'}
                  data-testid="media-image-preview"
                  className="w-full h-auto max-h-[160px] object-contain rounded transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}

            {mediaType === 'voice' && (
              <div className="w-full p-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-950/30 border border-amber-800/30 text-[10px] text-amber-200/90">
                  <Mic className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate italic">"{asset?.prompt || 'Narration snippet'}"</span>
                </div>
                <audio
                  controls
                  src={assetUrl}
                  data-testid="media-voice-player"
                  className="w-full h-8 outline-none filter invert contrast-125"
                />
              </div>
            )}

            {mediaType === 'video' && (
              <div className="w-full p-1.5 flex flex-col items-center">
                <video
                  controls
                  playsInline
                  src={assetUrl}
                  data-testid="media-video-player"
                  className="w-full max-h-[150px] rounded bg-black"
                />
              </div>
            )}

            {mediaType === 'audio' && (
              <div className="w-full p-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-950/30 border border-emerald-800/30 text-[10px] text-emerald-200/90">
                  <Music className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate italic">Ambient Atmosphere</span>
                </div>
                <audio
                  controls
                  src={assetUrl}
                  data-testid="media-audio-player"
                  className="w-full h-8 outline-none filter invert contrast-125"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center">
            {renderIcon()}
            <p className="text-[10px] text-slate-500 mt-1">Ready to synthesize</p>
          </div>
        )}
      </div>

      {/* Footer info if completed */}
      {asset && asset.provider_name && (
        <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60 pt-1.5">
          <span className="capitalize">{asset.provider_name} Provider</span>
          {asset.mime_type && <span>{asset.mime_type.split('/')[1]?.toUpperCase()}</span>}
        </div>
      )}
    </motion.div>
  );
};
