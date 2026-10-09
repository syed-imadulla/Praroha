import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Film,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Compass,
  MapPin,
  Flame,
  ArrowRight,
  GitBranch,
  GitFork,
  Shield,
  Layers,
  AlertTriangle,
  Edit3,
  Lock,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { RefinementModal } from './RefinementModal';
import { OriginBadge } from './OriginBadge';
import { WhyIsThisHereModal, WhyIsThisHereData } from './WhyIsThisHereModal';
import { EntityMediaSection } from './EntityMediaSection';
import { AtmosphereDeck } from './AtmosphereDeck';
import type { OriginType } from '../types';

export const UniverseCodexCanvas: React.FC = () => {
  const {
    selectedWorldId,
    selectedWorldRationale,
    activeSelection,
    fetchActiveSelection,
    worlds,
    unfoldedUniverse,
    isUnfolding,
    unfoldingStep,
    unfoldError,
    activeCodexTab,
    setActiveCodexTab,
    setActiveStage,
    unlockStage,
    unfoldUniverse,
    jumpToTraceNode,
    toggleInspector,
    setInspectorTab,
    setRefiningEntity,
    humanOnlyZones,
  } = useWorkspaceStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedOriginFilter, setSelectedOriginFilter] = useState<OriginType | 'ALL'>('ALL');
  const [whyModalData, setWhyModalData] = useState<WhyIsThisHereData | null>(null);

  useEffect(() => {
    if (!activeSelection) {
      fetchActiveSelection();
    }
  }, [activeSelection, fetchActiveSelection]);

  const selectedWorld = worlds.find((w) => w.id === selectedWorldId);
  const decisionDNA = activeSelection?.decision_dna;
  const hoz = activeSelection?.human_only_zones || decisionDNA?.human_only_zones || humanOnlyZones;

  const handleCopyPrompt = async (id: string, text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.warn('Clipboard write restricted, falling back to visual feedback:', err);
    }
    setCopiedId(id);
    setToastMessage(`Copied prompt for ${label}!`);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleTriggerUnfold = async () => {
    await unfoldUniverse();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F4E8] text-[#294B3A] p-4 md:p-8">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] text-xs font-semibold shadow-md"
          >
            <Check className="w-4 h-4 text-[#355A46]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8CCB7]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                Stage 5 · Build Your World
              </span>
              <span className="text-xs text-[#5F6D63] font-mono">• World Details</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#294B3A] tracking-tight">
              {selectedWorld ? selectedWorld.title : 'Progressive World Unfolding'}
            </h1>
            <p className="text-sm md:text-[15px] text-[#394840] max-w-2xl leading-relaxed">
              {selectedWorld?.concept ||
                'Expanding the committed world candidate into a multi-layered, living story-world.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => {
                setInspectorTab('provenance');
                toggleInspector(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] text-xs text-[#294B3A] transition shadow-2xs font-semibold min-h-[38px] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
              title="Open Causal Lineage"
            >
              <GitBranch className="w-4 h-4 text-[#355A46]" />
              <span>Inspect Lineage</span>
            </button>
          </div>
        </header>

        {/* Persistent Decision DNA Anchor Strip / Pill Bar */}
        {selectedWorld && (
          <div className="p-4 rounded-[20px] bg-[#F2EBDD] border border-[#D8CCB7] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] font-mono font-bold text-xs min-h-[26px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#355A46]" />
                  <span>Decision DNA</span>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#F8F4E8] text-[#805B20] font-mono font-bold border border-[#D8C79D] text-xs min-h-[26px] inline-flex items-center">
                  {selectedWorld.archetype}
                </span>
                {selectedWorld.divergence_archetype && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono uppercase bg-[#F8F4E8] text-[#394840] border border-[#D8CCB7] font-semibold min-h-[26px] inline-flex items-center">
                    {selectedWorld.divergence_archetype}
                  </span>
                )}
                {(decisionDNA?.user_rationale || selectedWorldRationale) && (
                  <span className="text-[#394840] italic text-xs line-clamp-1 max-w-sm">
                    "{decisionDNA?.user_rationale || selectedWorldRationale}"
                  </span>
                )}
              </div>

              {/* Priorities & Exclusions Pill Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {/* Priorities */}
                {(decisionDNA?.creative_priorities && decisionDNA.creative_priorities.length > 0
                  ? decisionDNA.creative_priorities
                  : []
                )
                  .slice(0, 4)
                  .map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] text-xs font-semibold min-h-[26px]"
                      title={`Mandatory Creative Priority: ${p}`}
                    >
                      <span className="text-[#355A46] font-bold">★</span>
                      <span>{p}</span>
                    </span>
                  ))}

                {/* Exclusions */}
                {(decisionDNA?.rejected_directions && decisionDNA.rejected_directions.length > 0
                  ? decisionDNA.rejected_directions
                  : []
                )
                  .slice(0, 3)
                  .map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5E6DC] border border-[#E2BFAC] text-[#B8734F] text-xs font-semibold min-h-[26px]"
                      title={`Active Negative Guardrail: Avoid ${r}`}
                    >
                      <span className="text-[#B8734F] font-bold">⊘</span>
                      <span>Avoid: {r}</span>
                    </span>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setInspectorTab('provenance');
                  toggleInspector(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
                title="Inspect Decision DNA and full causal lineage DAG"
              >
                <span>Inspect Full DNA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Human-Only Zones Summary Banner (HOZ-01 & HOZ-02) */}
        {hoz && hoz.is_locked && (
          <div
            id="human-only-zones-summary-banner"
            className="p-4 rounded-[20px] bg-[#F2EBDD] border border-[#D8CCB7] shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CCB7] pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1 rounded-md bg-[#E9DDBF] text-[#805B20]">
                  <Lock className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#294B3A]">
                  Human-Only Zones: Inviolable Creative Axioms
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-xs font-mono font-bold min-h-[24px] inline-flex items-center">
                  CREATOR LOCKED
                </span>
              </div>
              <span className="text-xs text-[#5F6D63] font-mono font-medium">
                Dual-Layer AI Invariance Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {hoz.core_theme && (
                <div className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#805B20] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Core Theme</span>
                  </div>
                  <p className="text-[#294B3A] line-clamp-2 leading-relaxed font-medium">
                    {hoz.core_theme}
                  </p>
                </div>
              )}
              {hoz.protagonist_motivation && (
                <div className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#805B20] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Protagonist Motivation</span>
                  </div>
                  <p className="text-[#294B3A] line-clamp-2 leading-relaxed font-medium">
                    {hoz.protagonist_motivation}
                  </p>
                </div>
              )}
              {hoz.central_conflict && (
                <div className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#805B20] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Central Conflict</span>
                  </div>
                  <p className="text-[#294B3A] line-clamp-2 leading-relaxed font-medium">
                    {hoz.central_conflict}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State 1: Error Notification & Safe Retry */}
        {unfoldError && (
          <div className="p-5 rounded-[20px] bg-[#F5E6DC] border border-[#E2BFAC] text-[#B8734F] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#A0522D] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-sm text-[#A0522D]">Universe Unfolding Interrupted</h2>
                <p className="text-xs text-[#B8734F] mt-1 leading-relaxed">{unfoldError}</p>
              </div>
            </div>
            <button
              id="retry-unfold-btn"
              onClick={handleTriggerUnfold}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#A0522D] hover:bg-[#8B4513] text-[#F8F4E8] font-medium text-xs shadow-xs transition shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Unfold</span>
            </button>
          </div>
        )}

        {/* State 2: Pre-unfold Hero CTA */}
        {!unfoldedUniverse && !isUnfolding && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 md:p-12 rounded-[24px] bg-[#F8F4E8] border border-[#D8CCB7] text-center space-y-8 shadow-xs relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,154,85,0.08),transparent_70%)] pointer-events-none" />

            <div className="max-w-xl mx-auto space-y-3 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#E2EBE2] border border-[#BACBB8] text-[#355A46] flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#294B3A]">
                Ready to Unfold the Universe
              </h2>
              <p className="text-[#5A6E5E] text-xs md:text-sm leading-relaxed">
                Click below to begin the 4-layer generative expansion grounded strictly in your selected world,
                Seed DNA constraints, and creator rationale.
              </p>
            </div>

            {/* 4 Layers Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left relative z-10">
              <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5">
                <div className="flex items-center gap-2 text-[#355A46] text-xs font-bold font-serif">
                  <BookOpen className="w-4 h-4" />
                  <span>1. World Bible</span>
                </div>
                <p className="text-[11px] text-[#5A6E5E] leading-relaxed">
                  Physics rules, environmental constraints, historical timeline, factions, and key locations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5">
                <div className="flex items-center gap-2 text-[#805B20] text-xs font-bold font-serif">
                  <Users className="w-4 h-4" />
                  <span>2. Characters</span>
                </div>
                <p className="text-[11px] text-[#5A6E5E] leading-relaxed">
                  2 to 4 core cast members with archetypes, internal conflicts, and Midjourney visual prompts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5">
                <div className="flex items-center gap-2 text-[#294B3A] text-xs font-bold font-serif">
                  <Compass className="w-4 h-4" />
                  <span>3. Relationship Web</span>
                </div>
                <p className="text-[11px] text-[#5A6E5E] leading-relaxed">
                  Interpersonal tensions, alliances, and dramatic social dynamics connecting the core cast.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5">
                <div className="flex items-center gap-2 text-[#6A4B67] text-xs font-bold font-serif">
                  <Film className="w-4 h-4" />
                  <span>4. Story Beats</span>
                </div>
                <p className="text-[11px] text-[#5A6E5E] leading-relaxed">
                  Pivotal narrative scenes putting characters into active conflict with dramatic questions.
                </p>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <button
                id="unfold-universe-btn"
                onClick={handleTriggerUnfold}
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unfold Universe (Stage 5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* State 3: Progressive Reveal Loader */}
        {isUnfolding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 md:p-12 rounded-[24px] bg-[#F8F4E8] border border-[#D8CCB7] text-center space-y-8 shadow-xs relative"
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#D8CCB7] border-t-[#355A46] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#355A46] animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#294B3A]">Expanding Story-World Universe</h2>
              <p className="text-xs text-[#5A6E5E]">
                Grounding physical laws, generating characters, and constructing dramatic tensions...
              </p>
            </div>

            {/* Step-by-Step Progress Trackers */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-left">
              {[
                { step: 1, title: 'Laws & Lore', desc: 'World Bible & Key Locations' },
                { step: 2, title: 'Inhabitants', desc: 'Core Character Cast' },
                { step: 3, title: 'Dynamics', desc: 'Relationship Tension Web' },
                { step: 4, title: 'Story Beats', desc: 'Narrative Conflict Scenes' },
              ].map((item) => {
                const isPassed = unfoldingStep > item.step;
                const isCurrent = unfoldingStep === item.step;
                return (
                  <div
                    key={item.step}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isPassed
                        ? 'bg-[#E2EBE2] border-[#BACBB8] text-[#294B3A]'
                        : isCurrent
                        ? 'bg-[#F2EBDD] border-[#355A46] text-[#294B3A] shadow-xs'
                        : 'bg-[#FAF7EE] border-[#E5DDCF] text-[#8C9E90]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 text-[#355A46]" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#E2EBE2] text-[#294B3A] flex items-center justify-center text-xs font-bold">
                          {item.step}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs leading-tight text-[#5A6E5E]">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* State 4: Interactive Codex Workspace */}
        {unfoldedUniverse && !isUnfolding && (
          <div className="space-y-6">
            {/* Codex Tab Navigation */}
            <div className="flex items-center justify-between border-b border-[#D8CCB7] pb-px">
              <div className="flex gap-2">
                <button
                  id="codex-tab-bible"
                  onClick={() => setActiveCodexTab('bible')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'bible'
                      ? 'border-[#355A46] text-[#294B3A] bg-[#E2EBE2]/60 font-serif'
                      : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#F2EBDD]/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>World Bible & Locations</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#E2EBE2] text-[#294B3A] font-mono font-bold">
                    {unfoldedUniverse.world_bible.key_locations.length}
                  </span>
                </button>

                <button
                  id="codex-tab-characters"
                  onClick={() => setActiveCodexTab('characters')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'characters'
                      ? 'border-[#C59A55] text-[#805B20] bg-[#E9DDBF]/50 font-serif'
                      : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#F2EBDD]/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Characters & Dynamics</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#E2EBE2] text-[#294B3A] font-mono font-bold">
                    {unfoldedUniverse.characters.length}
                  </span>
                </button>

                <button
                  id="codex-tab-scenes"
                  onClick={() => setActiveCodexTab('scenes')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'scenes'
                      ? 'border-[#6A4B67] text-[#6A4B67] bg-[#EFE8EE]/60 font-serif'
                      : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#F2EBDD]/60'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Story Beats / Scenes</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#E2EBE2] text-[#294B3A] font-mono font-bold">
                    {unfoldedUniverse.scenes.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Origin Filter Toolbar (ORIG-02) */}
            <div
              className="flex flex-wrap items-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] text-xs"
              data-testid="origin-filter-toolbar"
            >
              <span className="text-[11px] font-mono uppercase text-[#5A6E5E] mr-2 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#355A46]" />
                Origin Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedOriginFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  selectedOriginFilter === 'ALL'
                    ? 'bg-[#355A46] text-[#F8F4E8] border border-[#294B3A] shadow-xs'
                    : 'bg-[#F8F4E8] text-[#5A6E5E] hover:text-[#294B3A] border border-[#D8CCB7]'
                }`}
                data-testid="origin-filter-all"
              >
                All
              </button>
              {(
                [
                  'SEED_EXPLICIT',
                  'HUMAN_DECISION',
                  'SEED_INFERRED',
                  'DERIVED',
                  'AI_INTRODUCED',
                  'USER_ADDED',
                ] as OriginType[]
              ).map((type) => {
                const isSelected = selectedOriginFilter === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedOriginFilter(isSelected ? 'ALL' : type)}
                    className={`transition ${
                      isSelected ? 'scale-105 ring-2 ring-[#355A46]/40 rounded-full' : 'opacity-75 hover:opacity-100'
                    }`}
                    data-testid={`origin-filter-${type.toLowerCase()}`}
                  >
                    <OriginBadge originType={type} interactive={false} size="xs" />
                  </button>
                );
              })}
            </div>

            {/* TAB 1: World Bible & Locations */}
            {activeCodexTab === 'bible' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* World Hero Cover Banner (IMG-03) */}
                <div
                  id="codex-world-cover-section"
                  data-testid="codex-world-cover-section"
                  className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#294B3A] text-xs font-bold font-serif uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-[#C59A55]" />
                      <span>{selectedWorld?.title || 'Active World'} Hero Cover Visual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        data-testid="cinematic-video-coming-soon-badge"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAE4D4] border border-[#D8CCB7] text-[#718875] font-semibold text-xs cursor-not-allowed"
                        title="Video generation is currently unavailable"
                      >
                        <Film className="w-3.5 h-3.5 text-[#718875]" />
                        <span>Cinematic Video (Coming Soon)</span>
                      </span>
                      <span className="text-[11px] text-[#718875] font-mono">16:9 Cover & Visuals</span>
                    </div>
                  </div>
                  <EntityMediaSection
                    entityType="world"
                    entityId={selectedWorld?.id || unfoldedUniverse.world_bible.id}
                    defaultPrompt={`Hero visual cover for ${selectedWorld?.title || 'Unfolded World'}. ${unfoldedUniverse.world_bible.geography}. ${unfoldedUniverse.world_bible.physics_rules}`}
                    availableModalities={['image', 'audio']}
                  />
                </div>

                {/* Environmental Laws & Physical Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-[#355A46] text-xs font-bold font-serif uppercase tracking-wider">
                      <Compass className="w-4 h-4" />
                      <span>Geography & Environment</span>
                    </div>
                    <p className="text-[#394840] text-xs md:text-sm leading-relaxed">
                      {unfoldedUniverse.world_bible.geography}
                    </p>
                  </div>

                  <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-[#355A46] text-xs font-bold font-serif uppercase tracking-wider">
                      <Shield className="w-4 h-4" />
                      <span>Physical Laws & Constraints</span>
                    </div>
                    <p className="text-[#394840] text-xs md:text-sm leading-relaxed">
                      {unfoldedUniverse.world_bible.physics_rules}
                    </p>
                  </div>
                </div>

                {/* Key Locations Section (UNFL-05 with non-blocking copy prompt) */}
                <div id="codex-key-locations" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold font-serif text-[#294B3A] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#355A46]" />
                      <span>Key World Locations</span>
                    </h2>
                    <span className="text-[11px] text-[#718875]">
                      Embedded in World Bible with visual prompt descriptors
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unfoldedUniverse.world_bible.key_locations
                      .filter(
                        (loc) =>
                          selectedOriginFilter === 'ALL' ||
                          (loc.origin_type || 'DERIVED') === selectedOriginFilter
                      )
                      .map((loc, idx) => {
                        const copyKey = `location-${idx}`;
                        return (
                          <div
                            key={idx}
                            className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-3 flex flex-col justify-between shadow-xs"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold font-serif text-[#294B3A] text-sm md:text-base">{loc.name}</h3>
                                <div className="flex items-center gap-2">
                                  <OriginBadge
                                    originType={loc.origin_type || 'DERIVED'}
                                    originSource={loc.origin_source || 'World Bible Geography'}
                                    interactive={true}
                                    onClick={() =>
                                      setWhyModalData({
                                        title: loc.name,
                                        entityType: 'Key Location',
                                        originType: loc.origin_type || 'DERIVED',
                                        originSource: loc.origin_source || 'World Bible Geography',
                                        nodeId: `node-loc-${idx}`,
                                      })
                                    }
                                    size="xs"
                                  />
                                  <button
                                    onClick={() => jumpToTraceNode(`node-loc-${idx}`)}
                                    className="trace-lineage-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition font-semibold min-h-[28px] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
                                    title="Trace causal lineage in DAG"
                                  >
                                    <GitFork className="w-3.5 h-3.5" />
                                    <span>Trace Lineage</span>
                                  </button>
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7] font-medium">
                                    Location {idx + 1}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-[#394840] leading-relaxed">{loc.description}</p>
                            </div>

                            {/* Visual Prompt Callout */}
                            <div className="pt-2 border-t border-[#D8CCB7] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#5A6E5E] font-mono flex items-center gap-1 font-semibold">
                                  <Sparkles className="w-3.5 h-3.5 text-[#C59A55]" />
                                  Visual Prompt
                                </span>
                                <button
                                  onClick={() => handleCopyPrompt(copyKey, loc.visual_prompt, loc.name)}
                                  className="copy-prompt-btn flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg bg-[#F2EBDD] hover:bg-[#EAE0D0] text-xs font-semibold text-[#355A46] border border-[#D8CCB7] transition"
                                  title="Copy visual prompt to clipboard"
                                >
                                  {copiedId === copyKey ? (
                                    <>
                                      <Check className="w-3 h-3 text-[#355A46]" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Visual Prompt</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-[11px] text-[#5A6E5E] italic bg-[#F2EBDD] p-2.5 rounded-lg border border-[#D8CCB7] line-clamp-3">
                                "{loc.visual_prompt}"
                              </p>
                            </div>

                            {/* Multimodal Sensory Media */}
                            <EntityMediaSection
                              entityType="location"
                              entityId={`loc-${idx}`}
                              defaultPrompt={loc.visual_prompt || `${loc.name}: ${loc.description}`}
                              availableModalities={['image']}
                              compact={true}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Faction Matrix */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold font-serif text-[#294B3A] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#805B20]" />
                    <span>Faction Matrix</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {unfoldedUniverse.world_bible.factions.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold font-serif text-[#294B3A] text-xs md:text-sm">{f.name}</h3>
                          <span className="px-2.5 py-0.5 rounded text-xs bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30 font-semibold">
                            {f.role}
                          </span>
                        </div>
                        <p className="text-xs text-[#394840] leading-relaxed">
                          <span className="text-[#718875] font-medium">Agenda: </span>
                          {f.agenda}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Timeline & Canon Facts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Timeline */}
                  <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold font-serif text-[#294B3A] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#355A46]" />
                      <span>Historical Timeline</span>
                    </h3>
                    {unfoldedUniverse.world_bible.history_timeline && unfoldedUniverse.world_bible.history_timeline.length > 0 ? (
                      <div className="space-y-2.5">
                        {unfoldedUniverse.world_bible.history_timeline.map((item, idx) => (
                          <div key={idx} className="border-l-2 border-[#355A46]/60 pl-3 space-y-0.5">
                            <span className="text-xs font-mono text-[#355A46] font-bold block">
                              {item.era}
                            </span>
                            <p className="text-xs text-[#394840] leading-relaxed break-words">{item.event}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#5A6E5E] italic" data-testid="empty-history-timeline">
                        No timeline events recorded yet.
                      </p>
                    )}
                  </div>

                  {/* Canon Facts */}
                  <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold font-serif text-[#294B3A] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#355A46]" />
                      <span>Canon Lore Facts</span>
                    </h3>
                    {unfoldedUniverse.world_bible.canon_facts && unfoldedUniverse.world_bible.canon_facts.length > 0 ? (
                      <ul className="space-y-2 text-xs text-[#394840]">
                        {unfoldedUniverse.world_bible.canon_facts.map((fact, idx) => {
                          const isHozTheme =
                            Boolean(hoz &&
                            hoz.is_locked &&
                            hoz.core_theme &&
                            (fact === hoz.core_theme || fact.includes(hoz.core_theme) || idx === 0));
                          return (
                            <li key={idx} className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-start gap-2 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#355A46] mt-2 shrink-0" />
                                <span className="leading-relaxed break-words">{fact}</span>
                                {isHozTheme && (
                                  <span className="creator-locked-badge px-2.5 py-1 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 min-h-[24px]">
                                    <Lock className="w-3 h-3" /> CREATOR LOCKED
                                  </span>
                                )}
                              </div>
                              <OriginBadge
                                originType={isHozTheme ? 'HUMAN_DECISION' : 'DERIVED'}
                                originSource={isHozTheme ? 'Human-Only Zone: Core Theme' : 'World Bible: Canon Lore Laws'}
                                interactive={true}
                                onClick={() =>
                                  setWhyModalData({
                                    title: `Canon Lore Law #${idx + 1}`,
                                    entityType: 'Canon Lore Fact',
                                    originType: isHozTheme ? 'HUMAN_DECISION' : 'DERIVED',
                                    originSource: isHozTheme ? 'Human-Only Zone: Core Theme' : 'World Bible: Canon Lore Laws',
                                    causalExplanation: isHozTheme
                                      ? `Locked by the human creator as an inviolable Human-Only Zone before universe expansion: "${fact}"`
                                      : `Established in Stage 5 World Bible to enforce physical, geographical, and ecological consistency: "${fact}"`,
                                    nodeId: 'node-bible',
                                  })
                                }
                                size="xs"
                                showLabel={false}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#5A6E5E] italic" data-testid="empty-canon-facts">
                        No lore facts have been generated yet.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Characters & Dynamics */}
            {activeCodexTab === 'characters' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Character Cards */}
                <div id="codex-characters-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 min-w-0">
                  {unfoldedUniverse.characters
                    .filter(
                      (char) =>
                        selectedOriginFilter === 'ALL' ||
                        (char.origin_type || 'SEED_INFERRED') === selectedOriginFilter
                    )
                    .map((char, idx) => {
                    const copyKey = `char-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-5 md:p-6 rounded-[22px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-4 flex flex-col justify-between shadow-xs min-w-0 break-words overflow-hidden"
                      >
                        <div className="space-y-3.5 min-w-0">
                          {/* Character Card Header */}
                          <div className="space-y-2 pb-2.5 border-b border-[#D8CCB7] min-w-0">
                            <div className="min-w-0 space-y-0.5">
                              <h3 className="font-bold font-serif text-[#294B3A] text-base md:text-lg break-words">
                                {char.name}
                              </h3>
                              <div className="text-xs text-[#718875] font-medium break-words">
                                {char.role}
                              </div>
                            </div>

                            {/* Origin & Archetype Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0 pt-0.5">
                              <OriginBadge
                                originType={char.origin_type || 'SEED_INFERRED'}
                                originSource={char.origin_source || 'Character Roster'}
                                interactive={true}
                                onClick={() =>
                                  setWhyModalData({
                                    title: char.name,
                                    entityType: 'Character',
                                    originType: char.origin_type || 'SEED_INFERRED',
                                    originSource: char.origin_source || 'Character Roster',
                                    nodeId: `node-char-${char.id}`,
                                  })
                                }
                                size="xs"
                              />
                              <span className="char-version-badge px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30 shrink-0">
                                v{char.version || 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-xs font-mono bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7] font-medium shrink-0">
                                {char.archetype}
                              </span>
                            </div>
                          </div>

                          {/* Motivation & Core Conflict */}
                          <div className="space-y-2.5 text-xs min-w-0">
                            <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5 min-w-0 break-words">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-bold text-[#5F6D63]">
                                  Motivation
                                </span>
                                {hoz && hoz.is_locked && hoz.protagonist_motivation && (char.motivation === hoz.protagonist_motivation || (char.origin_source && char.origin_source.includes('Human-Only Zone'))) && (
                                  <span className="creator-locked-badge px-2.5 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-2xs shrink-0">
                                    <Lock className="w-3 h-3" /> CREATOR LOCKED
                                  </span>
                                )}
                              </div>
                              <p className="text-[#394840] leading-relaxed break-words whitespace-normal text-xs">{char.motivation}</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1.5 min-w-0 break-words">
                              <span className="text-[11px] uppercase tracking-wider font-bold text-[#5F6D63]">
                                Core Conflict
                              </span>
                              <p className="text-[#394840] leading-relaxed break-words whitespace-normal text-xs">{char.core_conflict}</p>
                            </div>
                          </div>
                        </div>

                        {/* Visual Prompt Section */}
                        <div className="pt-2.5 border-t border-[#D8CCB7] space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
                            <span className="text-[#5A6E5E] font-mono flex items-center gap-1 font-semibold text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-[#C59A55]" />
                              Image Idea
                            </span>
                            <button
                              onClick={() => handleCopyPrompt(copyKey, char.visual_prompt, char.name)}
                              className="copy-prompt-btn flex items-center gap-1.5 px-3 py-1.5 min-h-[30px] rounded-lg bg-[#F2EBDD] hover:bg-[#EAE0D0] text-xs font-semibold text-[#355A46] border border-[#D8CCB7] transition-colors shrink-0"
                            >
                              {copiedId === copyKey ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#355A46]" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Image Idea</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[11.5px] text-[#5A6E5E] italic bg-[#F2EBDD] p-3 rounded-lg border border-[#D8CCB7] break-words whitespace-normal leading-relaxed">
                            "{char.visual_prompt}"
                          </p>
                        </div>

                        {/* Multimodal Sensory Media */}
                        <EntityMediaSection
                          entityType="character"
                          entityId={char.id}
                          entityTitle={char.name}
                          defaultPrompt={char.visual_prompt || `${char.name}, ${char.role}: ${char.motivation}`}
                          availableModalities={['image', 'voice']}
                          roleHint={`${char.role} ${char.archetype}`}
                        />

                        {/* Consistent Card Footer */}
                        <div className="mt-auto pt-3.5 border-t border-[#D8CCB7] flex flex-wrap items-center justify-between gap-2.5 min-w-0">
                          <button
                            onClick={() => setRefiningEntity({ type: 'character', data: char })}
                            className="refine-character-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#E9DDBF] hover:bg-[#DFCFAC] text-[#805B20] border border-[#C59A55]/40 transition-colors font-semibold min-h-[30px] focus:outline-none focus:ring-1 focus:ring-[#805B20] shrink-0"
                            title="Refine character traits and motivation (PERS-01)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Refine</span>
                          </button>
                          <button
                            onClick={() => jumpToTraceNode(`node-char-${char.id}`)}
                            className="trace-lineage-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition-colors font-semibold min-h-[30px] focus:outline-none focus:ring-1 focus:ring-[#294B3A] shrink-0"
                            title="Trace origin trail in DAG"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            <span>See Where It Came From</span>
                          </button>
                        </div>

                      </div>

                    );
                  })}
                </div>

                {/* Relationship Web Section */}
                <div id="codex-relationship-web" className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold font-serif text-[#294B3A] flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#A0522D]" />
                      <span>Character Relationships</span>
                    </h2>
                    <span className="text-[11px] text-[#718875]">
                      Scoped to world direction with dynamic tension descriptions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
                    {unfoldedUniverse.relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-[22px] bg-[#F8F4E8] border border-[#D8CCB7] flex flex-col justify-between shadow-xs min-w-0 break-words space-y-3.5"
                      >
                        <div className="space-y-2.5 min-w-0">
                          {/* Relationship Header */}
                          <div className="flex flex-wrap items-center justify-between border-b border-[#D8CCB7] pb-2 min-w-0 gap-2">
                            <span className="font-bold font-serif text-[#294B3A] text-sm md:text-base">
                              {rel.source_character_name || 'Character A'}
                            </span>
                            <span className="text-[#8C9E90] shrink-0 font-bold">↔</span>
                            <span className="font-bold font-serif text-[#294B3A] text-sm md:text-base text-right">
                              {rel.target_character_name || 'Character B'}
                            </span>
                          </div>

                          {/* Relation Type Badge */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#F5E6DC] text-[#B8734F] border border-[#E2BFAC] shrink-0">
                              {rel.relation_type}
                            </span>
                          </div>

                          {/* Dynamic Description */}
                          <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] min-w-0 break-words">
                            <span className="text-[11px] uppercase tracking-wider font-bold text-[#5F6D63] block mb-1">
                              Dynamic Tension
                            </span>
                            <p className="text-[#394840] leading-relaxed text-xs break-words whitespace-normal">
                              {rel.dynamic_description}
                            </p>
                          </div>
                        </div>

                        {/* Consistent Footer for Relationship Card */}
                        <div className="mt-auto pt-3 border-t border-[#D8CCB7] flex items-center justify-end min-w-0">
                          <button
                            onClick={() => jumpToTraceNode(`node-rel-${rel.id}`)}
                            className="trace-lineage-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition-colors font-semibold min-h-[30px] focus:outline-none focus:ring-1 focus:ring-[#294B3A] shrink-0"
                            title="Trace origin trail in DAG"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            <span>See Where It Came From</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: Story Beats / Scenes */}
            {activeCodexTab === 'scenes' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                id="codex-scenes-grid"
                className="space-y-4"
              >
                {unfoldedUniverse.scenes
                  .filter(
                    (scene) =>
                      selectedOriginFilter === 'ALL' ||
                      (scene.origin_type || 'SEED_EXPLICIT') === selectedOriginFilter
                  )
                  .map((scene, idx) => {
                  const copyKey = `scene-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-4 shadow-xs min-w-0 break-words overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CCB7] pb-3 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-2.5 py-1 rounded-lg bg-[#EFE8EE] text-[#6A4B67] font-mono font-bold text-xs border border-[#DFD1DE] shrink-0">
                            Scene {scene.scene_number}
                          </span>
                          <h3 className="font-bold font-serif text-[#294B3A] text-base md:text-lg break-words">
                            {scene.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <OriginBadge
                            originType={scene.origin_type || 'SEED_EXPLICIT'}
                            originSource={scene.origin_source || `Story Beat #${scene.scene_number}`}
                            interactive={true}
                            onClick={() =>
                              setWhyModalData({
                                title: scene.title,
                                entityType: 'Scene / Story Beat',
                                originType: scene.origin_type || 'SEED_EXPLICIT',
                                originSource: scene.origin_source || `Story Beat #${scene.scene_number}`,
                                nodeId: `node-scene-${scene.id}`,
                              })
                            }
                            size="xs"
                          />
                          <span className="scene-version-badge px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#EFE8EE] text-[#6A4B67] border border-[#DFD1DE] shrink-0">
                            v{scene.version || 1}
                          </span>
                          <button
                            onClick={() => setRefiningEntity({ type: 'scene', data: scene })}
                            className="refine-scene-btn flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-mono bg-[#EFE8EE] hover:bg-[#DFD1DE] text-[#6A4B67] border border-[#DFD1DE] transition font-semibold shrink-0"
                            title="Refine scene beats and outcomes (PERS-01)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Refine</span>
                          </button>
                          <button
                            onClick={() => jumpToTraceNode(`node-scene-${scene.id}`)}
                            className="trace-lineage-btn flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition font-semibold shrink-0"
                            title="Trace origin trail in DAG"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            <span>See Where It Came From</span>
                          </button>
                          <span className="text-[11px] text-[#718875] font-medium shrink-0">Setting:</span>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7] break-words">
                            {scene.location_setting}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs min-w-0">
                        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1 min-w-0 break-words">
                          <span className="text-xs uppercase font-bold text-[#6A4B67]">
                            Dramatic Question
                          </span>
                          <p className="text-[#294B3A] font-semibold leading-relaxed break-words whitespace-normal">
                            {scene.dramatic_question}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1 min-w-0 break-words">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs uppercase font-bold text-[#A0522D]">
                              Conflict Narrative
                            </span>
                            {hoz && hoz.is_locked && hoz.central_conflict && (scene.conflict_narrative === hoz.central_conflict || (scene.origin_source && scene.origin_source.includes('Human-Only Zone'))) && (
                              <span className="creator-locked-badge px-2.5 py-1 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs min-h-[24px] shrink-0">
                                <Lock className="w-3 h-3" /> CREATOR LOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-[#394840] leading-relaxed break-words whitespace-normal">
                            {scene.conflict_narrative}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1 min-w-0 break-words">
                          <span className="text-xs uppercase font-bold text-[#355A46]">
                            Pivotal Outcome
                          </span>
                          <p className="text-[#394840] leading-relaxed break-words whitespace-normal">{scene.pivotal_outcome}</p>
                        </div>
                      </div>

                      {/* Visual Prompt Section */}
                      <div className="pt-2 border-t border-[#D8CCB7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#5A6E5E] font-mono min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-[#6A4B67] shrink-0" />
                          <span className="italic break-words whitespace-normal">"{scene.visual_prompt}"</span>
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(copyKey, scene.visual_prompt, scene.title)}
                          className="copy-prompt-btn flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2EBDD] hover:bg-[#EAE0D0] text-xs text-[#6A4B67] hover:text-[#583D55] border border-[#D8CCB7] transition shrink-0"
                        >
                          {copiedId === copyKey ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#355A46]" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Image Idea</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Multimodal Sensory Media */}
                      <EntityMediaSection
                        entityType="scene"
                        entityId={scene.id}
                        entityTitle={`Scene ${scene.scene_number}${scene.title ? `: ${scene.title}` : ''}`}
                        defaultPrompt={scene.visual_prompt || `${scene.title} in ${scene.location_setting}: ${scene.conflict_narrative}`}
                        availableModalities={['image', 'voice', 'audio']}
                      />

                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Bottom Action Area: Consistent Bottom Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#D8CCB7] mt-8 min-w-0">
              <div className="text-xs text-[#5F6D63]">
                World built successfully. See where every element came from in Stage 6.
              </div>
              <button
                type="button"
                data-testid="bottom-view-lineage-btn"
                onClick={() => {
                  unlockStage('trace');
                  setActiveStage('trace');
                }}
                className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <GitBranch className="w-4 h-4" />
                <span>See Where It Came From (Stage 6)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Why is this here? Explainer Modal (ORIG-03) */}
      <WhyIsThisHereModal
        isOpen={!!whyModalData}
        onClose={() => setWhyModalData(null)}
        data={whyModalData}
        onJumpToDAG={(nodeId) => jumpToTraceNode(nodeId || '')}
      />

      {/* Refinement Modal (PERS-01) */}
      <RefinementModal />

      {/* Persistent Atmosphere Deck (D-04) */}
      <AtmosphereDeck />
    </div>
  );
};
