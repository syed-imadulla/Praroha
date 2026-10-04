import React, { useEffect, useMemo } from 'react';
import {
  GitFork,
  Sparkles,
  RotateCw,
  Filter,
  CheckCircle2,
  Info,
  ChevronRight,
  BookOpen,
  User,
  Users,
  Film,
  MapPin,
  Compass,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { TraceNode, TraceNodeType } from '../types';

export const TraceabilityCanvas: React.FC = () => {
  const {
    activeProject,
    lineageGraph,
    selectedNodeId,
    isLoadingLineage,
    lineageFilter,
    fetchLineage,
    setSelectedNodeId,
    setLineageFilter,
  } = useWorkspaceStore();

  const [zoomLevel, setZoomLevel] = React.useState<number>(1.0);

  useEffect(() => {
    if (activeProject) {
      fetchLineage();
    }
  }, [activeProject?.id]);

  // Compute ancestor node IDs and active edges when a node is selected
  const { ancestorNodeIds, ancestorNodesOrdered } = useMemo(() => {
    if (!lineageGraph || !selectedNodeId) {
      return {
        ancestorNodeIds: new Set<string>(),
        ancestorNodesOrdered: [] as TraceNode[],
      };
    }

    const nodeMap = new Map<string, TraceNode>(lineageGraph.nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    const queue = [selectedNodeId];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const node = nodeMap.get(currId);
      if (node && node.parent_ids) {
        for (const pid of node.parent_ids) {
          if (nodeMap.has(pid) && !visited.has(pid)) {
            queue.push(pid);
          }
        }
      }
    }

    const ordered = Array.from(visited)
      .map((id) => nodeMap.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.stage - b.stage);

    return {
      ancestorNodeIds: visited,
      ancestorNodesOrdered: ordered,
    };
  }, [lineageGraph, selectedNodeId]);

  const selectedNode = useMemo(() => {
    if (!lineageGraph || !selectedNodeId) return null;
    return lineageGraph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [lineageGraph, selectedNodeId]);

  // Group nodes by pipeline lanes
  const laneGroups = useMemo(() => {
    if (!lineageGraph) return { lane1: [], lane2: [], lane3: [], lane4: [], lane5: [], lane6: [] };

    const nodes = lineageGraph.nodes;

    return {
      // Lane 1: Root Seed
      lane1: nodes.filter((n) => n.entity_type === 'root_seed'),
      // Lane 2: Seed DNA
      lane2: nodes.filter((n) => n.entity_type === 'seed_dna'),
      // Lane 3: Candidates & Selection Gate
      lane3: nodes.filter((n) => n.entity_type === 'world_candidate' || n.entity_type === 'human_selection'),
      // Lane 4: World Bible & Key Locations
      lane4: nodes.filter((n) => n.entity_type === 'world_bible' || n.entity_type === 'key_location'),
      // Lane 5: Characters & Relationships
      lane5: nodes.filter((n) => n.entity_type === 'character' || n.entity_type === 'relationship'),
      // Lane 6: Story Scenes
      lane6: nodes.filter((n) => n.entity_type === 'scene'),
    };
  }, [lineageGraph]);

  const getNodeColorClass = (type: TraceNodeType) => {
    switch (type) {
      case 'root_seed':
        return 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300';
      case 'seed_dna':
        return 'border-sky-500/50 bg-sky-950/40 text-sky-300';
      case 'world_candidate':
        return 'border-amber-500/40 bg-amber-950/30 text-amber-300';
      case 'human_selection':
        return 'border-emerald-500/60 bg-emerald-950/50 text-emerald-300';
      case 'world_bible':
        return 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300';
      case 'key_location':
        return 'border-teal-500/40 bg-teal-950/30 text-teal-300';
      case 'character':
        return 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300';
      case 'relationship':
        return 'border-orange-500/50 bg-orange-950/40 text-orange-300';
      case 'scene':
        return 'border-purple-500/50 bg-purple-950/40 text-purple-300';
      default:
        return 'border-slate-700 bg-slate-900 text-slate-300';
    }
  };

  const getNodeIcon = (type: TraceNodeType) => {
    switch (type) {
      case 'root_seed':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case 'seed_dna':
        return <GitFork className="w-3.5 h-3.5 text-sky-400" />;
      case 'world_candidate':
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case 'human_selection':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'world_bible':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'key_location':
        return <MapPin className="w-3.5 h-3.5 text-teal-400" />;
      case 'character':
        return <User className="w-3.5 h-3.5 text-indigo-400" />;
      case 'relationship':
        return <Users className="w-3.5 h-3.5 text-orange-400" />;
      case 'scene':
        return <Film className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const isNodeDimmed = (nodeId: string) => {
    if (!selectedNodeId) return false;
    return !ancestorNodeIds.has(nodeId);
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (!selectedNodeId) return false;
    return ancestorNodeIds.has(nodeId);
  };

  const isNodeSelected = (nodeId: string) => {
    return selectedNodeId === nodeId;
  };

  const handleNodeClick = (node: TraceNode) => {
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas-deep text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-canvas-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Tattva 2: Forms Hidden in Formless • Stage 6 Traceability
            </span>
            <span className="text-xs text-slate-400 font-mono">• Provenance DAG</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Causal Lineage & Provenance DAG
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Every downstream lore rule, character tension, key location, and dramatic scene is causally
            tethered back to your initial seed. Click any node to illuminate its full provenance trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>Reset Highlighting</span>
            </button>
          )}

          <button
            onClick={() => fetchLineage()}
            disabled={isLoadingLineage}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            title="Refresh DAG synthesis"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingLineage ? 'animate-spin' : ''}`} />
            <span>Sync Graph</span>
          </button>

          {/* DAG Zoom Controls */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Reset Zoom to 100%"
              aria-label="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.15).toFixed(2))))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Filter Focus:
          </span>
          {(['all', 'characters', 'scenes', 'locations', 'lore'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setLineageFilter(filter)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition ${
                lineageFilter === filter
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter === 'lore' ? 'Canon & Laws' : filter}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            Selected Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            Causal Ancestor Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            Unrelated Node
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 6-Lane DAG Pipeline (8 cols) */}
        <div
          id="lineage-dag-canvas"
          className="lg:col-span-8 space-y-6 origin-top-left transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel})`,
            width: zoomLevel !== 1 ? `${(100 / zoomLevel).toFixed(1)}%` : '100%',
          }}
        >
          {isLoadingLineage && !lineageGraph ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <RotateCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300">Synthesizing causal DAG relationships...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lane 1: Root Seed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                    STAGE 01
                  </span>
                  <span>Root Creative Seed</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {laneGroups.lane1.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isSelected={isNodeSelected(node.id)}
                      isHighlighted={isNodeHighlighted(node.id)}
                      isDimmed={isNodeDimmed(node.id)}
                      colorClass={getNodeColorClass(node.entity_type)}
                      icon={getNodeIcon(node.entity_type)}
                      onClick={() => handleNodeClick(node)}
                    />
                  ))}
                </div>
              </div>

              {/* Lane Divider Connector */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-4 bg-gradient-to-b from-cyan-500/40 to-sky-500/40" />
              </div>

              {/* Lane 2: Seed DNA */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400">
                  <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60">
                    STAGE 02
                  </span>
                  <span>Distilled Seed DNA & Constraints</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {laneGroups.lane2.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isSelected={isNodeSelected(node.id)}
                      isHighlighted={isNodeHighlighted(node.id)}
                      isDimmed={isNodeDimmed(node.id)}
                      colorClass={getNodeColorClass(node.entity_type)}
                      icon={getNodeIcon(node.entity_type)}
                      onClick={() => handleNodeClick(node)}
                    />
                  ))}
                </div>
              </div>

              {/* Lane Divider Connector */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-4 bg-gradient-to-b from-sky-500/40 to-amber-500/40" />
              </div>

              {/* Lane 3: World Candidates & Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60">
                    STAGES 03 & 04
                  </span>
                  <span>Archetype Exploration & Human Selection Gate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {laneGroups.lane3.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isSelected={isNodeSelected(node.id)}
                      isHighlighted={isNodeHighlighted(node.id)}
                      isDimmed={isNodeDimmed(node.id)}
                      colorClass={getNodeColorClass(node.entity_type)}
                      icon={getNodeIcon(node.entity_type)}
                      onClick={() => handleNodeClick(node)}
                    />
                  ))}
                </div>
              </div>

              {/* Lane Divider Connector */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500/40 to-emerald-500/40" />
              </div>

              {/* Lane 4: World Bible & Key Locations */}
              {(lineageFilter === 'all' || lineageFilter === 'lore' || lineageFilter === 'locations') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">
                      STAGE 05A
                    </span>
                    <span>World Bible Canon Laws & Landmark Locations</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {laneGroups.lane4
                      .filter((n) => {
                        if (lineageFilter === 'lore') return n.entity_type === 'world_bible';
                        if (lineageFilter === 'locations') return n.entity_type === 'key_location';
                        return true;
                      })
                      .map((node) => (
                        <NodeCard
                          key={node.id}
                          node={node}
                          isSelected={isNodeSelected(node.id)}
                          isHighlighted={isNodeHighlighted(node.id)}
                          isDimmed={isNodeDimmed(node.id)}
                          colorClass={getNodeColorClass(node.entity_type)}
                          icon={getNodeIcon(node.entity_type)}
                          onClick={() => handleNodeClick(node)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Lane Divider Connector */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-4 bg-gradient-to-b from-emerald-500/40 to-indigo-500/40" />
              </div>

              {/* Lane 5: Characters & Relationships */}
              {(lineageFilter === 'all' || lineageFilter === 'characters') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400">
                    <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">
                      STAGE 05B
                    </span>
                    <span>Cast of Inhabitants & Interpersonal Dynamics</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {laneGroups.lane5.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={isNodeSelected(node.id)}
                        isHighlighted={isNodeHighlighted(node.id)}
                        isDimmed={isNodeDimmed(node.id)}
                        colorClass={getNodeColorClass(node.entity_type)}
                        icon={getNodeIcon(node.entity_type)}
                        onClick={() => handleNodeClick(node)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Lane Divider Connector */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-500/40 to-purple-500/40" />
              </div>

              {/* Lane 6: Story Scenes */}
              {(lineageFilter === 'all' || lineageFilter === 'scenes') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60">
                      STAGE 05C
                    </span>
                    <span>Dramatic Story Beats & Scenes</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {laneGroups.lane6.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={isNodeSelected(node.id)}
                        isHighlighted={isNodeHighlighted(node.id)}
                        isDimmed={isNodeDimmed(node.id)}
                        colorClass={getNodeColorClass(node.entity_type)}
                        icon={getNodeIcon(node.entity_type)}
                        onClick={() => handleNodeClick(node)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Causal Inspector Card (4 cols, sticky) */}
        <div className="lg:col-span-4 sticky top-6">
          <div
            id="causal-inspector-card"
            className="p-6 rounded-2xl bg-canvas-card border border-canvas-border space-y-5 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <h2 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
                  Causal Provenance Inspector
                </h2>
              </div>
              {selectedNode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 capitalize">
                  Stage {selectedNode.stage}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                {/* Node Identity */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(selectedNode.entity_type)}
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      {selectedNode.entity_type.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 leading-snug">
                    {selectedNode.title || selectedNode.label}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedNode.summary}</p>
                </div>

                {/* "Why Does This Exist?" Box (TRAC-03) */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Why Does This Exist?</span>
                  </div>
                  <p className="text-xs text-emerald-200 leading-relaxed font-sans">
                    {selectedNode.causal_explanation}
                  </p>
                </div>

                {/* Ancestor Provenance Trail */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>PROVENANCE TRAIL ({ancestorNodesOrdered.length} STEPS)</span>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {ancestorNodesOrdered.map((anc, idx) => (
                      <button
                        key={anc.id}
                        onClick={() => setSelectedNodeId(anc.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                          anc.id === selectedNode.id
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                            : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                          <span className="font-medium truncate">{anc.title || anc.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          S0{anc.stage}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metadata Details */}
                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono uppercase">
                      Entity Attributes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedNode.metadata).map(([key, val]) => {
                        if (val === null || val === undefined || typeof val === 'object') return null;
                        return (
                          <span
                            key={key}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                          >
                            <span className="text-slate-500">{key}:</span> {String(val).slice(0, 30)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                  <Compass className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">Interactive Lineage Ready</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Select any character, relationship, world law, or scene card to reveal its causal
                  provenance back to the root seed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface NodeCardProps {
  node: TraceNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  colorClass: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  isHighlighted,
  isDimmed,
  colorClass,
  icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      id={`node-${node.id}`}
      data-node-id={node.id}
      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
        isSelected
          ? 'ring-2 ring-cyan-400 bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.01]'
          : isHighlighted
          ? 'ring-1 ring-emerald-400 bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
          : isDimmed
          ? 'opacity-35 hover:opacity-75 bg-slate-900/60 border-slate-800'
          : `${colorClass} hover:border-slate-500 hover:shadow-md`
      }`}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon}
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
              {node.entity_type.replace('_', ' ')}
            </span>
          </div>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900/80 text-slate-400 border border-slate-800">
            S0{node.stage}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-100 truncate">{node.title || node.label}</h4>
          {node.metadata?.version !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              v{String(node.metadata.version)}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{node.summary}</p>
      </div>

      <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>{node.parent_ids.length > 0 ? `${node.parent_ids.length} parent(s)` : 'Root Origin'}</span>
        <span className="flex items-center gap-0.5 text-cyan-400 hover:underline">
          <span>Inspect</span>
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
