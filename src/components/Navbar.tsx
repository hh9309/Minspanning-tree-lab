import React from "react";
import {
  Share2,
  FileSpreadsheet,
  Code,
  Sparkles,
  BookOpen,
  Edit3,
  Network,
  RotateCcw,
  Download,
  Info
} from "lucide-react";
import { GraphData, SolverResult } from "../types";

interface NavbarProps {
  graph: GraphData;
  result: SolverResult;
  onOpenDataEditor: () => void;
  onOpenCaseStudy: () => void;
  onOpenTheory: () => void;
  onOpenCodeEngine: () => void;
  onOpenAIDiagnose: () => void;
  onOpenReport: () => void;
  onResetGraph: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  graph,
  result,
  onOpenDataEditor,
  onOpenCaseStudy,
  onOpenTheory,
  onOpenCodeEngine,
  onOpenAIDiagnose,
  onOpenReport,
  onResetGraph,
}) => {
  return (
    <header className="bg-white border-b border-[#E2E4E8] text-[#1D1D1F] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#3B82F6] flex items-center justify-center rounded-lg text-white shadow-xs">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              最小生成树与图论优化实验室
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              V3.5 MST LAB
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            运筹数学模型 · 双范式求解 · 割圈沙盒 · 工业案例 · AI拓扑诊断
          </p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          id="btn-case-studies"
          onClick={onOpenCaseStudy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E4E8] shadow-xs transition"
          title="切换六大经典工程案例库"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">经典案例库</span>
        </button>

        <button
          id="btn-data-editor"
          onClick={onOpenDataEditor}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E4E8] shadow-xs transition"
          title="多模式建图：边列表 / 邻接矩阵 / Excel导入"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">数据沙盒</span>
        </button>

        <button
          id="btn-theory-model"
          onClick={onOpenTheory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E4E8] shadow-xs transition"
          title="运筹模型与割圈理论证明"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden md:inline">运筹理论</span>
        </button>

        <button
          id="btn-code-engine"
          onClick={onOpenCodeEngine}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E4E8] shadow-xs transition"
          title="Python / NetworkX / pandas 代码引擎"
        >
          <Code className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Python引擎</span>
        </button>

        <button
          id="btn-ai-diagnose"
          onClick={onOpenAIDiagnose}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition shadow-xs"
          title="AI 拓扑脆弱性与敏感性诊断"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span className="hidden sm:inline">AI 诊断</span>
        </button>

        <button
          id="btn-report-export"
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-black text-white transition shadow-xs"
          title="导出 Excel / CSV / SVG / Markdown 实验报告"
        >
          <Download className="w-3.5 h-3.5 text-slate-200" />
          <span>报告导出</span>
        </button>

        <button
          id="btn-reset-graph"
          onClick={onResetGraph}
          className="p-1.5 rounded-md text-xs bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-[#E2E4E8] shadow-xs transition"
          title="重置当前图形布局与状态"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
