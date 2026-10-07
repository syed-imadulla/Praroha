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
      <div className="p-8 rounded-2xl bg-canvas-card/40 border border-canvas-border text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-100">Seed Potential Map Not Extracted</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Extract explicit seed anchors, AI-inferred possibilities, and open narrative questions to shape your divergent worlds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => extractPotentialItemsAction()}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-canvas-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className={`font-bold text-slate-100 font-sans ${compact ? 'text-base' : 'text-xl'}`}>
              Seed Potential Map
            </h2>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
              Semantic Intelligence
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            Review the explicit anchors directly from your seed, accept or reject AI-inferred directions, and explore catalytic mysteries.
          </p>
        </div>

        {/* Status Pill Badges & Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{explicitItems.length} Anchors</span>
            <span className="text-slate-600">•</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>{acceptedCount} Accepted</span>
            <span className="text-slate-600">•</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{pendingCount} Pending</span>
            <span className="text-slate-600">•</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{rejectedCount} Rejected</span>
            <span className="text-slate-600">•</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{openItems.length} Questions</span>
          </div>

          <button
            type="button"
            onClick={handleAcceptAllInferred}
            disabled={inferredItems.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition disabled:opacity-50"
            title="Accept all AI-inferred possibilities"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accept All</span>
          </button>

          <button
            type="button"
            onClick={handleResetInferred}
            disabled={acceptedCount === 0 && rejectedCount === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Reset decisions to pending"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => extractPotentialItemsAction()}
            disabled={isExtractingPotential}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Re-extract Seed Potential Map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExtractingPotential ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeFilter === 'all'
              ? 'bg-slate-800 text-slate-100 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          All Categories ({potentialItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('explicit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            activeFilter === 'explicit'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-transparent'
          }`}
        >
          <Anchor className="w-3 h-3 text-cyan-400" />
          <span>Explicit Anchors ({explicitItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('inferred')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            activeFilter === 'inferred'
              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
              : 'text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 border border-transparent'
          }`}
        >
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>AI-Inferred ({inferredItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('open')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            activeFilter === 'open'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
              : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 border border-transparent'
          }`}
        >
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>Open Questions ({openItems.length})</span>
        </button>
      </div>

      {/* 3-Lane Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lane 1: Explicit Anchors */}
        {(activeFilter === 'all' || activeFilter === 'explicit') && (
          <div data-testid="lane-explicit" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Anchor className="w-4 h-4" />
                <span>Explicit Anchors</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300/80 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                100% Immutable
              </span>
            </div>

            <div className="space-y-2.5">
              {explicitItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`potential-item-${item.id}`}
                  className="p-3.5 rounded-xl bg-gradient-to-b from-cyan-950/20 to-slate-900/60 border border-cyan-800/40 text-slate-200 shadow-sm transition hover:border-cyan-600/60"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-100">{item.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 font-mono shrink-0">
                      Anchor
                    </span>
                  </div>
                  {item.source_evidence && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <span className="text-cyan-500">“</span>
                      <span className="italic">{item.source_evidence}</span>
                      <span className="text-cyan-500">”</span>
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
            <div className="flex items-center justify-between pb-2 border-b border-indigo-900/40">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI-Inferred Possibilities</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-300/80 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
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
                        ? 'bg-emerald-950/25 border-emerald-500/50 text-slate-100 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                        : isRejected
                        ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60'
                        : 'bg-indigo-950/20 border-indigo-800/40 text-slate-200 hover:border-indigo-600/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              isRejected ? 'line-through text-slate-500' : 'text-slate-100'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 font-mono">
                          AI-inferred possibility
                        </span>
                      </div>

                      {/* Confidence Score Badge */}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-850 text-slate-300 shrink-0 border border-slate-800">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>

                    {item.source_evidence && (
                      <p className="text-[11px] text-slate-400 mb-3">
                        <span className="text-slate-500">Basis:</span> {item.source_evidence}
                      </p>
                    )}

                    {/* Interactive Accept / Reject Decision Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="text-[11px] font-medium">
                        {isAccepted && (
                          <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Accepted by Creator
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-slate-400 inline-flex items-center gap-1">
                            <X className="w-3 h-3 text-rose-400" /> Excluded from canon
                          </span>
                        )}
                        {isPending && (
                          <span className="text-slate-400 text-[10px]">Awaiting decision</span>
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
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
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
                              ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300'
                              : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-emerald-600/30 hover:text-emerald-200'
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
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Open Creative Questions</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/80 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                Catalytic Mysteries
              </span>
            </div>

            <div className="space-y-2.5">
              {openItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`potential-item-${item.id}`}
                  className="p-3.5 rounded-xl bg-gradient-to-b from-amber-950/20 to-slate-900/60 border border-amber-800/40 text-slate-200 shadow-sm transition hover:border-amber-600/60"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-amber-200/90 leading-relaxed">
                      {item.label}
                    </span>
                  </div>
                  {item.source_evidence && (
                    <div className="text-[11px] text-slate-400 font-mono pt-1">
                      <span className="text-amber-500/70">Tension Anchor: </span>
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
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-canvas-border">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Accepted possibilities and open questions will guide divergence when synthesizing Three Worlds in Stage 3.
            </span>
          </div>

          <button
            type="button"
            onClick={handleProceedToWorlds}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Generate 3 Worlds with Seed Potential (Stage 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
