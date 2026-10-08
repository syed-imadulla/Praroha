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
      ? 'bg-[#DDE2D2] text-[#294B3A] border-[#294B3A]/30'
      : asset.provider_name === 'flux'
      ? 'bg-[#EFE8EE] text-[#6A4B67] border-[#B399B0]/40'
      : 'bg-[#E9DDBF] text-[#805B20] border-[#C59A55]/40';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
      data-testid="image-lightbox-modal"
    >
      {/* Modal Container */}
      <div
        className="relative flex flex-col max-w-5xl w-full max-h-[92vh] bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-2xl overflow-hidden text-[#294B3A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8CCB7] bg-[#F2EBDD]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base sm:text-lg font-serif font-bold tracking-wide text-[#294B3A] capitalize">
              {asset.entity_type} Visual
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-mono font-semibold min-h-[26px] inline-flex items-center ${providerColor}`}
              data-testid="lightbox-provider-badge"
            >
              {asset.provider_name || 'mock'}
            </span>
            {asset.aspect_ratio && (
              <span
                className="text-xs px-2.5 py-1 rounded-md bg-[#FAF6EE] text-[#394840] font-mono font-medium border border-[#D8CCB7] min-h-[26px] inline-flex items-center"
                data-testid="lightbox-aspect-ratio"
              >
                {asset.aspect_ratio}
              </span>
            )}
            {asset.width && asset.height && (
              <span
                className="text-xs text-[#394840] font-mono hidden sm:inline font-medium"
                data-testid="lightbox-dimensions"
              >
                {asset.width} × {asset.height}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownload}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#F8F4E8] bg-[#294B3A] hover:bg-[#355A46] border border-[#294B3A] rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
              title="Download asset"
              data-testid="lightbox-download-button"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#5F6D63] hover:text-[#294B3A] rounded-xl hover:bg-[#FAF6EE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
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
        <div className="flex-1 flex items-center justify-center p-4 bg-[#FAF6EE] overflow-hidden min-h-[300px]">
          {asset.asset_url ? (
            <img
              src={asset.asset_url}
              alt={asset.prompt || 'Generated visual asset'}
              className="max-h-[58vh] w-auto max-w-full object-contain rounded-xl shadow-xl border border-[#D8CCB7]"
              data-testid="lightbox-image"
            />
          ) : (
            <div className="flex items-center justify-center text-[#5F6D63] text-sm">
              No visual asset preview available
            </div>
          )}
        </div>

        {/* Footer Inspector Drawer */}
        <div className="px-6 py-4 bg-[#F2EBDD] border-t border-[#D8CCB7] space-y-3.5">
          {/* Prompt Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="text-xs font-bold text-[#5F6D63] uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#805B20]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Enriched Generation Prompt
              </div>
              <p
                className="text-sm text-[#294B3A] leading-relaxed font-serif bg-[#FAF6EE] p-3 rounded-xl border border-[#D8CCB7] select-all shadow-xs"
                data-testid="lightbox-prompt-text"
              >
                {asset.prompt}
              </p>
            </div>

            <button
              onClick={handleCopyPrompt}
              className={`shrink-0 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl border transition-all sm:self-center focus:outline-none focus:ring-2 focus:ring-[#294B3A] ${
                copied
                  ? 'bg-[#DDE2D2] text-[#294B3A] border-[#294B3A]/40'
                  : 'bg-[#FAF6EE] hover:bg-[#EAE1D0] text-[#294B3A] border-[#D8CCB7]'
              }`}
              data-testid="lightbox-copy-prompt-button"
            >
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>

          {/* Persisted Metadata Row */}
          <div className="flex flex-wrap items-center justify-between text-[13px] text-[#394840] pt-2.5 border-t border-[#D8CCB7]">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Entity: <span className="text-[#294B3A] font-mono font-semibold">{asset.entity_type}:{asset.entity_id}</span>
              </span>
              {asset.mime_type && (
                <span>
                  MIME: <span className="text-[#294B3A] font-mono font-medium">{asset.mime_type}</span>
                </span>
              )}
            </div>
            <div>
              <span>Generated: <span className="text-[#294B3A] font-medium">{formattedDate}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
