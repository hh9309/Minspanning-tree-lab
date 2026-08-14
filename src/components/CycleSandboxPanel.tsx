import React from "react";
import {
  Search,
  Scissors,
  Network,
  RotateCcw,
  AlertTriangle,
  GitPullRequest,
  CheckCircle2
} from "lucide-react";
import { GraphData, GraphEdge, CycleInfo, SolverResult } from "../types";

interface CycleSandboxPanelProps {
  graph: GraphData;
  solverResult: SolverResult;
  activeCycle?: CycleInfo | null;
  onBreakCycleEdge?: (edge: GraphEdge) => void;
  isHierarchyView: boolean;
  onToggleHierarchyView: () => void;
  rootId: string;
  onChangeRoot: (rootId: string) => void;
}

export const CycleSandboxPanel: React.FC<CycleSandboxPanelProps> = ({
  graph,
  solverResult,
  activeCycle,
  onBreakCycleEdge,
  isHierarchyView,
  onToggleHierarchyView,
  rootId,
  onChangeRoot,
}) => {
  const mstEdgeSet = new Set(solverResult.mstEdges.map((e) => e.id));
  const nonTreeEdges = graph.edges.filter((e) => !mstEdgeSet.has(e.id));

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-1">
      {/* 1. View Mode Switcher: Graph Canvas vs Hierarchy Tree */}
      <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHierarchyView}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
              isHierarchyView
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E4E8]"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>{isHierarchyView ? "返回网状平面视角" : "切换为树状层级拓扑 (Hierarchy)"}</span>
          </button>
        </div>

        {isHierarchyView && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">根节点 (Root):</span>
            <select
              value={rootId}
              onChange={(e) => onChangeRoot(e.target.value)}
              className="bg-white text-blue-700 font-mono font-bold rounded px-2 py-0.5 border border-[#E2E4E8] outline-none shadow-xs"
            >
              {graph.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id} ({n.label})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Interactive Fundamental Cycle & Break-Cycle Inspector */}
      <div className="bg-white border border-[#E2E4E8] rounded-xl p-3 shadow-xs flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-rose-600" />
            <span>基本回路 (Fundamental Cycle) 与破圈定理</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            非树边总数: <strong className="text-blue-600">{nonTreeEdges.length}</strong>
          </span>
        </div>

        {activeCycle ? (
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex flex-col gap-2.5 mb-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  已探查到闭合回路 (Cycle Detected)
                </span>
                <p className="text-xs text-slate-700 mt-1 font-mono">
                  回路顶点链: <strong>{activeCycle.cycleNodes.join(" → ")} → {activeCycle.cycleNodes[0]}</strong>
                </p>
              </div>

              {activeCycle.maxWeightEdge && (
                <button
                  onClick={() => onBreakCycleEdge?.(activeCycle.maxWeightEdge!)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>一键破圈 (删除最重边)</span>
                </button>
              )}
            </div>

            {activeCycle.maxWeightEdge && (
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs shadow-2xs">
                <span className="text-slate-600">圈上极大权值边 (Cycle Property 判定点): </span>
                <strong className="text-rose-700 font-mono font-bold">
                  ({activeCycle.maxWeightEdge.source} ↔ {activeCycle.maxWeightEdge.target})
                </strong>
                <span className="text-slate-600">，权重 = </span>
                <strong className="text-emerald-700 font-mono font-bold">{activeCycle.maxWeightEdge.weight}</strong>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  📖 <strong>圈性质定理证明</strong>：在一个回路中，若某边权值严格大于其他所有边，则此边必定不属于该图的任何最小生成树。将其删除可打破冗余回路并保持连通！
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-lg p-3 text-xs text-slate-600 leading-relaxed mb-3">
            💡 <strong>使用方法</strong>：请在下方非树边列表中点击任意一条边，或在画布上切换为「圈探测」工具点击非树边。系统将自动找出其与 MST 构成的唯一基本回路，并验证圈性质。
          </div>
        )}

        {/* Non-Tree Edges candidate list */}
        <h5 className="text-xs font-bold text-slate-700 mb-1.5">
          备选非树边列表（点击即可注入回路并观测破圈）：
        </h5>

        <div className="overflow-y-auto flex-1 max-h-[160px] border border-[#E2E4E8] rounded-lg">
          <div className="divide-y divide-[#E2E4E8] font-mono text-xs">
            {nonTreeEdges.map((edge) => (
              <button
                key={edge.id}
                onClick={() => {
                  const event = new CustomEvent("inspect-cycle-edge", { detail: edge });
                  window.dispatchEvent(event);
                }}
                className="w-full text-left p-2 hover:bg-slate-50 transition flex items-center justify-between text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-slate-900 font-bold">
                    {edge.source} ↔ {edge.target}
                  </span>
                  <span className="text-slate-500 text-[11px]">({edge.label || "备用链路"})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold">权值 {edge.weight}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-[#E2E4E8]">
                    测回路 ➜
                  </span>
                </div>
              </button>
            ))}
            {nonTreeEdges.length === 0 && (
              <div className="p-3 text-center text-slate-400 italic text-xs">
                当前图本身已是极小树状结构，无多余非树边
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
