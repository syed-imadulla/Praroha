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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#F5E6DC] text-[#B8734F] border border-[#B8734F]/50">
            <AlertTriangle className="w-3 h-3 text-[#B8734F]" />
            AFFECTED
          </span>
        );
      case 'CONDITIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/50">
            <HelpCircle className="w-3 h-3 text-[#805B20]" />
            CONDITIONAL
          </span>
        );
      case 'PRESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#DDE2D2] text-[#294B3A] border border-[#294B3A]/40">
            <ShieldCheck className="w-3 h-3 text-[#294B3A]" />
            PRESERVED
          </span>
        );
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'character':
        return <Users className="w-3.5 h-3.5 text-[#5A6E5E]" />;
      case 'scene':
        return <Film className="w-3.5 h-3.5 text-[#5A6E5E]" />;
      case 'world':
      case 'rule':
        return <Compass className="w-3.5 h-3.5 text-[#5A6E5E]" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-[#5A6E5E]" />;
    }
  };

  if (!simulation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#5A6E5E] border border-dashed border-[#D8CCB7] rounded-xl bg-[#FAF6EE]">
        <Sparkles className="w-12 h-12 text-[#805B20] mb-3 animate-pulse" />
        <h4 className="text-base font-serif font-bold text-[#294B3A] mb-1">Causal Diff DAG Empty</h4>
        <p className="text-xs text-[#5A6E5E] max-w-sm">
          Run <span className="text-[#805B20] font-semibold">"Simulate Impact"</span> on the left panel to synthesize and visualize downstream causal ripple effects across all universe entities.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-[#F8F4E8] rounded-xl border border-[#D8CCB7] overflow-hidden shadow-sm">
      {/* DAG Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#D8CCB7] bg-[#F2EBDD]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#805B20]" />
          <span className="text-xs font-serif font-bold text-[#294B3A] tracking-wide uppercase">Causal Ripple DAG</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#466A55] border border-[#D8CCB7]">
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
                  ? 'bg-[#294B3A] text-[#F8F4E8] font-bold shadow-sm'
                  : 'text-[#5A6E5E] hover:text-[#294B3A] hover:bg-[#FAF6EE]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#FAF6EE] rounded-lg p-0.5 border border-[#D8CCB7]">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1 hover:bg-[#F2EBDD] rounded-lg text-[#5F6D63] hover:text-[#294B3A] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-[#294B3A] px-1.5 font-mono font-bold tabular-nums">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1 hover:bg-[#F2EBDD] rounded-lg text-[#5F6D63] hover:text-[#294B3A] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1 hover:bg-[#F2EBDD] rounded-lg text-[#5F6D63] hover:text-[#294B3A] transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 overflow-auto p-4 custom-scrollbar bg-[#F8F4E8]">
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
                      stroke="rgba(184, 115, 79, 0.25)"
                      strokeWidth={isSelected ? 6 : 4}
                      strokeLinecap="round"
                    />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isAffected
                        ? '#B8734F'
                        : isConditional
                        ? '#C59A55'
                        : '#466A55'
                    }
                    strokeWidth={isSelected ? 2.5 : isAffected ? 2 : 1.5}
                    strokeDasharray={isConditional ? '4 4' : isPreserved ? '2 2' : undefined}
                    strokeLinecap="round"
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
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#FAF6EE] border-2 border-[#294B3A] shadow-md min-w-[240px] text-center">
              <div className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-[#805B20] mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#805B20]" />
                Mutation Origin
              </div>
              <span className="text-[13px] font-serif font-bold text-[#294B3A]">{rootPremiseName}</span>
              <p className="text-xs text-[#394840] line-clamp-1 italic mt-0.5 font-serif max-w-[220px]">
                "{rootHypothesis}"
              </p>
            </div>
          </div>

          {/* Node Cards */}
          {visibleNodes.map((node) => {
            const isSelected = selectedNode?.entity_id === node.item.entity_id;
            const status = node.item.impact_category;

            let borderStyle = 'border-[#D8CCB7] bg-[#FAF6EE] text-[#294B3A]';
            let haloStyle = '';

            if (status === 'AFFECTED') {
              borderStyle = 'border-[#B8734F] bg-[#F5E6DC] text-[#294B3A]';
              haloStyle = isSelected
                ? 'ring-2 ring-[#B8734F] shadow-md'
                : 'shadow-sm hover:shadow-md';
            } else if (status === 'CONDITIONAL') {
              borderStyle = 'border-[#C59A55] border-dashed bg-[#E9DDBF] text-[#294B3A]';
              haloStyle = isSelected
                ? 'ring-2 ring-[#805B20] shadow-md'
                : 'shadow-sm hover:shadow-md';
            } else {
              borderStyle = 'border-[#294B3A]/40 bg-[#DDE2D2] text-[#294B3A]';
              haloStyle = isSelected
                ? 'ring-2 ring-[#294B3A] shadow-md'
                : 'shadow-sm hover:shadow-md';
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
                className={`cursor-pointer rounded-xl p-2.5 min-w-[170px] max-w-[200px] border transition-all duration-200 z-10 ${borderStyle} ${haloStyle}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="flex items-center gap-1 text-xs uppercase font-mono font-semibold text-[#5F6D63] tracking-wider">
                    {getEntityIcon(node.item.entity_type)}
                    {node.item.entity_type}
                  </span>
                  {getStatusBadge(node.item.impact_category)}
                </div>

                <div className="text-xs font-bold truncate text-[#294B3A]" title={node.item.title}>
                  {node.item.title}
                </div>

                <div className="text-xs text-[#394840] line-clamp-2 mt-1 leading-tight font-serif">
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
          className="absolute bottom-4 left-4 right-4 bg-[#FAF6EE] border border-[#D8CCB7] rounded-xl p-4 shadow-xl backdrop-blur-md z-20 animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-mono text-[#5F6D63] font-semibold flex items-center gap-1">
                  {getEntityIcon(selectedNode.entity_type)}
                  {selectedNode.entity_type}
                </span>
                {getStatusBadge(selectedNode.impact_category)}
              </div>
              <h4 className="text-base font-serif font-bold text-[#294B3A]">{selectedNode.title}</h4>
            </div>

            <button
              onClick={() => onSelectNode(null)}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 hover:bg-[#F2EBDD] rounded-lg text-[#5F6D63] hover:text-[#294B3A] transition-colors focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2 border-t border-[#D8CCB7] pt-2.5">
            <div>
              <span className="text-xs font-bold text-[#B8734F] uppercase tracking-wider block mb-1">
                Causal Justification
              </span>
              <p className="text-[#394840] leading-relaxed text-xs">
                {selectedNode.causal_justification}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-[#805B20] uppercase tracking-wider block mb-1">
                Projected Adaptation
              </span>
              <p className="text-[#394840] leading-relaxed text-xs">
                {selectedNode.projected_impact || selectedNode.original_summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
