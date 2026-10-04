import React, { useState } from 'react';
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
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { RefinementModal } from './RefinementModal';

export const UniverseCodexCanvas: React.FC = () => {
  const {
    selectedWorldId,
    selectedWorldRationale,
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
  } = useWorkspaceStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedWorld = worlds.find((w) => w.id === selectedWorldId);

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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-canvas-deep text-slate-100 p-4 md:p-8">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/95 border border-cyan-500/80 text-cyan-200 text-xs font-medium shadow-2xl shadow-cyan-950/50 backdrop-blur-md"
          >
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-canvas-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Tattva 4: Generative Unfolding (Srishti)
              </span>
              <span className="text-xs text-slate-400 font-mono">• Stage 5 Codex</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              {selectedWorld ? selectedWorld.title : 'Progressive World Unfolding'}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {selectedWorld?.concept ||
                'Expanding the committed world candidate into a multi-layered, living story-world codex.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setInspectorTab('provenance');
                toggleInspector(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-canvas-border text-xs text-slate-300 hover:text-slate-100 transition shadow-sm"
              title="Open Causal Lineage"
            >
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Inspect Lineage</span>
            </button>
          </div>
        </header>

        {/* Selected Direction Highlights Callout */}
        {selectedWorld && (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-canvas-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-400 font-medium">Committed Direction:</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/20">
                {selectedWorld.archetype}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {selectedWorld.aesthetic}
              </span>
            </div>
            {selectedWorldRationale && (
              <div className="text-slate-300 italic text-xs max-w-md line-clamp-1">
                "{selectedWorldRationale}"
              </div>
            )}
          </div>
        )}

        {/* State 1: Error Notification & Safe Retry */}
        {unfoldError && (
          <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-sm text-red-100">Universe Unfolding Interrupted</h2>
                <p className="text-xs text-red-300/90 mt-1 leading-relaxed">{unfoldError}</p>
              </div>
            </div>
            <button
              id="retry-unfold-btn"
              onClick={handleTriggerUnfold}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg shadow-red-900/40 transition shrink-0"
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
            className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-canvas-panel via-slate-900 to-slate-950 border border-cyan-500/30 text-center space-y-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none" />

            <div className="max-w-xl mx-auto space-y-3 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-glow-cyan">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
                Ready to Unfold the Universe
              </h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                Click below to begin the 4-layer generative expansion grounded strictly in your selected world,
                Seed DNA constraints, and creator rationale.
              </p>
            </div>

            {/* 4 Layers Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left relative z-10">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>1. World Bible</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Physics rules, environmental constraints, historical timeline, factions, and key locations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Users className="w-4 h-4" />
                  <span>2. Characters</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  2 to 4 core cast members with archetypes, internal conflicts, and Midjourney visual prompts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Compass className="w-4 h-4" />
                  <span>3. Relationship Web</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Interpersonal tensions, alliances, and dramatic social dynamics connecting the core cast.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                  <Film className="w-4 h-4" />
                  <span>4. Story Beats</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pivotal narrative scenes putting characters into active conflict with dramatic questions.
                </p>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <button
                id="unfold-universe-btn"
                onClick={handleTriggerUnfold}
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unfold Universe (Tattva 4: Srishti)</span>
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
            className="p-8 md:p-12 rounded-3xl bg-slate-900/80 border border-cyan-500/40 text-center space-y-8 shadow-2xl relative"
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Expanding Story-World Universe</h2>
              <p className="text-xs text-slate-400">
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
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                        : isCurrent
                        ? 'bg-slate-900 border-cyan-400/80 text-cyan-300 shadow-glow-cyan animate-pulse'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                          {item.step}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[10px] leading-tight text-slate-400">{item.desc}</p>
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
            <div className="flex items-center justify-between border-b border-canvas-border pb-px">
              <div className="flex gap-2">
                <button
                  id="codex-tab-bible"
                  onClick={() => setActiveCodexTab('bible')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'bible'
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>World Bible & Locations</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    {unfoldedUniverse.world_bible.key_locations.length}
                  </span>
                </button>

                <button
                  id="codex-tab-characters"
                  onClick={() => setActiveCodexTab('characters')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'characters'
                      ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Characters & Dynamics</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    {unfoldedUniverse.characters.length}
                  </span>
                </button>

                <button
                  id="codex-tab-scenes"
                  onClick={() => setActiveCodexTab('scenes')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition ${
                    activeCodexTab === 'scenes'
                      ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Story Beats / Scenes</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    {unfoldedUniverse.scenes.length}
                  </span>
                </button>
              </div>
            </div>

            {/* TAB 1: World Bible & Locations */}
            {activeCodexTab === 'bible' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Environmental Laws & Physical Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-canvas-card border border-canvas-border space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                      <Compass className="w-4 h-4" />
                      <span>Geography & Environment</span>
                    </div>
                    <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
                      {unfoldedUniverse.world_bible.geography}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-canvas-card border border-canvas-border space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                      <Shield className="w-4 h-4" />
                      <span>Physical Laws & Constraints</span>
                    </div>
                    <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
                      {unfoldedUniverse.world_bible.physics_rules}
                    </p>
                  </div>
                </div>

                {/* Key Locations Section (UNFL-05 with non-blocking copy prompt) */}
                <div id="codex-key-locations" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>Key World Locations</span>
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Embedded in World Bible with visual prompt descriptors
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unfoldedUniverse.world_bible.key_locations.map((loc, idx) => {
                      const copyKey = `location-${idx}`;
                      return (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-slate-100 text-sm">{loc.name}</h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => jumpToTraceNode(`node-loc-${idx}`)}
                                  className="trace-lineage-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
                                  title="Trace causal lineage in DAG"
                                >
                                  <GitFork className="w-3 h-3" />
                                  <span>Trace Lineage</span>
                                </button>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  Location {idx + 1}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{loc.description}</p>
                          </div>

                          {/* Visual Prompt Callout */}
                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-mono flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                                Visual Prompt
                              </span>
                              <button
                                onClick={() => handleCopyPrompt(copyKey, loc.visual_prompt, loc.name)}
                                className="copy-prompt-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-[11px] text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/50 transition"
                                title="Copy visual prompt to clipboard"
                              >
                                {copiedId === copyKey ? (
                                  <>
                                    <Check className="w-3 h-3 text-cyan-400" />
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
                            <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 line-clamp-3">
                              "{loc.visual_prompt}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Faction Matrix */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Faction Matrix</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {unfoldedUniverse.world_bible.factions.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-canvas-card border border-canvas-border space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-100 text-xs md:text-sm">{f.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 font-medium">
                            {f.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <span className="text-slate-400 font-medium">Agenda: </span>
                          {f.agenda}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Timeline & Canon Facts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Timeline */}
                  <div className="p-5 rounded-2xl bg-canvas-card border border-canvas-border space-y-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>Historical Timeline</span>
                    </h3>
                    <div className="space-y-2.5">
                      {unfoldedUniverse.world_bible.history_timeline.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-cyan-500/50 pl-3 space-y-0.5">
                          <span className="text-[10px] font-mono text-cyan-300 font-bold block">
                            {item.era}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Canon Facts */}
                  <div className="p-5 rounded-2xl bg-canvas-card border border-canvas-border space-y-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Canon Lore Facts</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {unfoldedUniverse.world_bible.canon_facts.map((fact, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{fact}</span>
                        </li>
                      ))}
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
                  {unfoldedUniverse.characters.map((char, idx) => {
                    const copyKey = `char-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-canvas-card border border-canvas-border space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-extrabold text-slate-100 text-sm md:text-base">
                                {char.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="char-version-badge px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  v{char.version || 1}
                                </span>
                                <button
                                  onClick={() => setRefiningEntity({ type: 'character', data: char })}
                                  className="refine-character-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition font-medium"
                                  title="Refine character traits and motivation (PERS-01)"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Refine</span>
                                </button>
                                <button
                                  onClick={() => jumpToTraceNode(`node-char-${char.id}`)}
                                  className="trace-lineage-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition"
                                  title="Trace causal lineage in DAG"
                                >
                                  <GitFork className="w-3 h-3" />
                                  <span>Trace Lineage</span>
                                </button>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {char.archetype}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {char.role}
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Motivation
                              </span>
                              <p className="text-slate-200 leading-relaxed">{char.motivation}</p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Core Conflict
                              </span>
                              <p className="text-slate-200 leading-relaxed">{char.core_conflict}</p>
                            </div>
                          </div>
                        </div>

                        {/* Visual Prompt Section */}
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              Concept Prompt
                            </span>
                            <button
                              onClick={() => handleCopyPrompt(copyKey, char.visual_prompt, char.name)}
                              className="copy-prompt-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-[11px] text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/50 transition"
                            >
                              {copiedId === copyKey ? (
                                <>
                                  <Check className="w-3 h-3 text-cyan-400" />
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
                          <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 line-clamp-3">
                            "{char.visual_prompt}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Relationship Web Section */}
                <div id="codex-relationship-web" className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Interpersonal Dynamics & Relationship Web</span>
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Scoped to world direction with dynamic tension descriptions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {unfoldedUniverse.relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="font-bold text-slate-200">
                            {rel.source_character_name || 'Character A'}
                          </span>
                          <span className="text-slate-500">↔</span>
                          <span className="font-bold text-slate-200">
                            {rel.target_character_name || 'Character B'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/10 text-orange-300 border border-orange-500/20">
                            {rel.relation_type}
                          </div>
                          <button
                            onClick={() => jumpToTraceNode(`node-rel-${rel.id}`)}
                            className="trace-lineage-btn flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 transition"
                            title="Trace causal lineage in DAG"
                          >
                            <GitFork className="w-3 h-3" />
                            <span>Trace Lineage</span>
                          </button>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11.5px]">
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
                {unfoldedUniverse.scenes.map((scene, idx) => {
                  const copyKey = `scene-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl bg-canvas-card border border-canvas-border space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-canvas-border pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 font-mono font-bold text-xs border border-purple-500/30">
                            Scene {scene.scene_number}
                          </span>
                          <h3 className="font-extrabold text-slate-100 text-base md:text-lg">
                            {scene.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="scene-version-badge px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            v{scene.version || 1}
                          </span>
                          <button
                            onClick={() => setRefiningEntity({ type: 'scene', data: scene })}
                            className="refine-scene-btn flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition font-medium"
                            title="Refine scene beats and outcomes (PERS-01)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Refine</span>
                          </button>
                          <button
                            onClick={() => jumpToTraceNode(`node-scene-${scene.id}`)}
                            className="trace-lineage-btn flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition"
                            title="Trace causal lineage in DAG"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            <span>Trace Lineage</span>
                          </button>
                          <span className="text-[11px] text-slate-400 font-medium">Setting:</span>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                            {scene.location_setting}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-purple-400">
                            Dramatic Question
                          </span>
                          <p className="text-slate-200 font-medium leading-relaxed">
                            {scene.dramatic_question}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Conflict Narrative
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {scene.conflict_narrative}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400">
                            Pivotal Outcome
                          </span>
                          <p className="text-slate-300 leading-relaxed">{scene.pivotal_outcome}</p>
                        </div>
                      </div>

                      {/* Visual Prompt Section */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="italic line-clamp-1">"{scene.visual_prompt}"</span>
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(copyKey, scene.visual_prompt, scene.title)}
                          className="copy-prompt-btn flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-950 text-xs text-purple-300 hover:text-purple-200 border border-slate-700 hover:border-purple-500/50 transition shrink-0"
                        >
                          {copiedId === copyKey ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-purple-400" />
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
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Refinement Modal (PERS-01) */}
      <RefinementModal />
    </div>
  );
};
