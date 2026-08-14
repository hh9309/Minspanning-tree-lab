import React from "react";
import { Zap, ArrowRight, ShieldCheck, ListOrdered } from "lucide-react";
import { GraphData, StepLog } from "../types";

interface PrimPanelProps {
  graph: GraphData;
  currentStep?: StepLog;
  startNodeId: string;
}

const PRIM_PSEUDOCODE = [
  { line: 1, text: "1: 选取起点 r ∈ V，初始化割集 S = {r}，割集 V\\S = V \\ {r}" },
  { line: 2, text: "2: 初始化空生成树 T = ∅" },
  { line: 3, text: "3: while S ≠ V do" },
  { line: 4, text: "4:   扫描所有跨越割 (S, V\\S) 的边界可行边 (Cutset Edges)" },
  { line: 5, text: "5:   选取满足 e = argmin { w(u, v) | u ∈ S, v ∈ V\\S } 的极小权值边" },
  { line: 6, text: "6:   T = T ∪ {e};  S = S ∪ {v}; // 割性质保证此边必在最优生成树中" },
  { line: 7, text: "7: end while" },
  { line: 8, text: "8: return 最小生成树 T" },
];

export const PrimPanel: React.FC<PrimPanelProps> = ({ graph, currentStep, startNodeId }) => {
  const cutS = currentStep?.cutS || [startNodeId];
  const cutNotS = currentStep?.cutNotS || graph.nodes.map((n) => n.id).filter((id) => id !== startNodeId);
  const candidates = currentStep?.candidateEdges || [];

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-1">
      {/* 1. Prim Pseudocode */}
      <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Prim 算法伪代码（割集与优先队列推导）</span>
        </h4>
        <div className="font-mono text-[11px] flex flex-col gap-0.5">
          {PRIM_PSEUDOCODE.map((code) => {
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

      {/* 2. Cut Property Slice Visualizer (割集双分区切片) */}
      <div className="bg-white border border-[#E2E4E8] rounded-xl p-3 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>割集空间划分：割 (S, V \ S)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            生长进度: <strong className="text-blue-600">{cutS.length}</strong>/{graph.nodes.length}
          </span>
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Left: Cut Set S */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1.5">
              <span>已入树割集 S</span>
              <span className="font-mono bg-emerald-100/70 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">
                {cutS.length} 节点
              </span>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {cutS.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold shadow-2xs"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Cut Set V \ S */}
          <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>待吸纳割集 V \ S</span>
              <span className="font-mono bg-white border border-[#E2E4E8] px-1.5 py-0.5 rounded text-[10px] text-slate-500">
                {cutNotS.length} 节点
              </span>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {cutNotS.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded bg-white text-slate-600 border border-[#E2E4E8]"
                >
                  {id}
                </span>
              ))}
              {cutNotS.length === 0 && (
                <span className="text-emerald-700 font-sans text-xs italic font-semibold">
                  全网节点已完全吸纳入树 ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cross-Cut Frontier Priority Queue (优先队列候选跨割边) */}
      <div className="bg-white border border-[#E2E4E8] rounded-xl p-3 shadow-xs flex-1 flex flex-col min-h-[180px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
            <span>优先队列中的跨割候选边 (Priority Queue)</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            候选边数: <strong className="text-blue-600">{candidates.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto flex-1 border border-[#E2E4E8] rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8F9FA] text-slate-600 border-b border-[#E2E4E8] text-[11px] font-semibold">
                <th className="py-1.5 px-2.5">堆顶顺位</th>
                <th className="py-1.5 px-2">跨割方向 (S → V\S)</th>
                <th className="py-1.5 px-2">边权重 w(e)</th>
                <th className="py-1.5 px-2 text-right">割性质判定</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4E8] text-slate-700">
              {candidates.map((c, index) => {
                const isMinCutEdge = index === 0;
                return (
                  <tr
                    key={c.edgeId}
                    className={`transition-colors ${
                      isMinCutEdge ? "bg-emerald-50/60 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-1.5 px-2.5 text-slate-400">#{index + 1}</td>
                    <td className="py-1.5 px-2 text-slate-900 flex items-center gap-1.5">
                      <span className="text-emerald-700 font-bold">{c.source}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-blue-600 font-bold">{c.target}</span>
                    </td>
                    <td className="py-1.5 px-2 text-emerald-700 font-bold">{c.weight}</td>
                    <td className="py-1.5 px-2 text-right">
                      {isMinCutEdge ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] font-semibold">
                          ★ 割极小边 (入选)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">队列待定</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                    暂无跨割候选边或生成树已构建完成
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
