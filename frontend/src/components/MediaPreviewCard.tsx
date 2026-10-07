import React, { useState, useEffect } from 'react';
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
  Maximize2,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Radio,
  Volume2,
} from 'lucide-react';
import { MediaAsset, MediaJobResponse, MediaType, CURATED_VOICE_PERSONAS } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ImageLightboxModal } from './ImageLightboxModal';
import { VideoLightboxModal } from './VideoLightboxModal';

interface NarrativeAudioPlayerProps {
  assetUrl: string;
  prompt?: string;
  asset?: MediaAsset;
  job?: MediaJobResponse;
}

const NarrativeAudioPlayer: React.FC<NarrativeAudioPlayerProps> = ({
  assetUrl,
  prompt,
  asset,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const registerMediaBlocker = useWorkspaceStore((state) => state.registerMediaBlocker);
  const unregisterMediaBlocker = useWorkspaceStore((state) => state.unregisterMediaBlocker);

  // Unregister voice blocker when component unmounts
  useEffect(() => {
    return () => {
      unregisterMediaBlocker('voice');
    };
  }, [unregisterMediaBlocker]);

  // Parse consistent metadata
  let metadata: any = {};
  if (asset?.metadata_json) {
    try {
      metadata = JSON.parse(asset.metadata_json);
    } catch {
      // ignore
    }
  }

  const voiceId = metadata.voice_id || 'default';
  const rawPersona = metadata.persona || (voiceId !== 'default' ? voiceId : 'narrator-deep');
  const matchedPersona = CURATED_VOICE_PERSONAS.find(
    (p) => p.id === rawPersona || p.voice === voiceId
  );
  const personaDisplayName =
    matchedPersona?.name ||
    (rawPersona
      ? rawPersona.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Narrator');
  const resolvedProvider = metadata.resolved_provider || asset?.provider_name || 'edge-tts';
  const effectiveDuration = duration > 0 ? duration : (metadata.duration_sec || 0);

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleCopySnippet = async () => {
    const textToCopy = prompt || asset?.prompt || 'Vocal Narration';
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;

  return (
    <div className="w-full p-2.5 flex flex-col gap-2 bg-slate-950/80 rounded-lg border border-amber-900/30">
      {/* Audio element (hidden, with data-testid for compatibility) */}
      <audio
        ref={audioRef}
        src={assetUrl}
        data-testid="media-voice-player"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          registerMediaBlocker('voice');
        }}
        onPause={() => {
          setIsPlaying(false);
          unregisterMediaBlocker('voice');
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          unregisterMediaBlocker('voice');
        }}
        className="hidden"
      />

      {/* Script snippet banner with 1-click copy */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-amber-950/40 border border-amber-800/40 text-[10px] text-amber-200/90">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Mic className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate italic">
            "{prompt || asset?.prompt || 'Narration snippet'}"
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopySnippet}
          data-testid="media-voice-copy-btn"
          title="Copy spoken script to clipboard"
          className="shrink-0 p-1 rounded hover:bg-amber-900/50 text-amber-300 transition-colors"
        >
          {isCopied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3 text-amber-400/80 hover:text-amber-300" />
          )}
        </button>
      </div>

      {/* Voice Persona & Provider Badge */}
      <div className="flex items-center justify-between gap-1 text-[9px]">
        <div
          data-testid="media-voice-persona-badge"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-amber-800/50 text-amber-300 font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold">{personaDisplayName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{resolvedProvider}</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-400/70 truncate max-w-[110px]">{voiceId}</span>
        </div>

        {/* Download Action */}
        <a
          href={assetUrl}
          download={`narration-${asset?.entity_id || 'voice'}.mp3`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="media-voice-download-btn"
          title="Download narration audio"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-400 hover:text-amber-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-700/50 transition-colors"
        >
          <Download className="w-2.5 h-2.5" />
          <span>Download</span>
        </a>
      </div>

      {/* Player transport controls: Play/Pause, Progress Bar, Time Tracker */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={togglePlayPause}
          data-testid="media-voice-play-pause-btn"
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-950/50 transition-transform active:scale-95"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Interactive Scrubbable Progress Bar */}
        <div className="flex-1 relative flex items-center group">
          <input
            type="range"
            min="0"
            max={effectiveDuration > 0 ? effectiveDuration : 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            onInput={handleSeek}
            data-testid="media-voice-progress"
            aria-label="Audio progress slider"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(245 158 11) ${progressPercent}%, rgb(30 41 59) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Time Tracker */}
        <div
          data-testid="media-voice-time"
          className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums"
        >
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </div>
      </div>
    </div>
  );
};

interface NarrativeVideoPlayerProps {
  assetUrl: string;
  prompt?: string;
  asset?: MediaAsset;
  job?: MediaJobResponse;
  onOpenLightbox?: () => void;
}

const NarrativeVideoPlayer: React.FC<NarrativeVideoPlayerProps> = ({
  assetUrl,
  prompt,
  asset,
  onOpenLightbox,
}) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const registerMediaBlocker = useWorkspaceStore((state) => state.registerMediaBlocker);
  const unregisterMediaBlocker = useWorkspaceStore((state) => state.unregisterMediaBlocker);

  // Unregister video blocker when component unmounts
  useEffect(() => {
    return () => {
      unregisterMediaBlocker('video');
    };
  }, [unregisterMediaBlocker]);

  let metadata: any = {};
  if (asset?.metadata_json) {
    try {
      metadata = JSON.parse(asset.metadata_json);
    } catch {
      // ignore
    }
  }

  const resolvedProvider = metadata.resolved_provider || asset?.provider_name || 'mock';
  const effectiveDuration = duration > 0 ? duration : (metadata.duration_sec || 5);
  const aspectRatio = metadata.aspect_ratio || asset?.aspect_ratio || '16:9';

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const effectivePrompt = prompt || asset?.prompt;

  return (
    <div className="w-full p-2 flex flex-col gap-2 bg-slate-950/80 rounded-lg border border-purple-900/30">
      {/* Motion prompt snippet */}
      {effectivePrompt && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-950/30 border border-purple-800/30 text-[9px] text-purple-200/90 overflow-hidden">
          <Video className="w-2.5 h-2.5 text-purple-400 shrink-0" />
          <span className="truncate italic">"{effectivePrompt}"</span>
        </div>
      )}
      {/* Video element and overlay trigger */}
      <div className="relative group w-full bg-black rounded overflow-hidden aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          src={assetUrl}
          playsInline
          data-testid="media-video-player"
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current && videoRef.current.duration) {
              setDuration(videoRef.current.duration);
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            registerMediaBlocker('video');
          }}
          onPause={() => {
            setIsPlaying(false);
            unregisterMediaBlocker('video');
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
            unregisterMediaBlocker('video');
          }}
          className="w-full h-full object-contain"
        />

        {/* Lightbox Trigger Overlay */}
        <button
          type="button"
          onClick={onOpenLightbox}
          data-testid="media-video-lightbox-trigger"
          title="Open Theater Lightbox"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Provider & Technical Badges */}
      <div className="flex items-center justify-between gap-1 text-[9px]">
        <div
          data-testid="media-video-provider-badge"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-purple-800/50 text-purple-300 font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="font-semibold">{resolvedProvider}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{aspectRatio}</span>
          <span className="text-slate-500">•</span>
          <span className="text-purple-400/80">{effectiveDuration}s</span>
        </div>

        {/* Download MP4 */}
        <a
          href={assetUrl}
          download={`seed-unfold-${asset?.entity_id || 'video'}.mp4`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="media-video-download-btn"
          title="Download MP4 video"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-400 hover:text-purple-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-700/50 transition-colors"
        >
          <Download className="w-2.5 h-2.5" />
          <span>Download MP4</span>
        </a>
      </div>

      {/* Transport Controls: Play/Pause, Slider, Time Tracker */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={togglePlayPause}
          data-testid="media-video-play-pause-btn"
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-950/50 transition-transform active:scale-95"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Progress Slider */}
        <div className="flex-1 relative flex items-center group">
          <input
            type="range"
            min="0"
            max={effectiveDuration > 0 ? effectiveDuration : 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            onInput={handleSeek}
            data-testid="media-video-progress"
            aria-label="Video progress slider"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(168 85 247) ${progressPercent}%, rgb(30 41 59) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Time Tracker */}
        <div
          data-testid="media-video-time"
          className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums"
        >
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </div>
      </div>
    </div>
  );
};

interface NarrativeAudioAtmospherePlayerProps {
  assetUrl: string;
  prompt?: string;
  asset?: MediaAsset;
  job?: MediaJobResponse;
}

const NarrativeAudioAtmospherePlayer: React.FC<NarrativeAudioAtmospherePlayerProps> = ({
  assetUrl,
  prompt,
  asset,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [inCardVolume, setInCardVolume] = useState(0.8);

  const setAtmosphereTrack = useWorkspaceStore((state) => state.setAtmosphereTrack);

  let metadata: any = {};
  if (asset?.metadata_json) {
    try {
      metadata = JSON.parse(asset.metadata_json);
    } catch {
      // ignore
    }
  }

  const mood = metadata.mood || 'ambient';
  const resolvedProvider = metadata.resolved_provider || asset?.provider_name || 'mock';
  const effectiveDuration = duration > 0 ? duration : (metadata.duration_sec || 15);

  // Derives file extension from mime_type dynamically
  const isMp3 = asset?.mime_type === 'audio/mpeg' || assetUrl.endsWith('.mp3');
  const fileExt = isMp3 ? '.mp3' : '.wav';
  const downloadFilename = `atmosphere-${asset?.entity_id || 'soundscape'}${fileExt}`;

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setInCardVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleSendToDeck = () => {
    if (asset) {
      setAtmosphereTrack(asset);
    }
  };

  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const effectivePrompt = prompt || asset?.prompt || 'Ambient Soundscape';

  return (
    <div className="w-full p-2.5 flex flex-col gap-2 bg-slate-950/80 rounded-lg border border-cyan-900/40">
      <audio
        ref={audioRef}
        src={assetUrl}
        data-testid="media-audio-player"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
            audioRef.current.volume = inCardVolume;
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        className="hidden"
      />

      {/* Track Snippet Header with Send-To-Deck */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-[10px] text-cyan-200/90">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Music className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate italic">"{effectivePrompt}"</span>
        </div>

        {/* Send to Atmosphere Deck action */}
        <button
          type="button"
          onClick={handleSendToDeck}
          data-testid="media-audio-send-to-deck-btn"
          title="Send soundscape to persistent Atmosphere Deck"
          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors text-[9px] font-medium"
        >
          <Radio className="w-2.5 h-2.5" />
          <span>Send to Deck</span>
        </button>
      </div>

      {/* Mood, Provider & Download Badges */}
      <div className="flex items-center justify-between gap-1 text-[9px]">
        <div className="flex items-center gap-1.5">
          <span
            data-testid="media-audio-mood-badge"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-cyan-800/50 text-cyan-300 font-mono capitalize"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {mood}
          </span>

          <div
            data-testid="media-audio-provider-badge"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono"
          >
            <span>{resolvedProvider}</span>
            <span>•</span>
            <span className="capitalize">{mood}</span>
            <span>•</span>
            <span>{effectiveDuration}s</span>
          </div>
        </div>

        {/* Download Button (Dynamic extension derivation) */}
        <a
          href={assetUrl}
          download={downloadFilename}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="media-audio-download-btn"
          title={`Download ${isMp3 ? 'MP3' : 'WAV'} audio`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-400 hover:text-cyan-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/50 transition-colors"
        >
          <Download className="w-2.5 h-2.5" />
          <span>Download {isMp3 ? 'MP3' : 'WAV'}</span>
        </a>
      </div>

      {/* Transport Controls: Play/Pause, Progress Bar, Volume, Time */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={togglePlayPause}
          data-testid="media-audio-play-pause-btn"
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-950/50 transition-transform active:scale-95"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Progress Slider */}
        <div className="flex-1 relative flex items-center group">
          <input
            type="range"
            min="0"
            max={effectiveDuration > 0 ? effectiveDuration : 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            onInput={handleSeek}
            data-testid="media-audio-progress"
            aria-label="Audio progress slider"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(6 182 212) ${progressPercent}%, rgb(30 41 59) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* In-Card Volume Slider */}
        <div className="flex items-center gap-1 shrink-0" title={`Volume: ${Math.round(inCardVolume * 100)}%`}>
          <Volume2 className="w-3 h-3 text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={inCardVolume}
            onChange={handleVolumeChange}
            data-testid="media-audio-volume"
            aria-label="In-card audio volume slider"
            className="w-12 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Time Tracker */}
        <div
          data-testid="media-audio-time"
          className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums"
        >
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </div>
      </div>
    </div>
  );
};

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoLightboxOpen, setIsVideoLightboxOpen] = useState(false);
  const status = isGenerating
    ? 'processing'
    : job?.status || asset?.status || 'idle';
  const assetUrl = job?.asset_url || asset?.asset_url;
  const errorMessage = job?.error_message || asset?.error_message;

  const activeAsset: MediaAsset | undefined =
    asset ||
    (job && job.asset_url
      ? {
          id: job.job_id,
          project_id: '',
          entity_type: job.entity_type,
          entity_id: job.entity_id,
          media_type: mediaType,
          status: job.status,
          asset_url: job.asset_url,
          prompt: '',
          provider_name: 'mock',
          created_at: new Date().toISOString(),
        }
      : undefined);

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
              <div
                onClick={() => activeAsset && setIsLightboxOpen(true)}
                data-testid="media-image-lightbox-trigger"
                className="relative group w-full h-full min-h-[120px] flex items-center justify-center overflow-hidden cursor-pointer"
                title="Click to expand in Lightbox"
              >
                <img
                  src={assetUrl}
                  alt={asset?.prompt || 'Generated Asset'}
                  data-testid="media-image-preview"
                  className="w-full h-auto max-h-[160px] object-contain rounded transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-medium backdrop-blur-[2px] pointer-events-none">
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>Click to Expand</span>
                </div>
              </div>
            )}

            {mediaType === 'voice' && (
              <NarrativeAudioPlayer
                assetUrl={assetUrl}
                prompt={asset?.prompt}
                asset={activeAsset}
                job={job}
              />
            )}

            {mediaType === 'video' && (
              <NarrativeVideoPlayer
                assetUrl={assetUrl}
                prompt={asset?.prompt}
                asset={activeAsset}
                job={job}
                onOpenLightbox={() => activeAsset && setIsVideoLightboxOpen(true)}
              />
            )}

            {mediaType === 'audio' && (
              <NarrativeAudioAtmospherePlayer
                assetUrl={assetUrl}
                prompt={asset?.prompt}
                asset={activeAsset}
                job={job}
              />
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

      {/* Interactive Lightbox Modals */}
      {isLightboxOpen && activeAsset && (
        <ImageLightboxModal
          asset={activeAsset}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      {isVideoLightboxOpen && activeAsset && (
        <VideoLightboxModal
          asset={activeAsset}
          onClose={() => setIsVideoLightboxOpen(false)}
        />
      )}
    </motion.div>
  );
};
