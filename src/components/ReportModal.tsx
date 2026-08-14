import React, { useState } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  Copy,
  Check,
  Image as ImageIcon,
  Table,
  Layers,
  Sparkles,
  Award,
  ShieldCheck
} from "lucide-react";
import { GraphData, SolverResult } from "../types";
import {
  exportToExcel,
  exportToCSV,
  exportToMarkdown,
  exportSVG
} from "../utils/exportUtils";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: GraphData;
  solverResult: SolverResult;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  graph,
  solverResult,
  svgRef,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"all" | "summary" | "edges" | "nontree" | "audit">("all");

  if (!isOpen) return null;

  const markdownReport = exportToMarkdown(graph, solverResult);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    exportToExcel(graph, solverResult, `MST_全过程运筹审计报告_${graph.name}.xlsx`);
  };

  const handleExportCSV = () => {
    exportToCSV(graph, solverResult, `MST_链路清单_${graph.name}.csv`);
  };

  const handleExportSVG = () => {
    exportSVG(svgRef, `MST_拓扑矢量图_${graph.name}.svg`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white border border-[#E2E4E8] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  全过程运筹求解与审计报告 (Audit Report & Multi-Format Export)
                </h3>
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 包含 6 大标准篇章
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                覆盖拓扑基数、运筹指标、骨干链路清单、冗余非树边避环证明、分步执行轨迹与工程容灾加固方案
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

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-[#F8F9FA] border-b border-[#E2E4E8] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium font-mono">
              求解算法: <strong className="text-blue-700 uppercase font-bold">{solverResult.algorithm}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium font-mono">
              最优总成本:{" "}
              <strong className="text-emerald-700 font-bold">
                {solverResult.totalWeight} {graph.unit}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition font-bold shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>导出 Excel 多表报表 (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition font-semibold border border-[#E2E4E8] shadow-2xs"
            >
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>导出 CSV</span>
            </button>

            <button
              onClick={handleExportSVG}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition font-semibold border border-[#E2E4E8] shadow-2xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>导出 SVG 拓扑图</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition font-semibold border border-[#E2E4E8] shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">已复制全文</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>复制 Markdown 报告</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4 bg-[#F4F5F7]">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">网络节点基数 |V|</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900">{graph.nodes.length}</span>
                <span className="text-[11px] text-slate-400">个端点</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">可选走廊边数 |E|</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900">{graph.edges.length}</span>
                <span className="text-[11px] text-slate-400">条备选边</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">MST骨干选入边数</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-blue-700">{solverResult.mstEdges.length}</span>
                <span className="text-[11px] text-slate-400">|V|-1 棵树</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block mb-0.5">极小化最优建设总成本</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-emerald-700">{solverResult.totalWeight}</span>
                <span className="text-[11px] font-medium text-emerald-600">{graph.unit}</span>
              </div>
            </div>
          </div>

          {/* Six Section Navigation Tags */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E2E4E8] flex items-center justify-between text-xs gap-2 flex-wrap">
            <span className="text-slate-600 font-bold flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>报告结构章节导航：</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">① 拓扑背景基数</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">② 运筹优化指标</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">③ MST骨干决策清单</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">④ 冗余避环舍弃分析</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">⑤ 算法推导审计</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">⑥ 工程抗毁建议</span>
            </div>
          </div>

          {/* Markdown Preview Area */}
          <div className="bg-white p-5 rounded-xl border border-[#E2E4E8] text-slate-800 leading-relaxed overflow-x-auto shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E4E8]">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>结构化审计报告全文预览 (Markdown 格式)</span>
              </h4>
              <button
                onClick={handleCopyMarkdown}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "已复制" : "复制报告源码"}</span>
              </button>
            </div>
            <pre className="text-slate-800 whitespace-pre-wrap text-xs font-mono font-medium leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E4E8]">
              {markdownReport}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
