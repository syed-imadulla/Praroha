import React, { useEffect, useState } from 'react';
import { MediaAsset } from '../types';

interface ImageLightboxModalProps {
  asset: MediaAsset;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ asset, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyPrompt = async () => {
    if (!asset.prompt) return;
    try {
      await navigator.clipboard.writeText(asset.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!asset.asset_url) return;
    const link = document.createElement('a');
    link.href = asset.asset_url;
    const ext = asset.mime_type?.includes('svg')
      ? 'svg'
      : asset.mime_type?.includes('png')
      ? 'png'
      : 'jpg';
    link.download = `seed-unfold-${asset.entity_type}-${asset.entity_id}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = asset.completed_at
    ? new Date(asset.completed_at).toLocaleString()
    : new Date(asset.created_at).toLocaleString();

  const providerColor =
    asset.provider_name === 'pollinations'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : asset.provider_name === 'flux'
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
      data-testid="image-lightbox-modal"
    >
      {/* Modal Container */}
      <div
        className="relative flex flex-col max-w-5xl w-full max-h-[92vh] bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wide text-slate-200 capitalize">
              {asset.entity_type} Visual
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-medium ${providerColor}`}
              data-testid="lightbox-provider-badge"
            >
              {asset.provider_name || 'mock'}
            </span>
            {asset.aspect_ratio && (
              <span
                className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono border border-slate-700"
                data-testid="lightbox-aspect-ratio"
              >
                {asset.aspect_ratio}
              </span>
            )}
            {asset.width && asset.height && (
              <span
                className="text-xs text-slate-400 font-mono hidden sm:inline"
                data-testid="lightbox-dimensions"
              >
                {asset.width} × {asset.height}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 rounded-lg transition-colors"
              title="Download asset"
              data-testid="lightbox-download-button"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              aria-label="Close Lightbox"
              data-testid="lightbox-close-button"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Display Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-950/90 overflow-hidden min-h-[300px]">
          {asset.asset_url ? (
            <img
              src={asset.asset_url}
              alt={asset.prompt || 'Generated visual asset'}
              className="max-h-[58vh] w-auto max-w-full object-contain rounded-lg shadow-xl border border-slate-800"
              data-testid="lightbox-image"
            />
          ) : (
            <div className="flex items-center justify-center text-slate-500 text-sm">
              No visual asset preview available
            </div>
          )}
        </div>

        {/* Footer Inspector Drawer */}
        <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800 space-y-3">
          {/* Prompt Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Enriched Generation Prompt
              </div>
              <p
                className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 select-all"
                data-testid="lightbox-prompt-text"
              >
                {asset.prompt}
              </p>
            </div>

            <button
              onClick={handleCopyPrompt}
              className={`shrink-0 mt-6 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                copied
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              data-testid="lightbox-copy-prompt-button"
            >
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>

          {/* Persisted Metadata Row */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-4">
              <span>
                Entity: <span className="text-slate-300 font-mono">{asset.entity_type}:{asset.entity_id}</span>
              </span>
              {asset.mime_type && (
                <span>
                  MIME: <span className="text-slate-300 font-mono">{asset.mime_type}</span>
                </span>
              )}
            </div>
            <div>
              <span>Generated: <span className="text-slate-300">{formattedDate}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
