import React from "react";
import { Check, X, Search, Layers, GitMerge } from "lucide-react";
import { GraphData, StepLog, GraphEdge } from "../types";

interface KruskalPanelProps {
  graph: GraphData;
  currentStep?: StepLog;
}

const KRUSKAL_PSEUDOCODE = [
  { line: 1, text: "1: 将图 G 的所有边按权重 w(e) 升序排列 E = {e1, e2, ...}" },
  { line: 2, text: "2: 初始化并查集 DSU，每个顶点 v ∈ V 构成独立单元素集合" },
  { line: 3, text: "3: 初始化空生成树 T = ∅" },
  { line: 4, text: "4: for each 边 e = (u, v) in 升序序列 do" },
  { line: 5, text: "5:   if Find(u) ≠ Find(v) then // 两端点处于不同连通分量" },
  { line: 6, text: "6:     T = T ∪ {e};  Union(u, v); // 贪心接纳并合并集合" },
  { line: 7, text: "7:   else" },
  { line: 8, text: "8:     舍弃边 e; // 避环（形成回路，违背树的无环定义）" },
  { line: 9, text: "9:   if |T| == |V| - 1 then break; // 生成树已连通全网" },
  { line: 10, text: "10: return 最小生成树 T" },
];

export const KruskalPanel: React.FC<KruskalPanelProps> = ({ graph, currentStep }) => {
  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const acceptedEdgeIds = new Set(currentStep?.highlightEdges || []);
  const rejectedEdgeIds = new Set(currentStep?.rejectedEdges || []);
  const inspectingEdgeId = currentStep?.edgeId;

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-1">
      {/* 1. Pseudocode Sync Tracker */}
      <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <GitMerge className="w-3.5 h-3.5 text-blue-600" />
          <span>Kruskal 算法伪代码推导执行流</span>
        </h4>
        <div className="font-mono text-[11px] flex flex-col gap-0.5">
          {KRUSKAL_PSEUDOCODE.map((code) => {
            const isActive = currentStep?.codeLine === code.line;
            return (
              <div
                key={code.line}
                className={`px-2 py-0.5 rounded transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-3 border-blue-600 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {code.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Union-Find (DSU) Component Sets Visualizer */}
      {currentStep?.dsuState && (
        <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>并查集 (Union-Find) 连通分量跟踪</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              当前独立集合数: <strong className="text-emerald-700">{currentStep.dsuState.sets.length}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentStep.dsuState.sets.map((set) => (
              <div
                key={set.root}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono bg-white shadow-xs"
                style={{
                  borderColor: "#E2E4E8",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: set.color }}
                />
                <span className="text-slate-800 font-bold">根 [{set.root}]:</span>
                <span className="text-slate-600 font-medium">
                  {`{ ${set.members.join(", ")} }`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sorted Edge Sequence Table */}
      <div className="bg-white border border-[#E2E4E8] rounded-xl p-3 shadow-xs flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800">
            边权升序排列与贪心决策表 (Sorted Edge List)
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            已选入: <strong className="text-blue-600">{acceptedEdgeIds.size}</strong>/{graph.nodes.length - 1} 边
          </span>
        </div>

        <div className="overflow-x-auto flex-1 border border-[#E2E4E8] rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8F9FA] text-slate-600 border-b border-[#E2E4E8] text-[11px] font-semibold">
                <th className="py-1.5 px-2.5">位次</th>
                <th className="py-1.5 px-2">端点 (u - v)</th>
                <th className="py-1.5 px-2">权重 w(e)</th>
                <th className="py-1.5 px-2">业务标签</th>
                <th className="py-1.5 px-2 text-right">决策状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4E8] text-slate-700">
              {sortedEdges.map((edge, index) => {
                const isAccepted = acceptedEdgeIds.has(edge.id);
                const isRejected = rejectedEdgeIds.has(edge.id);
                const isInspecting = inspectingEdgeId === edge.id;

                let rowBg = "hover:bg-slate-50";
                if (isInspecting) rowBg = "bg-amber-50/70 font-semibold";
                else if (isAccepted) rowBg = "bg-emerald-50/50";
                else if (isRejected) rowBg = "bg-rose-50/40 opacity-70";

                return (
                  <tr key={edge.id} className={`transition-colors ${rowBg}`}>
                    <td className="py-1.5 px-2.5 text-slate-400">e_{index + 1}</td>
                    <td className="py-1.5 px-2 text-slate-900 font-bold">
                      {edge.source} ↔ {edge.target}
                    </td>
                    <td className="py-1.5 px-2 text-emerald-700 font-bold">{edge.weight}</td>
                    <td className="py-1.5 px-2 text-slate-500 truncate max-w-[90px]" title={edge.label}>
                      {edge.label || "-"}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] font-medium">
                          <Check className="w-3 h-3" />
                          已入树
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[10px] font-medium">
                          <X className="w-3 h-3" />
                          避环舍弃
                        </span>
                      ) : isInspecting ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] font-semibold animate-pulse">
                          <Search className="w-3 h-3" />
                          考察中
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">等待考察</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
