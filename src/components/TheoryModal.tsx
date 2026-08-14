import React from "react";
import { X, BookOpen, ShieldCheck, RefreshCw, Cpu, Layers, HelpCircle } from "lucide-react";

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E2E4E8] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                运筹模型与最小生成树 (MST) 图论理论基础
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                严格数学规划模型、割性质 (Cut Property)、圈性质 (Cycle Property) 及算法复杂度全景
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5 text-slate-700 text-xs leading-relaxed bg-[#F4F5F7]">
          {/* 1. Operations Research Mathematical Formulation */}
          <section className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>1. 运筹学 0-1 整数线性规划模型 (ILP Formulation)</span>
            </h4>
            <p className="text-slate-600 mb-3">
              设无向连通带权图为 $G=(V, E)$，顶点集规模 $|V|=n$，边集规模 $|E|=m$，每条边 $e \in E$ 具有非负权值 $w_e \ge 0$。引入决策变量：
            </p>
            <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E2E4E8] font-mono text-slate-800 mb-3">
              <p className="text-emerald-700 font-bold mb-1">【目标函数 Objective】:</p>
              <p className="pl-4 font-semibold">min Z = ∑_(e ∈ E) w_e · x_e</p>
              <p className="text-blue-700 font-bold mt-2 mb-1">【约束条件 Constraints】:</p>
              <p className="pl-4 font-semibold">(1) 边数基数约束：∑_(e ∈ E) x_e = n - 1</p>
              <p className="pl-4 font-semibold">(2) 破圈/子树消除约束 (Subtour Elimination Constraints, SEC):</p>
              <p className="pl-8 text-slate-600 font-medium">
                ∑_(e ∈ E(S)) x_e ≤ |S| - 1,  ∀ ∅ ≠ S ⊂ V  (确保任意非空真子集中不存在环路)
              </p>
              <p className="pl-4 font-semibold">(3) 变量二值约束：x_e ∈ &#123;0, 1&#125;,  ∀ e ∈ E</p>
            </div>
            <p className="text-slate-600">
              💡 <strong>运筹学特性</strong>：最小生成树的多面体（Spanning Tree Polytope）具有全单模性与拟阵（Matroid）贪心最优解结构，因此贪心算法即可求得严格全局最优解，无需分支定界！
            </p>
          </section>

          {/* 2. Cut Property & Cycle Property */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cut Property */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
              <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. 割性质定理 (Cut Property) —— Prim 算法基石</span>
              </h4>
              <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-emerald-900 font-mono text-[11px] mb-2.5 font-medium">
                对于图 G 中的任意割 (S, V \ S)，跨越该割的所有边中，权重严格最小的边 e 必然属于图 G 的某棵最小生成树。
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                <strong>证明简述 (反证法/拟阵交换)</strong>：假设某 MST T 不含最轻跨割边 e=(u, v)。将 e 加入 T 必产生回路 C。回路必在另一处穿回割集（存在边 e' ≠ e 且 e' 亦跨越割）。由于 w(e) ≤ w(e')，构造新树 T' = T ∪ &#123;e&#125; \ &#123;e'&#125;，其总权 w(T') ≤ w(T)，仍是连通无环的最小生成树！
              </p>
            </div>

            {/* Cycle Property */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
              <h4 className="text-sm font-bold text-rose-800 mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-rose-600" />
                <span>3. 圈性质定理 (Cycle Property) —— Kruskal 与破圈法基石</span>
              </h4>
              <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 text-rose-900 font-mono text-[11px] mb-2.5 font-medium">
                对于图 G 中的任意简单回路 C，若边 e 是回路 C 中权重严格最大的边，则 e 必然不属于图 G 的任何最小生成树。
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                <strong>证明简述</strong>：假设存在包含该极大边 e 的最小生成树 T。从 T 中删除 e 将使树分裂为两个连通分量 S 与 V \ S。由于 C 是闭合回路，必然存在另一条边 e'' ∈ C \ &#123;e&#125; 连接这两个分量。由于 w(e'') &lt; w(e)，以 e'' 替换 e 得到权值更严格减小的新树，与 T 最小性矛盾！
              </p>
            </div>
          </div>

          {/* 3. Algorithm Complexity Matrix */}
          <section className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>4. 主流最小生成树算法时间与空间复杂度全景对比</span>
            </h4>
            <div className="overflow-x-auto border border-[#E2E4E8] rounded-lg">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-[#F8F9FA] text-slate-700 border-b border-[#E2E4E8] font-bold">
                    <th className="p-2.5">算法名称</th>
                    <th className="p-2.5">核心驱动数据结构</th>
                    <th className="p-2.5">时间复杂度 (常规堆)</th>
                    <th className="p-2.5">时间复杂度 (斐波那契堆)</th>
                    <th className="p-2.5">最佳适用图场景</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4E8] text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-blue-700">Kruskal 算法</td>
                    <td className="p-2.5">边权快排 + 并查集 (DSU)</td>
                    <td className="p-2.5 text-emerald-700 font-bold">O(E log E)</td>
                    <td className="p-2.5 text-slate-500">O(E log V)</td>
                    <td className="p-2.5 text-slate-800 font-sans">稀疏图 (Sparse Graph, E ≈ V)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-emerald-700">Prim 算法</td>
                    <td className="p-2.5">邻接表 + 最小二叉优先队列</td>
                    <td className="p-2.5 text-emerald-700 font-bold">O(E log V)</td>
                    <td className="p-2.5 text-blue-700 font-bold">O(E + V log V)</td>
                    <td className="p-2.5 text-slate-800 font-sans">稠密图 (Dense Graph, E ≈ V²)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-amber-700">破圈法 (Reverse-Delete)</td>
                    <td className="p-2.5">降序边排 + 连通性检测 (BFS/DFS)</td>
                    <td className="p-2.5 text-amber-700 font-bold">O(E · (V + E))</td>
                    <td className="p-2.5 text-slate-500">O(E · log V · (log log V)³)</td>
                    <td className="p-2.5 text-slate-800 font-sans">理论教学 / 网络防灾破圈</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-purple-700">Borůvka 算法</td>
                    <td className="p-2.5">多连通分量并行贪心收缩</td>
                    <td className="p-2.5 text-emerald-700 font-bold">O(E log V)</td>
                    <td className="p-2.5 text-slate-500">-</td>
                    <td className="p-2.5 text-slate-800 font-sans">大规模分布式与 GPU 并行计算</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
