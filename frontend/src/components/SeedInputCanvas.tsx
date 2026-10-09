import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Waves,
  Rocket,
  Trees,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedPreset } from '../types';
import { HomeHero } from './home/HomeHero';
import { RecentCreationsRow, type RecentCreationItem } from './home/RecentCreationsRow';

export const SEED_PRESETS: SeedPreset[] = [
  {
    id: 'ocean-city',
    title: 'Sunken Ocean City',
    genre: 'Subaquatic Exploration',
    seed: 'A child discovers a forgotten city beneath the ocean.',
    tagline: 'Subaquatic wonder • Lost civilization & bio-luminescence',
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
    creations,
    fetchCreations,
  } = useWorkspaceStore();

  useEffect(() => {
    fetchCreations();
  }, [fetchCreations]);

  const recentCreationItems: RecentCreationItem[] = (creations || []).slice(0, 3).map((proj) => ({
    id: proj.id,
    title: proj.title,
    type: 'story',
    timestamp: new Date(proj.updated_at || proj.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    description: proj.seed_text || 'An unfolding world.',
  }));

  const handleSelectPreset = (seed: string) => {
    setSeedText(seed);
  };

  const handleExtract = async () => {
    if (!seedText.trim() || isExtracting) return;
    await extractSeedDNA(seedText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExtract();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-start py-2 sm:py-4 select-none">
      <div className="w-full flex flex-col items-start space-y-3">
        {/* Compact continuity indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE4D4]/80 border border-[#D8CCB7] text-[11px] font-sans text-[#466A55] mb-1 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#355A46]" />
          <span className="font-medium">Seed → Universe</span>
          <span className="opacity-40">·</span>
          <span>Botanical Creative Journal</span>
        </div>

        {/* 1. Editorial Hero Statement & Leaf Separator */}
        <HomeHero />

        {/* 2. Primary 72px Seed Input Container */}
        <div className="w-full relative mt-1 mb-2">
          <div
            className={`w-full min-h-[72px] rounded-[36px] bg-[#F8F4E8] border border-[#D8CCB7] px-5 py-2.5 flex items-center gap-3.5 shadow-xs transition-all duration-180 ${
              isExtracting
                ? 'border-[#718875] ring-2 ring-[#718875]/30'
                : 'hover:border-[#C8D0BE] focus-within:border-[#294B3A] focus-within:ring-2 focus-within:ring-[#294B3A]/20'
            }`}
          >
            {/* Botanical Seed Emblem on the Left */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isExtracting ? 'text-[#355A46] animate-pulse' : 'text-[#466A55]'
              }`}
              aria-hidden="true"
            >
              <svg
                className="w-6 h-6 stroke-[1.8]"
                viewBox="0 0 36 36"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
                <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" />
              </svg>
            </div>

            {/* Seed Text Input (TextArea styled as single-line/expandable input) */}
            <textarea
              rows={1}
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExtracting}
              placeholder="Enter your seed idea..."
              className="flex-1 bg-transparent border-none text-[#294B3A] placeholder:text-[#718875]/75 focus:outline-none focus:ring-0 text-[16px] sm:text-[17px] font-sans resize-none py-2 leading-relaxed"
              aria-label="Enter your seed idea"
            />

            {/* Circular Sage Submit Button */}
            <button
              type="button"
              onClick={handleExtract}
              disabled={!seedText.trim() || isExtracting}
              className="w-12 h-12 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] flex items-center justify-center transition-all duration-180 shadow-xs hover:shadow-md disabled:opacity-40 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#294B3A] focus:ring-offset-2"
              title="Extract Seed DNA"
              aria-label="Extract Seed DNA"
            >
              {isExtracting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 stroke-[2.2]" />
              )}
              {/* Screen-reader and selector compatibility label */}
              <span className="sr-only">Extract Seed DNA</span>
            </button>
          </div>

          {/* In-flight extraction status pill */}
          <AnimatePresence>
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-2 px-4 py-1.5 rounded-full bg-[#EAE4D4] border border-[#D8CCB7] inline-flex items-center gap-2 text-xs text-[#294B3A] font-medium"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#355A46]" />
                <span>
                  {extractionStep || 'Understanding seed intent and extracting latent DNA...'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preset Chips & Instant Demo Launcher */}
        <div className="flex flex-wrap items-center gap-2 mb-2 w-full">
          <span className="text-[12px] font-medium text-[#718875] mr-1">Presets:</span>
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-180 focus:outline-none focus:ring-1 focus:ring-[#294B3A] ${
                  isSelected
                    ? 'bg-[#294B3A] text-[#F8F4E8] shadow-xs'
                    : 'bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7] hover:bg-[#E8E0D0] hover:text-[#294B3A]'
                }`}
              >
                <Icon className="w-3 h-3 opacity-75" />
                <span>{preset.title}</span>
              </button>
            );
          })}

          {/* Instant Canonical Demo Launcher Button */}
          <button
            type="button"
            onClick={() => loadCanonicalDemoUniverse()}
            className="sm:ml-auto px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#E7C8B5] hover:bg-[#DFAFA0] text-[#A0522D] border border-[#B8734F]/30 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-[#A0522D]"
            title="Instantly generate and unfold complete Bio-City universe for hackathon judging"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Instant Full Universe</span>
          </button>
        </div>

        {/* 3. Recent Creations Horizontal Row */}
        <RecentCreationsRow
          creations={recentCreationItems}
          onSelectCreation={(item) => {
            window.history.pushState({}, '', `/projects/${item.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          onViewAll={() => {
            const navBtn = document.querySelector('button[aria-label="My Creations"]') as HTMLButtonElement | null;
            navBtn?.click();
          }}
          onPlantSeed={() => {
            const textarea = document.querySelector('textarea');
            textarea?.focus();
          }}
        />
      </div>
    </div>
  );
};
