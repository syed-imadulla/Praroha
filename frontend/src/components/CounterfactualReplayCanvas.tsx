import React, { useState, useEffect } from 'react';
import {
  Split,
  GitFork,
  Sparkles,
  User,
  Flame,
  BookOpen,
  Scale,
  ShieldCheck,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const CounterfactualReplayCanvas: React.FC = () => {
  const {
    activeProject,
    selectedWorldId,
    worlds,
    counterfactualCandidates,
    selectedCounterfactualCandidateId,
    counterfactualDelta,
    isLoadingCounterfactual,
    isForkingCounterfactual,
    counterfactualBranchName,
    fetchCounterfactualCandidates,
    selectCounterfactualCandidate,
    setCounterfactualBranchName,
    forkCounterfactualBranch,
  } = useWorkspaceStore();

  const [forkSuccessBranch, setForkSuccessBranch] = useState<string | null>(null);
  const [forkError, setForkError] = useState<string | null>(null);

  // Fetch counterfactual candidates on mount if empty
  useEffect(() => {
    if (activeProject && counterfactualCandidates.length === 0) {
      fetchCounterfactualCandidates(activeProject.id);
    }
  }, [activeProject, counterfactualCandidates.length, fetchCounterfactualCandidates]);

  // Active canon world object
  const canonWorld = worlds.find((w) => w.id === selectedWorldId) || null;
  const activeCandidate = counterfactualCandidates.find(
    (c) => c.id === selectedCounterfactualCandidateId
  ) || counterfactualCandidates[0] || null;

  const handleFork = async () => {
    if (!activeProject || !activeCandidate) return;
    setForkError(null);
    setForkSuccessBranch(null);
    try {
      const createdBranch = await forkCounterfactualBranch(activeProject.id, {
        candidate_id: activeCandidate.id,
        branch_name: counterfactualBranchName || `counterfactual/${activeCandidate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        rationale: `Forked counterfactual timeline exploring '${activeCandidate.title}'`,
      });
      setForkSuccessBranch(createdBranch);
    } catch (err) {
      setForkError(err instanceof Error ? err.message : 'Failed to fork timeline');
    }
  };

  const getDivergenceBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'radical':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'inverse':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'moderate':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    }
  };

  const getDimensionIcon = (dim: string) => {
    switch (dim) {
      case 'protagonist':
        return <User className="w-4 h-4 text-cyan-400" />;
      case 'tone_atmosphere':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'central_conflict':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'world_rules':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      default:
        return <Scale className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-8" data-testid="counterfactual-replay-canvas">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900/90 to-slate-950 border border-violet-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Split className="w-48 h-48 text-violet-400" />
        </div>
        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-mono font-semibold tracking-wide">
            <GitFork className="w-3.5 h-3.5 text-violet-400" />
            <span>STAGE 5 COMPLEMENT: COUNTERFACTUAL REPLAY</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>What If I Chose Another World?</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed">
            Inspect the structural divergence deltas between your active canon universe and the alternative candidate worlds rejected during Stage 4. 
            Evaluate lead character shifts, sensory mood contrasts, and foundational rule changes without re-running full universe synthesis.
          </p>
        </div>
      </div>

      {/* Candidate Selector Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-violet-400" />
            <span>Select Alternative Candidate to Compare:</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {counterfactualCandidates.length} Rejected Worlds Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="counterfactual-candidate-strip">
          {counterfactualCandidates.map((candidate) => {
            const isSelected = candidate.id === (activeCandidate?.id || selectedCounterfactualCandidateId);
            return (
              <button
                key={candidate.id}
                type="button"
                data-testid={`counterfactual-cand-btn-${candidate.id}`}
                onClick={() => selectCounterfactualCandidate(candidate.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-violet-950/50 border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.18)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      WORLD #{candidate.index}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-violet-950/70 text-violet-300 border border-violet-700/60">
                      {candidate.divergence_archetype}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-violet-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                      <span>Comparing</span>
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-100 group-hover:text-violet-200 transition">
                  {candidate.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {candidate.concept}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    Archetype: <span className="text-slate-300 font-medium">{candidate.archetype}</span>
                  </span>
                  <span className="text-rose-400/90 font-mono text-[10.5px]">
                    Avoided: {candidate.inferred_exclusion}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State Indicator */}
      {isLoadingCounterfactual && (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-xs font-mono text-slate-300">
            Synthesizing structural divergence deltas across story dimensions...
          </p>
        </div>
      )}

      {/* 50/50 Dual-Column Side-by-Side Comparative Matrix */}
      {!isLoadingCounterfactual && activeCandidate && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="counterfactual-comparative-matrix">
            {/* Left Column: Current Committed Canon */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-emerald-500/30 shadow-lg space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase font-bold text-emerald-300 tracking-wider">
                    Current Committed Canon
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  ANCHOR TIMELINE
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {counterfactualDelta?.canon_title || canonWorld?.title || 'Committed World'}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {canonWorld?.concept || 'Active unfolded story universe anchor.'}
                </p>
              </div>

              {counterfactualDelta?.decision_dna_rationale && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Creator Decision Rationale:
                  </span>
                  <p className="text-xs text-slate-300 italic">
                    "{counterfactualDelta.decision_dna_rationale}"
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
                  Active Universe Anchors:
                </span>
                {counterfactualDelta?.dimensions.map((dim) => (
                  <div key={dim.dimension} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      {getDimensionIcon(dim.dimension)}
                      <span>{dim.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 pl-5 leading-relaxed">
                      {dim.canon_value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Counterfactual Candidate */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-violet-500/30 shadow-lg space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-violet-500/20">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-mono uppercase font-bold text-violet-300 tracking-wider">
                    Counterfactual Alternative
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-950/80 text-violet-300 border border-violet-800">
                  REJECTED PATH
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-violet-100">
                  {activeCandidate.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {activeCandidate.concept}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-violet-300 font-bold block">
                  Inferred Exclusion Avoided in Canon:
                </span>
                <p className="text-xs text-violet-200">
                  {activeCandidate.inferred_exclusion}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-mono uppercase text-violet-400 font-bold tracking-wider block">
                  Projected Alternative Anchors:
                </span>
                {counterfactualDelta?.dimensions.map((dim) => (
                  <div key={dim.dimension} className="p-3 rounded-xl bg-slate-950/40 border border-violet-900/30 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-200">
                        {getDimensionIcon(dim.dimension)}
                        <span>{dim.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono uppercase border ${getDivergenceBadgeColor(dim.divergence_level)}`}>
                        {dim.divergence_level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 pl-5 leading-relaxed">
                      {dim.counterfactual_value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Divergence Delta Cards */}
          <div className="space-y-4" data-testid="counterfactual-delta-cards">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <span>Dimension Divergence Analysis (Delta Cards):</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {counterfactualDelta?.dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  data-testid={`delta-card-${dim.dimension}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDimensionIcon(dim.dimension)}
                      <h4 className="font-bold text-sm text-slate-100">{dim.title}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getDivergenceBadgeColor(dim.divergence_level)}`}>
                      {dim.divergence_level} divergence
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    {dim.divergence_analysis}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 font-mono block text-[10px]">CANON FOCUS</span>
                      <span className="text-slate-300 line-clamp-1">{dim.canon_value}</span>
                    </div>
                    <div>
                      <span className="text-violet-400 font-mono block text-[10px]">ALTERNATIVE SHIFT</span>
                      <span className="text-violet-200 line-clamp-1">{dim.counterfactual_value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exploration Profile Metric Deltas */}
          {counterfactualDelta?.profile_comparison && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4" data-testid="exploration-profile-deltas">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Exploration Profile Divergence Meters</span>
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  {counterfactualDelta.profile_comparison.summary}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Seed Fidelity',
                    canon: counterfactualDelta.profile_comparison.canon_profile.seed_fidelity,
                    cf: counterfactualDelta.profile_comparison.counterfactual_profile.seed_fidelity,
                    delta: counterfactualDelta.profile_comparison.seed_fidelity_delta,
                  },
                  {
                    label: 'Novelty',
                    canon: counterfactualDelta.profile_comparison.canon_profile.novelty,
                    cf: counterfactualDelta.profile_comparison.counterfactual_profile.novelty,
                    delta: counterfactualDelta.profile_comparison.novelty_delta,
                  },
                  {
                    label: 'Conceptual Distance',
                    canon: counterfactualDelta.profile_comparison.canon_profile.conceptual_distance,
                    cf: counterfactualDelta.profile_comparison.counterfactual_profile.conceptual_distance,
                    delta: counterfactualDelta.profile_comparison.conceptual_distance_delta,
                  },
                  {
                    label: 'Feasibility',
                    canon: counterfactualDelta.profile_comparison.canon_profile.feasibility,
                    cf: counterfactualDelta.profile_comparison.counterfactual_profile.feasibility,
                    delta: counterfactualDelta.profile_comparison.feasibility_delta,
                  },
                ].map((metric) => (
                  <div key={metric.label} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{metric.label}</span>
                      <span className={`font-mono font-bold text-[11px] ${metric.delta > 0 ? 'text-emerald-400' : metric.delta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {metric.delta > 0 ? `+${metric.delta}%` : `${metric.delta}%`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Canon: {metric.canon}%</span>
                        <span>Alt: {metric.cf}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-emerald-500/70 rounded-full absolute left-0"
                          style={{ width: `${metric.canon}%` }}
                        />
                        <div
                          className="h-full bg-violet-500/90 rounded-full absolute left-0"
                          style={{ width: `${metric.cf}%`, opacity: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar: Fork Timeline from Alternative World */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 border border-violet-500/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-violet-400" />
                  <span>Fork Timeline into This World</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Ready to explore this counterfactual universe? Spawns an isolated child timeline branch rooted in '{activeCandidate.title}', preserving current canon immutability.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="text"
                  data-testid="counterfactual-branch-name-input"
                  value={counterfactualBranchName}
                  onChange={(e) => setCounterfactualBranchName(e.target.value)}
                  placeholder="counterfactual/branch-name"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500 w-64"
                />

                <button
                  id="fork-counterfactual-branch-btn"
                  onClick={handleFork}
                  disabled={isForkingCounterfactual}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-900/30 transition disabled:opacity-50"
                >
                  {isForkingCounterfactual ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Forking Timeline...</span>
                    </>
                  ) : (
                    <>
                      <GitFork className="w-4 h-4" />
                      <span>Fork Timeline from This World</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {forkSuccessBranch && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Successfully created and switched to isolated counterfactual branch <strong>{forkSuccessBranch}</strong>!
                </span>
              </div>
            )}

            {forkError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{forkError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
