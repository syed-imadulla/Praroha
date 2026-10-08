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
    <div className="w-full p-2.5 flex flex-col gap-2 bg-[#F8F4E8] rounded-xl border border-[#D8CCB7]">
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
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] text-xs text-[#294B3A]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Mic className="w-3.5 h-3.5 text-[#C59A55] shrink-0" />
          <span className="truncate italic font-medium">
            "{prompt || asset?.prompt || 'Narration snippet'}"
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopySnippet}
          data-testid="media-voice-copy-btn"
          title="Copy spoken script to clipboard"
          className="shrink-0 p-1.5 rounded-md hover:bg-[#EAE4D4] text-[#A0522D] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-[#355A46]" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#A0522D] hover:text-[#294B3A]" />
          )}
        </button>
      </div>

      {/* Voice Persona & Provider Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div
          data-testid="media-voice-persona-badge"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[#294B3A] font-mono min-h-[26px]"
        >
          <span className="w-2 h-2 rounded-full bg-[#C59A55] animate-pulse" />
          <span className="font-bold">{personaDisplayName}</span>
          <span className="text-[#D8CCB7]">•</span>
          <span className="text-[#466A55] font-medium">{resolvedProvider}</span>
          <span className="text-[#D8CCB7]">•</span>
          <span className="text-[#A0522D] truncate max-w-[130px] font-medium">{voiceId}</span>
        </div>

        {/* Download Action */}
        <a
          href={assetUrl}
          download={`narration-${asset?.entity_id || 'voice'}.mp3`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="media-voice-download-btn"
          title="Download narration audio"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#466A55] hover:text-[#294B3A] bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] transition-colors min-h-[28px]"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </a>
      </div>

      {/* Player transport controls: Play/Pause, Progress Bar, Time Tracker */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={togglePlayPause}
          data-testid="media-voice-play-pause-btn"
          className="w-10 h-10 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
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
            className="w-full h-2 bg-[#E4DBCB] rounded-lg appearance-none cursor-pointer accent-[#355A46] hover:h-2.5 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(53 90 70) ${progressPercent}%, rgb(228 219 203) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Time Tracker */}
        <div
          data-testid="media-voice-time"
          className="text-xs font-mono font-medium text-[#394840] shrink-0 tabular-nums"
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
    <div className="w-full p-2 flex flex-col gap-2 bg-[#F8F4E8] rounded-xl border border-[#D8CCB7]">
      {/* Motion prompt snippet */}
      {effectivePrompt && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] text-xs text-[#294B3A] overflow-hidden">
          <Video className="w-3.5 h-3.5 text-[#6A4B67] shrink-0" />
          <span className="truncate italic font-medium">"{effectivePrompt}"</span>
        </div>
      )}
      {/* Video element and overlay trigger */}
      <div className="relative group w-full bg-[#EAE4D4] rounded-lg overflow-hidden aspect-video flex items-center justify-center">
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
          className="absolute top-2 right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#294B3A]/80 hover:bg-[#294B3A] text-[#F8F4E8] transition-opacity opacity-0 group-hover:opacity-100 backdrop-blur-xs focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#F8F4E8]"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Provider & Technical Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div
          data-testid="media-video-provider-badge"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[#6A4B67] font-mono min-h-[26px]"
        >
          <span className="w-2 h-2 rounded-full bg-[#6A4B67] animate-pulse" />
          <span className="font-bold">{resolvedProvider}</span>
          <span className="text-[#D8CCB7]">•</span>
          <span className="text-[#466A55] font-medium">{aspectRatio}</span>
          <span className="text-[#D8CCB7]">•</span>
          <span className="text-[#6A4B67] font-medium">{effectiveDuration}s</span>
        </div>

        {/* Download MP4 */}
        <a
          href={assetUrl}
          download={`seed-unfold-${asset?.entity_id || 'video'}.mp4`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="media-video-download-btn"
          title="Download MP4 video"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#466A55] hover:text-[#294B3A] bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] transition-colors min-h-[28px]"
        >
          <Download className="w-3 h-3" />
          <span>Download MP4</span>
        </a>
      </div>

      {/* Transport Controls: Play/Pause, Slider, Time Tracker */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={togglePlayPause}
          data-testid="media-video-play-pause-btn"
          className="w-10 h-10 rounded-full bg-[#6A4B67] hover:bg-[#52374F] text-[#F8F4E8] flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6A4B67]"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
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
            className="w-full h-2 bg-[#E4DBCB] rounded-lg appearance-none cursor-pointer accent-[#6A4B67] hover:h-2.5 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(106 75 103) ${progressPercent}%, rgb(228 219 203) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Time Tracker */}
        <div
          data-testid="media-video-time"
          className="text-xs font-mono font-medium text-[#394840] shrink-0 tabular-nums"
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
    <div className="w-full p-2.5 flex flex-col gap-2 bg-[#F8F4E8] rounded-xl border border-[#D8CCB7]">
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
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] text-xs text-[#294B3A]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Music className="w-3.5 h-3.5 text-[#355A46] shrink-0" />
          <span className="truncate italic font-medium">"{effectivePrompt}"</span>
        </div>

        {/* Send to Atmosphere Deck action */}
        <button
          type="button"
          onClick={handleSendToDeck}
          data-testid="media-audio-send-to-deck-btn"
          title="Send soundscape to persistent Atmosphere Deck"
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DDE2D2] hover:bg-[#C8D0BE] text-[#294B3A] border border-[#C8D0BE] transition-colors text-xs font-semibold min-h-[28px] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
        >
          <Radio className="w-3 h-3" />
          <span>Send to Deck</span>
        </button>
      </div>

      {/* Mood, Provider & Download Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="media-audio-mood-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[#294B3A] font-mono capitalize font-bold min-h-[26px]"
          >
            <span className="w-2 h-2 rounded-full bg-[#355A46] animate-pulse" />
            {mood}
          </span>

          <div
            data-testid="media-audio-provider-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-[#466A55] font-mono font-medium min-h-[26px]"
          >
            <span>{resolvedProvider}</span>
            <span className="text-[#D8CCB7]">•</span>
            <span className="capitalize">{mood}</span>
            <span className="text-[#D8CCB7]">•</span>
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#466A55] hover:text-[#294B3A] bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] transition-colors min-h-[28px]"
        >
          <Download className="w-3 h-3" />
          <span>Download {isMp3 ? 'MP3' : 'WAV'}</span>
        </a>
      </div>

      {/* Transport Controls: Play/Pause, Progress Bar, Volume, Time */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={togglePlayPause}
          data-testid="media-audio-play-pause-btn"
          className="w-10 h-10 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#355A46]"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
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
            className="w-full h-2 bg-[#E4DBCB] rounded-lg appearance-none cursor-pointer accent-[#355A46] hover:h-2.5 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(53 90 70) ${progressPercent}%, rgb(228 219 203) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* In-Card Volume Slider */}
        <div className="flex items-center gap-1.5 shrink-0" title={`Volume: ${Math.round(inCardVolume * 100)}%`}>
          <Volume2 className="w-3.5 h-3.5 text-[#466A55]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={inCardVolume}
            onChange={handleVolumeChange}
            data-testid="media-audio-volume"
            aria-label="In-card audio volume slider"
            className="w-14 h-1.5 bg-[#E4DBCB] rounded-lg appearance-none cursor-pointer accent-[#355A46]"
          />
        </div>

        {/* Time Tracker */}
        <div
          data-testid="media-audio-time"
          className="text-xs font-mono font-medium text-[#394840] shrink-0 tabular-nums"
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
        return <ImageIcon className="w-4 h-4 text-[#355A46]" />;
      case 'voice':
        return <Mic className="w-4 h-4 text-[#C59A55]" />;
      case 'video':
        return <Video className="w-4 h-4 text-[#6A4B67]" />;
      case 'audio':
        return <Music className="w-4 h-4 text-[#466A55]" />;
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
      className={`rounded-xl border border-[#D8CCB7] bg-[#F8F4E8] overflow-hidden flex flex-col p-3 transition-all duration-200 hover:border-[#355A46] shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#294B3A]">
          {renderIcon()}
          <span>{getMediaTitle()}</span>
        </div>

        {/* Status Pill */}
        <div>
          {status === 'processing' || status === 'queued' ? (
            <span
              data-testid="media-status-processing"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE] animate-pulse min-h-[24px]"
            >
              <RotateCw className="w-3 h-3 animate-spin text-[#355A46]" />
              <span>{status === 'queued' ? 'Queued' : 'Synthesizing'}</span>
            </span>
          ) : status === 'completed' ? (
            <span
              data-testid="media-status-completed"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE] min-h-[24px]"
            >
              <CheckCircle2 className="w-3 h-3 text-[#355A46]" />
              <span>Ready</span>
            </span>
          ) : status === 'failed' ? (
            <span
              data-testid="media-status-failed"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5E6DC] text-[#B8734F] border border-[#E2BFAC] min-h-[24px]"
            >
              <AlertCircle className="w-3 h-3 text-[#B8734F]" />
              <span>Failed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F2EBDD] text-[#5F6D63] border border-[#D8CCB7] min-h-[24px]">
              <Clock className="w-3 h-3 text-[#5F6D63]" />
              <span>Not synthesized</span>
            </span>
          )}
        </div>
      </div>

      {/* Body / Content */}
      <div className="relative min-h-[120px] flex items-center justify-center bg-[#F2EBDD] rounded-xl border border-[#D8CCB7] overflow-hidden">
        {status === 'processing' || status === 'queued' ? (
          <div className="flex flex-col items-center justify-center p-5 text-center">
            <div className="relative w-9 h-9 mb-2.5">
              <div className="absolute inset-0 rounded-full border-2 border-[#355A46]/20 border-t-[#355A46] animate-spin" />
              <Sparkles className="w-4 h-4 text-[#355A46] absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs text-[#294B3A] font-bold">Generating multimodal asset</p>
            <p className="text-xs text-[#5F6D63] mt-0.5">Non-blocking background synthesis</p>
          </div>
        ) : status === 'failed' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center w-full">
            <AlertCircle className="w-7 h-7 text-[#B8734F] mb-1.5" />
            <p className="text-xs text-[#B8734F] font-bold">Synthesis Encountered Error</p>
            <p className="text-xs text-[#B8734F] mt-0.5 max-w-[240px] truncate" title={errorMessage || 'Provider generation failed'}>
              {errorMessage || 'Generation error'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                data-testid="media-retry-btn"
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5E6DC] hover:bg-[#EAE4D4] text-[#B8734F] border border-[#E2BFAC] transition-colors min-h-[32px] focus:outline-none focus:ring-1 focus:ring-[#B8734F]"
              >
                <RotateCw className="w-3.5 h-3.5" />
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
                className="relative group w-full h-full min-h-[130px] flex items-center justify-center overflow-hidden cursor-pointer"
                title="Click to expand in Lightbox"
              >
                <img
                  src={assetUrl}
                  alt={asset?.prompt || 'Generated Asset'}
                  data-testid="media-image-preview"
                  className="w-full h-auto max-h-[180px] object-contain rounded transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#294B3A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-[#F8F4E8] font-medium backdrop-blur-2xs pointer-events-none">
                  <Maximize2 className="w-4 h-4 text-[#F8F4E8]" />
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
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {renderIcon()}
            <p className="text-xs text-[#5F6D63] font-medium mt-1.5">Ready to synthesize</p>
          </div>
        )}
      </div>

      {/* Footer info if completed */}
      {asset && asset.provider_name && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#5F6D63] border-t border-[#D8CCB7] pt-2 font-medium">
          <span className="capitalize">{asset.provider_name} Provider</span>
          {asset.mime_type && <span className="font-mono">{asset.mime_type.split('/')[1]?.toUpperCase()}</span>}
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
