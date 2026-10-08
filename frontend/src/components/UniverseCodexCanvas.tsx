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
import { SeedMutationLabCanvas } from './SeedMutationLabCanvas';
import { CounterfactualReplayCanvas } from './CounterfactualReplayCanvas';
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
    unfoldUniverse,
    jumpToTraceNode,
    toggleInspector,
    setInspectorTab,
    setRefiningEntity,
    generateMediaAction,
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                Tattva 2: Forms Hidden in Formless • Stage 5 Unfolding
              </span>
              <span className="text-xs text-[#718875] font-mono">• Universe Codex</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#294B3A] tracking-tight">
              {selectedWorld ? selectedWorld.title : 'Progressive World Unfolding'}
            </h1>
            <p className="text-xs md:text-sm text-[#466A55] max-w-2xl leading-relaxed">
              {selectedWorld?.concept ||
                'Expanding the committed world candidate into a multi-layered, living story-world codex.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              id="launcher-simulate-what-if-btn"
              onClick={() => setActiveCodexTab('mutation')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] text-xs text-[#294B3A] transition shadow-2xs font-semibold"
              title="Launch Seed Mutation Lab"
            >
              <Sparkles className="w-4 h-4 text-[#C59A55]" />
              <span>Simulate "What If?"</span>
            </button>
            <button
              id="launcher-counterfactual-replay-btn"
              onClick={() => setActiveCodexTab('replay')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] text-xs text-[#6A4B67] transition shadow-2xs font-semibold"
              title="Launch Counterfactual Replay"
            >
              <GitFork className="w-4 h-4 text-[#6A4B67]" />
              <span>What If I Chose Another World?</span>
            </button>
            <button
              onClick={() => {
                setInspectorTab('provenance');
                toggleInspector(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2EBDD] hover:bg-[#EAE4D4] border border-[#D8CCB7] text-xs text-[#294B3A] transition shadow-2xs"
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
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] font-mono font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#355A46]" />
                  <span>Decision DNA</span>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#F8F4E8] text-[#805B20] font-mono font-bold border border-[#D8C79D]">
                  {selectedWorld.archetype}
                </span>
                {selectedWorld.divergence_archetype && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F8F4E8] text-[#466A55] border border-[#D8CCB7]">
                    {selectedWorld.divergence_archetype}
                  </span>
                )}
                {(decisionDNA?.user_rationale || selectedWorldRationale) && (
                  <span className="text-[#466A55] italic text-[11px] line-clamp-1 max-w-sm">
                    "{decisionDNA?.user_rationale || selectedWorldRationale}"
                  </span>
                )}
              </div>

              {/* Priorities & Exclusions Pill Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {/* Priorities */}
                {(decisionDNA?.creative_priorities && decisionDNA.creative_priorities.length > 0
                  ? decisionDNA.creative_priorities
                  : ['Ecological / Symbiotic Mystery', 'Atmospheric Lore Depth', 'Ethical Stakes']
                )
                  .slice(0, 4)
                  .map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] text-[10.5px] font-medium"
                      title={`Mandatory Creative Priority: ${p}`}
                    >
                      <span className="text-[#355A46] font-bold">★</span>
                      <span>{p}</span>
                    </span>
                  ))}

                {/* Exclusions */}
                {(decisionDNA?.rejected_directions && decisionDNA.rejected_directions.length > 0
                  ? decisionDNA.rejected_directions
                  : ['Classical sunken ruins archaeology', 'Cold War militarized technology']
                )
                  .slice(0, 3)
                  .map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5E6DC] border border-[#E2BFAC] text-[#B8734F] text-[10.5px] font-medium"
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
                className="px-4 py-2 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] text-[11px] font-semibold flex items-center gap-1.5 transition shadow-2xs"
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
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#E9DDBF] text-[#805B20]">
                  <Lock className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#294B3A]">
                  Human-Only Zones: Inviolable Creative Axioms
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-[10px] font-mono font-bold">
                  CREATOR LOCKED
                </span>
              </div>
              <span className="text-[11px] text-[#718875] font-mono">
                Dual-Layer AI Invariance Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {hoz.core_theme && (
                <div className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C59A55] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Core Theme</span>
                  </div>
                  <p className="text-[#294B3A] line-clamp-2 leading-relaxed font-medium">
                    {hoz.core_theme}
                  </p>
                </div>
              )}
              {hoz.protagonist_motivation && (
                <div className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C59A55] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Protagonist Motivation</span>
                  </div>
                  <p className="text-[#294B3A] line-clamp-2 leading-relaxed font-medium">
                    {hoz.protagonist_motivation}
                  </p>
                </div>
              )}
              {hoz.central_conflict && (
                <div className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C59A55] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
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
                        <span className="w-4 h-4 rounded-full bg-[#E2EBE2] text-[#294B3A] flex items-center justify-center text-[10px]">
                          {item.step}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[10px] leading-tight text-[#5A6E5E]">{item.desc}</p>
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E2EBE2] text-[#294B3A] font-mono">
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E2EBE2] text-[#294B3A] font-mono">
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E2EBE2] text-[#294B3A] font-mono">
                    {unfoldedUniverse.scenes.length}
                  </span>
                </button>

                <button
                  id="codex-tab-mutation"
                  onClick={() => setActiveCodexTab('mutation')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'mutation'
                      ? 'border-[#A0522D] text-[#A0522D] bg-[#F5E6DC]/60 font-serif'
                      : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#F2EBDD]/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#A0522D]" />
                  <span>Seed Mutation Lab</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F5E6DC] text-[#A0522D] border border-[#E2BFAC] font-mono">
                    NEW
                  </span>
                </button>

                <button
                  id="codex-tab-replay"
                  onClick={() => setActiveCodexTab('replay')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'replay'
                      ? 'border-[#6A4B67] text-[#6A4B67] bg-[#EFE8EE]/60 font-serif'
                      : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#F2EBDD]/60'
                  }`}
                >
                  <GitFork className="w-4 h-4 text-[#6A4B67]" />
                  <span>Counterfactual Replay</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#EFE8EE] text-[#6A4B67] border border-[#DFD1DE] font-mono">
                    NEW
                  </span>
                </button>
              </div>
            </div>

            {/* Origin Filter Toolbar (ORIG-02) */}
            {activeCodexTab !== 'mutation' && activeCodexTab !== 'replay' && (
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
            )}

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
                      <button
                        type="button"
                        onClick={async () => {
                          const worldId = selectedWorld?.id || unfoldedUniverse?.world_bible.id;
                          if (!worldId) return;
                          await generateMediaAction({
                            entity_type: 'world',
                            entity_id: worldId,
                            media_type: 'video',
                            prompt: '',
                            duration_sec: 5,
                          });
                        }}
                        data-testid="bring-world-to-life-hero-btn"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6A4B67] hover:bg-[#583D55] text-[#F8F4E8] font-semibold text-xs shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        title="Synthesize 5s cinematic opening teaser video"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Bring This World to Life</span>
                      </button>
                      <span className="text-[11px] text-[#718875] font-mono">16:9 Cinematic Video & Cover</span>
                    </div>
                  </div>
                  <EntityMediaSection
                    entityType="world"
                    entityId={selectedWorld?.id || unfoldedUniverse.world_bible.id}
                    defaultPrompt={`Hero visual cover for ${selectedWorld?.title || 'Unfolded World'}. ${unfoldedUniverse.world_bible.geography}. ${unfoldedUniverse.world_bible.physics_rules}`}
                    availableModalities={['image', 'video', 'audio']}
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
                                    className="trace-lineage-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition"
                                    title="Trace causal lineage in DAG"
                                  >
                                    <GitFork className="w-3 h-3" />
                                    <span>Trace Lineage</span>
                                  </button>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F2EBDD] text-[#5A6E5E] border border-[#D8CCB7]">
                                    Location {idx + 1}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-[#394840] leading-relaxed">{loc.description}</p>
                            </div>

                            {/* Visual Prompt Callout */}
                            <div className="pt-2 border-t border-[#D8CCB7] space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#5A6E5E] font-mono flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-[#C59A55]" />
                                  Visual Prompt
                                </span>
                                <button
                                  onClick={() => handleCopyPrompt(copyKey, loc.visual_prompt, loc.name)}
                                  className="copy-prompt-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE0D0] text-[11px] text-[#355A46] border border-[#D8CCB7] transition"
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
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30 font-medium">
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
                    <div className="space-y-2.5">
                      {unfoldedUniverse.world_bible.history_timeline.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-[#355A46]/60 pl-3 space-y-0.5">
                          <span className="text-[10px] font-mono text-[#355A46] font-bold block">
                            {item.era}
                          </span>
                          <p className="text-xs text-[#394840] leading-relaxed">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Canon Facts */}
                  <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold font-serif text-[#294B3A] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#355A46]" />
                      <span>Canon Lore Facts</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-[#394840]">
                      {unfoldedUniverse.world_bible.canon_facts.map((fact, idx) => {
                        const isHozTheme =
                          Boolean(hoz &&
                          hoz.is_locked &&
                          hoz.core_theme &&
                          (fact === hoz.core_theme || fact.includes(hoz.core_theme) || idx === 0));
                        return (
                          <li key={idx} className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#355A46] mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{fact}</span>
                              {isHozTheme && (
                                <span className="creator-locked-badge px-2 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-[9px] font-mono font-bold flex items-center gap-1 shrink-0">
                                  <Lock className="w-2.5 h-2.5" /> CREATOR LOCKED
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
                <div id="codex-characters-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-4 flex flex-col justify-between shadow-xs"
                      >
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold font-serif text-[#294B3A] text-sm md:text-base">
                                {char.name}
                              </h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
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
                                <span className="char-version-badge px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30">
                                  v{char.version || 1}
                                </span>
                                <button
                                  onClick={() => setRefiningEntity({ type: 'character', data: char })}
                                  className="refine-character-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#E9DDBF] hover:bg-[#DFCFAC] text-[#805B20] border border-[#C59A55]/40 transition font-medium"
                                  title="Refine character traits and motivation (PERS-01)"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Refine</span>
                                </button>
                                <button
                                  onClick={() => jumpToTraceNode(`node-char-${char.id}`)}
                                  className="trace-lineage-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition"
                                  title="Trace causal lineage in DAG"
                                >
                                  <GitFork className="w-3 h-3" />
                                  <span>Trace Lineage</span>
                                </button>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F2EBDD] text-[#5A6E5E] border border-[#D8CCB7]">
                                  {char.archetype}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-[#718875] font-medium mt-0.5">
                              {char.role}
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-[#5A6E5E]">
                                  Motivation
                                </span>
                                {hoz && hoz.is_locked && hoz.protagonist_motivation && (char.motivation === hoz.protagonist_motivation || (char.origin_source && char.origin_source.includes('Human-Only Zone'))) && (
                                  <span className="creator-locked-badge px-2 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                                    <Lock className="w-2.5 h-2.5" /> CREATOR LOCKED
                                  </span>
                                )}
                              </div>
                              <p className="text-[#394840] leading-relaxed">{char.motivation}</p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1">
                              <span className="text-[10px] uppercase font-bold text-[#5A6E5E]">
                                Core Conflict
                              </span>
                              <p className="text-[#394840] leading-relaxed">{char.core_conflict}</p>
                            </div>
                          </div>
                        </div>

                        {/* Visual Prompt Section */}
                        <div className="pt-2 border-t border-[#D8CCB7] space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#5A6E5E] font-mono flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#C59A55]" />
                              Concept Prompt
                            </span>
                            <button
                              onClick={() => handleCopyPrompt(copyKey, char.visual_prompt, char.name)}
                              className="copy-prompt-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE0D0] text-[11px] text-[#355A46] border border-[#D8CCB7] transition"
                            >
                              {copiedId === copyKey ? (
                                <>
                                  <Check className="w-3 h-3 text-[#355A46]" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-[#5A6E5E] italic bg-[#F2EBDD] p-2.5 rounded-lg border border-[#D8CCB7] line-clamp-3">
                            "{char.visual_prompt}"
                          </p>
                        </div>

                        {/* Multimodal Sensory Media */}
                        <EntityMediaSection
                          entityType="character"
                          entityId={char.id}
                          defaultPrompt={char.visual_prompt || `${char.name}, ${char.role}: ${char.motivation}`}
                          availableModalities={['image', 'voice']}
                          roleHint={`${char.role} ${char.archetype}`}
                        />

                      </div>

                    );
                  })}
                </div>

                {/* Relationship Web Section */}
                <div id="codex-relationship-web" className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold font-serif text-[#294B3A] flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#A0522D]" />
                      <span>Interpersonal Dynamics & Relationship Web</span>
                    </h2>
                    <span className="text-[11px] text-[#718875]">
                      Scoped to world direction with dynamic tension descriptions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {unfoldedUniverse.relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-[#D8CCB7] pb-2">
                          <span className="font-bold font-serif text-[#294B3A]">
                            {rel.source_character_name || 'Character A'}
                          </span>
                          <span className="text-[#8C9E90]">↔</span>
                          <span className="font-bold font-serif text-[#294B3A]">
                            {rel.target_character_name || 'Character B'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#F5E6DC] text-[#B8734F] border border-[#E2BFAC]">
                            {rel.relation_type}
                          </div>
                          <button
                            onClick={() => jumpToTraceNode(`node-rel-${rel.id}`)}
                            className="trace-lineage-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition"
                            title="Trace causal lineage in DAG"
                          >
                            <GitFork className="w-3 h-3" />
                            <span>Trace Lineage</span>
                          </button>
                        </div>
                        <p className="text-[#394840] leading-relaxed text-[11.5px]">
                          {rel.dynamic_description}
                        </p>
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
                      className="p-6 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CCB7] pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-[#EFE8EE] text-[#6A4B67] font-mono font-bold text-xs border border-[#DFD1DE]">
                            Scene {scene.scene_number}
                          </span>
                          <h3 className="font-bold font-serif text-[#294B3A] text-base md:text-lg">
                            {scene.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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
                          <span className="scene-version-badge px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EFE8EE] text-[#6A4B67] border border-[#DFD1DE]">
                            v{scene.version || 1}
                          </span>
                          <button
                            onClick={() => setRefiningEntity({ type: 'scene', data: scene })}
                            className="refine-scene-btn flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#EFE8EE] hover:bg-[#DFD1DE] text-[#6A4B67] border border-[#DFD1DE] transition font-medium"
                            title="Refine scene beats and outcomes (PERS-01)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Refine</span>
                          </button>
                          <button
                            onClick={() => jumpToTraceNode(`node-scene-${scene.id}`)}
                            className="trace-lineage-btn flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#E2EBE2] hover:bg-[#D5E2D5] text-[#294B3A] border border-[#BACBB8] transition font-medium"
                            title="Trace causal lineage in DAG"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            <span>Trace Lineage</span>
                          </button>
                          <span className="text-[11px] text-[#718875] font-medium">Setting:</span>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7]">
                            {scene.location_setting}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#6A4B67]">
                            Dramatic Question
                          </span>
                          <p className="text-[#294B3A] font-medium leading-relaxed">
                            {scene.dramatic_question}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#A0522D]">
                              Conflict Narrative
                            </span>
                            {hoz && hoz.is_locked && hoz.central_conflict && (scene.conflict_narrative === hoz.central_conflict || (scene.origin_source && scene.origin_source.includes('Human-Only Zone'))) && (
                              <span className="creator-locked-badge px-2 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                                <Lock className="w-2.5 h-2.5" /> CREATOR LOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-[#394840] leading-relaxed">
                            {scene.conflict_narrative}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#355A46]">
                            Pivotal Outcome
                          </span>
                          <p className="text-[#394840] leading-relaxed">{scene.pivotal_outcome}</p>
                        </div>
                      </div>

                      {/* Visual Prompt Section */}
                      <div className="pt-2 border-t border-[#D8CCB7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-[#5A6E5E] font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-[#6A4B67] shrink-0" />
                          <span className="italic line-clamp-1">"{scene.visual_prompt}"</span>
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
                              <span>Copy Visual Prompt</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Multimodal Sensory Media */}
                      <EntityMediaSection
                        entityType="scene"
                        entityId={scene.id}
                        defaultPrompt={scene.visual_prompt || `${scene.title} in ${scene.location_setting}: ${scene.conflict_narrative}`}
                        availableModalities={['image', 'voice', 'audio', 'video']}
                      />

                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* TAB 4: Seed Mutation Lab (MUT-01 to MUT-04) */}
            {activeCodexTab === 'mutation' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SeedMutationLabCanvas />
              </motion.div>
            )}

            {/* TAB 5: Counterfactual Replay (CNTR-01, CNTR-02) */}
            {activeCodexTab === 'replay' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <CounterfactualReplayCanvas />
              </motion.div>
            )}
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
