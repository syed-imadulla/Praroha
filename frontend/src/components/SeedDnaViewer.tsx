import React, { useState } from 'react';
import {
  Dna,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Layers,
  Tag,
  Flame,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedDNARead } from '../types';
import { SeedPotentialCanvas } from './SeedPotentialCanvas';

interface SeedDnaViewerProps {
  dnaRecord?: SeedDNARead | null;
  compact?: boolean;
}

export const SeedDnaViewer: React.FC<SeedDnaViewerProps> = ({
  dnaRecord: propDnaRecord,
  compact = false,
}) => {
  const {
    seedDNA: storeDna,
    setActiveStage,
    unlockStage,
    understandSubTab,
    setUnderstandSubTab,
    potentialItems,
  } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);

  const dnaRecord = propDnaRecord || storeDna;

  if (!dnaRecord) {
    return (
      <div className="p-8 rounded-2xl bg-[#F8F4E8] border border-[#D8CCB7] text-center space-y-3">
        <Dna className="w-8 h-8 text-[#466A55] mx-auto" />
        <div className="text-base font-serif font-bold text-[#294B3A]">
          No Seed DNA Extracted Yet
        </div>
        <p className="text-xs text-[#466A55] max-w-sm mx-auto">
          Enter a creative seed in Stage 1 and run the understanding pass to generate structural Seed DNA.
        </p>
      </div>
    );
  }

  const { dna, raw_seed, model_used, fallback_used } = dnaRecord;

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(dna, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy Seed DNA JSON:', err);
    }
  };

  const handleAdjustSeed = () => {
    setActiveStage('seed');
  };

  const handleProceedToWorlds = () => {
    unlockStage('worlds');
    setActiveStage('worlds');
  };

  return (
    <div className={`space-y-6 ${compact ? 'text-xs' : 'w-full max-w-5xl py-2'}`}>
      {/* Sub-stage Lens Switcher (DNA Blueprint vs Seed Potential Map) */}
      {!compact && (
        <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[#EAE4D4] border border-[#D8CCB7] w-fit shadow-2xs">
          <button
            type="button"
            data-testid="tab-dna-blueprint"
            onClick={() => setUnderstandSubTab('dna')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              understandSubTab === 'dna'
                ? 'bg-[#355A46] text-[#F8F4E8] shadow-xs'
                : 'text-[#466A55] hover:text-[#294B3A]'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Seed DNA Blueprint</span>
          </button>

          <button
            type="button"
            data-testid="tab-seed-potential"
            onClick={() => setUnderstandSubTab('potential')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              understandSubTab === 'potential'
                ? 'bg-[#355A46] text-[#F8F4E8] shadow-xs'
                : 'text-[#466A55] hover:text-[#294B3A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Potential Map</span>
            {potentialItems.length > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                {potentialItems.length}
              </span>
            )}
          </button>
        </div>
      )}

      {!compact && understandSubTab === 'potential' ? (
        <SeedPotentialCanvas compact={compact} />
      ) : (
        <>
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8CCB7]">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A]">
                  <Dna className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#466A55]">
                  Stage 2 / 07 — Understand
                </span>
              </div>
              <h2 className={`font-serif font-bold text-[#294B3A] tracking-tight ${compact ? 'text-lg' : 'text-2xl sm:text-3xl'}`}>
                Distilled Seed DNA
              </h2>
              <p className="text-[#466A55] text-xs sm:text-sm">
                Semantic foundation synthesized from raw creative premise.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7] text-xs font-medium transition shadow-2xs"
                title="Copy structured DNA JSON"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#294B3A]" />
                    <span className="text-[#294B3A] font-semibold">Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#466A55]" />
                    <span>Export JSON</span>
                  </>
                )}
              </button>

              {!compact && (
                <button
                  type="button"
                  onClick={handleAdjustSeed}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7] text-xs font-medium transition shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#466A55]" />
                  <span>Refine Seed</span>
                </button>
              )}
            </div>
          </div>

          {/* Model & Provenance Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2EBDD] border border-[#D8CCB7] text-[11px] font-mono text-[#466A55]">
              <span>Engine:</span>
              <span className="text-[#294B3A] font-semibold">{model_used}</span>
            </div>

            {fallback_used && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F5E6DC] border border-[#E2BFAC] text-[11px] font-mono text-[#B8734F]">
                <span>Mock Fallback Active</span>
              </div>
            )}

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#DDE2D2] border border-[#C8D0BE] text-[11px] text-[#294B3A] font-mono">
              <span>DNA Schema v1.0</span>
            </div>
          </div>

          {/* Original Raw Seed Quote (Rule #1 Immutability Check) */}
          <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5 shadow-2xs">
            <div className="text-[11px] uppercase font-mono tracking-wider text-[#466A55] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#466A55]" />
              <span>Immutable Input Seed (Permanent Provenance)</span>
            </div>
            <p className="text-sm text-[#294B3A] italic font-serif leading-relaxed">
              "{raw_seed}"
            </p>
          </div>

          {/* Core Distilled Premise */}
          <div className="rounded-xl p-5 md:p-6 bg-[#F8F4E8] border border-[#D8CCB7] relative overflow-hidden space-y-2.5 shadow-xs">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#355A46]" />
            <div className="flex items-center gap-2 text-[#355A46] text-xs font-bold uppercase tracking-wider pl-1">
              <Sparkles className="w-3.5 h-3.5 text-[#355A46]" />
              <span>Core Distilled Premise</span>
            </div>
            <p className="text-base md:text-lg text-[#294B3A] font-medium leading-relaxed font-sans pl-1">
              {dna.premise}
            </p>
          </div>

          {/* Tone & Themes Grid (2-column layout on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emotional Tone */}
            <div className="rounded-xl p-4 sm:p-5 bg-[#F8F4E8] border border-[#D8CCB7] space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#6A4B67] text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                <span>Emotional & Aesthetic Tone</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFE8EE] border border-[#D1BECD] text-[#6A4B67] text-xs font-medium">
                <Sparkles className="w-3 h-3 text-[#6A4B67]" />
                <span>{dna.tone}</span>
              </div>
            </div>

            {/* Implicit Themes */}
            <div className="rounded-xl p-4 sm:p-5 bg-[#F8F4E8] border border-[#D8CCB7] space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#355A46] text-xs font-bold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Implicit Thematic Tensions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dna.themes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] text-xs font-medium"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Entities & Boundary Constraints (2-column layout on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Core Entities */}
            <div className="rounded-xl p-4 sm:p-5 bg-[#F8F4E8] border border-[#D8CCB7] space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#294B3A] text-xs font-bold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Core Entities & Artifacts</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dna.entities.map((entity, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#F2EBDD] border border-[#D8CCB7] text-[#294B3A] text-xs font-medium"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>

            {/* Strict Boundary Constraints */}
            <div className="rounded-xl p-4 sm:p-5 bg-[#F8F4E8] border border-[#E2BFAC] space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#B8734F] text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Strict Creative Constraints</span>
              </div>
              <div className="space-y-1.5">
                {dna.constraints.map((constraint, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1.5 rounded-md bg-[#FAF5EE] border border-[#E8DCC8] text-[#394840] text-xs flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B8734F] shrink-0" />
                    <span>{constraint}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Domain Keywords */}
          <div className="rounded-xl p-4 sm:p-5 bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#466A55] text-xs font-bold uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-[#466A55]" />
              <span>Domain Semantic Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dna.domain_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#F2EBDD] border border-[#D8CCB7] text-[#394840] text-[11px] font-mono"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* Stage 2 Primary Call To Action (Canvas mode only) */}
          {!compact && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#D8CCB7]">
              <div className="text-xs text-[#466A55]">
                Seed DNA is locked and immutable for this project. Ready to explore semantic potential or branch into 3 distinct worlds.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setUnderstandSubTab('potential')}
                  className="px-4 py-2.5 rounded-full bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] text-[#294B3A] font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#294B3A]" />
                  <span>Explore Potential Map ({potentialItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToWorlds}
                  className="px-6 py-2.5 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Generate 3 Worlds (Stage 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
