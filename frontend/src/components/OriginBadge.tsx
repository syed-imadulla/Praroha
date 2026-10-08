import React from 'react';
import {
  Anchor,
  Sparkles,
  Compass,
  GitBranch,
  Bot,
  UserCheck,
} from 'lucide-react';
import type { OriginType } from '../types';

interface OriginConfig {
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  classes: string;
  accentColor: string;
  dotColor: string;
}

export const ORIGIN_CONFIG: Record<OriginType, OriginConfig> = {
  SEED_EXPLICIT: {
    label: 'Seed Explicit',
    shortLabel: 'Seed Anchor',
    description: 'Directly grounded in nouns or verbs from your original premise.',
    icon: Anchor,
    classes: 'bg-[#DDE2D2] text-[#294B3A] border-[#C8D0BE] hover:bg-[#C8D0BE] hover:border-[#355A46]',
    accentColor: '#355A46',
    dotColor: 'bg-[#355A46]',
  },
  SEED_INFERRED: {
    label: 'Seed Inferred',
    shortLabel: 'Inferred',
    description: 'Extrapolated from accepted possibilities in the Seed Potential Map.',
    icon: Sparkles,
    classes: 'bg-[#F2EBDD] text-[#466A55] border-[#D8CCB7] hover:bg-[#EAE4D4] hover:border-[#C8D0BE]',
    accentColor: '#466A55',
    dotColor: 'bg-[#466A55]',
  },
  HUMAN_DECISION: {
    label: 'Human Decision',
    shortLabel: 'Creator Choice',
    description: 'Committed creator choice from Stage 4 Decision DNA and custom directives.',
    icon: Compass,
    classes: 'bg-[#E9DDBF] text-[#805B20] border-[#D8C79D] hover:bg-[#DFCFA7] hover:border-[#C59A55]',
    accentColor: '#C59A55',
    dotColor: 'bg-[#C59A55]',
  },
  DERIVED: {
    label: 'Derived',
    shortLabel: 'Canon Law',
    description: 'Logical systemic outgrowth from World Bible physics, geography, and factions.',
    icon: GitBranch,
    classes: 'bg-[#EFE8EE] text-[#6A4B67] border-[#D1BECD] hover:bg-[#E4D9E2] hover:border-[#6A4B67]',
    accentColor: '#6A4B67',
    dotColor: 'bg-[#6A4B67]',
  },
  AI_INTRODUCED: {
    label: 'AI Introduced',
    shortLabel: 'Generative',
    description: 'Novel generative synthesis introduced to expand narrative texture within canon bounds.',
    icon: Bot,
    classes: 'bg-[#F5E6DC] text-[#B8734F] border-[#E2BFAC] hover:bg-[#EDD5C7] hover:border-[#B8734F]',
    accentColor: '#B8734F',
    dotColor: 'bg-[#B8734F]',
  },
  USER_ADDED: {
    label: 'User Added',
    shortLabel: 'Refined',
    description: 'Directly authored, modified, or refined by the creator in Stage 7.',
    icon: UserCheck,
    classes: 'bg-[#DDE2D2] text-[#294B3A] border-[#C8D0BE] hover:bg-[#C8D0BE] hover:border-[#355A46]',
    accentColor: '#294B3A',
    dotColor: 'bg-[#294B3A]',
  },
};

export interface OriginBadgeProps {
  originType?: OriginType | string;
  originSource?: string | null;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export const OriginBadge: React.FC<OriginBadgeProps> = ({
  originType,
  originSource,
  interactive = false,
  onClick,
  size = 'sm',
  showLabel = true,
  className = '',
  showTooltip = true,
}) => {
  const normType = (originType || 'AI_INTRODUCED') as OriginType;
  const config = ORIGIN_CONFIG[normType] || ORIGIN_CONFIG.AI_INTRODUCED;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs gap-1 min-h-[24px]',
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[28px]',
    md: 'px-3.5 py-1.5 text-[13px] gap-2 min-h-[32px]',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  const tooltipText = originSource
    ? `${config.label}: ${originSource}`
    : `${config.label} — ${config.description}`;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={showTooltip ? tooltipText : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      className={`inline-flex items-center font-sans font-medium rounded-full border transition-all duration-150 select-none ${
        config.classes
      } ${sizeClasses} ${
        interactive
          ? 'cursor-pointer hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#355A46] focus:ring-offset-2'
          : 'cursor-default'
      } ${className}`}
      data-testid={`origin-badge origin-badge-${normType.toLowerCase()}`}
      data-origin-type={normType}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      {showLabel && (
        <span className="whitespace-nowrap tracking-tight">
          {config.label}
        </span>
      )}
      {interactive && (
        <span
          className="text-xs font-semibold ml-0.5 opacity-80 hover:opacity-100"
          title="Why is this here?"
        >
          ?
        </span>
      )}
    </div>
  );
};
