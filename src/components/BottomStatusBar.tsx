import React from "react";
import { GraphData, SolverResult } from "../types";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  TrendingDown,
  Cpu,
  Layers,
  Zap
} from "lucide-react";

interface BottomStatusBarProps {
  graph: GraphData;
  solverResult: SolverResult;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  graph,
  solverResult,
}) => {
  // Check isolated nodes
  const connectedNodeIds = new Set<string>();
  graph.edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });
  const isolatedCount = graph.nodes.filter((n) => !connectedNodeIds.has(n.id)).length;
  const isNodeStatusNormal = isolatedCount === 0 && graph.nodes.length > 0;

  // Topology density
  const v = graph.nodes.length;
  const e = graph.edges.length;
  const density = v > 1 ? ((2 * e) / (v * (v - 1))).toFixed(2) : "0.00";

  // Check connectivity
  const isFullyConnected = solverResult.isOptimal && solverResult.mstEdges.length === Math.max(0, v - 1);

  return (
    <footer className="w-full bg-white border-t border-[#E2E4E8] px-3 sm:px-4 py-2 shadow-xs z-20 shrink-0 select-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between flex-wrap gap-y-1.5 text-xs text-slate-700 font-mono">
        {/* Left-to-Right Status & Metric Flow */}
        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
          {/* 1. 节点状态 */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 font-sans">节点状态:</span>
            {isNodeStatusNormal ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>正常</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>存在 {isolatedCount} 个孤立节点</span>
              </span>
            )}
          </div>

          <span className="text-slate-300 font-normal">|</span>

          {/* 2. 拓扑连通 */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 font-sans">拓扑连通:</span>
            <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              G=(V,E)
            </span>
            <span className={`text-[11px] font-semibold ${isFullyConnected ? "text-emerald-700" : "text-amber-700"}`}>
              ({isFullyConnected ? "全连通图" : "非连通森林"})
            </span>
          </div>

          <span className="text-slate-300 font-normal">|</span>

          {/* 3. 规模基数 |V| */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-500 font-sans">|V| =</span>
            <strong className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              {graph.nodes.length}
            </strong>
          </div>

          <span className="text-slate-300 font-normal">|</span>

          {/* 4. 可行边数 |E| */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-500 font-sans">|E| =</span>
            <strong className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {graph.edges.length}
            </strong>
          </div>

          <span className="text-slate-300 font-normal">|</span>

          {/* 5. 最小生成树边数 |V|-1 */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-500 font-sans">树边 |V|-1 =</span>
            <strong className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              {solverResult.mstEdges.length}
            </strong>
            <span className="text-[11px] text-slate-400 font-sans">条</span>
          </div>

          <span className="text-slate-300 font-normal">|</span>

          {/* 6. 最优目标函数 min ∑w */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 font-sans">min ∑w =</span>
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              <span className="text-sm font-bold text-emerald-700">{solverResult.totalWeight}</span>
              <span className="text-[11px] text-emerald-600 font-normal font-sans">{graph.unit}</span>
            </span>
          </div>

          <span className="text-slate-300 font-normal">|</span>

          {/* 7. 算法与求解耗时 */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-500 font-sans">算法:</span>
            <span className="text-blue-800 uppercase font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
              {solverResult.algorithm}
            </span>
            <span className="text-slate-400 text-[11px]">({solverResult.executionTimeMs}ms)</span>
          </div>

          <span className="text-slate-300 font-normal hidden lg:inline">|</span>

          {/* 8. 最重瓶颈边 (Bottleneck Edge) */}
          <div className="hidden lg:flex items-center gap-1">
            <span className="font-semibold text-slate-500 font-sans">瓶颈边:</span>
            <span className="text-slate-700 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
              {solverResult.bottleneckEdge ? `${solverResult.bottleneckEdge.weight} ${graph.unit}` : "-"}
            </span>
          </div>

          <span className="text-slate-300 font-normal hidden xl:inline">|</span>

          {/* 9. 拓扑密度 */}
          <div className="hidden xl:flex items-center gap-1">
            <span className="font-semibold text-slate-500 font-sans">密度 D =</span>
            <span className="text-slate-700 font-medium text-[11px]">{density}</span>
          </div>

          {solverResult.secondBestMST && (
            <>
              <span className="text-slate-300 font-normal hidden xl:inline">|</span>
              <div className="hidden xl:flex items-center gap-1">
                <span className="font-semibold text-slate-500 font-sans">二阶次优:</span>
                <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
                  Δw=+{solverResult.secondBestMST.weightDiff} {graph.unit}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Status Tag: System Ready & Verified */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-sans">运筹模型全局收敛</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
