import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  ShieldAlert,
  Sliders,
  Send,
  Loader2,
  Activity,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Settings,
  Bot,
  User,
  Key,
  Cpu,
  Trash2,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  MessageSquareQuote,
  Eye,
  EyeOff
} from "lucide-react";
import { GraphData, SolverResult, AIDiagnosisData } from "../types";
import {
  loadLLMConfig,
  saveLLMConfig,
  callLLM,
  buildGraphContext,
  LLMConfig,
  LLMModelType
} from "../utils/aiClient";

interface AIDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: GraphData;
  solverResult: SolverResult;
  onApplyAIGraph?: (newGraph: GraphData) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export const AIDiagnosisModal: React.FC<AIDiagnosisModalProps> = ({
  isOpen,
  onClose,
  graph,
  solverResult,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "diagnose">("chat");
  const [showSettings, setShowSettings] = useState(false);

  // LLM Config State
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig());
  const [tempApiKey, setTempApiKey] = useState("");
  const [tempModel, setTempModel] = useState<LLMModelType>("gemini-3-flash");
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Chat Q&A State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Diagnosis States
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<AIDiagnosisData | null>(null);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);

  // Initialize and load saved settings
  useEffect(() => {
    if (isOpen) {
      const cfg = loadLLMConfig();
      setLlmConfig(cfg);
      setTempApiKey(cfg.apiKey);
      setTempModel(cfg.model);

      // Add default welcome message if chat is empty
      if (messages.length === 0) {
        setMessages([
          {
            id: "welcome-1",
            role: "assistant",
            content: `你好！我是针对当前图论案例 **《${graph.name}》** 的大模型运筹学智能助手。\n\n我已完全解析当前拓扑的 **${graph.nodes.length} 个节点**、**${graph.edges.length} 条可行边** 以及当前最小生成树最优总权值 **${solverResult.totalWeight} ${graph.unit}**。\n\n你可以向我提问任何关于：\n1. 关键卡口边（Bridge）与单点故障风险分析\n2. 边权成本变动对最小生成树的敏感性影响\n3. 冗余容灾备份链路加边建议\n4. Kruskal 与 Prim 算法在当前拓扑中的求解机理与瓶颈\n\n*(提示：首次使用请先点击右上角 ⚙️ 设置大模型与 API-Key)*`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    }
  }, [isOpen, graph.name]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering]);

  if (!isOpen) return null;

  // Handle Save LLM Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: LLMConfig = {
      apiKey: tempApiKey.trim(),
      model: tempModel,
    };
    setLlmConfig(newConfig);
    saveLLMConfig(newConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2000);
    setShowSettings(false);
  };

  // Handle Question Asking
  const handleSendQuestion = async (presetText?: string) => {
    const questionText = (presetText || inputQuestion).trim();
    if (!questionText || isAnswering) return;

    if (!llmConfig.apiKey.trim()) {
      setShowSettings(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: questionText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!presetText) setInputQuestion("");
    setIsAnswering(true);

    const systemPrompt = `你是一位顶级的图论（Graph Theory）与运筹学（Operations Research）专家。
请结合用户提供的当前网络拓扑与最小生成树计算数据，严谨、深入且专业地回答用户的问题。
回答要求：
1. 观点清晰，逻辑严谨，使用运筹学术语（如割集定理、环路定理、关键路径、灵敏度分析、并查集等）；
2. 结合具体节点编号和边权数值进行案例剖析；
3. 输出格式排版工整，结构清晰，使用 Markdown 格式（加粗、列表、分段）。`;

    const fullPrompt = `${buildGraphContext(graph, solverResult)}\n\n【用户提问】: ${questionText}`;

    try {
      const reply = await callLLM(fullPrompt, systemPrompt, llmConfig);
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "system",
        content: `❌ 大模型调用失败: ${err?.message || "网络请求异常"}。\n请检查右上角 ⚙️ 设置中的 API-Key 及所选大模型 (${llmConfig.model}) 是否有效。`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnswering(false);
    }
  };

  // Run AI Diagnostic
  const handleRunDiagnosis = async () => {
    if (!llmConfig.apiKey.trim()) {
      setShowSettings(true);
      return;
    }

    setIsDiagnosing(true);
    setDiagnoseError(null);

    const systemPrompt = `你是一位运筹学与图论网络专家。请对给定的网络拓扑和最小生成树结果进行深度运筹学诊断。
必须以标准的 JSON 格式返回分析结果（不要包含任何其他前缀或后缀文本），JSON 数据结构如下：
{
  "title": "案例诊断标题",
  "summary": "运筹学综合综述与瓶颈分析（200字左右）",
  "vulnerabilityScore": 35, // 0-100间的整数，越高表示网络越脆弱、越容易因单边故障瘫痪
  "criticalEdges": [
    { "edge": "A-B", "weight": 12, "reason": "作为连接核心子网的割边/桥，无任何冗余备份" }
  ],
  "sensitivityAnalysis": "边权波动容忍区间分析说明...",
  "recommendations": [
    "建议1...",
    "建议2...",
    "建议3..."
  ]
}`;

    const fullPrompt = `${buildGraphContext(graph, solverResult)}\n\n请输出该网络的全面运筹学抗毁性与敏感性诊断 JSON：`;

    try {
      const rawText = await callLLM(fullPrompt, systemPrompt, llmConfig);
      // Clean possible markdown json fences
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setDiagnosisData(parsed);
      } else {
        throw new Error("大模型未返回符合规范的 JSON 诊断结构，请重试或查看原始文本。");
      }
    } catch (err: any) {
      setDiagnoseError(err.message || "请求 AI 诊断服务异常");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white border border-[#E2E4E8] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  AI 拓扑与成本运筹学诊断引擎
                </h3>
                <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200 font-mono">
                  {llmConfig.model === "gemini-3-flash" ? "gemini 3 flash" : "deepseek-v4-pro"}
                </span>
                {llmConfig.apiKey ? (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> API-Key 已就绪
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Key className="w-3 h-3" /> 待设置 Key
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                支持在浏览器直接调用大模型进行多轮图论问答、脆弱性分析与敏感度深度诊断（适配 GitHub / Netlify 静态部署）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Gear Button: Set LLM & API-Key */}
            <button
              id="btn-llm-settings"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border transition flex items-center gap-1.5 text-xs font-bold ${
                showSettings || !llmConfig.apiKey
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-[#E2E4E8] shadow-2xs"
              }`}
              title="设置大模型类型与输入 API-Key (LLM Settings)"
            >
              <Settings className={`w-4 h-4 ${showSettings ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">大模型设置</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Drawer / Popover */}
        {showSettings && (
          <div className="bg-amber-50/70 border-b border-amber-200 p-4 animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-3 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>大模型参数与 API-Key 浏览器端配置</span>
                </h4>
                <span className="text-[11px] text-amber-800">
                  🔒 密钥仅保存在当前浏览器本地缓存 (localStorage)，绝不上传后端
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* 1. Model Selection */}
                <div className="sm:col-span-4 flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    2. 选择大模型 (Model Select)
                  </label>
                  <select
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value as LLMModelType)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-blue-600 shadow-2xs"
                  >
                    <option value="gemini-3-flash">gemini 3 flash (Google)</option>
                    <option value="deepseek-v4-pro">deepseek-v4-pro (DeepSeek)</option>
                  </select>
                </div>

                {/* 2. Manual API-Key Input */}
                <div className="sm:col-span-8 flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>1. 手工输入 API-Key <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {tempModel === "gemini-3-flash" ? "Google AI Studio Key" : "DeepSeek Platform Key"}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeyText ? "text" : "password"}
                      required
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder={
                        tempModel === "gemini-3-flash"
                          ? "请输入 AIzaSy... (Gemini API Key)"
                          : "请输入 sk-... (DeepSeek API Key)"
                      }
                      className="w-full px-3 py-2 pr-10 bg-white border border-[#D1D5DB] rounded-lg text-xs font-mono text-slate-900 outline-hidden focus:border-blue-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeyText(!showApiKeyText)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showApiKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Confirm Model & Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-600">
                  项目部署在 GitHub / Netlify 后，浏览器直接向官方端点发送 HTTPS 请求完成运筹求解。
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-[#E2E4E8] transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>3. 确认大模型与保存密钥</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Config Saved Feedback Banner */}
        {configSavedToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>大模型配置已成功保存！当前模型：{llmConfig.model}</span>
          </div>
        )}

        {/* API-Key Missing Warning Prompt */}
        {!llmConfig.apiKey && !showSettings && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-700 animate-bounce" />
              <span>
                <strong>提示</strong>：GitHub 静态环境调用需要您输入专属 API-Key 后方可发起大模型问答与诊断。
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 transition"
            >
              立即配置 Key
            </button>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#E2E4E8] bg-white px-4">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "chat"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>大模型回答问题对话框 (Interactive Q&A)</span>
          </button>

          <button
            onClick={() => setActiveTab("diagnose")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "diagnose"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>网络脆弱性与敏感性诊断</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-[400px] bg-[#F4F5F7] flex flex-col">
          {/* TAB 1: 大模型回答问题对话框 */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col justify-between gap-3 min-h-[380px]">
              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role !== "user" && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white font-medium rounded-tr-xs"
                          : msg.role === "system"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-white text-slate-800 border border-[#E2E4E8] rounded-tl-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                        <span className="font-bold">
                          {msg.role === "user" ? "我" : `${llmConfig.model} 专家助手`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          {msg.role !== "user" && (
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="hover:text-slate-900 transition"
                              title="复制内容"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isAnswering && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white border border-[#E2E4E8] p-3 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>正在调用 <strong>{llmConfig.model}</strong> 深度思考与运筹推演中...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Preset Quick Questions */}
              <div className="pt-2 flex flex-col gap-1.5 border-t border-[#E2E4E8]">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-blue-600" />
                  <span>快捷运筹学问题推荐：</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    "分析当前拓扑最脆弱、容易发生单点故障的关键割边",
                    "若要增加 1 条冗余备份链路，推荐添加在哪两点间？",
                    "评估边权变动对最小生成树结构稳定性的敏感度",
                    "比较 Kruskal 与 Prim 在本案例下的收敛效率",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuestion(q)}
                      disabled={isAnswering}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-[#E2E4E8] hover:border-blue-300 rounded-lg text-[11px] font-medium transition shadow-2xs text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E2E4E8] shadow-xs">
                <input
                  type="text"
                  value={inputQuestion}
                  disabled={isAnswering}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuestion();
                    }
                  }}
                  placeholder={`向 ${llmConfig.model} 提问当前网络拓扑、成本优化或运筹算法... (Enter 发送)`}
                  className="flex-1 px-3 py-1.5 text-xs text-slate-900 bg-transparent outline-hidden"
                />
                <button
                  onClick={() => handleSendQuestion()}
                  disabled={isAnswering || !inputQuestion.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-40"
                >
                  {isAnswering ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>发送提问</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AI 脆弱性与敏感性深度诊断 */}
          {activeTab === "diagnose" && (
            <div className="flex flex-col gap-4">
              {!diagnosisData && (
                <div className="bg-white p-6 rounded-2xl border border-[#E2E4E8] text-center flex flex-col items-center gap-3 shadow-xs">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    发起当前网络最小生成树运筹与工程抗毁性诊断
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                    当前使用大模型：<strong className="text-blue-700 font-mono">{llmConfig.model}</strong>。
                    AI 将深度审查当前拓扑中的割边/桥 (Bridge)、单点故障风险 (SPOF)、边权波动对 MST 稳定性的敏感度以及冗余加边建议。
                  </p>

                  <button
                    onClick={handleRunDiagnosis}
                    disabled={isDiagnosing}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    {isDiagnosing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>大模型正在分析拓扑与运筹约束...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>开始 AI 深度诊断 ({llmConfig.model})</span>
                      </>
                    )}
                  </button>

                  {diagnoseError && (
                    <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {diagnoseError}
                    </div>
                  )}
                </div>
              )}

              {diagnosisData && (
                <div className="flex flex-col gap-4">
                  {/* Re-run button */}
                  <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900">
                        {diagnosisData.title || "最小生成树拓扑与成本诊断报告"}
                      </span>
                      {diagnosisData.vulnerabilityScore !== undefined && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          网络脆弱性指数: {diagnosisData.vulnerabilityScore}/100
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleRunDiagnosis}
                      disabled={isDiagnosing}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs rounded-lg font-bold border border-[#E2E4E8] transition shadow-2xs"
                    >
                      {isDiagnosing ? "分析中..." : "重新诊断"}
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] text-xs text-slate-700 leading-relaxed shadow-xs">
                    <strong className="text-slate-900 font-bold block mb-1.5">【运筹学综合综述】:</strong>
                    {diagnosisData.summary}
                  </div>

                  {/* Critical Edges */}
                  {diagnosisData.criticalEdges && diagnosisData.criticalEdges.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
                      <h4 className="text-xs font-bold text-amber-800 mb-2.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>关键卡口边 / 桥边 (Critical Edges & Bridges)</span>
                      </h4>
                      <div className="flex flex-col gap-2">
                        {diagnosisData.criticalEdges.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E2E4E8] text-xs flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <span className="font-bold text-slate-900">{item.edge}</span>
                              <span className="text-emerald-700 font-bold">
                                权重: {item.weight}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sensitivity Analysis */}
                  {diagnosisData.sensitivityAnalysis && (
                    <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
                      <h4 className="text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>边权变动敏感性与替代容忍区间 (Sensitivity Analysis)</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {diagnosisData.sensitivityAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {diagnosisData.recommendations && diagnosisData.recommendations.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] shadow-xs">
                      <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                        <span>工程与运筹优化建议</span>
                      </h4>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                        {diagnosisData.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
