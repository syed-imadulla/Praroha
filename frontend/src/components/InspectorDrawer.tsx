import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dna, GitCommit, Info, Sparkles, Globe } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { SeedDnaViewer } from './SeedDnaViewer';

export const InspectorDrawer: React.FC = () => {
  const {
    inspectorOpen,
    inspectorTab,
    toggleInspector,
    setInspectorTab,
    seedDNA,
    worlds,
    seedText,
    selectedWorldId,
    selectedWorldRationale,
    activeSelection,
    unfoldedUniverse,
  } = useWorkspaceStore();

  return (
    <AnimatePresence>
      {inspectorOpen && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-14 right-0 bottom-0 w-80 md:w-96 bg-[#F4EEDF] border-l border-[#D8CCB7] shadow-xl flex flex-col z-20 select-none"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#D8CCB7] bg-[#EAE4D4]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#355A46]" />
              <h2 className="font-serif font-bold text-[#294B3A] text-sm">
                Workspace Inspector
              </h2>
            </div>
            <button
              onClick={() => toggleInspector(false)}
              className="p-1 rounded-md hover:bg-[#EAE4D4] text-[#466A55] hover:text-[#294B3A] transition"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#D8CCB7] bg-[#F2EBDD]">
            <button
              onClick={() => setInspectorTab('dna')}
              className={`flex-1 py-2 px-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                inspectorTab === 'dna'
                  ? 'border-[#355A46] text-[#294B3A] bg-[#EAE4D4] font-bold'
                  : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#EAE4D4]/60'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>DNA</span>
            </button>

            <button
              onClick={() => setInspectorTab('worlds')}
              className={`flex-1 py-2 px-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                inspectorTab === 'worlds'
                  ? 'border-[#355A46] text-[#294B3A] bg-[#EAE4D4] font-bold'
                  : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#EAE4D4]/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Worlds ({worlds.length})</span>
            </button>

            <button
              onClick={() => setInspectorTab('provenance')}
              className={`flex-1 py-2 px-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition ${
                inspectorTab === 'provenance'
                  ? 'border-[#355A46] text-[#294B3A] bg-[#EAE4D4] font-bold'
                  : 'border-transparent text-[#718875] hover:text-[#294B3A] hover:bg-[#EAE4D4]/60'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Lineage</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inspectorTab === 'dna' && (
              seedDNA ? (
                <SeedDnaViewer dnaRecord={seedDNA} compact={true} />
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[#355A46] font-semibold mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Seed DNA Parameters</span>
                    </div>
                    <p className="text-[#466A55] leading-relaxed text-[11px]">
                      Extracted intent, tone, entities, and constraints will appear here as structured chips and exportable JSON once the understanding pass runs.
                    </p>
                  </div>
                </div>
              )
            )}

            {inspectorTab === 'worlds' && (
              worlds.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-2.5 rounded-lg bg-[#EAE4D4] border border-[#D8CCB7] text-[11px] text-[#294B3A] flex items-center justify-between shadow-2xs font-mono">
                    <span>Batch ID: {worlds[0]?.batch_id.slice(0, 8)}...</span>
                    <span>{worlds[0]?.model_used}</span>
                  </div>

                  {worlds.map((w, idx) => {
                    const accents = [
                      { border: 'border-[#C8D0BE]', badge: 'bg-[#DDE2D2] text-[#294B3A]' },
                      { border: 'border-[#D1BECD]', badge: 'bg-[#EFE8EE] text-[#6A4B67]' },
                      { border: 'border-[#E2BFAC]', badge: 'bg-[#F5E6DC] text-[#B8734F]' },
                    ];
                    const currentAccent = accents[idx % accents.length];

                    return (
                      <div
                        key={w.id || idx}
                        className={`p-3.5 rounded-xl bg-[#F8F4E8] border ${currentAccent.border} space-y-2 text-xs shadow-2xs`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${currentAccent.badge}`}>
                            Candidate 0{w.candidate_index || idx + 1}
                          </span>
                          <span className="text-[10px] text-[#466A55] truncate max-w-[140px]">
                            {w.archetype}
                          </span>
                        </div>

                        <div className="font-serif font-bold text-[#294B3A] text-sm">
                          {w.title}
                        </div>

                        <p className="text-[#394840] text-[11.5px] italic leading-relaxed">
                          "{w.concept}"
                        </p>

                        <div className="pt-2 border-t border-[#D8CCB7] space-y-1.5 text-[11px]">
                          <div>
                            <span className="text-[#466A55] font-semibold">Tension: </span>
                            <span className="text-[#294B3A]">{w.core_tension}</span>
                          </div>
                          <div>
                            <span className="text-[#466A55] font-semibold">Trade-offs: </span>
                            <span className="text-[#294B3A]">{w.trade_offs}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] text-center space-y-2 shadow-2xs">
                  <Globe className="w-8 h-8 text-[#466A55] mx-auto" />
                  <div className="text-xs font-serif font-bold text-[#294B3A]">
                    No World Candidates Available
                  </div>
                  <p className="text-[11px] text-[#466A55]">
                    Switch to Stage 3 (Three Worlds) and generate candidates to inspect and compare them here.
                  </p>
                </div>
              )
            )}

            {inspectorTab === 'provenance' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#355A46] font-semibold mb-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>Active Causal Provenance Trail</span>
                  </div>
                  <p className="text-[#466A55] leading-relaxed text-[11px]">
                    Traceable DAG linking root seed, distilled Seed DNA, human world choice, and unfolded universe layers.
                  </p>
                </div>

                {/* Step 1: Raw Seed Node */}
                <div className="p-3.5 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                      Step 1 • Root Seed
                    </span>
                    <span className="text-[10px] text-[#355A46] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#355A46]" />
                      Immutable
                    </span>
                  </div>
                  <p className="text-[#294B3A] text-[11.5px] italic line-clamp-3">
                    "{seedText || 'No seed text recorded'}"
                  </p>
                </div>

                {/* Vertical Connector */}
                <div className="flex justify-center -my-2">
                  <div className="w-0.5 h-5 bg-[#D8CCB7]" />
                </div>

                {/* Step 2: Seed DNA Node */}
                <div className="p-3.5 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                      Step 2 • Seed DNA
                    </span>
                    <span className="text-[10px] text-[#466A55] font-mono">
                      {seedDNA ? seedDNA.model_used : 'Pending'}
                    </span>
                  </div>
                  {seedDNA ? (
                    <div className="space-y-1">
                      <p className="text-[#294B3A] text-[11.5px] font-medium line-clamp-2">
                        {seedDNA.dna.premise}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#466A55] pt-1">
                        <span>Tone: {seedDNA.dna.tone}</span>
                        <span>•</span>
                        <span>{seedDNA.dna.themes?.length || 0} themes</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#718875] italic text-[11px]">DNA extraction pending in Stage 2</p>
                  )}
                </div>

                {/* Vertical Connector */}
                <div className="flex justify-center -my-2">
                  <div className="w-0.5 h-5 bg-[#D8CCB7]" />
                </div>

                {/* Step 3: Human World Selection Node */}
                <div className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all shadow-2xs ${
                  selectedWorldId
                    ? 'bg-[#F8F4E8] border-[#355A46] ring-1 ring-[#355A46]/20'
                    : 'bg-[#F8F4E8] border-[#D8CCB7]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedWorldId
                        ? 'bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7]'
                        : 'bg-[#F2EBDD] text-[#718875]'
                    }`}>
                      Step 3 • Human World Selection
                    </span>
                    {selectedWorldId && (
                      <span className="text-[10px] text-[#355A46] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#355A46]" />
                        Human Verified
                      </span>
                    )}
                  </div>

                  {selectedWorldId ? (
                    (() => {
                      const selWorld = worlds.find((w) => w.id === selectedWorldId);
                      return (
                        <div className="space-y-2">
                          <div>
                            <div className="text-slate-100 font-bold text-sm">
                              {selWorld?.title || 'Selected World'}
                            </div>
                            <div className="text-[10px] text-amber-300 font-mono">
                              {selWorld?.archetype}
                            </div>
                          </div>
                          {selectedWorldRationale && (
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Creator Rationale:
                              </span>
                              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                                "{selectedWorldRationale}"
                              </p>
                            </div>
                          )}

                          {/* Decision DNA Details */}
                          {activeSelection?.decision_dna && (
                            <div className="space-y-2 pt-1 border-t border-slate-800/60">
                              {activeSelection.decision_dna.creative_priorities.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[9.5px] uppercase font-mono font-bold text-cyan-400">
                                    Creative Priorities:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {activeSelection.decision_dna.creative_priorities.map((p) => (
                                      <span
                                        key={p}
                                        className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px]"
                                      >
                                        ★ {p}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {activeSelection.decision_dna.rejected_directions.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[9.5px] uppercase font-mono font-bold text-rose-400">
                                    Negative Guardrails:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {activeSelection.decision_dna.rejected_directions.map((r) => (
                                      <span
                                        key={r}
                                        className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px]"
                                      >
                                        ⊘ {r}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {activeSelection.decision_dna.custom_directives && (
                                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10.5px] text-slate-400">
                                  <span className="font-semibold text-amber-300">Directive:</span>{' '}
                                  {activeSelection.decision_dna.custom_directives}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">
                      Awaiting human world choice in Stage 4
                    </p>
                  )}
                </div>

                {/* Vertical Connector to Step 4 */}
                {unfoldedUniverse && (
                  <>
                    <div className="flex justify-center -my-2">
                      <div className="w-0.5 h-5 bg-gradient-to-b from-amber-500/40 to-cyan-500/40" />
                    </div>

                    {/* Step 4: Unfolded Universe Codex Node */}
                    <div id="lineage-unfolded-codex" className="p-3.5 rounded-xl bg-[#F8F4E8] border border-[#355A46] shadow-xs space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                          Step 4 • Unfolded Codex
                        </span>
                        <span className="text-[10px] text-[#355A46] font-mono font-bold">
                          Universe Unfolded
                        </span>
                      </div>

                      {/* 4 Child Branches */}
                      <div className="space-y-2 pt-1 border-t border-[#D8CCB7]">
                        <div className="p-2 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] flex items-center justify-between">
                          <span className="text-[#294B3A] text-[11px] font-medium">World Bible</span>
                          <span className="text-[10px] text-[#466A55] font-mono">
                            {unfoldedUniverse.world_bible.key_locations.length} Locations • {unfoldedUniverse.world_bible.factions.length} Factions
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] flex items-center justify-between">
                          <span className="text-[#294B3A] text-[11px] font-medium">Characters</span>
                          <span className="text-[10px] text-[#B8734F] font-mono">
                            {unfoldedUniverse.characters.length} Inhabitants
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] flex items-center justify-between">
                          <span className="text-[#294B3A] text-[11px] font-medium">Dynamics Web</span>
                          <span className="text-[10px] text-[#6A4B67] font-mono">
                            {unfoldedUniverse.relationships.length} Tensions
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] flex items-center justify-between">
                          <span className="text-[#294B3A] text-[11px] font-medium">Story Scenes</span>
                          <span className="text-[10px] text-[#355A46] font-mono">
                            {unfoldedUniverse.scenes.length} Beats
                          </span>
                        </div>
                      </div>

                      {/* Origin Ledger Distribution (ORIG-01 / ORIG-03) */}
                      {(() => {
                        const counts: Record<string, number> = {
                          SEED_EXPLICIT: 0,
                          SEED_INFERRED: 0,
                          HUMAN_DECISION: 0,
                          DERIVED: 0,
                          AI_INTRODUCED: 0,
                          USER_ADDED: 0,
                        };

                        unfoldedUniverse.world_bible.key_locations.forEach((loc) => {
                          const o = loc.origin_type || 'DERIVED';
                          counts[o] = (counts[o] || 0) + 1;
                        });
                        unfoldedUniverse.characters.forEach((char) => {
                          const o = char.origin_type || 'SEED_INFERRED';
                          counts[o] = (counts[o] || 0) + 1;
                        });
                        unfoldedUniverse.scenes.forEach((sc) => {
                          const o = sc.origin_type || 'SEED_EXPLICIT';
                          counts[o] = (counts[o] || 0) + 1;
                        });

                        const totalEntities =
                          unfoldedUniverse.world_bible.key_locations.length +
                          unfoldedUniverse.characters.length +
                          unfoldedUniverse.scenes.length;

                        const originLabels: Record<string, { label: string; color: string; border: string }> = {
                          SEED_EXPLICIT: { label: 'Seed Explicit', color: 'text-[#294B3A] bg-[#DDE2D2]', border: 'border-[#C8D0BE]' },
                          SEED_INFERRED: { label: 'Seed Inferred', color: 'text-[#294B3A] bg-[#EAE4D4]', border: 'border-[#D8CCB7]' },
                          HUMAN_DECISION: { label: 'Human Choice', color: 'text-[#B8734F] bg-[#F5E6DC]', border: 'border-[#E2BFAC]' },
                          DERIVED: { label: 'Derived', color: 'text-[#466A55] bg-[#F2EBDD]', border: 'border-[#D8CCB7]' },
                          AI_INTRODUCED: { label: 'AI Introduced', color: 'text-[#6A4B67] bg-[#EFE8EE]', border: 'border-[#D1BECD]' },
                          USER_ADDED: { label: 'User Added', color: 'text-[#294B3A] bg-[#DDE2D2]', border: 'border-[#C8D0BE]' },
                        };

                        return (
                          <div className="pt-2 border-t border-[#D8CCB7] space-y-2" data-testid="origin-ledger-distribution">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-[#466A55] font-bold uppercase tracking-wider">
                                Origin Ledger Breakdown
                              </span>
                              <span className="text-[#355A46] font-bold">{totalEntities} Entities</span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              {Object.entries(counts)
                                .filter(([, cnt]) => cnt > 0)
                                .map(([key, cnt]) => {
                                  const cfg = originLabels[key] || {
                                    label: key,
                                    color: 'text-[#394840] bg-[#F2EBDD]',
                                    border: 'border-[#D8CCB7]',
                                  };
                                  return (
                                    <div
                                      key={key}
                                      className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center justify-between ${cfg.color} ${cfg.border}`}
                                    >
                                      <span className="truncate">{cfg.label}</span>
                                      <span className="font-bold ml-1">{cnt}</span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-[#D8CCB7] bg-[#EAE4D4]/60 text-[11px] text-[#466A55] text-center font-mono">
            Seed Unfold Inspector • Phase 5 Universe Codex
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
