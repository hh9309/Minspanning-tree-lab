import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  GitBranch,
  Split
} from "lucide-react";
import { AlgorithmType, GraphData, StepLog } from "../types";

interface SolverControlsProps {
  algorithm: AlgorithmType;
  onSelectAlgorithm: (alg: AlgorithmType) => void;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onGoToFirst: () => void;
  onGoToLast: () => void;
  onSeek: (step: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  startNodeId: string;
  onChangeStartNode: (nodeId: string) => void;
  graph: GraphData;
  clusterK: number;
  onChangeClusterK: (k: number) => void;
  currentStep?: StepLog;
}

export const SolverControls: React.FC<SolverControlsProps> = ({
  algorithm,
  onSelectAlgorithm,
  currentStepIndex,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onGoToFirst,
  onGoToLast,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  startNodeId,
  onChangeStartNode,
  graph,
  clusterK,
  onChangeClusterK,
  currentStep,
}) => {
  return (
    <div className="bg-white border border-[#E2E4E8] rounded-xl p-3 shadow-xs flex flex-col gap-2.5">
      {/* 1. Algorithm Selection Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E2E4E8]">
        <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-lg border border-[#E2E4E8] flex-wrap">
          <button
            onClick={() => onSelectAlgorithm("kruskal")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              algorithm === "kruskal"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Kruskal (避环合并)</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm("prim")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              algorithm === "prim"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Prim (割集生长)</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm("reverse-delete")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              algorithm === "reverse-delete"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>破圈法 (Reverse-Delete)</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm("second-best")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              algorithm === "second-best"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>次优生成树 (Second-Best)</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm("clustering")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              algorithm === "clustering"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>MST层次聚类</span>
          </button>
        </div>

        {/* Algorithm Specific Option Pickers */}
        <div className="flex items-center gap-2">
          {algorithm === "prim" && (
            <div className="flex items-center gap-1.5 bg-[#F4F5F7] px-2.5 py-1 rounded-md border border-[#E2E4E8] text-xs">
              <span className="text-slate-500 font-medium">生长起点:</span>
              <select
                value={startNodeId}
                onChange={(e) => onChangeStartNode(e.target.value)}
                className="bg-white text-blue-700 font-mono font-bold rounded px-1.5 py-0.5 border border-[#E2E4E8] outline-none shadow-xs"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} ({n.label})
                  </option>
                ))}
              </select>
            </div>
          )}

          {algorithm === "clustering" && (
            <div className="flex items-center gap-2 bg-[#F4F5F7] px-2.5 py-1 rounded-md border border-[#E2E4E8] text-xs">
              <span className="text-slate-500 font-medium">簇数量 k:</span>
              <input
                type="range"
                min="2"
                max={Math.min(6, Math.max(2, graph.nodes.length - 1))}
                value={clusterK}
                onChange={(e) => onChangeClusterK(parseInt(e.target.value, 10))}
                className="w-16 accent-blue-600"
              />
              <span className="font-mono text-blue-600 font-bold">{clusterK}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Timeline Step Slider & Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Playback Button Group */}
        <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-lg border border-[#E2E4E8]">
          <button
            onClick={onGoToFirst}
            disabled={currentStepIndex <= 0}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
            title="跳至初始步"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStepIndex <= 0}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
            title="上一步 (Step Back)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition shadow-xs ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>暂停</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>开始动画</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
            title="下一步 (Step Next)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onGoToLast}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition"
            title="跳至完成状态"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 w-full flex items-center gap-2.5">
          <input
            type="range"
            min="0"
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className="flex-1 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="font-mono text-xs text-slate-700 whitespace-nowrap bg-[#F4F5F7] px-2.5 py-1 rounded-md border border-[#E2E4E8]">
            步骤 <strong className="text-blue-600">{currentStepIndex + 1}</strong> / {totalSteps}
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#F4F5F7] px-2 py-1 rounded-lg border border-[#E2E4E8] text-xs">
          <span className="text-slate-500 font-medium">倍速:</span>
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition ${
                playbackSpeed === spd
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* 3. Step Commentary Banner */}
      {currentStep && (
        <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-lg p-2.5 flex items-start gap-2.5 text-xs shadow-xs">
          <div
            className={`px-2 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider whitespace-nowrap ${
              currentStep.action === "accept"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : currentStep.action === "reject" || currentStep.action === "delete"
                ? "bg-red-50 text-red-700 border border-red-200"
                : currentStep.action === "complete"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {currentStep.action === "accept"
              ? "✓ 入选生成树"
              : currentStep.action === "reject"
              ? "✕ 避环舍弃"
              : currentStep.action === "delete"
              ? "✄ 破圈删除"
              : currentStep.action === "complete"
              ? "★ 求解收敛"
              : "🔍 候选考察"}
          </div>

          <div className="flex-1">
            <h4 className="font-bold text-slate-800 mb-0.5">{currentStep.title}</h4>
            <p className="text-slate-600 leading-relaxed">{currentStep.description}</p>
          </div>

          <div className="text-right whitespace-nowrap pl-3 border-l border-[#E2E4E8] font-mono">
            <span className="text-[11px] text-slate-500 block">当前生成树权值</span>
            <span className="text-sm font-bold text-emerald-600">
              {currentStep.currentWeight} <span className="text-[10px] font-normal text-slate-500">{graph.unit}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
