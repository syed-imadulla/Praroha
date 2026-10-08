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
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden bg-[#F8F4E8] text-[#294B3A]">
      {/* Left Column: Premise Controls & Impact Matrix (50%) */}
      <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
        {/* Header Banner */}
        <div className="p-4 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#805B20]" />
              <h2 className="text-base font-serif font-bold text-[#294B3A]">Seed Mutation Lab</h2>
            </div>
            <button
              onClick={() => {
                resetMutationLab();
                setSimulationError(null);
                setForkSuccess(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#5A6E5E] hover:text-[#294B3A] hover:bg-[#FAF6EE] rounded-lg transition-colors border border-[#D8CCB7]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Lab
            </button>
          </div>
          <p className="text-xs text-[#5A6E5E] mt-1 leading-relaxed">
            Hypothesize foundational shifts in Seed DNA premise variables, preview causal ripples across all downstream entities, and fork divergent narrative universes without contaminating parent canon.
          </p>
        </div>

        {/* Premise Variable Selector */}
        <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#D8CCB7] shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6E5E] mb-2">
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
                      ? 'border-[#294B3A] bg-[#EAE1D0] text-[#294B3A] ring-1 ring-[#294B3A]/40 shadow-sm'
                      : 'border-[#D8CCB7] bg-[#F8F4E8] text-[#394840] hover:border-[#B5A58D] hover:bg-[#F2EBDD]'
                  }`}
                >
                  <span className="text-xs font-semibold">{v.label}</span>
                  <span className="text-xs text-[#5A6E5E] mt-0.5 line-clamp-1 italic font-serif">
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
              className="mt-3 p-3.5 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] text-xs"
            >
              <div className="flex items-center justify-between text-xs text-[#5A6E5E] mb-1">
                <span className="font-semibold">Original Seed DNA Value:</span>
                <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] text-[#466A55] border border-[#D8CCB7]">
                  {selectedPremiseVariable.variable_type}
                </span>
              </div>
              <p className="text-[#294B3A] font-serif italic text-xs leading-relaxed">
                "{selectedPremiseVariable.original_value}"
              </p>
            </div>
          )}
        </div>

        {/* Mutation Hypothesis Prompt & Input */}
        <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#D8CCB7] shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6E5E] mb-2">
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
            className="w-full px-3 py-2 text-xs rounded-lg bg-[#F8F4E8] border border-[#D8CCB7] focus:border-[#294B3A] focus:ring-1 focus:ring-[#294B3A] text-[#294B3A] placeholder-[#8C9E8F] outline-none transition-all font-serif"
          />

          {/* Preset Chips */}
          {presets.length > 0 && (
            <div className="mt-2.5">
              <span className="text-xs font-semibold text-[#5A6E5E] uppercase tracking-wider block mb-1.5">
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
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#F2EBDD] hover:bg-[#E9DDBF] hover:text-[#805B20] border border-[#D8CCB7] text-[#394840] text-left transition-all"
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
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                isSimulatingMutation || !mutationHypothesisPrompt.trim() || !selectedPremiseVariable
                  ? 'bg-[#EAE1D0] text-[#8C9E8F] cursor-not-allowed border border-[#D8CCB7]'
                  : 'bg-[#294B3A] hover:bg-[#355A46] text-[#F8F4E8] font-bold shadow-sm'
              }`}
            >
              {isSimulatingMutation ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#F8F4E8] border-t-transparent rounded-full animate-spin" />
                  Computing Downstream Causal Ripple...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-[#DDE2D2]" />
                  Simulate Impact
                </>
              )}
            </button>
          </div>

          {simulationError && (
            <div className="mt-3 p-2.5 rounded-lg bg-[#F5E6DC] border border-[#B8734F]/40 text-xs text-[#B8734F] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B8734F] flex-shrink-0" />
              <span>{simulationError}</span>
            </div>
          )}
        </div>

        {/* Impact Matrix Summary & Forking */}
        {mutationSimulation && (
          <div
            data-testid="mutation-impact-matrix"
            className="p-4 rounded-xl bg-[#FAF6EE] border border-[#D8CCB7] shadow-sm space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#805B20]" />
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#294B3A]">
                  Causal Impact Matrix
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[#B8734F] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#B8734F] animate-pulse" />
                  {mutationSimulation.summary_counts.affected} Affected
                </span>
                <span className="flex items-center gap-1 text-[#805B20] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#805B20]" />
                  {mutationSimulation.summary_counts.conditional} Conditional
                </span>
                <span className="flex items-center gap-1 text-[#294B3A] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#294B3A]" />
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
                        ? 'ring-2 ring-[#294B3A] shadow-sm'
                        : ''
                    } ${
                      isAffected
                        ? 'border-[#B8734F]/40 bg-[#F5E6DC]/60 text-[#294B3A] hover:bg-[#F5E6DC]'
                        : isConditional
                        ? 'border-[#C59A55]/40 bg-[#E9DDBF]/60 text-[#294B3A] hover:bg-[#E9DDBF]'
                        : 'border-[#294B3A]/30 bg-[#DDE2D2]/60 text-[#294B3A] hover:bg-[#DDE2D2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#294B3A]">{item.title}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          isAffected
                            ? 'bg-[#F5E6DC] text-[#B8734F] border border-[#B8734F]/40'
                            : isConditional
                            ? 'bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/40'
                            : 'bg-[#DDE2D2] text-[#294B3A] border border-[#294B3A]/30'
                        }`}
                      >
                        {item.impact_category}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6E5E] line-clamp-2 font-serif leading-relaxed">
                      {item.causal_justification}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Fork Mutated Universe Section */}
            <div className="border-t border-[#D8CCB7] pt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A6E5E] uppercase tracking-wider mb-1">
                  Custom Branch Name (Optional)
                </label>
                <input
                  type="text"
                  data-testid="custom-branch-name-input"
                  value={customBranchName}
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  placeholder={`mutant-${selectedPremiseVariable?.variable_type || 'divergence'}`}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#F8F4E8] border border-[#D8CCB7] text-[#294B3A] placeholder-[#8C9E8F] outline-none focus:border-[#294B3A] font-mono"
                />
              </div>

              <button
                id="fork-mutation-btn"
                data-testid="fork-mutation-btn"
                disabled={isForkingMutation}
                onClick={handleFork}
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isForkingMutation
                    ? 'bg-[#EAE1D0] text-[#8C9E8F] cursor-not-allowed border border-[#D8CCB7]'
                    : 'bg-[#6A4B67] hover:bg-[#573D54] text-[#F8F4E8] shadow-sm'
                }`}
              >
                {isForkingMutation ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#F8F4E8] border-t-transparent rounded-full animate-spin" />
                    Branching Isolated Universe & Remapping Entities...
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4 text-[#DDE2D2]" />
                    Fork Mutated Universe
                  </>
                )}
              </button>

              {forkSuccess && (
                <div className="p-3 rounded-lg bg-[#DDE2D2] border border-[#294B3A]/40 text-xs text-[#294B3A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#294B3A] flex-shrink-0" />
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
