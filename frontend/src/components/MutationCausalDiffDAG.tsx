import React, { useState, useMemo } from 'react';
import {
  EntityImpactItem,
  EntityImpactCategory,
  MutationSimulationResponse,
} from '../types';
import {
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Compass,
  Users,
  Film,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface MutationCausalDiffDAGProps {
  simulation: MutationSimulationResponse | null;
  selectedNode: EntityImpactItem | null;
  onSelectNode: (node: EntityImpactItem | null) => void;
  rootPremiseName?: string;
  rootHypothesis?: string;
}

interface DagNode {
  id: string;
  item: EntityImpactItem;
  x: number;
  y: number;
  tier: number; // 0: Root, 1: World, 2: Characters, 3: Scenes, 4: Locations
}

interface DagEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  impactCategory: EntityImpactCategory;
}

export const MutationCausalDiffDAG: React.FC<MutationCausalDiffDAGProps> = ({
  simulation,
  selectedNode,
  onSelectNode,
  rootPremiseName = 'Mutated Premise',
  rootHypothesis = 'Hypothesis Shift',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<EntityImpactCategory | 'ALL'>('ALL');

  const { nodes, edges, svgWidth, svgHeight } = useMemo(() => {
    if (!simulation || !simulation.impacted_entities || simulation.impacted_entities.length === 0) {
      return { nodes: [], edges: [], svgWidth: 700, svgHeight: 400 };
    }

    const items = simulation.impacted_entities;
    const worldItems = items.filter((i) => i.entity_type === 'world' || i.entity_type === 'rule');
    const charItems = items.filter((i) => i.entity_type === 'character');
    const sceneItems = items.filter((i) => i.entity_type === 'scene');
    const locItems = items.filter(
      (i) => i.entity_type === 'location' || (i.entity_type !== 'world' && i.entity_type !== 'rule' && i.entity_type !== 'character' && i.entity_type !== 'scene')
    );

    const maxCol = Math.max(1, worldItems.length, charItems.length, sceneItems.length, locItems.length);
    const colWidth = 200;
    const calculatedWidth = Math.max(760, (maxCol + 1) * colWidth);
    const centerX = calculatedWidth / 2;

    const dagNodes: DagNode[] = [];
    const dagEdges: DagEdge[] = [];

    // Root node
    const rootX = centerX;
    const rootY = 50;

    const layoutRow = (rowItems: EntityImpactItem[], y: number, tier: number) => {
      if (rowItems.length === 0) return;
      const totalWidth = (rowItems.length - 1) * colWidth;
      const startX = centerX - totalWidth / 2;

      rowItems.forEach((item, idx) => {
        const x = rowItems.length === 1 ? centerX : startX + idx * colWidth;
        const node: DagNode = {
          id: item.entity_id,
          item,
          x,
          y,
          tier,
        };
        dagNodes.push(node);

        // Edge from Root (or previous tier)
        dagEdges.push({
          id: `edge-root-${item.entity_id}`,
          fromX: rootX,
          fromY: rootY + 28,
          toX: x,
          toY: y - 28,
          impactCategory: item.impact_category,
        });
      });
    };

    let currentY = 160;
    if (worldItems.length > 0) {
      layoutRow(worldItems, currentY, 1);
      currentY += 120;
    }
    if (charItems.length > 0) {
      layoutRow(charItems, currentY, 2);
      currentY += 120;
    }
    if (sceneItems.length > 0) {
      layoutRow(sceneItems, currentY, 3);
      currentY += 120;
    }
    if (locItems.length > 0) {
      layoutRow(locItems, currentY, 4);
      currentY += 120;
    }

    return {
      nodes: dagNodes,
      edges: dagEdges,
      svgWidth: calculatedWidth,
      svgHeight: currentY + 40,
    };
  }, [simulation]);

  const visibleNodes = useMemo(() => {
    if (filterStatus === 'ALL') return nodes;
    return nodes.filter((n) => n.item.impact_category === filterStatus);
  }, [nodes, filterStatus]);

  const getStatusBadge = (status: EntityImpactCategory) => {
    switch (status) {
      case 'AFFECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            AFFECTED
          </span>
        );
      case 'CONDITIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            CONDITIONAL
          </span>
        );
      case 'PRESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            PRESERVED
          </span>
        );
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'character':
        return <Users className="w-3.5 h-3.5" />;
      case 'scene':
        return <Film className="w-3.5 h-3.5" />;
      case 'world':
      case 'rule':
        return <Compass className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  if (!simulation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-700/60 rounded-xl bg-slate-900/30">
        <Sparkles className="w-12 h-12 text-amber-400/50 mb-3 animate-pulse" />
        <h4 className="text-base font-semibold text-slate-200 mb-1">Causal Diff DAG Empty</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Run <span className="text-amber-400 font-medium">"Simulate Impact"</span> on the left panel to synthesize and visualize downstream causal ripple effects across all universe entities.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* DAG Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">Causal Ripple DAG</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {nodes.length} entities
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {(['ALL', 'AFFECTED', 'CONDITIONAL', 'PRESERVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                filterStatus === status
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/60">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
            className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-300 px-1 font-mono">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 overflow-auto p-4 custom-scrollbar bg-radial-gradient">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            minWidth: svgWidth,
            minHeight: svgHeight,
          }}
          className="relative mx-auto"
        >
          {/* SVG Connector Lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          >
            <defs>
              <linearGradient id="affectedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="conditionalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {edges.map((edge) => {
              const isSelected = selectedNode?.entity_id === edge.id.replace('edge-root-', '');
              const isAffected = edge.impactCategory === 'AFFECTED';
              const isConditional = edge.impactCategory === 'CONDITIONAL';
              const isPreserved = edge.impactCategory === 'PRESERVED';

              // Curve path
              const midY = (edge.fromY + edge.toY) / 2;
              const pathD = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`;

              return (
                <g key={edge.id}>
                  {/* Glowing background line for affected */}
                  {isAffected && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="rgba(245, 158, 11, 0.25)"
                      strokeWidth={isSelected ? 6 : 4}
                      strokeLinecap="round"
                    />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isAffected
                        ? 'url(#affectedGrad)'
                        : isConditional
                        ? 'url(#conditionalGrad)'
                        : 'rgba(52, 211, 153, 0.3)'
                    }
                    strokeWidth={isSelected ? 2.5 : isAffected ? 2 : 1.5}
                    strokeDasharray={isConditional ? '4 4' : isPreserved ? '2 2' : undefined}
                    strokeLinecap="round"
                    className={isAffected ? 'animate-pulse' : ''}
                  />
                </g>
              );
            })}
          </svg>

          {/* Root Seed Node */}
          <div
            style={{
              position: 'absolute',
              left: `${svgWidth / 2}px`,
              top: '50px',
              transform: 'translate(-50%, -50%)',
            }}
            className="z-10"
          >
            <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-purple-950/80 border-2 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] min-w-[240px] text-center backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                Mutation Origin
              </div>
              <span className="text-xs font-semibold text-slate-100">{rootPremiseName}</span>
              <p className="text-[11px] text-amber-200/80 line-clamp-1 italic mt-0.5 font-serif max-w-[220px]">
                "{rootHypothesis}"
              </p>
            </div>
          </div>

          {/* Node Cards */}
          {visibleNodes.map((node) => {
            const isSelected = selectedNode?.entity_id === node.item.entity_id;
            const status = node.item.impact_category;

            let borderStyle = 'border-slate-700 bg-slate-900/90 text-slate-200';
            let haloStyle = '';

            if (status === 'AFFECTED') {
              borderStyle = 'border-amber-500/80 bg-amber-950/50 text-amber-100';
              haloStyle = isSelected
                ? 'ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                : 'shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]';
            } else if (status === 'CONDITIONAL') {
              borderStyle = 'border-cyan-400/70 border-dashed bg-cyan-950/40 text-cyan-100';
              haloStyle = isSelected
                ? 'ring-2 ring-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]';
            } else {
              borderStyle = 'border-emerald-600/50 bg-emerald-950/30 text-emerald-100';
              haloStyle = isSelected
                ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            }

            return (
              <div
                key={node.id}
                data-testid={`dag-node-${node.item.entity_id}`}
                onClick={() => onSelectNode(isSelected ? null : node.item)}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`cursor-pointer rounded-lg p-2.5 min-w-[170px] max-w-[190px] border transition-all duration-200 backdrop-blur-md z-10 ${borderStyle} ${haloStyle}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                    {getEntityIcon(node.item.entity_type)}
                    {node.item.entity_type}
                  </span>
                  {getStatusBadge(node.item.impact_category)}
                </div>

                <div className="text-xs font-semibold truncate text-slate-100" title={node.item.title}>
                  {node.item.title}
                </div>

                <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-tight font-serif">
                  {node.item.causal_justification}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Detail Popover/Panel */}
      {selectedNode && (
        <div
          data-testid="dag-node-detail-panel"
          className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-md z-20 animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-mono text-slate-400 flex items-center gap-1">
                  {getEntityIcon(selectedNode.entity_type)}
                  {selectedNode.entity_type}
                </span>
                {getStatusBadge(selectedNode.impact_category)}
              </div>
              <h4 className="text-sm font-bold text-slate-100">{selectedNode.title}</h4>
            </div>

            <button
              onClick={() => onSelectNode(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2 border-t border-slate-800/80 pt-2">
            <div>
              <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block mb-0.5">
                Causal Justification
              </span>
              <p className="text-slate-300 font-serif leading-relaxed text-[11px]">
                {selectedNode.causal_justification}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-cyan-400/90 uppercase tracking-wider block mb-0.5">
                Projected Adaptation
              </span>
              <p className="text-slate-300 font-serif leading-relaxed text-[11px]">
                {selectedNode.projected_impact || selectedNode.original_summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
