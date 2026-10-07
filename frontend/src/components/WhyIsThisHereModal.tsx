import { X, GitCommit, Compass, Sparkles, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import type { OriginType } from '../types';
import { OriginBadge, ORIGIN_CONFIG } from './OriginBadge';
import { useWorkspaceStore } from '../store/workspaceStore';

export interface WhyIsThisHereData {
  title: string;
  entityType: string;
  originType?: OriginType | string;
  originSource?: string | null;
  causalExplanation?: string | null;
  nodeId?: string | null;
  rawSeedText?: string;
}

interface WhyIsThisHereModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WhyIsThisHereData | null;
  onJumpToDAG?: (nodeId?: string) => void;
}

export const WhyIsThisHereModal: React.FC<WhyIsThisHereModalProps> = ({
  isOpen,
  onClose,
  data,
  onJumpToDAG,
}) => {
  const activeProject = useWorkspaceStore((state) => state.activeProject);
  const setActiveStage = useWorkspaceStore((state) => state.setActiveStage);

  if (!isOpen || !data) return null;

  const originType = (data.originType || 'AI_INTRODUCED') as OriginType;
  const config = ORIGIN_CONFIG[originType] || ORIGIN_CONFIG.AI_INTRODUCED;
  const sourceLabel = data.originSource || 'Creative Genesis Engine';

  // Deterministic fallback synthesis if no explicit backend causal explanation provided
  const generateExplanation = (): string => {
    if (data.causalExplanation) return data.causalExplanation;

    const seed = data.rawSeedText || activeProject?.seed_text || 'the original premise';

    switch (originType) {
      case 'SEED_EXPLICIT':
        return `This ${data.entityType.toLowerCase()} is grounded directly in your original seed premise: "${seed}". Origin Anchor: "${sourceLabel}". It serves as an immutable conceptual foundation of the world.`;
      case 'SEED_INFERRED':
        return `Developed from an accepted Seed Potential possibility or inferred thematic premise: "${sourceLabel}". It logically extrapolates foundational seed implications without introducing canon drift.`;
      case 'HUMAN_DECISION':
        if (sourceLabel.includes('Human-Only Zone')) {
          return `Locked by the human creator as an inviolable Human-Only Zone before universe expansion: "${sourceLabel}". AI models are strictly prohibited from overriding or softening this constraint.`;
        }
        return `Created to fulfill your explicit creator commitment in Stage 4 Decision DNA: "${sourceLabel}". It directly embodies chosen archetypes, creative priorities, and custom directives.`;
      case 'DERIVED':
        return `Derived logically from established World Bible physics, geography, and systemic rules. Canon Anchor: "${sourceLabel}". It maintains strict ecological and world consistency.`;
      case 'AI_INTRODUCED':
        return `Introduced via generative narrative synthesis to expand atmospheric depth, character friction, and dramatic stakes. Source Context: "${sourceLabel}". Strictly constrained by all Decision DNA boundaries.`;
      case 'USER_ADDED':
        return `Authored or refined directly by the creator during iterative refinement: "${sourceLabel}". Represents an immutable, creator-committed branch mutation.`;
      default:
        return `Provenance established under ${originType} classification. Anchor citation: "${sourceLabel}".`;
    }
  };

  const handleJumpToDAG = () => {
    onClose();
    if (onJumpToDAG) {
      onJumpToDAG(data.nodeId || undefined);
    } else {
      // Traceability Canvas is stage 'trace'
      setActiveStage('trace');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      data-testid="why-is-this-here-modal"
    >
      <div
        className="relative w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 overflow-hidden"
        style={{
          boxShadow: `0 0 35px -5px ${config.accentColor}25, 0 10px 25px -5px rgba(0, 0, 0, 0.7)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ambient Accent Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: config.accentColor }}
        />

        {/* Top bar with close button */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: `${config.accentColor}15`,
                borderColor: `${config.accentColor}40`,
                color: config.accentColor,
              }}
            >
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono tracking-wider text-zinc-400 uppercase">
                Provenance Explainer • {data.entityType}
              </div>
              <h2 className="text-lg font-bold text-zinc-100 truncate max-w-sm" data-testid="why-modal-title">
                {data.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/60 transition-colors"
            data-testid="close-why-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Origin Classification Ribbon */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 mb-4">
          <div className="text-xs font-medium text-zinc-300">
            Universal Origin Tier
          </div>
          <div data-testid="why-modal-origin-badge">
            <OriginBadge
              originType={originType}
              originSource={data.originSource}
              interactive={false}
              size="md"
            />
          </div>
        </div>

        {/* Exact Citation / Anchor Box */}
        {data.originSource && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Source Anchor Citation
            </div>
            <div
              className="text-xs font-mono text-zinc-200 bg-black/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/50"
              data-testid="why-modal-citation"
            >
              {data.originSource}
            </div>
          </div>
        )}

        {/* Human-Only Zone Creator Lock Callout Banner */}
        {sourceLabel.includes('Human-Only Zone') && (
          <div
            id="why-modal-hoz-callout"
            className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2.5 text-xs text-amber-200"
          >
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-mono font-bold text-amber-300 uppercase text-[10px]">
                Inviolable Human-Only Zone Lock
              </div>
              <p className="text-[11.5px] text-amber-200/90 leading-relaxed">
                Locked by human creator before universe expansion. AI models are strictly prohibited from overriding this constraint.
              </p>
            </div>
          </div>
        )}

        {/* Narrative Causal Explanation */}
        <div className="mb-6">
          <div className="text-[11px] font-mono uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Why is this here? (Causal Justification)
          </div>
          <div
            className="text-sm leading-relaxed text-zinc-300 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 font-sans"
            data-testid="why-modal-explanation"
          >
            {generateExplanation()}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
            <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
            Zero-Token Deterministic Proof
          </div>
          <button
            onClick={handleJumpToDAG}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-950/40 hover:scale-[1.02] active:scale-[0.98]"
            data-testid="why-modal-jump-dag"
          >
            <span>Inspect in Causal DAG</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
