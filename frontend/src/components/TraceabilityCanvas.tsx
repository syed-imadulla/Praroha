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
import { TraceNode, TraceNodeType, OriginType } from '../types';
import { OriginBadge } from './OriginBadge';

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
  const [selectedOriginFilter, setSelectedOriginFilter] = React.useState<OriginType | 'ALL'>('ALL');

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

  // Group nodes by pipeline lanes with Origin Tier filtering
  const laneGroups = useMemo(() => {
    if (!lineageGraph) return { lane1: [], lane2: [], lane3: [], lane4: [], lane5: [], lane6: [] };

    const nodes =
      selectedOriginFilter === 'ALL'
        ? lineageGraph.nodes
        : lineageGraph.nodes.filter(
            (n) => (n.origin_type || 'DERIVED') === selectedOriginFilter
          );

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
  }, [lineageGraph, selectedOriginFilter]);

  const getNodeColorClass = (type: TraceNodeType) => {
    switch (type) {
      case 'root_seed':
        return 'border-[#BACBB8] bg-[#F8F4E8] text-[#294B3A]';
      case 'seed_dna':
        return 'border-[#D8CCB7] bg-[#F8F4E8] text-[#294B3A]';
      case 'world_candidate':
        return 'border-[#E9DDBF] bg-[#F8F4E8] text-[#294B3A]';
      case 'human_selection':
        return 'border-[#BACBB8] bg-[#E2EBE2] text-[#294B3A]';
      case 'world_bible':
        return 'border-[#BACBB8] bg-[#F8F4E8] text-[#294B3A]';
      case 'key_location':
        return 'border-[#D8CCB7] bg-[#F8F4E8] text-[#294B3A]';
      case 'character':
        return 'border-[#C59A55]/40 bg-[#F8F4E8] text-[#294B3A]';
      case 'relationship':
        return 'border-[#E2BFAC] bg-[#F8F4E8] text-[#294B3A]';
      case 'scene':
        return 'border-[#DFD1DE] bg-[#F8F4E8] text-[#294B3A]';
      default:
        return 'border-[#D8CCB7] bg-[#F8F4E8] text-[#294B3A]';
    }
  };

  const getNodeIcon = (type: TraceNodeType) => {
    switch (type) {
      case 'root_seed':
        return <Sparkles className="w-3.5 h-3.5 text-[#355A46]" />;
      case 'seed_dna':
        return <GitFork className="w-3.5 h-3.5 text-[#355A46]" />;
      case 'world_candidate':
        return <Compass className="w-3.5 h-3.5 text-[#C59A55]" />;
      case 'human_selection':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#355A46]" />;
      case 'world_bible':
        return <BookOpen className="w-3.5 h-3.5 text-[#355A46]" />;
      case 'key_location':
        return <MapPin className="w-3.5 h-3.5 text-[#355A46]" />;
      case 'character':
        return <User className="w-3.5 h-3.5 text-[#805B20]" />;
      case 'relationship':
        return <Users className="w-3.5 h-3.5 text-[#A0522D]" />;
      case 'scene':
        return <Film className="w-3.5 h-3.5 text-[#6A4B67]" />;
      default:
        return <Info className="w-3.5 h-3.5 text-[#718875]" />;
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
    <div className="flex-1 flex flex-col h-full bg-[#F8F4E8] text-[#294B3A] p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8CCB7]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#E2EBE2] text-[#294B3A] border border-[#BACBB8]">
              Tattva 2: Forms Hidden in Formless • Stage 6 Traceability
            </span>
            <span className="text-xs text-[#718875] font-mono font-semibold">• Provenance DAG</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#294B3A] tracking-tight">
            Causal Lineage & Provenance DAG
          </h1>
          <p className="text-xs md:text-sm text-[#5A6E5E] max-w-3xl leading-relaxed">
            Every downstream lore rule, character tension, key location, and dramatic scene is causally
            tethered back to your initial seed. Click any node to illuminate its full provenance trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="px-3.5 py-1.5 rounded-full bg-[#F2EBDD] hover:bg-[#EAE0D0] text-xs font-medium text-[#294B3A] border border-[#D8CCB7] transition flex items-center gap-1.5"
            >
              <span>Reset Highlighting</span>
            </button>
          )}

          <button
            onClick={() => fetchLineage()}
            disabled={isLoadingLineage}
            className="px-4 py-2 rounded-full bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
            title="Refresh DAG synthesis"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingLineage ? 'animate-spin' : ''}`} />
            <span>Sync Graph</span>
          </button>

          {/* DAG Zoom Controls */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#F2EBDD] border border-[#D8CCB7] text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              className="p-1.5 rounded-full text-[#718875] hover:text-[#294B3A] hover:bg-[#EAE0D0] transition"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-[#294B3A] hover:bg-[#EAE0D0] transition"
              title="Reset Zoom to 100%"
              aria-label="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.15).toFixed(2))))}
              className="p-1.5 rounded-full text-[#718875] hover:text-[#294B3A] hover:bg-[#EAE0D0] transition"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#D8CCB7] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#5A6E5E] flex items-center gap-1 font-mono text-[11px]">
            <Filter className="w-3.5 h-3.5 text-[#355A46]" />
            Filter Focus:
          </span>
          {(['all', 'characters', 'scenes', 'locations', 'lore'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setLineageFilter(filter)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition ${
                lineageFilter === filter
                  ? 'bg-[#355A46] text-[#F8F4E8] border border-[#294B3A] shadow-xs'
                  : 'bg-[#F2EBDD] text-[#5A6E5E] hover:text-[#294B3A] border border-[#D8CCB7]'
              }`}
            >
              {filter === 'lore' ? 'Canon & Laws' : filter}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-[#718875] flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#355A46]" />
            Selected Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C59A55]" />
            Causal Ancestor Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D8CCB7]" />
            Unrelated Node
          </span>
        </div>
      </div>

      {/* Origin Tier Filter Toolbar (ORIG-02) */}
      <div
        className="flex flex-wrap items-center gap-1.5 py-2 px-3 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] text-xs"
        data-testid="dag-origin-filter-toolbar"
      >
        <span className="text-[11px] font-mono uppercase text-[#5A6E5E] mr-2 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-[#355A46]" />
          Origin Tier:
        </span>
        <button
          type="button"
          onClick={() => setSelectedOriginFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
            selectedOriginFilter === 'ALL'
              ? 'bg-[#355A46] text-[#F8F4E8] border border-[#294B3A] shadow-xs'
              : 'bg-[#F8F4E8] text-[#5A6E5E] hover:text-[#294B3A] border border-[#D8CCB7]'
          }`}
          data-testid="dag-origin-filter-all"
        >
          All
        </button>
        {(
          [
            'SEED_EXPLICIT',
            'HUMAN_DECISION',
            'SEED_INFERRED',
            'DERIVED',
            'AI_INTRODUCED',
            'USER_ADDED',
          ] as OriginType[]
        ).map((type) => {
          const isSelected = selectedOriginFilter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedOriginFilter(isSelected ? 'ALL' : type)}
              className={`transition ${
                isSelected ? 'scale-105 ring-2 ring-[#355A46]/40 rounded-full' : 'opacity-75 hover:opacity-100'
              }`}
              data-testid={`dag-origin-filter-${type.toLowerCase()}`}
            >
              <OriginBadge originType={type} interactive={false} size="xs" />
            </button>
          );
        })}
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
            <div className="p-12 text-center rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-3 shadow-xs">
              <RotateCw className="w-6 h-6 text-[#355A46] animate-spin mx-auto" />
              <p className="text-sm text-[#394840]">Synthesizing causal DAG relationships...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lane 1: Root Seed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#355A46]">
                  <span className="px-2 py-0.5 rounded-full bg-[#E2EBE2] border border-[#BACBB8] text-[#294B3A]">
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
                <div className="w-0.5 h-4 bg-[#D8CCB7]" />
              </div>

              {/* Lane 2: Seed DNA */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#805B20]">
                  <span className="px-2 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/30 text-[#805B20]">
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
                <div className="w-0.5 h-4 bg-[#D8CCB7]" />
              </div>

              {/* Lane 3: World Candidates & Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#805B20]">
                  <span className="px-2 py-0.5 rounded-full bg-[#E9DDBF] border border-[#C59A55]/30 text-[#805B20]">
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
                <div className="w-0.5 h-4 bg-[#D8CCB7]" />
              </div>

              {/* Lane 4: World Bible & Key Locations */}
              {(lineageFilter === 'all' || lineageFilter === 'lore' || lineageFilter === 'locations') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#355A46]">
                    <span className="px-2 py-0.5 rounded-full bg-[#E2EBE2] border border-[#BACBB8] text-[#294B3A]">
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
                <div className="w-0.5 h-4 bg-[#D8CCB7]" />
              </div>

              {/* Lane 5: Characters & Relationships */}
              {(lineageFilter === 'all' || lineageFilter === 'characters') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6A4B67]">
                    <span className="px-2 py-0.5 rounded-full bg-[#EFE8EE] border border-[#DFD1DE] text-[#6A4B67]">
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
                <div className="w-0.5 h-4 bg-[#D8CCB7]" />
              </div>

              {/* Lane 6: Story Scenes */}
              {(lineageFilter === 'all' || lineageFilter === 'scenes') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A0522D]">
                    <span className="px-2 py-0.5 rounded-full bg-[#F5E6DC] border border-[#E2BFAC] text-[#A0522D]">
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
            className="p-6 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] space-y-5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-[#D8CCB7] pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-[#355A46]" />
                <h2 className="font-bold font-serif text-[#294B3A] text-sm tracking-wide uppercase">
                  Causal Provenance Inspector
                </h2>
              </div>
              {selectedNode && (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#E2EBE2] text-[#294B3A] border border-[#BACBB8] capitalize">
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
                    <span className="text-xs font-mono text-[#718875] uppercase font-semibold">
                      {selectedNode.entity_type.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-serif text-[#294B3A] leading-snug">
                    {selectedNode.title || selectedNode.label}
                  </h3>
                  <p className="text-xs text-[#5A6E5E]">{selectedNode.summary}</p>
                </div>

                {/* Origin Ledger Classification (ORIG-02 / ORIG-03) */}
                <div
                  className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] flex items-center justify-between gap-2"
                  data-testid="inspector-origin-box"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-[#718875] font-semibold">
                      Origin Tier:
                    </span>
                    <OriginBadge
                      originType={selectedNode.origin_type || 'DERIVED'}
                      originSource={selectedNode.origin_source}
                      interactive={false}
                      size="sm"
                    />
                  </div>
                  {selectedNode.origin_source && (
                    <span
                      className="text-xs font-mono text-[#718875] italic truncate max-w-[150px]"
                      title={selectedNode.origin_source}
                    >
                      {selectedNode.origin_source}
                    </span>
                  )}
                </div>

                {/* "Why Does This Exist?" Box (TRAC-03) */}
                <div className="p-4 rounded-xl bg-[#E2EBE2]/70 border border-[#BACBB8] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold font-serif text-[#294B3A]">
                    <Sparkles className="w-4 h-4 text-[#C59A55]" />
                    <span>Why Does This Exist?</span>
                  </div>
                  <p className="text-xs text-[#294B3A] leading-relaxed font-sans">
                    {selectedNode.causal_explanation}
                  </p>
                </div>

                {/* Ancestor Provenance Trail */}
                <div className="space-y-2 pt-2 border-t border-[#D8CCB7]">
                  <div className="flex items-center justify-between text-xs text-[#718875] font-mono font-semibold">
                    <span>PROVENANCE TRAIL ({ancestorNodesOrdered.length} STEPS)</span>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {ancestorNodesOrdered.map((anc, idx) => (
                      <button
                        key={anc.id}
                        onClick={() => setSelectedNodeId(anc.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition min-h-[36px] ${
                          anc.id === selectedNode.id
                            ? 'bg-[#355A46] text-[#F8F4E8] border border-[#294B3A]'
                            : 'bg-[#F2EBDD] hover:bg-[#EAE0D0] text-[#294B3A] border border-[#D8CCB7]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-xs font-mono font-semibold ${anc.id === selectedNode.id ? 'text-[#DDE2D2]' : 'text-[#8C9E90]'}`}>#{idx + 1}</span>
                          <span className="font-medium truncate">{anc.title || anc.label}</span>
                        </div>
                        <span className={`text-xs font-mono shrink-0 font-semibold ${anc.id === selectedNode.id ? 'text-[#DDE2D2]' : 'text-[#718875]'}`}>
                          S0{anc.stage}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metadata Details */}
                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#D8CCB7]">
                    <span className="text-xs text-[#718875] font-mono uppercase font-semibold">
                      Entity Attributes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedNode.metadata).map(([key, val]) => {
                        if (val === null || val === undefined || typeof val === 'object') return null;
                        return (
                          <span
                            key={key}
                            className="px-2.5 py-1 rounded text-xs bg-[#F2EBDD] text-[#294B3A] border border-[#D8CCB7] font-mono"
                          >
                            <span className="text-[#718875] font-semibold">{key}:</span> {String(val).slice(0, 30)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#E2EBE2] border border-[#BACBB8] text-[#355A46] flex items-center justify-center mx-auto shadow-2xs">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold font-serif text-[#294B3A]">Interactive Lineage Ready</h4>
                <p className="text-xs text-[#5A6E5E] max-w-xs mx-auto leading-relaxed">
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

const getOriginAccentClass = (type?: OriginType) => {
  switch (type) {
    case 'SEED_EXPLICIT':
      return 'border-l-4 border-l-[#294B3A]';
    case 'SEED_INFERRED':
      return 'border-l-4 border-l-[#466A55]';
    case 'HUMAN_DECISION':
      return 'border-l-4 border-l-[#C59A55]';
    case 'DERIVED':
      return 'border-l-4 border-l-[#6A4B67]';
    case 'AI_INTRODUCED':
      return 'border-l-4 border-l-[#A0522D]';
    case 'USER_ADDED':
      return 'border-l-4 border-l-[#355A46]';
    default:
      return 'border-l-4 border-l-[#D8CCB7]';
  }
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
  const originBorder = getOriginAccentClass(node.origin_type);

  return (
    <div
      onClick={onClick}
      id={`node-${node.id}`}
      data-node-id={node.id}
      className={`p-3.5 rounded-[16px] border cursor-pointer transition-all duration-200 select-none flex flex-col justify-between shadow-xs ${originBorder} ${
        isSelected
          ? 'ring-2 ring-[#355A46] bg-[#E2EBE2] border-[#355A46] shadow-sm scale-[1.01]'
          : isHighlighted
          ? 'ring-1 ring-[#C59A55] bg-[#E9DDBF]/40 border-[#C59A55] shadow-2xs'
          : isDimmed
          ? 'opacity-35 hover:opacity-75 bg-[#F2EBDD]/60 border-[#D8CCB7]'
          : `${colorClass} hover:border-[#BACBB8] hover:shadow-2xs`
      }`}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon}
            <span className="text-xs font-mono uppercase tracking-wider text-[#718875] truncate font-semibold">
              {node.entity_type.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <OriginBadge
              originType={node.origin_type || 'DERIVED'}
              originSource={node.origin_source}
              interactive={false}
              size="xs"
              showLabel={false}
            />
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#F2EBDD] text-[#394840] border border-[#D8CCB7]">
              S0{node.stage}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[13px] font-bold font-serif text-[#294B3A] truncate">{node.title || node.label}</h4>
          {node.metadata?.version !== undefined && (
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30 shrink-0">
              v{String(node.metadata.version)}
            </span>
          )}
        </div>
        <p className="text-xs text-[#394840] line-clamp-2 leading-relaxed">{node.summary}</p>
      </div>

      <div className="pt-2 mt-2 border-t border-[#D8CCB7] flex items-center justify-between text-xs text-[#5F6D63] font-mono">
        <span>{node.parent_ids.length > 0 ? `${node.parent_ids.length} parent(s)` : 'Root Origin'}</span>
        <span className="flex items-center gap-1 text-[#355A46] hover:underline font-semibold">
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
