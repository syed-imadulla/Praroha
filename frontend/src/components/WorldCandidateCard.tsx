import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Palette,
  Flame,
  Scale,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { WorldCandidateRead } from '../types';

interface WorldCandidateCardProps {
  candidate: WorldCandidateRead;
  index: number; // 0, 1, 2
  isSelected?: boolean;
  isDimmed?: boolean;
  isSelectable?: boolean;
  actionLabel?: string;
  onSelect?: (candidate: WorldCandidateRead) => void;
  selectionDisabled?: boolean;
}

export const WorldCandidateCard: React.FC<WorldCandidateCardProps> = ({
  candidate,
  index,
  isSelected = false,
  isDimmed = false,
  isSelectable = false,
  actionLabel,
  onSelect,
  selectionDisabled = false,
}) => {
  const candidateNumber = String(candidate.candidate_index || index + 1).padStart(2, '0');

  // Theme configuration according to D-08 (Cyan, Emerald, Amber)
  const themeStyles = [
    {
      // Index 1: Cyan (Mythic / Ancient)
      border: 'border-cyan-500/40 hover:border-cyan-400/80',
      activeBorder: 'border-cyan-400 ring-2 ring-cyan-400/30',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.15)]',
      accentBg: 'bg-cyan-950/40',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      iconColor: 'text-cyan-400',
      titleColor: 'text-cyan-200 group-hover:text-cyan-100',
      headerGlow: 'from-cyan-500/10 to-transparent',
      chipColor: 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300',
    },
    {
      // Index 2: Emerald (Ecological / Organic)
      border: 'border-emerald-500/40 hover:border-emerald-400/80',
      activeBorder: 'border-emerald-400 ring-2 ring-emerald-400/30',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      accentBg: 'bg-emerald-950/40',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-200 group-hover:text-emerald-100',
      headerGlow: 'from-emerald-500/10 to-transparent',
      chipColor: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
    },
    {
      // Index 3: Amber (Technological / Retro)
      border: 'border-amber-500/40 hover:border-amber-400/80',
      activeBorder: 'border-amber-400 ring-2 ring-amber-400/30',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      accentBg: 'bg-amber-950/40',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-200 group-hover:text-amber-100',
      headerGlow: 'from-amber-500/10 to-transparent',
      chipColor: 'bg-amber-950/60 border-amber-800/60 text-amber-300',
    },
  ];

  const currentTheme = themeStyles[index % themeStyles.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className={`group relative flex flex-col justify-between rounded-2xl glass-card border backdrop-blur-xl transition-all duration-300 ${
        isDimmed ? 'opacity-60 grayscale-[25%] hover:opacity-95 hover:grayscale-0' : 'opacity-100'
      } ${
        isSelected
          ? `${currentTheme.activeBorder} ${currentTheme.glow} ring-2 ring-cyan-400 bg-canvas-card/95 scale-[1.01] shadow-[0_0_35px_rgba(6,182,212,0.25)]`
          : `${currentTheme.border} hover:${currentTheme.glow} bg-canvas-card/60`
      }`}
    >
      {/* Chosen Direction Badge */}
      {isSelected && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-glow-cyan border border-white/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
          <span>Chosen Direction</span>
        </div>
      )}

      {/* Top ambient color gradient strip */}
      <div
        className={`absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b ${currentTheme.headerGlow} pointer-events-none`}
      />

      <div className="relative p-5 sm:p-6 space-y-5 flex-1 flex flex-col">
        {/* Header: Candidate badge & Archetype tag */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wide ${currentTheme.badgeBg}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Candidate {candidateNumber}</span>
          </div>

          <div
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border font-sans truncate max-w-[180px] ${currentTheme.chipColor}`}
            title={candidate.archetype}
          >
            {candidate.archetype}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3
            className={`text-xl font-bold font-sans tracking-tight transition-colors ${currentTheme.titleColor}`}
          >
            {candidate.title}
          </h3>
        </div>

        {/* High-Concept Logline */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className={`w-3 h-3 ${currentTheme.iconColor}`} />
            <span>High-Concept Premise</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            "{candidate.concept}"
          </p>
        </div>

        {/* Key Dimensions Stack */}
        <div className="space-y-3.5 flex-1 text-xs">
          {/* Aesthetic & Mood */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <Palette className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Aesthetic & Atmosphere</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-5 text-[11.5px]">
              {candidate.aesthetic}
            </p>
          </div>

          {/* Core Tension */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <Flame className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Core Dramatic Stakes</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-5 text-[11.5px]">
              {candidate.core_tension}
            </p>
          </div>

          {/* Trade-Offs */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <Scale className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Narrative Balance & Trade-offs</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-5 text-[11.5px]">
              {candidate.trade_offs}
            </p>
          </div>

          {/* Key Visual Vignette */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              <Camera className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Signature Cinematic Visual</span>
            </div>
            <p className="text-[11.5px] text-slate-300 italic leading-relaxed">
              "{candidate.key_visual}"
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer / Selection state */}
      <div className="p-4 border-t border-canvas-border bg-slate-950/30 rounded-b-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <Layers className="w-3 h-3 text-slate-600" />
          <span>Stage {isSelectable ? '4' : '3'} Candidate</span>
        </div>

        {selectionDisabled ? (
          <span className="text-[11px] text-slate-500 italic">
            Selection enabled in Stage 4
          </span>
        ) : isSelectable ? (
          <button
            type="button"
            onClick={() => onSelect && onSelect(candidate)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-glow-cyan scale-[1.02]'
                : 'bg-slate-800/90 hover:bg-cyan-950 hover:text-cyan-300 text-slate-200 border border-slate-700 hover:border-cyan-500/50'
            }`}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Selected Direction</span>
              </>
            ) : (
              <span>{actionLabel || 'Select This Direction'}</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelect && onSelect(candidate)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSelected
                ? `${currentTheme.badgeBg} ring-1 ring-cyan-400/40 font-bold`
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selected</span>
              </>
            ) : (
              <span>{actionLabel || 'Inspect Details'}</span>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};
