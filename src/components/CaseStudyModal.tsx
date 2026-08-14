import React from "react";
import { X, Zap, Droplets, Cpu, Share2, Compass, Radio, Check } from "lucide-react";
import { CASE_STUDIES } from "../utils/caseStudies";
import { CaseStudy } from "../types";

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCaseId: string;
  onSelectCase: (caseStudy: CaseStudy) => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  isOpen,
  onClose,
  currentCaseId,
  onSelectCase,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "power":
        return <Zap className="w-5 h-5 text-amber-400" />;
      case "water":
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case "pcb":
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case "clustering":
        return <Share2 className="w-5 h-5 text-pink-400" />;
      case "traffic":
        return <Compass className="w-5 h-5 text-emerald-400" />;
      case "telecom":
        return <Radio className="w-5 h-5 text-purple-400" />;
      default:
        return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E2E4E8] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>六大经典工业与运筹优化案例库</span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-mono font-bold">
                6 Cases Loaded
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              预置真实工程坐标、物理单位与业务背景约束，一键载入即可开展分步推导与敏感性诊断
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Cards Grid */}
        <div className="p-5 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F4F5F7]">
          {CASE_STUDIES.map((c) => {
            const isSelected = currentCaseId === c.id;
            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-white border-[#E2E4E8] hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E4E8]">
                        {getCategoryIcon(c.category)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{c.title}</h4>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          单位: {c.unit}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                        <Check className="w-3.5 h-3.5" />
                        当前案例
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2 font-normal">
                    {c.description}
                  </p>

                  <div className="bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E2E4E8] text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 block mb-0.5 font-bold">运筹学工程背景：</strong>
                    {c.engineeringContext}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E4E8] flex items-center justify-between text-xs">
                  <div className="font-mono text-slate-500">
                    规模: <strong className="text-slate-800 font-bold">{c.graph.nodes.length}</strong> 点 /{" "}
                    <strong className="text-slate-800 font-bold">{c.graph.edges.length}</strong> 边
                  </div>

                  <button
                    onClick={() => {
                      onSelectCase(c);
                      onClose();
                    }}
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${
                      isSelected
                        ? "bg-slate-100 text-slate-400 cursor-default border border-[#E2E4E8]"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    }`}
                  >
                    {isSelected ? "已载入" : "一键载入案例"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
