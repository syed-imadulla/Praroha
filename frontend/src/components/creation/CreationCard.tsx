import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Music,
  Play,
  MessageSquare,
  MoreHorizontal,
  Heart,
  Archive,
  Trash2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type {
  CreationAction,
  CreationCardProps,
  CreationType,
} from './types';
import { normalizeCreationType } from './types';

interface ContentTypeStyle {
  label: string;
  accentColor: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  IconComponent: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  gradientClass: string;
  placeholderHint: string;
}

const TYPE_CONFIG: Record<CreationType, ContentTypeStyle> = {
  image: {
    label: 'Image',
    accentColor: '#294B3A',
    accentBg: '#DDE2D2',
    badgeBg: 'bg-[#DDE2D2]',
    badgeText: 'text-[#294B3A]',
    IconComponent: ImageIcon,
    gradientClass: 'from-[#DDE2D2]/50 via-[#F2EBDD]/60 to-[#F8F4E8]',
    placeholderHint: 'Visual illustration',
  },
  story: {
    label: 'Story',
    accentColor: '#A0522D',
    accentBg: '#E8D5C4',
    badgeBg: 'bg-[#E8D5C4]',
    badgeText: 'text-[#A0522D]',
    IconComponent: FileText,
    gradientClass: 'from-[#E8D5C4]/50 via-[#F2EBDD]/60 to-[#F8F4E8]',
    placeholderHint: 'World chronicle',
  },
  sound: {
    label: 'Sound',
    accentColor: '#6A4B67',
    accentBg: '#DCCDD8',
    badgeBg: 'bg-[#DCCDD8]',
    badgeText: 'text-[#6A4B67]',
    IconComponent: Music,
    gradientClass: 'from-[#DCCDD8]/50 via-[#F2EBDD]/60 to-[#F8F4E8]',
    placeholderHint: 'Acoustic soundscape',
  },
  video: {
    label: 'Video',
    accentColor: '#294B3A',
    accentBg: '#DDE2D2',
    badgeBg: 'bg-[#DDE2D2]',
    badgeText: 'text-[#294B3A]',
    IconComponent: Play,
    gradientClass: 'from-[#DDE2D2]/50 via-[#F2EBDD]/60 to-[#F8F4E8]',
    placeholderHint: 'Cinematic reel',
  },
  chat: {
    label: 'Chat',
    accentColor: '#B8734F',
    accentBg: '#E9DDBF',
    badgeBg: 'bg-[#E9DDBF]',
    badgeText: 'text-[#A0522D]',
    IconComponent: MessageSquare,
    gradientClass: 'from-[#E9DDBF]/50 via-[#F2EBDD]/60 to-[#F8F4E8]',
    placeholderHint: 'Botanical dialogue',
  },
};

export const CreationCard: React.FC<CreationCardProps> = ({
  creation,
  variant = 'default',
  actions,
  showFavoriteButton = true,
  onOpen,
  onToggleFavorite,
  onAction,
  className = '',
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(creation.isFavorite));
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsFavorite(Boolean(creation.isFavorite));
  }, [creation.isFavorite]);

  const contentType = normalizeCreationType(creation.type);
  const typeStyle = TYPE_CONFIG[contentType];
  const { IconComponent } = typeStyle;

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Default actions when parent does not supply custom ones
  const resolvedActions: CreationAction[] = actions || [
    {
      key: 'open',
      label: 'Open',
      icon: <ExternalLink className="w-4 h-4 stroke-[2]" />,
      onClick: () => onOpen?.(creation),
    },
    {
      key: 'favorite',
      label: isFavorite ? 'Unfavorite' : 'Favorite',
      icon: (
        <Heart
          className={`w-4 h-4 stroke-[2] ${
            isFavorite ? 'fill-[#294B3A] text-[#294B3A]' : ''
          }`}
        />
      ),
      onClick: () => {
        const next = !isFavorite;
        setIsFavorite(next);
        const updated = { ...creation, isFavorite: next };
        if (onToggleFavorite) {
          onToggleFavorite(updated);
        } else {
          onAction?.('favorite', updated);
        }
      },
    },
    {
      key: 'archive',
      label: creation.isArchived ? 'Unarchive' : 'Archive',
      icon: <Archive className="w-4 h-4 stroke-[2]" />,
      onClick: () => onAction?.('archive', creation),
    },
    {
      key: 'delete',
      label: 'Move to Graveyard',
      icon: <Trash2 className="w-4 h-4 stroke-[2]" />,
      isDestructive: true,
      onClick: () => onAction?.('delete', creation),
    },
  ];

  const handleCardClick = () => {
    onOpen?.(creation);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.(creation);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    const updated = { ...creation, isFavorite: next };
    if (onToggleFavorite) {
      onToggleFavorite(updated);
    } else {
      onAction?.('favorite', updated);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleActionClick = (e: React.MouseEvent, action: CreationAction) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (action.onClick) {
      action.onClick(creation);
    } else {
      onAction?.(action.key, creation);
    }
  };

  const hasValidImage = Boolean(creation.imageUrl && !hasImageError);

  return (
    <article
      data-testid={`creation-card-${creation.id}`}
      data-content-type={contentType}
      className={`card-botanical group relative flex flex-col p-3 sm:p-3.5 select-none cursor-pointer transition-all duration-180 hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#294B3A] ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${creation.title}, ${typeStyle.label} creation`}
    >
      {/* 16:9 Thumbnail Area */}
      <div className="relative aspect-16/9 w-full rounded-[13px] overflow-hidden bg-[#E8E0D0] mb-2.5">
        {hasValidImage ? (
          <img
            src={creation.imageUrl}
            alt={creation.title}
            onError={() => setHasImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Calm Content-Type-Specific Botanical Placeholder */
          <div
            data-testid="creation-card-placeholder"
            className={`w-full h-full bg-gradient-to-br ${typeStyle.gradientClass} flex flex-col items-center justify-center p-3 text-center relative overflow-hidden`}
          >
            {/* Subtle background decorative rings */}
            <div
              className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full border border-black/5 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -left-3 -top-3 w-16 h-16 rounded-full border border-black/5 pointer-events-none"
              aria-hidden="true"
            />

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs mb-1.5 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: typeStyle.accentBg, color: typeStyle.accentColor }}
            >
              <IconComponent className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-sans font-medium opacity-75"
              style={{ color: typeStyle.accentColor }}
            >
              {typeStyle.placeholderHint}
            </span>
          </div>
        )}

        {/* Content-Type Badge Overlay (Top Left) */}
        <div
          data-testid="creation-type-badge"
          className={`absolute top-2.5 left-2.5 h-7 px-2 rounded-full ${typeStyle.badgeBg} ${typeStyle.badgeText} shadow-xs flex items-center gap-1.5 backdrop-blur-[2px] transition-transform duration-180`}
        >
          <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
          <span className="text-[11px] font-medium tracking-wide uppercase font-sans">
            {typeStyle.label}
          </span>
        </div>

        {/* Favorite Button (Top Right) */}
        {showFavoriteButton && variant !== 'graveyard' && (
          <button
            type="button"
            data-testid="creation-favorite-button"
            onClick={handleFavoriteClick}
            aria-label={
              isFavorite
                ? `Remove ${creation.title} from favorites`
                : `Add ${creation.title} to favorites`
            }
            className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center rounded-full text-[#718875] hover:text-[#294B3A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#294B3A]"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-xs transition-colors ${
                isFavorite
                  ? 'bg-[#F8F4E8] text-[#294B3A] shadow-xs'
                  : 'bg-[#F8F4E8]/80 text-[#718875] hover:bg-[#F8F4E8] hover:text-[#294B3A]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 stroke-[2] transition-colors ${
                  isFavorite ? 'fill-[#294B3A] text-[#294B3A]' : ''
                }`}
              />
            </div>
          </button>
        )}
      </div>

      {/* Content Info (Title, Metadata & Context Menu) */}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0 flex-1">
          <h3
            data-testid="creation-card-title"
            className="font-serif font-bold text-[15.5px] sm:text-[16px] text-[#294B3A] leading-snug truncate"
            title={creation.title}
          >
            {creation.title}
          </h3>
          <p
            data-testid="creation-card-meta"
            className="text-[12px] font-sans text-[#718875] mt-0.5 truncate flex items-center gap-1"
          >
            <span>{typeStyle.label}</span>
            <span className="opacity-50" aria-hidden="true">
              ·
            </span>
            <span>
              {variant === 'graveyard' && creation.deletedAt
                ? `Deleted ${creation.deletedAt}`
                : creation.timestamp}
            </span>
          </p>
        </div>

        {/* 3-Dot Context Menu Button (Min 44x44px Hit Target) */}
        <div className="relative shrink-0 -mr-1.5 -mt-1" ref={menuRef}>
          <button
            type="button"
            data-testid="creation-menu-trigger"
            onClick={handleMenuToggle}
            aria-label={`Options for ${creation.title}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#718875] hover:text-[#294B3A] hover:bg-[#E8E0D0]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#294B3A]"
          >
            <MoreHorizontal className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Context Menu Dropdown */}
          {isMenuOpen && (
            <div
              data-testid="creation-context-menu"
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 top-10 w-44 rounded-[14px] bg-[#F8F4E8] border border-[#D8CCB7] shadow-lg py-1.5 z-30 focus:outline-none"
            >
              {resolvedActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  role="menuitem"
                  data-testid={`creation-action-${action.key}`}
                  onClick={(e) => handleActionClick(e, action)}
                  className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm font-sans flex items-center gap-2.5 transition-colors focus:outline-none focus-visible:bg-[#E8E0D0] ${
                    action.isDestructive
                      ? 'text-[#B85C46] hover:bg-[#F1DDD5]/60 hover:text-[#B85C46]'
                      : 'text-[#294B3A] hover:bg-[#E8E0D0]/60'
                  }`}
                >
                  {action.icon && <span className="shrink-0">{action.icon}</span>}
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Graveyard Quick Action Buttons (if graveyard variant) */}
      {variant === 'graveyard' && (
        <div
          data-testid="graveyard-actions"
          className="flex items-center gap-2 mt-2 pt-2 border-t border-[#D8CCB7]/60"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            data-testid="graveyard-restore-btn"
            onClick={() => onAction?.('restore', creation)}
            className="flex-1 py-1.5 px-2.5 rounded-[12px] bg-[#DDE2D2] text-[#294B3A] hover:bg-[#355A46] hover:text-[#F8F4E8] text-xs font-medium font-sans flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#294B3A]"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
            <span>Restore</span>
          </button>
          <button
            type="button"
            data-testid="graveyard-delete-btn"
            onClick={() => onAction?.('delete_permanently', creation)}
            className="flex-1 py-1.5 px-2.5 rounded-[12px] bg-[#F1DDD5] text-[#B85C46] hover:bg-[#B85C46] hover:text-white text-xs font-medium font-sans flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C46]"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
            <span>Delete permanently</span>
          </button>
        </div>
      )}
    </article>
  );
};
