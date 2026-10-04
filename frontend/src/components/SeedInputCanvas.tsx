import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Waves,
  Rocket,
  Trees,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedPreset } from '../types';

export const SEED_PRESETS: SeedPreset[] = [
  {
    id: 'ocean-city',
    title: 'Sunken Ocean City',
    genre: 'Subaquatic Exploration',
    seed: 'A child discovers a forgotten city beneath the ocean.',
    tagline: 'Canonical judge demo • Lost civilization & bio-luminescence',
  },
  {
    id: 'orbital-ark',
    title: 'Silent Orbital Ark',
    genre: 'Deep Space Sci-Fi',
    seed: 'A derelict orbital generation ship drifts silent above a dying star, emitting a heartbeat signal.',
    tagline: 'Cosmic isolation • Relic systems & dying stellar glow',
  },
  {
    id: 'whispering-forest',
    title: 'The Whispering Forest',
    genre: 'Mythic Dark Fantasy',
    seed: 'An ancient whispering forest where trees remember the names of forgotten gods and demand memories as toll.',
    tagline: 'Supernatural folklore • Sentient ecology & ancient pacts',
  },
];

export const SeedInputCanvas: React.FC = () => {
  const {
    seedText,
    setSeedText,
    isExtracting,
    extractionStep,
    extractSeedDNA,
    loadCanonicalDemoUniverse,
  } = useWorkspaceStore();

  const wordCount = seedText.trim() ? seedText.trim().split(/\s+/).length : 0;
  const charCount = seedText.length;

  const handleSelectPreset = (seed: string) => {
    setSeedText(seed);
  };

  const handleExtract = async () => {
    if (!seedText.trim() || isExtracting) return;
    await extractSeedDNA(seedText.trim());
  };

  return (
    <div className="w-full max-w-4xl space-y-8 py-4">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-medium tracking-wide font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tattva 2: Forms Hidden in Formless • Stage 1: Seed</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-100 font-sans">
          Plant the Creative Seed
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Provide an incomplete, evocative premise. Praroha will progressively reveal the latent forms hidden within this seed through structured Generative AI unfolding.
        </p>

        {/* Instant Canonical Demo Launcher */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => loadCanonicalDemoUniverse()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 font-mono"
            title="Instantly generate and unfold complete Bio-City universe for hackathon judging"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
            <span>🌟 Instant Full Universe (Demo)</span>
          </button>
        </div>
      </div>

      {/* Preset Curations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            Quick Seed Presets
          </span>
          <span className="text-[11px] text-slate-500">
            Click to populate or type custom seed below
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SEED_PRESETS.map((preset) => {
            const isSelected = seedText === preset.seed;
            const Icon =
              preset.id === 'ocean-city'
                ? Waves
                : preset.id === 'orbital-ark'
                ? Rocket
                : Trees;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.seed)}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-glow-cyan/30'
                    : preset.id === 'ocean-city'
                    ? 'bg-cyan-950/20 hover:bg-cyan-950/40 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-canvas-card/60 hover:bg-canvas-card border-canvas-border hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    {preset.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {preset.id === 'ocean-city' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        🌟 Canonical Demo
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-cyan-400/80 font-mono mb-1">
                  {preset.genre}
                </div>
                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                  {preset.seed}
                </p>
                <div className="mt-2 text-[10px] text-slate-500 italic">
                  {preset.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Seed Input Box */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-5 border border-canvas-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 opacity-60" />

        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Creative Seed Textarea</span>
          </label>
          <div className="text-xs text-slate-500 font-mono">
            {wordCount} words • {charCount} chars
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={5}
            value={seedText}
            onChange={(e) => setSeedText(e.target.value)}
            disabled={isExtracting}
            placeholder="Type or paste your creative premise here... (e.g. A solitary cartographer maps islands that vanish when unobserved)"
            className="w-full bg-canvas-deep/90 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition font-sans text-sm md:text-base resize-none shadow-inner disabled:opacity-50"
          />

          {/* Animated Extraction Overlay */}
          <AnimatePresence>
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-4 z-10"
              >
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <Sparkles className="w-4 h-4 text-emerald-400 absolute top-0 right-0 animate-ping" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-100 font-mono">
                    UNDERSTANDING PASS IN PROGRESS
                  </div>
                  <motion.p
                    key={extractionStep}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-xs text-cyan-300 font-medium max-w-sm"
                  >
                    {extractionStep || 'Analyzing semantic latent intent...'}
                  </motion.p>
                </div>
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Immutable input guarantee — raw seed is permanently recorded alongside extracted DNA</span>
          </div>

          <button
            type="button"
            onClick={handleExtract}
            disabled={!seedText.trim() || isExtracting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              !seedText.trim() || isExtracting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <span>Extract Seed DNA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
