import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  Info,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { apiClient } from '../api/client';
import {
  ImpactPreviewResponse,
  SelectiveRegenerateRequest,
} from '../types';

interface ChangeImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  upstreamEntityType: string;
  upstreamEntityId: string;
  upstreamTitle: string;
  currentValue: string;
  fieldName?: string;
  onRegenerationComplete?: () => void;
}

export const ChangeImpactModal: React.FC<ChangeImpactModalProps> = ({
  isOpen,
  onClose,
  upstreamEntityType,
  upstreamEntityId,
  upstreamTitle,
  currentValue,
  fieldName = 'physics_rules',
  onRegenerationComplete,
}) => {
  const activeProject = useWorkspaceStore((state) => state.activeProject);
  const fetchUnfoldedUniverse = useWorkspaceStore((state) => state.fetchUnfoldedUniverse);
  const fetchLineage = useWorkspaceStore((state) => state.fetchLineage);

  const [proposedText, setProposedText] = useState(currentValue);
  const [changeSummary, setChangeSummary] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [preview, setPreview] = useState<ImpactPreviewResponse | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());
  const [forceUnlockIds, setForceUnlockIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProposedText(currentValue);
      setChangeSummary(`Update ${fieldName.replace(/_/g, ' ')} for ${upstreamTitle}`);
      setPreview(null);
      setSelectedEntityIds(new Set());
      setForceUnlockIds(new Set());
      setError(null);
      setSuccessResult(null);
    }
  }, [isOpen, currentValue, fieldName, upstreamTitle]);

  if (!isOpen || !activeProject) return null;

  const handleFetchPreview = async () => {
    if (!proposedText.trim()) {
      setError('Please provide the proposed modification text.');
      return;
    }
    setError(null);
    setIsLoadingPreview(true);
    try {
      const resp = await apiClient.previewChangeImpact(activeProject.id, {
        upstream_entity_type: upstreamEntityType,
        upstream_entity_id: upstreamEntityId,
        proposed_change: { [fieldName]: proposedText.trim() },
        change_summary: changeSummary.trim() || undefined,
      });

      if (resp.success && resp.data) {
        setPreview(resp.data);
        // By default, pre-select unlocked affected nodes for regeneration
        const defaultSelected = new Set<string>();
        resp.data.affected_nodes.forEach((node) => {
          if (!node.is_locked && node.entity_id !== upstreamEntityId) {
            defaultSelected.add(node.entity_id);
          }
        });
        setSelectedEntityIds(defaultSelected);
      } else {
        setError(resp.error?.message || 'Failed to compute dependency blast radius.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with impact analysis service.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const toggleSelectEntity = (id: string) => {
    const next = new Set(selectedEntityIds);
    if (next.has(id)) {
      next.delete(id);
      // Also remove force unlock if deselected
      if (forceUnlockIds.has(id)) {
        const nextUnlock = new Set(forceUnlockIds);
        nextUnlock.delete(id);
        setForceUnlockIds(nextUnlock);
      }
    } else {
      next.add(id);
    }
    setSelectedEntityIds(next);
  };

  const toggleForceUnlock = (id: string) => {
    const next = new Set(forceUnlockIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      // Ensure entity is selected if unlocked
      if (!selectedEntityIds.has(id)) {
        const nextSel = new Set(selectedEntityIds);
        nextSel.add(id);
        setSelectedEntityIds(nextSel);
      }
    }
    setForceUnlockIds(next);
  };

  const handleExecuteRegeneration = async () => {
    if (!preview) return;

    // Check if any selected node is locked without explicit unlock
    for (const eid of selectedEntityIds) {
      const node = preview.affected_nodes.concat(preview.conditional_nodes).find((n) => n.entity_id === eid);
      if (node?.is_locked && !forceUnlockIds.has(eid)) {
        setError(
          `Entity "${node.name_or_title}" is protected by a creator lock. Please confirm explicit unlock before regenerating.`
        );
        return;
      }
    }

    setError(null);
    setIsRegenerating(true);

    try {
      // Build optimistic concurrency version expectations
      const expectedVersions: Record<string, number> = {};
      const allNodes = preview.affected_nodes.concat(preview.conditional_nodes, preview.preserved_nodes);
      allNodes.forEach((n) => {
        expectedVersions[n.entity_id] = n.current_version;
      });

      const payload: SelectiveRegenerateRequest = {
        upstream_entity_type: upstreamEntityType,
        upstream_entity_id: upstreamEntityId,
        proposed_change: { [fieldName]: proposedText.trim() },
        selected_entity_ids: Array.from(selectedEntityIds),
        force_unlock_entity_ids: Array.from(forceUnlockIds),
        expected_versions: expectedVersions,
        change_summary: changeSummary.trim() || undefined,
      };

      const resp = await apiClient.regenerateSelective(activeProject.id, payload);
      if (resp.success && resp.data) {
        setSuccessResult(resp.data.message);
        // Refresh project universe and lineage in workspace
        await fetchUnfoldedUniverse();
        await fetchLineage();
        if (onRegenerationComplete) {
          onRegenerationComplete();
        }
      } else {
        setError(resp.error?.message || 'Failed to complete selective regeneration.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during selective regeneration.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#FDFBF7] rounded-[24px] border border-[#D8CCB7] shadow-2xl overflow-hidden text-[#294B3A]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8CCB7] bg-[#F4EEDB]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#294B3A] text-[#FDFBF7]">
              <Sparkles className="w-5 h-5 text-[#88B04B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#DDE2D2] text-[#294B3A]">
                  Tatva 2 · Controlled Regeneration
                </span>
                <span className="text-xs text-[#5F6D63] font-mono">
                  {upstreamEntityType.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold font-serif text-[#294B3A]">
                Change Impact & Downstream Blast Radius: {upstreamTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5F6D63] hover:text-[#294B3A] hover:bg-[#DDE2D2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successResult && (
            <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
                <span>{successResult}</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D]"
              >
                Close
              </button>
            </div>
          )}

          {!preview && !successResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F4EEDB] border border-[#D8CCB7] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#355A46]">
                  <Info className="w-4 h-4" />
                  <span>Current World Law / Trait</span>
                </div>
                <p className="text-xs text-[#5F6D63] leading-relaxed italic bg-[#FDFBF7] p-3 rounded-lg border border-[#E5DEC9]">
                  {currentValue || 'No existing value recorded.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#294B3A] font-serif uppercase tracking-wider">
                  Proposed Upstream Mutation ({fieldName.replace(/_/g, ' ')})
                </label>
                <textarea
                  value={proposedText}
                  onChange={(e) => setProposedText(e.target.value)}
                  rows={4}
                  placeholder="Enter the updated canon law, physical constraint, or premise..."
                  className="w-full text-xs p-3 rounded-xl border border-[#D8CCB7] bg-[#FDFBF7] text-[#294B3A] focus:outline-hidden focus:ring-2 focus:ring-[#355A46] font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#294B3A] font-serif uppercase tracking-wider">
                  Change Rationale / Summary
                </label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Creator introduced underwater breathing mechanics to enable aquatic deep trench encounters"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D8CCB7] bg-[#FDFBF7] text-[#294B3A] focus:outline-hidden focus:ring-2 focus:ring-[#355A46]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6D63] hover:bg-[#DDE2D2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFetchPreview}
                  disabled={isLoadingPreview}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#294B3A] text-[#FDFBF7] text-xs font-bold hover:bg-[#355A46] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoadingPreview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing Blast Radius...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#88B04B]" />
                      <span>Preview Impact (Zero Side Effects)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {preview && !successResult && (
            <div className="space-y-6">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#FEE2E2]/60 border border-[#FCA5A5] text-center">
                  <span className="block text-lg font-bold text-[#991B1B]">
                    {preview.affected_nodes.length}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#7F1D1D] font-bold">
                    Affected Nodes
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#FEF3C7]/60 border border-[#FCD34D] text-center">
                  <span className="block text-lg font-bold text-[#92400E]">
                    {preview.conditional_nodes.length}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#78350F] font-bold">
                    Conditional Nodes
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#DCFCE7]/60 border border-[#86EFAC] text-center">
                  <span className="block text-lg font-bold text-[#166534]">
                    {preview.preserved_nodes.length}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#14532D] font-bold">
                    Preserved Nodes
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] text-center">
                  <span className="block text-lg font-bold text-[#334155]">
                    {preview.locked_node_count}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#475569] font-bold">
                    Locked Protected
                  </span>
                </div>
              </div>

              {/* Ambiguity Warnings */}
              {preview.has_ambiguous_provenance && (
                <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                    <span>Conservative Heuristic Assessment Notice</span>
                  </div>
                  {preview.ambiguity_warnings.map((w, idx) => (
                    <p key={idx} className="text-[11px] leading-relaxed">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Affected Nodes List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-[#991B1B] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>AFFECTED Nodes (Direct Descendants)</span>
                  </h3>
                  <span className="text-[11px] text-[#5F6D63]">
                    Selected for regeneration: {selectedEntityIds.size}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {preview.affected_nodes.map((node) => {
                    const isSelected = selectedEntityIds.has(node.entity_id);
                    const isUnlocked = forceUnlockIds.has(node.entity_id);
                    const isUpstreamRoot = node.entity_id === upstreamEntityId;

                    return (
                      <div
                        key={node.entity_id}
                        className={`p-3 rounded-xl border text-xs transition-colors flex items-start justify-between gap-3 ${
                          node.is_locked
                            ? 'bg-[#FDF2F2] border-[#FCA5A5]'
                            : isSelected
                            ? 'bg-[#F4EEDB] border-[#C8D0BE]'
                            : 'bg-[#FDFBF7] border-[#E5DEC9]'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FEE2E2] text-[#991B1B] font-bold">
                              {node.entity_type}
                            </span>
                            <span className="font-bold text-[#294B3A]">{node.name_or_title}</span>
                            {node.is_locked && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#991B1B] text-white font-bold">
                                <Lock className="w-2.5 h-2.5" />
                                Locked Zone
                              </span>
                            )}
                            <span className="text-[10px] text-[#5F6D63] font-mono">
                              v{node.current_version}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5F6D63] leading-relaxed">
                            {node.reason}
                          </p>
                        </div>

                        {!isUpstreamRoot && (
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            {node.is_locked ? (
                              <button
                                type="button"
                                onClick={() => toggleForceUnlock(node.entity_id)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                  isUnlocked
                                    ? 'bg-[#991B1B] text-white border-[#7F1D1D]'
                                    : 'bg-white text-[#991B1B] border-[#FCA5A5] hover:bg-[#FEE2E2]'
                                }`}
                              >
                                {isUnlocked ? (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    <span>Unlock Confirmed</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>Confirm Unlock</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <label className="flex items-center gap-1.5 text-xs text-[#294B3A] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectEntity(node.entity_id)}
                                  className="rounded border-[#D8CCB7] text-[#355A46] focus:ring-[#355A46]"
                                />
                                <span className="text-[11px] font-semibold">Regenerate</span>
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Nodes List */}
              {preview.conditional_nodes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-[#92400E] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#B45309]" />
                    <span>CONDITIONAL Nodes (Thematic & Contextual Review)</span>
                  </h3>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {preview.conditional_nodes.map((node) => {
                      const isSelected = selectedEntityIds.has(node.entity_id);
                      return (
                        <div
                          key={node.entity_id}
                          className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono px-1 rounded bg-[#FEF3C7] text-[#92400E] font-bold">
                                {node.entity_type}
                              </span>
                              <span className="font-semibold text-[#294B3A]">{node.name_or_title}</span>
                            </div>
                            <p className="text-[10px] text-[#78350F]">{node.reason}</p>
                          </div>
                          <label className="flex items-center gap-1 text-[11px] text-[#78350F] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectEntity(node.entity_id)}
                              className="rounded border-[#D8CCB7] text-[#355A46]"
                            />
                            <span>Regenerate</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preserved Nodes List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-[#166534] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                  <span>PRESERVED Nodes ({preview.preserved_nodes.length} Untouched)</span>
                </h3>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {preview.preserved_nodes.slice(0, 5).map((node) => (
                    <div
                      key={node.entity_id}
                      className="p-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] flex items-center justify-between"
                    >
                      <span className="font-medium text-[#166534]">{node.name_or_title}</span>
                      <span className="text-[10px] text-[#4ADE80] font-mono">
                        {node.is_locked ? 'Protected by Lock' : 'Independent Arc'}
                      </span>
                    </div>
                  ))}
                  {preview.preserved_nodes.length > 5 && (
                    <p className="text-[10px] text-[#5F6D63] italic">
                      + {preview.preserved_nodes.length - 5} additional preserved entities
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#D8CCB7] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#5F6D63] hover:bg-[#DDE2D2] transition-colors"
                >
                  Back to Edit
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6D63] hover:bg-[#DDE2D2] transition-colors"
                  >
                    Cancel & Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRegeneration}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#294B3A] text-[#FDFBF7] text-xs font-bold hover:bg-[#355A46] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isRegenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Regenerating Selected Entities...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-[#88B04B]" />
                        <span>Confirm Selective Regeneration ({selectedEntityIds.size})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
