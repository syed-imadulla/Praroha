import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileEdit,
  Sparkles,
  ShieldCheck,
  Dna,
  Lock,
  Unlock,
  Sliders,
  Ban,
  Plus,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { WorldCandidateCard } from './WorldCandidateCard';
import { WorldCandidateRead, WorldSelectionCreate } from '../types';

const PRESET_PRIORITIES = [
  'Atmospheric Lore Depth',
  'Character-Driven Conflict',
  'Ecological / Symbiotic Mystery',
  'Ethical Stakes',
  'Philosophical Stakes',
  'Visceral Sensory Worldbuilding',
  'Intimate Personal Scale',
];

export const WorldSelectionCanvas: React.FC = () => {
  const {
    activeProject,
    worlds,
    seedDNA,
    selectedWorldId,
    selectedWorldRationale,
    isSelectingWorld,
    setSelectedWorldId,
    setSelectedWorldRationale,
    confirmWorldSelection,
    setActiveStage,
    toggleInspector,
    setInspectorTab,
    humanOnlyZones,
    setHumanOnlyZones,
    toggleZoneLock,
  } = useWorkspaceStore();

  const [localRationale, setLocalRationale] = useState<string>(selectedWorldRationale || '');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [customPriorityInput, setCustomPriorityInput] = useState<string>('');
  const [enabledExclusions, setEnabledExclusions] = useState<Record<string, boolean>>({});
  const [customExclusions, setCustomExclusions] = useState<string[]>([]);
  const [customExclusionInput, setCustomExclusionInput] = useState<string>('');
  const [customDirectives, setCustomDirectives] = useState<string>('');

  // Check if Stage 5 has commenced
  const isStage5Begun =
    activeProject?.status !== undefined &&
    ['unfolding', 'unfolded', 'bible_generated', 'characters_generated', 'scenes_generated'].includes(
      activeProject.status
    );

  // Active selected candidate object
  const chosenCandidate = worlds.find((w) => w.id === selectedWorldId) || null;

  // Derive inferred exclusions from the two non-selected candidate worlds
  const unselectedCandidates = worlds.filter((w) => w.id !== selectedWorldId);
  const inferredExclusionsList = unselectedCandidates.map((cand) => {
    const t = cand.title.toLowerCase();
    if (t.includes('lost civilization')) {
      return 'Classical sunken ruins archaeology';
    }
    if (t.includes('time capsule')) {
      return 'Cold War militarized technology';
    }
    return `Archetype conventions of ${cand.title} (${cand.archetype})`;
  });

  // Synchronize defaults whenever a candidate is chosen
  useEffect(() => {
    if (chosenCandidate) {
      const isBioCity = chosenCandidate.title.toLowerCase().includes('bio-city');
      if (selectedPriorities.length === 0) {
        if (isBioCity) {
          setSelectedPriorities([
            'Ecological / Symbiotic Mystery',
            'Atmospheric Lore Depth',
            'Ethical Stakes',
          ]);
        } else {
          setSelectedPriorities(['Atmospheric Lore Depth', 'Character-Driven Conflict']);
        }
      }

      if (!localRationale && isBioCity) {
        setLocalRationale(
          'Selected Bio-City for deep biopunk exploration and rich ecological tension.'
        );
      }

      if (!customDirectives && isBioCity) {
        setCustomDirectives(
          'Ensure coral bio-luminescence and symbiotic sentience remain central across all layers.'
        );
      }

      // Default all inferred exclusions to active
      setEnabledExclusions((prev) => {
        const next = { ...prev };
        inferredExclusionsList.forEach((exc) => {
          if (next[exc] === undefined) {
            next[exc] = true;
          }
        });
        return next;
      });
    }
  }, [chosenCandidate?.id]);

  const handleSelectCandidate = (candidate: WorldCandidateRead) => {
    if (isStage5Begun) return;
    setSelectedWorldId(candidate.id);
  };

  const togglePriority = (p: string) => {
    if (selectedPriorities.includes(p)) {
      setSelectedPriorities(selectedPriorities.filter((item) => item !== p));
    } else {
      setSelectedPriorities([...selectedPriorities, p]);
    }
  };

  const handleAddCustomPriority = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customPriorityInput.trim();
    if (trimmed && !selectedPriorities.includes(trimmed)) {
      setSelectedPriorities([...selectedPriorities, trimmed]);
      setCustomPriorityInput('');
    }
  };

  const toggleExclusion = (exc: string) => {
    setEnabledExclusions((prev) => ({
      ...prev,
      [exc]: prev[exc] === false ? true : false,
    }));
  };

  const handleAddCustomExclusion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customExclusionInput.trim();
    if (trimmed && !customExclusions.includes(trimmed)) {
      setCustomExclusions([...customExclusions, trimmed]);
      setCustomExclusionInput('');
    }
  };

  const handleRemoveCustomExclusion = (exc: string) => {
    setCustomExclusions(customExclusions.filter((item) => item !== exc));
  };

  const handleSuggestZones = () => {
    if (!chosenCandidate) return;
    const isBioCity = chosenCandidate.title.toLowerCase().includes('bio-city');
    let theme = `${chosenCandidate.aesthetic} — ${chosenCandidate.core_tension}`;
    let motivation = `Uncover the secrets of ${chosenCandidate.title} under canon pressure`;
    let conflict = chosenCandidate.core_tension;

    if (isBioCity) {
      theme = 'Coexistence between synthetic human biology and ancient abyssal intelligence';
      motivation = "Decipher the sentient coral reef's neural frequency before corporate salvage crews arrive";
      conflict = 'Bio-symbiont collective survival vs. extractive corporate exploitation';
    } else if (seedDNA?.dna.premise) {
      theme = seedDNA.dna.premise;
      conflict = chosenCandidate.core_tension;
    }

    setHumanOnlyZones({
      core_theme: theme,
      protagonist_motivation: motivation,
      central_conflict: conflict,
      is_locked: false,
    });
  };

  const handleConfirmLock = async () => {
    if (!selectedWorldId || isStage5Begun) return;
    setSelectedWorldRationale(localRationale);

    const activeInferred = inferredExclusionsList.filter(
      (e) => enabledExclusions[e] !== false
    );
    const finalRejectedDirections = [...activeInferred, ...customExclusions];

    const payload: WorldSelectionCreate = {
      user_rationale: localRationale || null,
      creative_priorities: selectedPriorities,
      rejected_directions: finalRejectedDirections,
      custom_directives: customDirectives.trim() || null,
      human_only_zones: humanOnlyZones?.is_locked ? humanOnlyZones : undefined,
    };

    await confirmWorldSelection(selectedWorldId, payload);
  };

  const handleBackToStage3 = () => {
    setActiveStage('worlds');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 py-4 sm:py-6 px-2 sm:px-4">
      {/* Top Header & Human-in-the-Loop Choice Gate Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-canvas-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Stage 4 / 07 — Choice Gate
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3 h-3" />
              Human-in-the-Loop
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-slate-100 tracking-tight">
            Human World Selection & Creative Commitment
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Choose which of the three contrasting worlds becomes your project's canonical foundation. Define the Decision DNA (priorities, negative guardrails, and rationale) that anchors all Stage 5 unfolding.
          </p>
        </div>

        {/* Back and Status Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToStage3}
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            title="Return to candidate comparison without locking"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stage 3</span>
          </button>
        </div>
      </div>

      {/* Grounding Reminder: Seed DNA Anchor Strip */}
      {seedDNA && (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Dna className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300 font-medium">Seed DNA Anchor:</span>
            <span className="text-slate-400 italic line-clamp-1">"{seedDNA.dna.premise}"</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setInspectorTab('dna');
                toggleInspector(true);
              }}
              className="text-cyan-400 hover:underline text-[11px] font-medium"
            >
              View DNA Full
            </button>
          </div>
        </div>
      )}

      {/* Stage 5 Unfolding Lock Banner */}
      {isStage5Begun && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Direction Frozen:</strong> Stage 5 universe unfolding has already begun. The selected world is locked to preserve narrative consistency. To explore another candidate, branch the project.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveStage('unfold')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            Go to Stage 5
          </button>
        </div>
      )}

      {/* 3-Column Comparative Grid with Glow & Dim Hierarchy */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">
            {isStage5Begun ? 'Selected canon world direction:' : 'Select one world direction to activate:'}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {isStage5Begun
              ? 'Direction locked (Stage 5 active)'
              : selectedWorldId
              ? '1 direction active (switchable before Stage 5)'
              : 'No direction chosen yet'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {worlds.map((candidate, idx) => {
            const isSelected = selectedWorldId === candidate.id;
            const isDimmed = selectedWorldId !== null && !isSelected;

            return (
              <WorldCandidateCard
                key={candidate.id || idx}
                candidate={candidate}
                index={idx}
                isSelected={isSelected}
                isDimmed={isDimmed}
                isSelectable={!isStage5Begun}
                actionLabel={isSelected ? 'Selected Direction' : 'Select This Direction'}
                onSelect={handleSelectCandidate}
                selectionDisabled={isStage5Begun}
              />
            );
          })}
        </div>
      </div>

      {/* Selection Confirmation & Decision DNA Capture Panel */}
      <AnimatePresence>
        {chosenCandidate ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-6 rounded-2xl glass-card border border-cyan-500/40 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-6"
          >
            {/* Header: Chosen World Direction + Lock Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chosen World Direction</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>{chosenCandidate.title}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-normal">
                    {chosenCandidate.archetype}
                  </span>
                  {chosenCandidate.divergence_archetype && (
                    <span className="text-[10.5px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300">
                      {chosenCandidate.divergence_archetype}
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmLock}
                  disabled={isSelectingWorld}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  title="Lock this creative world direction and proceed to Stage 5 Unfolding"
                >
                  <Lock className={`w-4 h-4 ${isSelectingWorld ? 'animate-spin' : ''}`} />
                  <span>{isSelectingWorld ? 'Locking Direction...' : 'Confirm & Lock Direction (Proceed to Stage 5)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Decision DNA Capture Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Section 1: Creative Priorities */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>1. Creative Priorities (Pillars)</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400/80">
                    {selectedPriorities.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select thematic pillars for Stage 5 generation to prioritize across Bible, characters, and scenes:
                </p>

                {/* Priority Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_PRIORITIES.map((p) => {
                    const active = selectedPriorities.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                          active
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                        <span>{p}</span>
                      </button>
                    );
                  })}
                  {selectedPriorities
                    .filter((p) => !PRESET_PRIORITIES.includes(p))
                    .map((customP) => (
                      <span
                        key={customP}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/30 text-cyan-100 border border-cyan-400 flex items-center gap-1.5"
                      >
                        <span>{customP}</span>
                        <button
                          type="button"
                          onClick={() => togglePriority(customP)}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>

                {/* Add Custom Priority Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customPriorityInput}
                    onChange={(e) => setCustomPriorityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomPriority();
                      }
                    }}
                    placeholder="Add custom creative priority..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomPriority()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Negative Guardrails & Rejected Directions */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                    <Ban className="w-3.5 h-3.5" />
                    <span>2. Negative Guardrails & Exclusions</span>
                  </div>
                  <span className="text-[11px] font-mono text-rose-400/80">
                    {inferredExclusionsList.filter((e) => enabledExclusions[e] !== false).length + customExclusions.length} active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Inferred from the two unselected candidate worlds. Toggle active exclusions or add custom boundaries:
                </p>

                {/* Inferred Exclusions Checklist */}
                <div className="space-y-2 pt-1">
                  {inferredExclusionsList.map((exc) => {
                    const isChecked = enabledExclusions[exc] !== false;
                    return (
                      <label
                        key={exc}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleExclusion(exc)}
                          className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
                        />
                        <span className="leading-snug">Avoid: {exc}</span>
                      </label>
                    );
                  })}

                  {/* Custom Exclusions Pills */}
                  {customExclusions.map((customExc) => (
                    <div
                      key={customExc}
                      className="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-800/80 text-xs text-rose-200"
                    >
                      <span>Avoid: {customExc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomExclusion(customExc)}
                        className="text-slate-400 hover:text-rose-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Negative Guardrail */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customExclusionInput}
                    onChange={(e) => setCustomExclusionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomExclusion();
                      }
                    }}
                    placeholder="Add custom exclusion (e.g. No magical portals)..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomExclusion()}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Creator Notes & Rationale */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="creator-rationale"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"
              >
                <FileEdit className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Creator Rationale & Intent</span>
              </label>
              <textarea
                id="creator-rationale"
                rows={2}
                value={localRationale}
                onChange={(e) => setLocalRationale(e.target.value)}
                placeholder="Explain why you chose this direction over the others..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-200 placeholder-slate-500 text-xs sm:text-sm font-sans transition-all resize-y"
              />
            </div>

            {/* Section 4: Custom Creative Directives */}
            <div className="space-y-2">
              <label
                htmlFor="custom-directives"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Custom Directives (Non-Negotiables)</span>
              </label>
              <textarea
                id="custom-directives"
                rows={2}
                value={customDirectives}
                onChange={(e) => setCustomDirectives(e.target.value)}
                placeholder="Specific non-negotiable guidelines for Stage 5 generation..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-200 placeholder-slate-500 text-xs sm:text-sm font-sans transition-all resize-y"
              />
            </div>

            {/* Section 5: Human-Only Zones Panel (HOZ-01) */}
            <div
              id="human-only-zones-panel"
              className={`p-5 rounded-xl border transition-all ${
                humanOnlyZones?.is_locked
                  ? 'border-amber-500/70 bg-amber-950/25 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                  : 'border-amber-500/40 bg-amber-950/15'
              } space-y-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-900/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                      {humanOnlyZones?.is_locked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-amber-400/80" />
                      )}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                      5. Human-Only Zones: Inviolable Creative Axioms
                    </span>
                    {humanOnlyZones?.is_locked && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                        <Lock className="w-2.5 h-2.5" /> LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-amber-200/70 max-w-2xl leading-relaxed">
                    Parameters defined here are treated as inviolable creator axioms. AI models are strictly prohibited from reinterpreting or overriding these exact values during universe expansion.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!humanOnlyZones?.is_locked && (
                    <button
                      type="button"
                      id="hoz-suggest-btn"
                      onClick={handleSuggestZones}
                      className="px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 hover:text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
                      title="Populate draft suggestions from selected world (unlocked draft only)"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Suggest from Selected World</span>
                    </button>
                  )}
                  <button
                    type="button"
                    id="hoz-lock-toggle-btn"
                    onClick={toggleZoneLock}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                      humanOnlyZones?.is_locked
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow-amber'
                        : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 hover:text-amber-100'
                    }`}
                  >
                    {humanOnlyZones?.is_locked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock Parameters</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Parameters</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Zone 1: Core Theme */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="hoz-input-theme"
                    className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center justify-between"
                  >
                    <span>Core Theme</span>
                    {humanOnlyZones?.is_locked && <Lock className="w-3 h-3 text-amber-400" />}
                  </label>
                  <input
                    id="hoz-input-theme"
                    type="text"
                    disabled={humanOnlyZones?.is_locked}
                    readOnly={humanOnlyZones?.is_locked}
                    value={humanOnlyZones?.core_theme || ''}
                    onChange={(e) => setHumanOnlyZones({ core_theme: e.target.value })}
                    placeholder="e.g. Coexistence between abyssal biology and human consciousness"
                    className={`w-full px-3 py-2 rounded-lg text-xs transition-all ${
                      humanOnlyZones?.is_locked
                        ? 'bg-slate-950/90 border border-amber-500/50 text-amber-200 cursor-not-allowed select-text font-medium'
                        : 'bg-slate-950/80 border border-amber-700/50 text-slate-200 placeholder-amber-400/30 focus:border-amber-400 focus:outline-none'
                    }`}
                  />
                  <p className="text-[10px] text-amber-200/50 italic">
                    Anchors the core lore rules and canon facts in the World Bible.
                  </p>
                </div>

                {/* Zone 2: Protagonist Motivation */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="hoz-input-motivation"
                    className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center justify-between"
                  >
                    <span>Protagonist Motivation</span>
                    {humanOnlyZones?.is_locked && <Lock className="w-3 h-3 text-amber-400" />}
                  </label>
                  <input
                    id="hoz-input-motivation"
                    type="text"
                    disabled={humanOnlyZones?.is_locked}
                    readOnly={humanOnlyZones?.is_locked}
                    value={humanOnlyZones?.protagonist_motivation || ''}
                    onChange={(e) => setHumanOnlyZones({ protagonist_motivation: e.target.value })}
                    placeholder="e.g. Decode the neural coral frequency before salvage crews arrive"
                    className={`w-full px-3 py-2 rounded-lg text-xs transition-all ${
                      humanOnlyZones?.is_locked
                        ? 'bg-slate-950/90 border border-amber-500/50 text-amber-200 cursor-not-allowed select-text font-medium'
                        : 'bg-slate-950/80 border border-amber-700/50 text-slate-200 placeholder-amber-400/30 focus:border-amber-400 focus:outline-none'
                    }`}
                  />
                  <p className="text-[10px] text-amber-200/50 italic">
                    Locks the inner drive and agency of the central lead character.
                  </p>
                </div>

                {/* Zone 3: Central Conflict */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="hoz-input-conflict"
                    className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center justify-between"
                  >
                    <span>Central Conflict</span>
                    {humanOnlyZones?.is_locked && <Lock className="w-3 h-3 text-amber-400" />}
                  </label>
                  <input
                    id="hoz-input-conflict"
                    type="text"
                    disabled={humanOnlyZones?.is_locked}
                    readOnly={humanOnlyZones?.is_locked}
                    value={humanOnlyZones?.central_conflict || ''}
                    onChange={(e) => setHumanOnlyZones({ central_conflict: e.target.value })}
                    placeholder="e.g. Bio-symbiont survival vs extractive corporate exploitation"
                    className={`w-full px-3 py-2 rounded-lg text-xs transition-all ${
                      humanOnlyZones?.is_locked
                        ? 'bg-slate-950/90 border border-amber-500/50 text-amber-200 cursor-not-allowed select-text font-medium'
                        : 'bg-slate-950/80 border border-amber-700/50 text-slate-200 placeholder-amber-400/30 focus:border-amber-400 focus:outline-none'
                    }`}
                  />
                  <p className="text-[10px] text-amber-200/50 italic">
                    Shapes the primary dramatic narrative arc and climactic confrontation.
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Provenance Note */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11.5px] text-slate-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Locking records this full Decision DNA as an immutable creative contract in the project DAG. You can still switch candidates within this batch until Stage 5 unfolding commences.
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 rounded-2xl glass-card border border-slate-800 text-center space-y-3">
            <Compass className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-slate-200">
              No Direction Selected Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click <strong>"Select This Direction"</strong> on any of the three cards above to review details, record your rationale, and confirm your world choice.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
