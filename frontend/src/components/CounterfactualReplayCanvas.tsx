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
        return 'bg-[#EFE8EE] text-[#6A4B67] border-[#B399B0]/50';
      case 'inverse':
        return 'bg-[#F5E6DC] text-[#B8734F] border-[#B8734F]/50';
      case 'moderate':
        return 'bg-[#E9DDBF] text-[#805B20] border-[#C59A55]/50';
      default:
        return 'bg-[#DDE2D2] text-[#294B3A] border-[#294B3A]/40';
    }
  };

  const getDimensionIcon = (dim: string) => {
    switch (dim) {
      case 'protagonist':
        return <User className="w-4 h-4 text-[#355A46]" />;
      case 'tone_atmosphere':
        return <Sparkles className="w-4 h-4 text-[#6A4B67]" />;
      case 'central_conflict':
        return <Flame className="w-4 h-4 text-[#B8734F]" />;
      case 'world_rules':
        return <BookOpen className="w-4 h-4 text-[#805B20]" />;
      default:
        return <Scale className="w-4 h-4 text-[#294B3A]" />;
    }
  };

  return (
    <div className="space-y-8 text-[#294B3A]" data-testid="counterfactual-replay-canvas">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-[#F2EBDD] border border-[#D8CCB7] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Split className="w-48 h-48 text-[#294B3A]" />
        </div>
        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE8EE] border border-[#B399B0]/40 text-[#6A4B67] text-xs font-mono font-semibold tracking-wide">
            <GitFork className="w-3.5 h-3.5 text-[#6A4B67]" />
            <span>STAGE 5 COMPLEMENT: COUNTERFACTUAL REPLAY</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-[#294B3A] tracking-tight flex items-center gap-2">
            <span>What If I Chose Another World?</span>
          </h2>
          <p className="text-xs md:text-sm text-[#5A6E5E] leading-relaxed">
            Inspect the structural divergence deltas between your active canon universe and the alternative candidate worlds rejected during Stage 4. 
            Evaluate lead character shifts, sensory mood contrasts, and foundational rule changes without re-running full universe synthesis.
          </p>
        </div>
      </div>

      {/* Candidate Selector Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[#5A6E5E] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#6A4B67]" />
            <span>Select Alternative Candidate to Compare:</span>
          </span>
          <span className="text-[11px] font-mono text-[#718875]">
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
                    ? 'bg-[#EAE1D0] border-[#294B3A] shadow-sm'
                    : 'bg-[#FAF6EE] border-[#D8CCB7] hover:border-[#B5A58D] hover:bg-[#F2EBDD]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7]">
                      WORLD #{candidate.index}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-[#EFE8EE] text-[#6A4B67] border border-[#B399B0]/40">
                      {candidate.divergence_archetype}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#294B3A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#294B3A]" />
                      <span>Comparing</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-base text-[#294B3A] transition">
                  {candidate.title}
                </h3>
                <p className="text-xs text-[#5A6E5E] mt-1 line-clamp-2 leading-relaxed">
                  {candidate.concept}
                </p>

                <div className="mt-3 pt-3 border-t border-[#D8CCB7] flex items-center justify-between text-[11px]">
                  <span className="text-[#718875] font-mono">
                    Archetype: <span className="text-[#294B3A] font-medium">{candidate.archetype}</span>
                  </span>
                  <span className="text-[#B8734F] font-mono text-[10.5px]">
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
        <div className="p-12 rounded-3xl bg-[#FAF6EE] border border-[#D8CCB7] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#6A4B67] animate-spin" />
          <p className="text-xs font-mono text-[#5A6E5E]">
            Synthesizing structural divergence deltas across story dimensions...
          </p>
        </div>
      )}

      {/* 50/50 Dual-Column Side-by-Side Comparative Matrix */}
      {!isLoadingCounterfactual && activeCandidate && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="counterfactual-comparative-matrix">
            {/* Left Column: Current Committed Canon */}
            <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#294B3A]/30 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8CCB7]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#294B3A]" />
                  <span className="text-xs font-mono uppercase font-bold text-[#294B3A] tracking-wider">
                    Current Committed Canon
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#DDE2D2] text-[#294B3A] border border-[#294B3A]/30">
                  ANCHOR TIMELINE
                </span>
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-[#294B3A]">
                  {counterfactualDelta?.canon_title || canonWorld?.title || 'Committed World'}
                </h3>
                <p className="text-xs text-[#5A6E5E] mt-1.5 leading-relaxed">
                  {canonWorld?.concept || 'Active unfolded story universe anchor.'}
                </p>
              </div>

              {counterfactualDelta?.decision_dna_rationale && (
                <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-1">
                  <span className="text-xs font-mono uppercase text-[#5A6E5E] font-bold block">
                    Creator Decision Rationale:
                  </span>
                  <p className="text-xs text-[#294B3A] italic font-serif">
                    "{counterfactualDelta.decision_dna_rationale}"
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase text-[#5A6E5E] font-bold tracking-wider block">
                  Active Universe Anchors:
                </span>
                {counterfactualDelta?.dimensions.map((dim) => (
                  <div key={dim.dimension} className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#294B3A]">
                      {getDimensionIcon(dim.dimension)}
                      <span>{dim.title}</span>
                    </div>
                    <p className="text-xs text-[#5A6E5E] pl-5 leading-relaxed">
                      {dim.canon_value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Counterfactual Alternative */}
            <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#6A4B67]/30 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8CCB7]">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-[#6A4B67]" />
                  <span className="text-xs font-mono uppercase font-bold text-[#6A4B67] tracking-wider">
                    Counterfactual Alternative
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#EFE8EE] text-[#6A4B67] border border-[#B399B0]/40">
                  REJECTED PATH
                </span>
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-[#294B3A]">
                  {activeCandidate.title}
                </h3>
                <p className="text-xs text-[#5A6E5E] mt-1.5 leading-relaxed">
                  {activeCandidate.concept}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#EFE8EE] border border-[#B399B0]/30 space-y-1">
                <span className="text-xs font-mono uppercase text-[#6A4B67] font-bold block">
                  Inferred Exclusion Avoided in Canon:
                </span>
                <p className="text-xs text-[#6A4B67]">
                  {activeCandidate.inferred_exclusion}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase text-[#6A4B67] font-bold tracking-wider block">
                  Projected Alternative Anchors:
                </span>
                {counterfactualDelta?.dimensions.map((dim) => (
                  <div key={dim.dimension} className="p-3 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-1 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#294B3A]">
                        {getDimensionIcon(dim.dimension)}
                        <span>{dim.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono uppercase border ${getDivergenceBadgeColor(dim.divergence_level)}`}>
                        {dim.divergence_level}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6E5E] pl-5 leading-relaxed">
                      {dim.counterfactual_value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Divergence Delta Cards */}
          <div className="space-y-4" data-testid="counterfactual-delta-cards">
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#294B3A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#805B20]" />
              <span>Dimension Divergence Analysis (Delta Cards):</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {counterfactualDelta?.dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#D8CCB7] hover:border-[#B5A58D] transition space-y-3 shadow-sm"
                  data-testid={`delta-card-${dim.dimension}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDimensionIcon(dim.dimension)}
                      <h4 className="font-serif font-bold text-sm text-[#294B3A]">{dim.title}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-bold border ${getDivergenceBadgeColor(dim.divergence_level)}`}>
                      {dim.divergence_level} divergence
                    </span>
                  </div>

                  <p className="text-xs text-[#394840] leading-relaxed bg-[#F2EBDD] p-3.5 rounded-xl border border-[#D8CCB7] font-serif">
                    {dim.divergence_analysis}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#D8CCB7]">
                    <div>
                      <span className="text-[#5A6E5E] font-mono block text-xs font-semibold">CANON FOCUS</span>
                      <span className="text-[#294B3A] line-clamp-1">{dim.canon_value}</span>
                    </div>
                    <div>
                      <span className="text-[#6A4B67] font-mono block text-xs font-semibold">ALTERNATIVE SHIFT</span>
                      <span className="text-[#6A4B67] line-clamp-1 font-semibold">{dim.counterfactual_value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exploration Profile Metric Deltas */}
          {counterfactualDelta?.profile_comparison && (
            <div className="p-6 rounded-3xl bg-[#FAF6EE] border border-[#D8CCB7] space-y-4 shadow-sm" data-testid="exploration-profile-deltas">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#5A6E5E] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#294B3A]" />
                  <span>Exploration Profile Divergence Meters</span>
                </span>
                <span className="text-xs font-mono text-[#466A55] font-semibold">
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
                  <div key={metric.label} className="p-4 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A6E5E] font-medium">{metric.label}</span>
                      <span className={`font-mono font-bold text-xs ${metric.delta > 0 ? 'text-[#294B3A]' : metric.delta < 0 ? 'text-[#B8734F]' : 'text-[#718875]'}`}>
                        {metric.delta > 0 ? `+${metric.delta}%` : `${metric.delta}%`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#718875] font-mono">
                        <span>Canon: {metric.canon}%</span>
                        <span>Alt: {metric.cf}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#EAE1D0] rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-[#294B3A] rounded-full absolute left-0"
                          style={{ width: `${metric.canon}%` }}
                        />
                        <div
                          className="h-full bg-[#6A4B67] rounded-full absolute left-0"
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
          <div className="p-6 rounded-3xl bg-[#F2EBDD] border border-[#D8CCB7] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-serif font-bold text-[#294B3A] flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-[#6A4B67]" />
                  <span>Fork Timeline into This World</span>
                </h4>
                <p className="text-xs text-[#5A6E5E]">
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
                  className="px-3.5 py-2.5 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] text-xs text-[#294B3A] placeholder-[#8C9E8F] font-mono focus:outline-none focus:border-[#294B3A] w-64"
                />

                <button
                  id="fork-counterfactual-branch-btn"
                  onClick={handleFork}
                  disabled={isForkingCounterfactual}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6A4B67] hover:bg-[#573D54] text-[#F8F4E8] font-bold text-xs shadow-sm transition disabled:opacity-50"
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
              <div className="p-3 rounded-xl bg-[#DDE2D2] border border-[#294B3A]/30 text-[#294B3A] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#294B3A] shrink-0" />
                <span>
                  Successfully created and switched to isolated counterfactual branch <strong>{forkSuccessBranch}</strong>!
                </span>
              </div>
            )}

            {forkError && (
              <div className="p-3 rounded-xl bg-[#F5E6DC] border border-[#B8734F]/40 text-[#B8734F] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B8734F] shrink-0" />
                <span>{forkError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
