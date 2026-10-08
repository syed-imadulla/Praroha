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
  Activity,
  Zap,
  Orbit,
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

  // Archetype resolution (Familiar, Radical, Inverse)
  const archetypeType =
    candidate.divergence_archetype || (index === 0 ? 'familiar' : index === 1 ? 'radical' : 'inverse');

  // Botanical theme configuration according to archetype & index
  const themeStyles = [
    {
      // Index 0 / Familiar: Sage
      border: 'border-[#D8CCB7] hover:border-[#355A46]',
      activeBorder: 'border-[#355A46] ring-2 ring-[#355A46]/20',
      badgeBg: 'bg-[#DDE2D2] border-[#C8D0BE] text-[#294B3A]',
      iconColor: 'text-[#355A46]',
      titleColor: 'text-[#294B3A]',
      chipColor: 'bg-[#F2EBDD] border-[#D8CCB7] text-[#466A55]',
      metricBarColor: 'bg-[#355A46]',
    },
    {
      // Index 1 / Radical: Plum
      border: 'border-[#D8CCB7] hover:border-[#6A4B67]',
      activeBorder: 'border-[#6A4B67] ring-2 ring-[#6A4B67]/20',
      badgeBg: 'bg-[#EFE8EE] border-[#D1BECD] text-[#6A4B67]',
      iconColor: 'text-[#6A4B67]',
      titleColor: 'text-[#294B3A]',
      chipColor: 'bg-[#F2EBDD] border-[#D8CCB7] text-[#6A4B67]',
      metricBarColor: 'bg-[#6A4B67]',
    },
    {
      // Index 2 / Inverse: Terracotta
      border: 'border-[#D8CCB7] hover:border-[#B8734F]',
      activeBorder: 'border-[#B8734F] ring-2 ring-[#B8734F]/20',
      badgeBg: 'bg-[#F5E6DC] border-[#E2BFAC] text-[#B8734F]',
      iconColor: 'text-[#B8734F]',
      titleColor: 'text-[#294B3A]',
      chipColor: 'bg-[#F2EBDD] border-[#D8CCB7] text-[#B8734F]',
      metricBarColor: 'bg-[#B8734F]',
    },
  ];

  const currentTheme = themeStyles[index % themeStyles.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className={`group relative flex flex-col justify-between rounded-[20px] bg-[#F8F4E8] border transition-all duration-300 shadow-xs hover:shadow-sm ${
        isDimmed ? 'opacity-60 grayscale-[25%] hover:opacity-95 hover:grayscale-0' : 'opacity-100'
      } ${
        isSelected
          ? `${currentTheme.activeBorder} bg-[#FAF6EC] shadow-sm`
          : currentTheme.border
      }`}
    >
      {/* Chosen Direction Badge */}
      {isSelected && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#355A46] text-[#F8F4E8] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs border border-[#294B3A]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#F8F4E8]" />
          <span>Chosen Direction</span>
        </div>
      )}

      <div className="relative p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
        {/* Header: Candidate badge & Divergence Archetype tag */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wide ${currentTheme.badgeBg}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Candidate {candidateNumber}</span>
          </div>

          {/* Divergence Archetype Banner Pill */}
          {archetypeType === 'radical' ? (
            <div
              className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#EFE8EE] text-[#6A4B67] border border-[#D1BECD] flex items-center gap-1.5"
              title="Radical Archetype: High novelty and transformative paradigm shift"
            >
              <Zap className="w-3.5 h-3.5 text-[#6A4B67]" />
              <span>Radical</span>
            </div>
          ) : archetypeType === 'inverse' ? (
            <div
              className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#F5E6DC] text-[#B8734F] border border-[#E2BFAC] flex items-center gap-1.5"
              title="Inverse Archetype: Conceptual flip & dramatic subversion of core assumptions"
            >
              <Orbit className="w-3.5 h-3.5 text-[#B8734F]" />
              <span>Inverse</span>
            </div>
          ) : (
            <div
              className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE] flex items-center gap-1.5"
              title="Familiar Archetype: Grounded realization maximizing seed fidelity"
            >
              <Compass className="w-3.5 h-3.5 text-[#294B3A]" />
              <span>Familiar</span>
            </div>
          )}
        </div>

        {/* Title & Theme chip */}
        <div className="space-y-1">
          <h3 className={`text-xl sm:text-2xl font-bold font-serif tracking-tight transition-colors ${currentTheme.titleColor}`}>
            {candidate.title}
          </h3>
          <div
            className={`inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full border max-w-full truncate ${currentTheme.chipColor}`}
            title={candidate.archetype}
          >
            {candidate.archetype}
          </div>
        </div>

        {/* High-Concept Logline */}
        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1 shadow-2xs">
          <div className="text-xs font-bold text-[#466A55] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
            <span>High-Concept Premise</span>
          </div>
          <p className="text-sm text-[#294B3A] leading-relaxed font-sans">
            "{candidate.concept}"
          </p>
        </div>

        {/* Emphasized Potential Items */}
        {candidate.emphasized_potential_labels && candidate.emphasized_potential_labels.length > 0 && (
          <div className="space-y-1.5 pt-0.5">
            <span className="text-xs font-mono font-semibold text-[#466A55] uppercase tracking-wider">
              Emphasized Potential Pillars:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {candidate.emphasized_potential_labels.map((lbl, lIdx) => (
                <span
                  key={lIdx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-medium bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7]"
                  title={`Accepted potential element incorporated into ${candidate.title}`}
                >
                  <Sparkles className="w-3 h-3 text-[#355A46]" />
                  <span>{lbl}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Exploration Profile (4 normalized metrics) */}
        {candidate.exploration_profile && (
          <div className="p-3.5 rounded-xl bg-[#F2EBDD]/70 border border-[#D8CCB7] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#466A55]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#355A46]" />
                <span>Exploration Profile</span>
              </span>
              <span className="font-mono text-[#718875] font-semibold">Divergence Metrics</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {/* Seed Fidelity */}
              <div className="space-y-1" title="Seed Fidelity: Alignment with explicit seed anchors and tone">
                <div className="flex justify-between text-xs">
                  <span className="text-[#466A55]">Fidelity</span>
                  <span className="font-mono font-bold text-[#294B3A]">{candidate.exploration_profile.seed_fidelity}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E4DBCB] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#355A46] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, candidate.exploration_profile.seed_fidelity))}%` }}
                  />
                </div>
              </div>

              {/* Novelty */}
              <div className="space-y-1" title="Novelty: Conceptual originality and surprise factor">
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-[#466A55]">Novelty</span>
                  <span className="font-mono font-bold text-[#6A4B67]">{candidate.exploration_profile.novelty}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E4DBCB] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6A4B67] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, candidate.exploration_profile.novelty))}%` }}
                  />
                </div>
              </div>

              {/* Conceptual Distance */}
              <div className="space-y-1" title="Conceptual Distance: How far the world departs from conventional genre tropes">
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-[#466A55]">Distance</span>
                  <span className="font-mono font-bold text-[#B8734F]">{candidate.exploration_profile.conceptual_distance}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E4DBCB] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#B8734F] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, candidate.exploration_profile.conceptual_distance))}%` }}
                  />
                </div>
              </div>

              {/* Feasibility */}
              <div className="space-y-1" title="Feasibility: Internal world stability and narrative tractability">
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-[#466A55]">Feasibility</span>
                  <span className="font-mono font-bold text-[#294B3A]">{candidate.exploration_profile.feasibility}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E4DBCB] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#355A46] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, candidate.exploration_profile.feasibility))}%` }}
                  />
                </div>
              </div>
            </div>

            {candidate.exploration_profile.summary && (
              <p className="text-xs text-[#466A55] italic pt-1 border-t border-[#D8CCB7] leading-relaxed">
                "{candidate.exploration_profile.summary}"
              </p>
            )}
          </div>
        )}

        {/* Key Dimensions Stack */}
        <div className="space-y-3 flex-1 text-xs pt-1">
          {/* Aesthetic & Mood */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[#466A55] font-semibold text-xs">
              <Palette className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Aesthetic & Atmosphere</span>
            </div>
            <p className="text-[#294B3A] leading-relaxed pl-5 text-xs">
              {candidate.aesthetic}
            </p>
          </div>

          {/* Core Tension */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[#466A55] font-semibold text-xs">
              <Flame className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Core Dramatic Stakes</span>
            </div>
            <p className="text-[#294B3A] leading-relaxed pl-5 text-xs">
              {candidate.core_tension}
            </p>
          </div>

          {/* Trade-Offs */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[#466A55] font-semibold text-xs">
              <Scale className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Narrative Balance & Trade-offs</span>
            </div>
            <p className="text-[#294B3A] leading-relaxed pl-5 text-xs">
              {candidate.trade_offs}
            </p>
          </div>

          {/* Key Visual Vignette */}
          <div className="p-3 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#466A55]">
              <Camera className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
              <span>Signature Cinematic Visual</span>
            </div>
            <p className="text-xs text-[#294B3A] italic leading-relaxed">
              "{candidate.key_visual}"
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer / Selection state */}
      <div className="p-4 border-t border-[#D8CCB7] bg-[#F2EBDD]/60 rounded-b-[20px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#718875] font-mono">
          <Layers className="w-3 h-3 text-[#466A55]" />
          <span>Stage {isSelectable ? '4' : '3'} Candidate</span>
        </div>

        {selectionDisabled ? (
          <span className="text-[11px] text-[#718875] italic">
            Selection enabled in Stage 4
          </span>
        ) : isSelectable ? (
          <button
            type="button"
            onClick={() => onSelect && onSelect(candidate)}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isSelected
                ? 'bg-[#355A46] text-[#F8F4E8]'
                : 'bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7]'
            }`}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#F8F4E8]" />
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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSelected
                ? `${currentTheme.badgeBg} font-bold`
                : 'bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7]'
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
