import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { MutationCausalDiffDAG } from './MutationCausalDiffDAG';
import { PremiseVariable } from '../types';
import {
  Sparkles,
  GitFork,
  AlertTriangle,
  Zap,
  RotateCcw,
  CheckCircle2,
  Layers,
} from 'lucide-react';

const PRESET_MUTATIONS: Record<string, string[]> = {
  core_premise: [
    'What if the city was actually a weaponized outpost?',
    'What if the ocean is alive and actively hunting intruders?',
    'What if the ancient technology was left behind as an ark for fleeing gods?',
  ],
  tone: [
    'What if the narrative shifts to gritty psychological horror?',
    'What if the tone becomes whimsical poetic realism?',
    'What if the atmosphere is hard military sci-fi noir?',
  ],
  tone_atmosphere: [
    'What if the narrative shifts to gritty psychological horror?',
    'What if the tone becomes whimsical poetic realism?',
    'What if the atmosphere is hard military sci-fi noir?',
  ],
  central_conflict: [
    'What if the protagonists discover they are unwitting biological weapons?',
    'What if resources are completely infinite but forbidden to touch?',
    'What if internal betrayal fractures the expedition from day one?',
  ],
  world_rule: [
    'What if breathing underwater requires trading memories to the deep currents?',
    'What if sunlight instantly incinerates artificial alloys?',
    'What if sound attracts reality-devouring leviathans?',
  ],
};

export const SeedMutationLabCanvas: React.FC = () => {
  const {
    activeProject,
    premiseVariables,
    selectedPremiseVariable,
    mutationHypothesisPrompt,
    mutationNewValue,
    customBranchName,
    mutationSimulation,
    isSimulatingMutation,
    isForkingMutation,
    mutationSelectedNode,
    fetchPremiseVariables,
    setSelectedPremiseVariable,
    setMutationHypothesisPrompt,
    setMutationNewValue,
    setCustomBranchName,
    simulateMutation,
    forkMutatedUniverse,
    setMutationSelectedNode,
    resetMutationLab,
  } = useWorkspaceStore();

  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [forkSuccess, setForkSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject?.id) {
      fetchPremiseVariables(activeProject.id);
    }
  }, [activeProject?.id, fetchPremiseVariables]);

  const handleSelectVariable = (variable: PremiseVariable) => {
    setSelectedPremiseVariable(variable);
    setSimulationError(null);
    setForkSuccess(null);
  };

  const handleSimulate = async () => {
    if (!activeProject || !selectedPremiseVariable) return;
    setSimulationError(null);
    setForkSuccess(null);

    const effectiveNewVal = mutationHypothesisPrompt.trim() || mutationNewValue.trim() || selectedPremiseVariable.original_value;
    try {
      await simulateMutation(activeProject.id, {
        mutated_variable: selectedPremiseVariable.variable_type,
        original_value: selectedPremiseVariable.original_value,
        new_value: effectiveNewVal,
        hypothesis_prompt: mutationHypothesisPrompt.trim() || effectiveNewVal,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      setSimulationError(msg);
    }
  };

  const handleFork = async () => {
    if (!activeProject || !selectedPremiseVariable) return;
    setForkSuccess(null);

    const targetBranch = customBranchName.trim()
      ? customBranchName.trim()
      : `mutant-${selectedPremiseVariable.variable_type}-${Date.now().toString().slice(-4)}`;

    const effectiveNewVal = mutationHypothesisPrompt.trim() || mutationNewValue.trim() || selectedPremiseVariable.original_value;
    try {
      const newProjectId = await forkMutatedUniverse(activeProject.id, {
        mutated_variable: selectedPremiseVariable.variable_type,
        original_value: selectedPremiseVariable.original_value,
        new_value: effectiveNewVal,
        hypothesis_prompt: mutationHypothesisPrompt.trim() || effectiveNewVal,
        branch_name: targetBranch,
      });

      setForkSuccess(`Forked mutated universe to branch "${targetBranch}"! Project ID: ${newProjectId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fork failed';
      setSimulationError(msg);
    }
  };

  const presets = selectedPremiseVariable
    ? PRESET_MUTATIONS[selectedPremiseVariable.variable_type] || []
    : [];

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden bg-slate-950 text-slate-100">
      {/* Left Column: Premise Controls & Impact Matrix (50%) */}
      <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
        {/* Header Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/20 to-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Seed Mutation Lab</h2>
            </div>
            <button
              onClick={() => {
                resetMutationLab();
                setSimulationError(null);
                setForkSuccess(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors border border-slate-700/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Lab
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Hypothesize foundational shifts in Seed DNA premise variables, preview causal ripples across all downstream entities, and fork divergent narrative universes without contaminating parent canon.
          </p>
        </div>

        {/* Premise Variable Selector */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            1. Select Premise Variable
          </label>

          <div className="grid grid-cols-2 gap-2">
            {premiseVariables.map((v) => {
              const isSelected = selectedPremiseVariable?.variable_type === v.variable_type;
              return (
                <button
                  key={v.variable_type}
                  data-testid={`premise-var-btn-${v.variable_type}`}
                  onClick={() => handleSelectVariable(v)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-amber-500/80 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-xs font-semibold">{v.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic font-serif">
                    {v.original_value}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Original Value Card */}
          {selectedPremiseVariable && (
            <div
              data-testid="mutation-original-value-card"
              className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-medium">Original Seed DNA Value:</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedPremiseVariable.variable_type}
                </span>
              </div>
              <p className="text-slate-200 font-serif italic text-xs leading-relaxed">
                "{selectedPremiseVariable.original_value}"
              </p>
            </div>
          )}
        </div>

        {/* Mutation Hypothesis Prompt & Input */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. Formulate "What If?" Mutation
          </label>

          <textarea
            data-testid="mutation-hypothesis-textarea"
            rows={3}
            value={mutationHypothesisPrompt}
            onChange={(e) => {
              setMutationHypothesisPrompt(e.target.value);
              setMutationNewValue(e.target.value);
            }}
            placeholder={
              selectedPremiseVariable
                ? `e.g. What if ${selectedPremiseVariable.label.toLowerCase()} was completely reversed or intensified?`
                : 'Select a premise variable above and enter a hypothesis prompt...'
            }
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 placeholder-slate-500 outline-none transition-all font-serif"
          />

          {/* Preset Chips */}
          {presets.length > 0 && (
            <div className="mt-2.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Suggested Curated Hypotheses:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMutationHypothesisPrompt(preset);
                      setMutationNewValue(preset);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-950/60 hover:text-amber-300 border border-slate-700/70 text-slate-300 text-left transition-all"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simulate Action Button */}
          <div className="mt-4">
            <button
              id="simulate-mutation-btn"
              data-testid="simulate-mutation-btn"
              disabled={isSimulatingMutation || !mutationHypothesisPrompt.trim() || !selectedPremiseVariable}
              onClick={handleSimulate}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isSimulatingMutation || !mutationHypothesisPrompt.trim() || !selectedPremiseVariable
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}
            >
              {isSimulatingMutation ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Computing Downstream Causal Ripple...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Simulate Impact
                </>
              )}
            </button>
          </div>

          {simulationError && (
            <div className="mt-3 p-2.5 rounded-lg bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{simulationError}</span>
            </div>
          )}
        </div>

        {/* Impact Matrix Summary & Forking */}
        {mutationSimulation && (
          <div
            data-testid="mutation-impact-matrix"
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-lg space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Causal Impact Matrix
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-amber-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {mutationSimulation.summary_counts.affected} Affected
                </span>
                <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {mutationSimulation.summary_counts.conditional} Conditional
                </span>
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {mutationSimulation.summary_counts.preserved} Preserved
                </span>
              </div>
            </div>

            {/* Impact Cards Grid */}
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {mutationSimulation.impacted_entities.map((item) => {
                const isAffected = item.impact_category === 'AFFECTED';
                const isConditional = item.impact_category === 'CONDITIONAL';
                const isSelected = mutationSelectedNode?.entity_id === item.entity_id;

                return (
                  <div
                    key={item.entity_id}
                    onClick={() => setMutationSelectedNode(isSelected ? null : item)}
                    className={`cursor-pointer p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'ring-1 ring-amber-400 shadow-md'
                        : ''
                    } ${
                      isAffected
                        ? 'border-amber-500/40 bg-amber-950/20 text-amber-100 hover:bg-amber-950/30'
                        : isConditional
                        ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-950/30'
                        : 'border-emerald-600/30 bg-emerald-950/15 text-emerald-100 hover:bg-emerald-950/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-100">{item.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          isAffected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : isConditional
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.impact_category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 font-serif leading-relaxed">
                      {item.causal_justification}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Fork Mutated Universe Section */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Custom Branch Name (Optional)
                </label>
                <input
                  type="text"
                  data-testid="custom-branch-name-input"
                  value={customBranchName}
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  placeholder={`mutant-${selectedPremiseVariable?.variable_type || 'divergence'}`}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                id="fork-mutation-btn"
                data-testid="fork-mutation-btn"
                disabled={isForkingMutation}
                onClick={handleFork}
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isForkingMutation
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white shadow-[0_0_18px_rgba(147,51,234,0.35)]'
                }`}
              >
                {isForkingMutation ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Branching Isolated Universe & Remapping Entities...
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4" />
                    Fork Mutated Universe
                  </>
                )}
              </button>

              {forkSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{forkSuccess}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Interactive Causal Diff DAG (50%) */}
      <div className="w-full md:w-1/2 flex flex-col h-[520px] md:h-full">
        <MutationCausalDiffDAG
          simulation={mutationSimulation}
          selectedNode={mutationSelectedNode}
          onSelectNode={setMutationSelectedNode}
          rootPremiseName={selectedPremiseVariable?.label}
          rootHypothesis={mutationHypothesisPrompt || mutationNewValue}
        />
      </div>
    </div>
  );
};
