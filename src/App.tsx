import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { GraphCanvas } from "./components/GraphCanvas";
import { SolverControls } from "./components/SolverControls";
import { KruskalPanel } from "./components/KruskalPanel";
import { PrimPanel } from "./components/PrimPanel";
import { CycleSandboxPanel } from "./components/CycleSandboxPanel";
import { DataEditorModal } from "./components/DataEditorModal";
import { CaseStudyModal } from "./components/CaseStudyModal";
import { TheoryModal } from "./components/TheoryModal";
import { CodeEngineModal } from "./components/CodeEngineModal";
import { AIDiagnosisModal } from "./components/AIDiagnosisModal";
import { ReportModal } from "./components/ReportModal";
import { BottomStatusBar } from "./components/BottomStatusBar";

import { CASE_STUDIES } from "./utils/caseStudies";
import {
  runAlgorithm,
  findFundamentalCycle,
  computeHierarchyLayout
} from "./utils/graphAlgorithms";
import {
  GraphData,
  AlgorithmType,
  CaseStudy,
  GraphEdge,
  CycleInfo
} from "./types";
import {
  Layers,
  Sparkles,
  GitBranch,
  Split,
  ChevronRight,
  TrendingDown,
  Info,
  Maximize2
} from "lucide-react";

export function App() {
  // 1. Core Graph and Case Study state
  const [currentCase, setCurrentCase] = useState<CaseStudy>(CASE_STUDIES[0]);
  const [graph, setGraph] = useState<GraphData>(CASE_STUDIES[0].graph);

  // 2. Algorithm & Options state
  const [algorithm, setAlgorithm] = useState<AlgorithmType>("kruskal");
  const [startNodeId, setStartNodeId] = useState<string>(
    CASE_STUDIES[0].graph.nodes[0]?.id || "v1"
  );
  const [clusterK, setClusterK] = useState<number>(2);

  // 3. Modals visibility state
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isTheoryModalOpen, setIsTheoryModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 4. Stepper & Playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // 5. Interactive Cycle & Topology sandbox state
  const [activeCycle, setActiveCycle] = useState<CycleInfo | null>(null);
  const [isHierarchyView, setIsHierarchyView] = useState(false);
  const [hierarchyRootId, setHierarchyRootId] = useState<string>(
    graph.nodes[0]?.id || "v1"
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // SVG ref for export
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 6. Compute Solver Result
  const solverResult = useMemo(() => {
    return runAlgorithm(graph, algorithm, { startNodeId, clusterK });
  }, [graph, algorithm, startNodeId, clusterK]);

  // Keep step index within bounds
  useEffect(() => {
    if (currentStepIndex >= solverResult.steps.length) {
      setCurrentStepIndex(Math.max(0, solverResult.steps.length - 1));
    }
  }, [solverResult.steps.length]);

  // Reset step index when algorithm or graph changes
  const handleSelectAlgorithm = (alg: AlgorithmType) => {
    setAlgorithm(alg);
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setActiveCycle(null);
  };

  const handleUpdateGraph = (newGraph: GraphData) => {
    setGraph(newGraph);
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setActiveCycle(null);
    if (!newGraph.nodes.some((n) => n.id === startNodeId)) {
      setStartNodeId(newGraph.nodes[0]?.id || "v1");
    }
    if (!newGraph.nodes.some((n) => n.id === hierarchyRootId)) {
      setHierarchyRootId(newGraph.nodes[0]?.id || "v1");
    }
  };

  const handleSelectCase = (cs: CaseStudy) => {
    setCurrentCase(cs);
    handleUpdateGraph(cs.graph);
  };

  // 7. Auto Playback Timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      const intervalMs = Math.max(250, Math.round(1000 / playbackSpeed));
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= solverResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, solverResult.steps.length]);

  // 8. Hierarchy Tree Layout
  const hierarchyNodes = useMemo(() => {
    if (!isHierarchyView) return [];
    return computeHierarchyLayout(graph, solverResult.mstEdges, hierarchyRootId);
  }, [isHierarchyView, graph, solverResult.mstEdges, hierarchyRootId]);

  // 9. Interactive Cycle Detection on Edge Click
  const handleSelectCycleEdge = useCallback(
    (edge: GraphEdge) => {
      const isMstEdge = solverResult.mstEdges.some((e) => e.id === edge.id);
      if (isMstEdge) {
        setActiveCycle(null);
        return;
      }
      const cycle = findFundamentalCycle(graph, solverResult.mstEdges, edge);
      setActiveCycle(cycle);
    },
    [graph, solverResult.mstEdges]
  );

  // 10. Break Cycle (Remove Max Weight Edge)
  const handleBreakCycleEdge = (edgeToBreak: GraphEdge) => {
    const updatedEdges = graph.edges.filter((e) => e.id !== edgeToBreak.id);
    handleUpdateGraph({
      ...graph,
      edges: updatedEdges,
    });
    setActiveCycle(null);
  };

  // Listen to custom inspect-cycle event from side panel
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        handleSelectCycleEdge(e.detail);
      }
    };
    window.addEventListener("inspect-cycle-edge", handler);
    return () => window.removeEventListener("inspect-cycle-edge", handler);
  }, [handleSelectCycleEdge]);

  const currentStep = solverResult.steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        graph={graph}
        result={solverResult}
        onOpenDataEditor={() => setIsDataModalOpen(true)}
        onOpenCaseStudy={() => setIsCaseModalOpen(true)}
        onOpenTheory={() => setIsTheoryModalOpen(true)}
        onOpenCodeEngine={() => setIsCodeModalOpen(true)}
        onOpenAIDiagnose={() => setIsAIModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onResetGraph={() => handleUpdateGraph(currentCase.graph)}
      />

      {/* Main Studio Body */}
      <main className="flex-1 p-3 md:p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-3">
        {/* Engineering Case Context Banner */}
        <div className="bg-white border border-[#E2E4E8] rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-500">当前案例:</span>
            <span className="font-bold text-slate-900 text-sm tracking-tight">{graph.name}</span>
            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200 font-mono text-[11px] font-medium">
              {graph.nodes.length} 节点 / {graph.edges.length} 可行边
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200 font-mono text-[11px] font-medium">
              度量单位: {graph.unit}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-slate-600 text-xs">
            <div className="flex items-center gap-1.5 bg-[#F1F3F5] px-2.5 py-1 rounded-md border border-[#E2E4E8]">
              <span className="text-slate-500">已选边:</span>
              <strong className="text-blue-600 font-bold">{solverResult.mstEdges.length}</strong>
              <span className="text-slate-400">/</span>
              <span>{graph.nodes.length - 1}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-800">
              <span className="text-emerald-700">最优总权值:</span>
              <strong className="font-bold text-emerald-700 text-sm">
                {solverResult.totalWeight}
              </strong>
              <span className="text-[10px] text-emerald-600 font-normal">{graph.unit}</span>
            </div>
          </div>
        </div>

        {/* Solver Stepper Controls */}
        <SolverControls
          algorithm={algorithm}
          onSelectAlgorithm={handleSelectAlgorithm}
          currentStepIndex={currentStepIndex}
          totalSteps={solverResult.steps.length}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStepForward={() =>
            setCurrentStepIndex((prev) => Math.min(solverResult.steps.length - 1, prev + 1))
          }
          onStepBackward={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          onGoToFirst={() => setCurrentStepIndex(0)}
          onGoToLast={() => setCurrentStepIndex(solverResult.steps.length - 1)}
          onSeek={(idx) => setCurrentStepIndex(idx)}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
          startNodeId={startNodeId}
          onChangeStartNode={(id) => setStartNodeId(id)}
          graph={graph}
          clusterK={clusterK}
          onChangeClusterK={(k) => setClusterK(k)}
          currentStep={currentStep}
        />

        {/* Dual-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[560px]">
          {/* Left / Center Column: SVG Graph Canvas (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col h-[560px] lg:h-full">
            <GraphCanvas
              graph={graph}
              onUpdateGraph={handleUpdateGraph}
              currentStep={currentStep}
              activeCycle={activeCycle}
              onSelectCycleEdge={handleSelectCycleEdge}
              isHierarchyView={isHierarchyView}
              hierarchyNodes={hierarchyNodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              svgRef={svgRef}
            />
          </div>

          {/* Right Column: Algorithmic Derivation Panels (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E2E4E8] rounded-xl p-3 shadow-xs flex flex-col h-[560px] lg:h-full overflow-hidden">
            {algorithm === "kruskal" && (
              <KruskalPanel graph={graph} currentStep={currentStep} />
            )}

            {algorithm === "prim" && (
              <PrimPanel
                graph={graph}
                currentStep={currentStep}
                startNodeId={startNodeId}
              />
            )}

            {(algorithm === "reverse-delete" ||
              algorithm === "second-best" ||
              algorithm === "clustering") && (
              <CycleSandboxPanel
                graph={graph}
                solverResult={solverResult}
                activeCycle={activeCycle}
                onBreakCycleEdge={handleBreakCycleEdge}
                isHierarchyView={isHierarchyView}
                onToggleHierarchyView={() => setIsHierarchyView(!isHierarchyView)}
                rootId={hierarchyRootId}
                onChangeRoot={setHierarchyRootId}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Global Status Bar (Left-to-Right Full Module) */}
      <BottomStatusBar graph={graph} solverResult={solverResult} />

      {/* Modals Container */}
      <DataEditorModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        graph={graph}
        onUpdateGraph={handleUpdateGraph}
      />

      <CaseStudyModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        currentCaseId={currentCase.id}
        onSelectCase={handleSelectCase}
      />

      <TheoryModal
        isOpen={isTheoryModalOpen}
        onClose={() => setIsTheoryModalOpen(false)}
      />

      <CodeEngineModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        graph={graph}
      />

      <AIDiagnosisModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        graph={graph}
        solverResult={solverResult}
        onApplyAIGraph={handleUpdateGraph}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        graph={graph}
        solverResult={solverResult}
        svgRef={svgRef}
      />
    </div>
  );
}

export default App;
