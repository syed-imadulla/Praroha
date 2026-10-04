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
  } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);

  const dnaRecord = propDnaRecord || storeDna;

  if (!dnaRecord) {
    return (
      <div className="p-6 rounded-xl bg-canvas-card/40 border border-canvas-border text-center space-y-3">
        <Dna className="w-8 h-8 text-slate-600 mx-auto" />
        <div className="text-sm font-semibold text-slate-300">
          No Seed DNA Extracted Yet
        </div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
    <div className={`space-y-6 ${compact ? 'text-xs' : 'w-full max-w-4xl py-4'}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-canvas-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Dna className="w-4 h-4" />
            </span>
            <h2 className={`font-bold text-slate-100 font-sans ${compact ? 'text-sm' : 'text-xl'}`}>
              Distilled Seed DNA
            </h2>
          </div>
          <p className="text-slate-400 text-xs">
            Semantic foundation synthesized from raw creative premise.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            title="Copy structured DNA JSON"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Export JSON</span>
              </>
            )}
          </button>

          {!compact && (
            <button
              type="button"
              onClick={handleAdjustSeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refine Seed</span>
            </button>
          )}
        </div>
      </div>

      {/* Model & Provenance Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span>Engine:</span>
          <span className="text-slate-200 font-semibold">{model_used}</span>
        </div>

        {fallback_used && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/60 text-[11px] font-mono text-amber-300">
            <span>Mock Fallback Active</span>
          </div>
        )}

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300 font-mono">
          <span>DNA Schema v1.0</span>
        </div>
      </div>

      {/* Original Raw Seed Quote (Rule #1 Immutability Check) */}
      <div className="p-3.5 rounded-xl bg-canvas-card/40 border border-canvas-border space-y-1">
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>Immutable Input Seed (Permanent Provenance)</span>
        </div>
        <p className="text-xs text-slate-300 italic font-serif">
          "{raw_seed}"
        </p>
      </div>

      {/* Core Premise */}
      <div className="glass-card rounded-xl p-4 md:p-5 border border-cyan-800/30 relative overflow-hidden space-y-2">
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-emerald-400" />
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core Distilled Premise</span>
        </div>
        <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed">
          {dna.premise}
        </p>
      </div>

      {/* Tone & Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emotional Tone */}
        <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>Emotional & Aesthetic Tone</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-950/40 border border-violet-800/50 text-violet-200 text-xs font-medium">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>{dna.tone}</span>
          </div>
        </div>

        {/* Implicit Themes */}
        <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Implicit Thematic Tensions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dna.themes.map((theme, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Entities & Boundary Constraints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Entities */}
        <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Core Entities & Artifacts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dna.entities.map((entity, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>

        {/* Strict Boundary Constraints */}
        <div className="glass-card rounded-xl p-4 border border-amber-900/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Strict Creative Constraints</span>
          </div>
          <div className="space-y-1.5">
            {dna.constraints.map((constraint, i) => (
              <div
                key={i}
                className="px-2.5 py-1.5 rounded-md bg-amber-950/30 border border-amber-800/40 text-amber-300/90 text-xs flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{constraint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Domain Keywords */}
      <div className="glass-card rounded-xl p-4 border border-canvas-border space-y-2">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Domain Semantic Keywords</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dna.domain_keywords.map((kw, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700 text-slate-300 text-[11px] font-mono"
            >
              #{kw}
            </span>
          ))}
        </div>
      </div>

      {/* Stage 2 Primary Call To Action (Canvas mode only) */}
      {!compact && (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-canvas-border">
          <div className="text-xs text-slate-400">
            Seed DNA is locked and immutable for this project. Ready to branch into 3 distinct worlds in Stage 3.
          </div>

          <button
            type="button"
            onClick={handleProceedToWorlds}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Generate 3 Worlds (Stage 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
