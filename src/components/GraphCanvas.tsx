import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
  PlusCircle,
  Share2,
  Trash2,
  Search,
  Layers,
  Sparkles,
  Focus,
  Grid,
  X,
  Check
} from "lucide-react";
import { GraphData, GraphNode, GraphEdge, StepLog, CycleInfo } from "../types";

interface GraphCanvasProps {
  graph: GraphData;
  onUpdateGraph: (newGraph: GraphData) => void;
  currentStep?: StepLog;
  activeCycle?: CycleInfo | null;
  onSelectCycleEdge?: (edge: GraphEdge) => void;
  isHierarchyView?: boolean;
  hierarchyNodes?: { id: string; x: number; y: number; depth: number }[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  onUpdateGraph,
  currentStep,
  activeCycle,
  onSelectCycleEdge,
  isHierarchyView = false,
  hierarchyNodes,
  selectedNodeId,
  onSelectNode,
  svgRef,
}) => {
  const [tool, setTool] = useState<"pointer" | "add-node" | "add-edge" | "delete" | "cycle-inspect">("pointer");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  
  // Pending edge modal state for manual weight configuration
  const [pendingEdgeInfo, setPendingEdgeInfo] = useState<{
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
    initialWeight: number;
    weightInput: string;
    labelInput: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const localSvgRef = useRef<SVGSVGElement>(null);
  const effectiveSvgRef = svgRef || localSvgRef;

  // Node position map (uses hierarchy layout if active)
  const nodePosMap = new Map<string, { x: number; y: number; label: string; type?: string; depth?: number }>();
  if (isHierarchyView && hierarchyNodes && hierarchyNodes.length > 0) {
    hierarchyNodes.forEach((hn) => {
      const original = graph.nodes.find((n) => n.id === hn.id);
      nodePosMap.set(hn.id, {
        x: hn.x,
        y: hn.y,
        label: original?.label || hn.id,
        type: original?.type,
        depth: hn.depth,
      });
    });
  } else {
    graph.nodes.forEach((n) => {
      nodePosMap.set(n.id, { x: n.x, y: n.y, label: n.label, type: n.type });
    });
  }

  // DSU color map for current step
  const nodeDsuColorMap: Record<string, string> = {};
  if (currentStep?.dsuState?.sets) {
    currentStep.dsuState.sets.forEach((set) => {
      set.members.forEach((m) => {
        nodeDsuColorMap[m] = set.color;
      });
    });
  }

  // Get SVG coordinates from mouse event
  const getSvgCoordinates = useCallback(
    (e: React.MouseEvent) => {
      if (!effectiveSvgRef.current) return { x: 0, y: 0 };
      const rect = effectiveSvgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      return {
        x: (clientX - pan.x) / zoom,
        y: (clientY - pan.y) / zoom,
      };
    },
    [pan, zoom, effectiveSvgRef]
  );

  // Mouse Down handler
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If middle click or space-drag, start panning
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getSvgCoordinates(e);

    if (tool === "add-node") {
      // Create new node
      const newId = `N${graph.nodes.length + 1}`;
      const newNode: GraphNode = {
        id: newId,
        label: `节点 ${newId}`,
        x: Math.round(Math.max(40, Math.min(860, x))),
        y: Math.round(Math.max(40, Math.min(560, y))),
        type: "default",
      };
      onUpdateGraph({
        ...graph,
        nodes: [...graph.nodes, newNode],
      });
      return;
    }

    if (tool === "pointer" && e.target === effectiveSvgRef.current) {
      onSelectNode?.(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Mouse Move handler
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getSvgCoordinates(e);
    setMousePos(coords);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingNodeId && !isHierarchyView) {
      const updatedNodes = graph.nodes.map((n) => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.round(coords.x - dragOffset.x),
            y: Math.round(coords.y - dragOffset.y),
          };
        }
        return n;
      });
      onUpdateGraph({ ...graph, nodes: updatedNodes });
    }
  };

  // Mouse Up handler
  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Click / Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();

    if (tool === "delete") {
      // Delete node and associated edges
      onUpdateGraph({
        ...graph,
        nodes: graph.nodes.filter((n) => n.id !== node.id),
        edges: graph.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id),
      });
      return;
    }

    if (tool === "add-edge") {
      if (!edgeStartNodeId) {
        setEdgeStartNodeId(node.id);
      } else if (edgeStartNodeId !== node.id) {
        // Connect edge: check if already exists
        const existing = graph.edges.find(
          (edge) =>
            (edge.source === edgeStartNodeId && edge.target === node.id) ||
            (edge.source === node.id && edge.target === edgeStartNodeId)
        );

        const uNode = graph.nodes.find((n) => n.id === edgeStartNodeId);
        const vNode = node;
        const dist = uNode ? Math.hypot(uNode.x - vNode.x, uNode.y - vNode.y) : 100;
        const defaultWeight = existing ? existing.weight : Math.max(1, Math.round(dist / 15));

        // Open weight & attribute modal
        setPendingEdgeInfo({
          sourceId: edgeStartNodeId,
          targetId: node.id,
          sourceName: uNode?.label || edgeStartNodeId,
          targetName: vNode?.label || node.id,
          initialWeight: defaultWeight,
          weightInput: String(defaultWeight),
          labelInput: existing?.label || `链路 ${edgeStartNodeId}-${node.id}`,
        });

        setEdgeStartNodeId(null);
      }
      return;
    }

    if (tool === "pointer") {
      onSelectNode?.(node.id);
      if (!isHierarchyView) {
        const coords = getSvgCoordinates(e);
        setDraggingNodeId(node.id);
        setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
      }
    }
  };

  // Edge Click
  const handleEdgeClick = (e: React.MouseEvent, edge: GraphEdge) => {
    e.stopPropagation();
    if (tool === "delete") {
      onUpdateGraph({
        ...graph,
        edges: graph.edges.filter((eItem) => eItem.id !== edge.id),
      });
      return;
    }

    if (tool === "cycle-inspect" || tool === "pointer") {
      onSelectCycleEdge?.(edge);
    }
  };

  // Auto Layouts
  const applyCircleLayout = () => {
    const count = graph.nodes.length;
    if (count === 0) return;
    const centerX = 400;
    const centerY = 260;
    const radius = Math.min(220, count * 28);
    const updated = graph.nodes.map((n, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      return {
        ...n,
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle)),
      };
    });
    onUpdateGraph({ ...graph, nodes: updated });
  };

  const applyGridLayout = () => {
    const count = graph.nodes.length;
    if (count === 0) return;
    const cols = Math.ceil(Math.sqrt(count));
    const startX = 140;
    const startY = 100;
    const gapX = 160;
    const gapY = 120;
    const updated = graph.nodes.map((n, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      return {
        ...n,
        x: startX + c * gapX,
        y: startY + r * gapY,
      };
    });
    onUpdateGraph({ ...graph, nodes: updated });
  };

  // Auto-center and fit graph
  const handleCenterGraph = useCallback(() => {
    const activeNodes =
      isHierarchyView && hierarchyNodes && hierarchyNodes.length > 0
        ? hierarchyNodes
        : graph.nodes;

    if (activeNodes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const xs = activeNodes.map((n) => n.x);
    const ys = activeNodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 560;

    const graphWidth = Math.max(maxX - minX + 160, 200);
    const graphHeight = Math.max(maxY - minY + 160, 200);

    // Calculate fit zoom scale
    const targetZoom = Math.min(
      1.25,
      Math.max(
        0.45,
        Math.min((containerWidth - 60) / graphWidth, (containerHeight - 60) / graphHeight)
      )
    );

    const targetPanX = containerWidth / 2 - graphCenterX * targetZoom;
    const targetPanY = containerHeight / 2 - graphCenterY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [graph.nodes, hierarchyNodes, isHierarchyView]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white rounded-xl overflow-hidden border border-[#E2E4E8] shadow-xs flex flex-col select-none"
    >
      {/* Top Floating Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-[#E2E4E8] shadow-sm flex-wrap">
        <button
          onClick={() => {
            setTool("pointer");
            setEdgeStartNodeId(null);
          }}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
            tool === "pointer"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          title="选择与拖拽节点"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>选择/拖拽</span>
        </button>

        <button
          onClick={() => {
            setTool("add-node");
            setEdgeStartNodeId(null);
          }}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
            tool === "add-node"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          title="在画布上点击添加新节点"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>加点</span>
        </button>

        <button
          onClick={() => {
            setTool("add-edge");
            setEdgeStartNodeId(null);
          }}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
            tool === "add-edge"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          title="依次点击两点建立连线"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>加边/连线</span>
        </button>

        <button
          onClick={() => {
            setTool("cycle-inspect");
            setEdgeStartNodeId(null);
          }}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
            tool === "cycle-inspect"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          title="点击非树边探测基本回路并破圈"
        >
          <Search className="w-3.5 h-3.5" />
          <span>圈探测</span>
        </button>

        <button
          onClick={() => {
            setTool("delete");
            setEdgeStartNodeId(null);
          }}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
            tool === "delete"
              ? "bg-red-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
          title="点击删除点或边"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>删除</span>
        </button>

        <div className="w-[1px] h-4 bg-[#E2E4E8] mx-0.5" />

        {/* 图形居中 Button */}
        <button
          id="btn-center-graph"
          onClick={handleCenterGraph}
          className="px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-2xs"
          title="自动居中对齐当前拓扑图形并适配视口 (Center Graph)"
        >
          <Focus className="w-3.5 h-3.5 text-blue-600" />
          <span>图形居中</span>
        </button>

        {/* Layout quick arranges */}
        <button
          onClick={applyCircleLayout}
          disabled={isHierarchyView}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40"
          title="环形对齐排布"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Center Floating Metric Badges */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2">
        <span className="px-3 py-1 bg-white/90 border border-[#E2E4E8] rounded-md text-xs font-mono font-medium shadow-xs text-slate-700">
          Nodes: {graph.nodes.length}
        </span>
        <span className="px-3 py-1 bg-white/90 border border-[#E2E4E8] rounded-md text-xs font-mono font-medium shadow-xs text-slate-700">
          Edges: {graph.edges.length}
        </span>
      </div>

      {/* Top Right Zoom and Pan Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-[#E2E4E8] shadow-sm">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          title="放大画布"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          title="缩小画布"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCenterGraph}
          className="p-1.5 rounded-md text-blue-700 hover:bg-blue-50 transition flex items-center gap-1"
          title="图形居中并适配视口 (Center Graph)"
        >
          <Focus className="w-3.5 h-3.5 text-blue-600" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          title="重置缩放与视角 (100%)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono font-semibold text-slate-600 px-1">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Helper Toast in Canvas if action pending */}
      {tool === "add-edge" && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-amber-50 text-amber-800 border border-amber-300 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md animate-pulse">
          {edgeStartNodeId
            ? `已选择起点 [${edgeStartNodeId}]，请点击另一个节点完成连线`
            : "请点击第一个节点作为连线起点"}
        </div>
      )}

      {tool === "cycle-inspect" && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-rose-50 text-rose-800 border border-rose-300 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md">
          点击任意非树边，实时探查形成的基本回路 (Fundamental Cycle)
        </div>
      )}

      {/* Main SVG Render Area */}
      <svg
        ref={effectiveSvgRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        <defs>
          {/* Subtle Grid Background Pattern */}
          <pattern id="canvas-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="#F1F3F5"
              strokeWidth="1"
            />
            <circle cx="0" cy="0" r="1.2" fill="#E2E4E8" />
          </pattern>

          {/* Shadow Filter */}
          <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />

        {/* Transform Group with Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Draw Prim Cut Set Halos (if cutS defined) */}
          {currentStep?.cutS && currentStep.cutS.length > 0 && (
            <g className="cut-set-halos">
              {currentStep.cutS.map((id) => {
                const pos = nodePosMap.get(id);
                if (!pos) return null;
                return (
                  <circle
                    key={`cut-halo-${id}`}
                    cx={pos.x}
                    cy={pos.y}
                    r="34"
                    fill="rgba(16, 185, 129, 0.12)"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                );
              })}
            </g>
          )}

          {/* 2. Draw Edges */}
          <g className="edges-layer">
            {graph.edges.map((edge) => {
              const u = nodePosMap.get(edge.source);
              const v = nodePosMap.get(edge.target);
              if (!u || !v) return null;

              const isHighlightedMST = currentStep?.highlightEdges?.includes(edge.id);
              const isInspecting = currentStep?.edgeId === edge.id && currentStep.action === "inspect";
              const isRejected = currentStep?.rejectedEdges?.includes(edge.id);
              const isCycleEdge = activeCycle?.cycleEdges?.includes(edge.id);
              const isMaxCycleEdge = activeCycle?.maxWeightEdge?.id === edge.id;
              const isCandidate = currentStep?.candidateEdges?.some((c) => c.edgeId === edge.id);

              // Midpoint for weight badge
              const midX = (u.x + v.x) / 2;
              const midY = (u.y + v.y) / 2;

              // Line visual styling
              let strokeColor = "#CBD5E1"; // Clean workbench gray for base
              let strokeWidth = 2;
              let strokeDasharray = "none";

              if (isMaxCycleEdge) {
                strokeColor = "#EF4444"; // Red for break cycle candidate
                strokeWidth = 4;
                strokeDasharray = "6 4";
              } else if (isCycleEdge) {
                strokeColor = "#F43F5E"; // Rose for fundamental cycle
                strokeWidth = 3.5;
                strokeDasharray = "5 3";
              } else if (isInspecting) {
                strokeColor = "#F59E0B"; // Amber for currently inspecting
                strokeWidth = 3.5;
              } else if (isHighlightedMST) {
                strokeColor = "#3B82F6"; // High density primary blue for MST
                strokeWidth = 3.5;
              } else if (isCandidate) {
                strokeColor = "#0284C7"; // Sky for Prim candidate cut edge
                strokeWidth = 2.8;
                strokeDasharray = "4 3";
              } else if (isRejected) {
                strokeColor = "#FCA5A5"; // Soft red
                strokeWidth = 1.8;
                strokeDasharray = "4 4";
              }

              return (
                <g
                  key={edge.id}
                  className="edge-group cursor-pointer transition-all duration-200"
                  onClick={(e) => handleEdgeClick(e, edge)}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                >
                  {/* Invisible thicker stroke for easy clicking */}
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke="transparent"
                    strokeWidth="18"
                  />

                  {/* Main visible line */}
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                  />

                  {/* Weight Label Pill */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-17"
                      y="-10"
                      width="34"
                      height="20"
                      rx="5"
                      fill={
                        isMaxCycleEdge
                          ? "#FEF2F2"
                          : isHighlightedMST
                          ? "#EFF6FF"
                          : isInspecting
                          ? "#FFFBEB"
                          : "#FFFFFF"
                      }
                      stroke={
                        isMaxCycleEdge
                          ? "#EF4444"
                          : isHighlightedMST
                          ? "#3B82F6"
                          : isInspecting
                          ? "#F59E0B"
                          : "#E2E4E8"
                      }
                      strokeWidth="1.2"
                      className="shadow-xs"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={
                        isMaxCycleEdge
                          ? "#B91C1C"
                          : isHighlightedMST
                          ? "#1D4ED8"
                          : isInspecting
                          ? "#B45309"
                          : "#1E293B"
                      }
                    >
                      {edge.weight}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 3. Drawing Edge in-progress line */}
          {tool === "add-edge" && edgeStartNodeId && (
            <line
              x1={nodePosMap.get(edgeStartNodeId)?.x || 0}
              y1={nodePosMap.get(edgeStartNodeId)?.y || 0}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          )}

          {/* 4. Draw Nodes */}
          <g className="nodes-layer">
            {graph.nodes.map((node) => {
              const pos = nodePosMap.get(node.id);
              if (!pos) return null;

              const isHighlighted = currentStep?.highlightNodes?.includes(node.id);
              const isSelected = selectedNodeId === node.id;
              const isStartNode = edgeStartNodeId === node.id;
              const isInCutS = currentStep?.cutS?.includes(node.id);
              const dsuColor = nodeDsuColorMap[node.id] || "#3B82F6";

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  className="cursor-pointer group"
                >
                  {/* Outer Ring for Selection / DSU color */}
                  <circle
                    r="22"
                    fill="none"
                    stroke={
                      isSelected
                        ? "#F59E0B"
                        : isStartNode
                        ? "#0284C7"
                        : currentStep?.dsuState
                        ? dsuColor
                        : isInCutS
                        ? "#10B981"
                        : "transparent"
                    }
                    strokeWidth={isSelected || isStartNode ? "3" : "2"}
                    strokeDasharray={isSelected ? "4 2" : "none"}
                    className="transition-all"
                  />

                  {/* Main Node Body */}
                  <circle
                    r="17"
                    fill={
                      isInCutS
                        ? "#10B981"
                        : isHighlighted
                        ? "#2563EB"
                        : "#3B82F6"
                    }
                    filter="url(#node-shadow)"
                    className="transition-colors"
                  />

                  {/* Node ID / Label */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#FFFFFF"
                    className="pointer-events-none"
                  >
                    {node.id}
                  </text>

                  {/* Node Sub-label (City / Equipment name) */}
                  <text
                    textAnchor="middle"
                    dy="28"
                    fontSize="11"
                    fontWeight="600"
                    fill="#334155"
                    className="pointer-events-none drop-shadow-xs"
                  >
                    {pos.label}
                  </text>

                  {/* Cut Set indicator badge */}
                  {currentStep?.cutS && (
                    <g transform="translate(13, -13)">
                      <circle
                        r="6.5"
                        fill={isInCutS ? "#047857" : "#64748B"}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        textAnchor="middle"
                        dy="2.5"
                        fontSize="7.5"
                        fontWeight="bold"
                        fill="#FFFFFF"
                      >
                        {isInCutS ? "S" : "V\\S"}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Bottom Information Legend */}
      <div className="bg-white border-t border-[#E2E4E8] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded-full" />
            <span className="text-slate-700 font-medium">已选入生成树 (MST Edge)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-slate-300 rounded-full" />
            <span className="text-slate-600">普通可行边</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded-full" />
            <span className="text-slate-700 font-medium">考察/跨割边</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 border-t-2 border-dashed border-red-500" />
            <span className="text-slate-600">避环/破圈边</span>
          </div>
          {currentStep?.cutS && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 font-medium">已生长割集 S</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          💡 提示：按住 <kbd className="px-1 py-0.5 bg-[#F1F3F5] rounded text-slate-700 border border-[#E2E4E8] font-mono">Alt</kbd> 键或鼠标中键拖拽可平移画布
        </div>
      </div>

      {/* Set Edge Weight & Attributes Modal */}
      {pendingEdgeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E2E4E8] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    设置新连线属性 (Add Link & Weight)
                  </h3>
                  <p className="text-xs text-slate-500">
                    连接节点 <span className="font-mono font-bold text-blue-700">{pendingEdgeInfo.sourceId} ({pendingEdgeInfo.sourceName})</span> 与 <span className="font-mono font-bold text-blue-700">{pendingEdgeInfo.targetId} ({pendingEdgeInfo.targetName})</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPendingEdgeInfo(null);
                  setTool("pointer");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const weightNum = parseFloat(pendingEdgeInfo.weightInput);
                const finalWeight = isNaN(weightNum) || weightNum <= 0 ? 1 : weightNum;
                
                const existingIndex = graph.edges.findIndex(
                  (edge) =>
                    (edge.source === pendingEdgeInfo.sourceId && edge.target === pendingEdgeInfo.targetId) ||
                    (edge.source === pendingEdgeInfo.targetId && edge.target === pendingEdgeInfo.sourceId)
                );

                let updatedEdges = [...graph.edges];
                if (existingIndex >= 0) {
                  // Update existing edge
                  updatedEdges[existingIndex] = {
                    ...updatedEdges[existingIndex],
                    weight: finalWeight,
                    label: pendingEdgeInfo.labelInput || `链路 ${pendingEdgeInfo.sourceId}-${pendingEdgeInfo.targetId}`,
                  };
                } else {
                  // Insert new edge
                  const newEdge: GraphEdge = {
                    id: `e_${Date.now()}`,
                    source: pendingEdgeInfo.sourceId,
                    target: pendingEdgeInfo.targetId,
                    weight: finalWeight,
                    label: pendingEdgeInfo.labelInput || `链路 ${pendingEdgeInfo.sourceId}-${pendingEdgeInfo.targetId}`,
                  };
                  updatedEdges.push(newEdge);
                }

                onUpdateGraph({
                  ...graph,
                  edges: updatedEdges,
                });

                setPendingEdgeInfo(null);
                // Switch back to pointer so user doesn't keep continuously adding edges by accident
                setTool("pointer");
              }}
              className="p-5 flex flex-col gap-4"
            >
              {/* Weight Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>
                    边权值 / 建设成本 (Weight) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    当前计量单位: <strong className="text-blue-700">{graph.unit}</strong>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    autoFocus
                    required
                    value={pendingEdgeInfo.weightInput}
                    onChange={(e) =>
                      setPendingEdgeInfo({
                        ...pendingEdgeInfo,
                        weightInput: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg text-sm text-slate-900 font-mono font-semibold focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition"
                    placeholder="请输入正数权值，如 12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                    {graph.unit}
                  </span>
                </div>
              </div>

              {/* Edge Label Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  链路描述 / 标签 (Label)
                </label>
                <input
                  type="text"
                  value={pendingEdgeInfo.labelInput}
                  onChange={(e) =>
                    setPendingEdgeInfo({
                      ...pendingEdgeInfo,
                      labelInput: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition"
                  placeholder="例如：主干光纤链路 / 输电线路"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E4E8]">
                <button
                  type="button"
                  onClick={() => {
                    setPendingEdgeInfo(null);
                    setTool("pointer");
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>确定并完成连线</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
