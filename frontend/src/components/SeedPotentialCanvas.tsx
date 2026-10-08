import React, { useState, useEffect } from 'react';
import {
  Anchor,
  Sparkles,
  HelpCircle,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PotentialItemStatus, SeedPotentialCategory } from '../types';

interface SeedPotentialCanvasProps {
  compact?: boolean;
}

export const SeedPotentialCanvas: React.FC<SeedPotentialCanvasProps> = ({ compact = false }) => {
  const {
    activeProject,
    potentialItems,
    isExtractingPotential,
    extractPotentialItemsAction,
    updatePotentialStatusAction,
    batchUpdatePotentialStatusesAction,
    fetchPotentialItems,
    unlockStage,
    setActiveStage,
  } = useWorkspaceStore();

  const [activeFilter, setActiveFilter] = useState<'all' | SeedPotentialCategory>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject && potentialItems.length === 0 && !isExtractingPotential) {
      fetchPotentialItems();
    }
  }, [activeProject, potentialItems.length, isExtractingPotential, fetchPotentialItems]);

  const explicitItems = potentialItems.filter((i) => i.category === 'explicit');
  const inferredItems = potentialItems.filter((i) => i.category === 'inferred');
  const openItems = potentialItems.filter((i) => i.category === 'open');

  const acceptedCount = inferredItems.filter((i) => i.user_status === 'accepted').length;
  const rejectedCount = inferredItems.filter((i) => i.user_status === 'rejected').length;
  const pendingCount = inferredItems.filter((i) => i.user_status === 'pending').length;

  const handleStatusChange = async (itemId: string, newStatus: PotentialItemStatus) => {
    setUpdatingId(itemId);
    await updatePotentialStatusAction(itemId, newStatus);
    setUpdatingId(null);
  };

  const handleAcceptAllInferred = async () => {
    const pending = inferredItems.filter((i) => i.user_status !== 'accepted');
    if (pending.length === 0) return;
    await batchUpdatePotentialStatusesAction(
      pending.map((i) => ({ id: i.id, user_status: 'accepted' }))
    );
  };

  const handleResetInferred = async () => {
    const nonPending = inferredItems.filter((i) => i.user_status !== 'pending');
    if (nonPending.length === 0) return;
    await batchUpdatePotentialStatusesAction(
      nonPending.map((i) => ({ id: i.id, user_status: 'pending' }))
    );
  };

  const handleProceedToWorlds = () => {
    unlockStage('worlds');
    setActiveStage('worlds');
  };

  if (potentialItems.length === 0 && !isExtractingPotential) {
    return (
      <div className="p-8 rounded-2xl bg-[#F8F4E8] border border-[#D8CCB7] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-serif font-bold text-[#294B3A]">Seed Potential Map Not Extracted</h3>
          <p className="text-xs text-[#466A55] max-w-md mx-auto">
            Extract explicit seed anchors, AI-inferred possibilities, and open narrative questions to shape your divergent worlds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => extractPotentialItemsAction()}
          className="px-5 py-2.5 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-semibold text-xs inline-flex items-center gap-2 shadow-xs transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Extract Seed Potential Map</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? 'text-xs' : 'w-full max-w-6xl py-2'}`}>
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D8CCB7]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className={`font-serif font-bold text-[#294B3A] ${compact ? 'text-base' : 'text-xl'}`}>
              Seed Potential Map
            </h2>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7] font-mono">
              Semantic Intelligence
            </span>
          </div>
          <p className="text-[#466A55] text-xs">
            Review the explicit anchors directly from your seed, accept or reject AI-inferred directions, and explore catalytic mysteries.
          </p>
        </div>

        {/* Status Pill Badges & Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2EBDD] border border-[#D8CCB7] text-[11px] font-mono text-[#294B3A]">
            <span className="w-2 h-2 rounded-full bg-[#355A46]" />
            <span>{explicitItems.length} Anchors</span>
            <span className="text-[#D8CCB7]">•</span>
            <span className="w-2 h-2 rounded-full bg-[#294B3A]" />
            <span>{acceptedCount} Accepted</span>
            <span className="text-[#D8CCB7]">•</span>
            <span className="w-2 h-2 rounded-full bg-[#718875]" />
            <span>{pendingCount} Pending</span>
            <span className="text-[#D8CCB7]">•</span>
            <span className="w-2 h-2 rounded-full bg-[#B85C46]" />
            <span>{rejectedCount} Rejected</span>
            <span className="text-[#D8CCB7]">•</span>
            <span className="w-2 h-2 rounded-full bg-[#C59A55]" />
            <span>{openItems.length} Questions</span>
          </div>

          <button
            type="button"
            onClick={handleAcceptAllInferred}
            disabled={inferredItems.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7] text-xs font-medium inline-flex items-center gap-1.5 transition disabled:opacity-50 shadow-2xs"
            title="Accept all AI-inferred possibilities"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#355A46]" />
            <span>Accept All</span>
          </button>

          <button
            type="button"
            onClick={handleResetInferred}
            disabled={acceptedCount === 0 && rejectedCount === 0}
            className="p-1.5 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#466A55] hover:text-[#294B3A] border border-[#D8CCB7] transition disabled:opacity-50 shadow-2xs"
            title="Reset decisions to pending"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => extractPotentialItemsAction()}
            disabled={isExtractingPotential}
            className="p-1.5 rounded-lg bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#466A55] hover:text-[#294B3A] border border-[#D8CCB7] transition disabled:opacity-50 shadow-2xs"
            title="Re-extract Seed Potential Map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExtractingPotential ? 'animate-spin text-[#355A46]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            activeFilter === 'all'
              ? 'bg-[#355A46] text-[#F8F4E8] shadow-xs'
              : 'text-[#466A55] hover:text-[#294B3A] hover:bg-[#EAE4D4]'
          }`}
        >
          All Categories ({potentialItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('explicit')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            activeFilter === 'explicit'
              ? 'bg-[#355A46] text-[#F8F4E8] shadow-xs'
              : 'text-[#466A55] hover:text-[#294B3A] hover:bg-[#EAE4D4]'
          }`}
        >
          <Anchor className="w-3 h-3" />
          <span>Explicit Anchors ({explicitItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('inferred')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            activeFilter === 'inferred'
              ? 'bg-[#355A46] text-[#F8F4E8] shadow-xs'
              : 'text-[#466A55] hover:text-[#294B3A] hover:bg-[#EAE4D4]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>AI-Inferred ({inferredItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('open')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            activeFilter === 'open'
              ? 'bg-[#355A46] text-[#F8F4E8] shadow-xs'
              : 'text-[#466A55] hover:text-[#294B3A] hover:bg-[#EAE4D4]'
          }`}
        >
          <HelpCircle className="w-3 h-3" />
          <span>Open Questions ({openItems.length})</span>
        </button>
      </div>

      {/* 3-Lane Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lane 1: Explicit Anchors */}
        {(activeFilter === 'all' || activeFilter === 'explicit') && (
          <div data-testid="lane-explicit" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D8CCB7]">
              <div className="flex items-center gap-2 text-[#355A46] font-bold text-xs uppercase tracking-wider">
                <Anchor className="w-4 h-4" />
                <span>Explicit Anchors</span>
              </div>
              <span className="text-[10px] font-mono text-[#466A55] px-2 py-0.5 rounded-full bg-[#DDE2D2] border border-[#C8D0BE]">
                100% Immutable
              </span>
            </div>

            <div className="space-y-2.5">
              {explicitItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`potential-item-${item.id}`}
                  className="p-3.5 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] text-[#294B3A] shadow-2xs transition hover:border-[#355A46]"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#294B3A]">{item.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DDE2D2] text-[#294B3A] font-mono shrink-0">
                      Anchor
                    </span>
                  </div>
                  {item.source_evidence && (
                    <div className="text-[11px] text-[#466A55] flex items-center gap-1 font-mono">
                      <span>“</span>
                      <span className="italic">{item.source_evidence}</span>
                      <span>”</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lane 2: AI-Inferred Possibilities (With Accept/Reject Controls) */}
        {(activeFilter === 'all' || activeFilter === 'inferred') && (
          <div data-testid="lane-inferred" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D8CCB7]">
              <div className="flex items-center gap-2 text-[#294B3A] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#294B3A]" />
                <span>AI-Inferred Possibilities</span>
              </div>
              <span className="text-[10px] font-mono text-[#466A55] px-2 py-0.5 rounded-full bg-[#EAE4D4] border border-[#D8CCB7]">
                Human Choice
              </span>
            </div>

            <div className="space-y-2.5">
              {inferredItems.map((item) => {
                const isAccepted = item.user_status === 'accepted';
                const isRejected = item.user_status === 'rejected';
                const isPending = item.user_status === 'pending';

                return (
                  <div
                    key={item.id}
                    data-testid={`potential-item-${item.id}`}
                    className={`p-3.5 rounded-xl transition-all border ${
                      isAccepted
                        ? 'bg-[#EBF3ED] border-[#A8CCA4] text-[#294B3A] shadow-xs'
                        : isRejected
                        ? 'bg-[#F2EBDD]/50 border-[#D8CCB7]/60 text-[#718875] opacity-60'
                        : 'bg-[#F8F4E8] border-[#D8CCB7] text-[#294B3A] hover:border-[#355A46]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              isRejected ? 'line-through text-[#718875]' : 'text-[#294B3A]'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#F2EBDD] text-[#466A55] border border-[#D8CCB7] font-mono">
                          AI-inferred possibility
                        </span>
                      </div>

                      {/* Confidence Score Badge */}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EAE4D4] text-[#294B3A] shrink-0 border border-[#D8CCB7]">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>

                    {item.source_evidence && (
                      <p className="text-[11px] text-[#466A55] mb-3">
                        <span className="text-[#718875]">Basis:</span> {item.source_evidence}
                      </p>
                    )}

                    {/* Interactive Accept / Reject Decision Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#D8CCB7]/60">
                      <div className="text-[11px] font-medium">
                        {isAccepted && (
                          <span className="text-[#355A46] font-semibold inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#355A46]" /> Accepted by Creator
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[#B85C46] inline-flex items-center gap-1">
                            <X className="w-3 h-3 text-[#B85C46]" /> Excluded from canon
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[#718875] text-[10px]">Awaiting decision</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Reject ${item.label}`}
                          disabled={updatingId === item.id}
                          onClick={() =>
                            handleStatusChange(item.id, isRejected ? 'pending' : 'rejected')
                          }
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                            isRejected
                              ? 'bg-[#FBEBE8] border-[#E8B4AA] text-[#B85C46]'
                              : 'bg-[#F2EBDD] border-[#D8CCB7] text-[#718875] hover:text-[#B85C46] hover:bg-[#FBEBE8]'
                          }`}
                          title={isRejected ? 'Reset rejection' : 'Reject possibility'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          aria-label={`Accept ${item.label}`}
                          disabled={updatingId === item.id}
                          onClick={() =>
                            handleStatusChange(item.id, isAccepted ? 'pending' : 'accepted')
                          }
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition ${
                            isAccepted
                              ? 'bg-[#DDE2D2] border-[#C8D0BE] text-[#294B3A]'
                              : 'bg-[#F2EBDD] border-[#D8CCB7] text-[#294B3A] hover:bg-[#DDE2D2]'
                          }`}
                          title={isAccepted ? 'Revoke acceptance' : 'Accept into canon'}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAccepted ? 'Accepted' : 'Accept'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lane 3: Open Creative Questions */}
        {(activeFilter === 'all' || activeFilter === 'open') && (
          <div data-testid="lane-open" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D8CCB7]">
              <div className="flex items-center gap-2 text-[#C59A55] font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Open Creative Questions</span>
              </div>
              <span className="text-[10px] font-mono text-[#466A55] px-2 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E8DCC8]">
                Catalytic Mysteries
              </span>
            </div>

            <div className="space-y-2.5">
              {openItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`potential-item-${item.id}`}
                  className="p-3.5 rounded-xl bg-[#FAF5EE] border border-[#E8DCC8] text-[#294B3A] shadow-2xs transition hover:border-[#C59A55]"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#294B3A] leading-relaxed">
                      {item.label}
                    </span>
                  </div>
                  {item.source_evidence && (
                    <div className="text-[11px] text-[#718875] font-mono pt-1">
                      <span className="text-[#C59A55]">Tension Anchor: </span>
                      <span className="italic">{item.source_evidence}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Advancement Bar */}
      {!compact && (
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#D8CCB7]">
          <div className="text-xs text-[#466A55] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#355A46] shrink-0" />
            <span>
              Accepted possibilities and open questions will guide divergence when synthesizing Three Worlds in Stage 3.
            </span>
          </div>

          <button
            type="button"
            onClick={handleProceedToWorlds}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Generate 3 Worlds with Seed Potential (Stage 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
