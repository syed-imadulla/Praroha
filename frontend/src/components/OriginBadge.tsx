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
    classes: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/70 hover:bg-cyan-900/80 hover:border-cyan-500 shadow-cyan-950/40',
    accentColor: '#06b6d4',
    dotColor: 'bg-cyan-400',
  },
  SEED_INFERRED: {
    label: 'Seed Inferred',
    shortLabel: 'Inferred',
    description: 'Extrapolated from accepted possibilities in the Seed Potential Map.',
    icon: Sparkles,
    classes: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/70 hover:bg-indigo-900/80 hover:border-indigo-500 shadow-indigo-950/40',
    accentColor: '#6366f1',
    dotColor: 'bg-indigo-400',
  },
  HUMAN_DECISION: {
    label: 'Human Decision',
    shortLabel: 'Creator Choice',
    description: 'Committed creator choice from Stage 4 Decision DNA and custom directives.',
    icon: Compass,
    classes: 'bg-amber-950/70 text-amber-300 border-amber-800/70 hover:bg-amber-900/80 hover:border-amber-500 shadow-amber-950/40',
    accentColor: '#f59e0b',
    dotColor: 'bg-amber-400',
  },
  DERIVED: {
    label: 'Derived',
    shortLabel: 'Canon Law',
    description: 'Logical systemic outgrowth from World Bible physics, geography, and factions.',
    icon: GitBranch,
    classes: 'bg-sky-950/70 text-sky-300 border-sky-800/70 hover:bg-sky-900/80 hover:border-sky-500 shadow-sky-950/40',
    accentColor: '#0284c7',
    dotColor: 'bg-sky-400',
  },
  AI_INTRODUCED: {
    label: 'AI Introduced',
    shortLabel: 'Generative',
    description: 'Novel generative synthesis introduced to expand narrative texture within canon bounds.',
    icon: Bot,
    classes: 'bg-violet-950/70 text-violet-300 border-violet-800/70 hover:bg-violet-900/80 hover:border-violet-500 shadow-violet-950/40',
    accentColor: '#8b5cf6',
    dotColor: 'bg-violet-400',
  },
  USER_ADDED: {
    label: 'User Added',
    shortLabel: 'Refined',
    description: 'Directly authored, modified, or refined by the creator in Stage 7.',
    icon: UserCheck,
    classes: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70 hover:bg-emerald-900/80 hover:border-emerald-500 shadow-emerald-950/40',
    accentColor: '#10b981',
    dotColor: 'bg-emerald-400',
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
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
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
      className={`inline-flex items-center font-mono font-medium rounded-full border transition-all duration-150 select-none ${
        config.classes
      } ${sizeClasses} ${
        interactive
          ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm'
          : 'cursor-default'
      } ${className}`}
      data-testid={`origin-badge origin-badge-${normType.toLowerCase()}`}
      data-origin-type={normType}
    >
      <Icon className={`${iconSizes} flex-shrink-0`} />
      {showLabel && (
        <span className="truncate max-w-[140px]">
          {config.label}
        </span>
      )}
      {interactive && (
        <span
          className="text-[10px] opacity-75 hover:opacity-100 ml-0.5"
          title="Why is this here?"
        >
          ?
        </span>
      )}
    </div>
  );
};
