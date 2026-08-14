import { GraphData, SolverResult } from "../types";

export type LLMModelType = "gemini-3-flash" | "deepseek-v4-pro";

export interface LLMConfig {
  apiKey: string;
  model: LLMModelType;
  customBaseUrl?: string;
}

const STORAGE_KEY = "mst_lab_llm_config";

export function loadLLMConfig(): LLMConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiKey: parsed.apiKey || "",
        model: parsed.model || "gemini-3-flash",
        customBaseUrl: parsed.customBaseUrl || "",
      };
    }
  } catch (e) {
    console.warn("Failed to load LLM config from localStorage", e);
  }
  return {
    apiKey: "",
    model: "gemini-3-flash",
    customBaseUrl: "",
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save LLM config to localStorage", e);
  }
}

/**
 * Call LLM directly in browser for GitHub Pages / Netlify static deployment
 */
export async function callLLM(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig
): Promise<string> {
  if (!config.apiKey.trim()) {
    throw new Error("请先点击右上角小齿轮 ⚙️ 设置并保存有效的 API-Key！");
  }

  if (config.model === "gemini-3-flash") {
    return callGeminiAPI(prompt, systemPrompt, config.apiKey.trim());
  } else if (config.model === "deepseek-v4-pro") {
    return callDeepSeekAPI(
      prompt,
      systemPrompt,
      config.apiKey.trim(),
      config.customBaseUrl
    );
  } else {
    throw new Error(`不支持的大模型类型: ${config.model}`);
  }
}

/**
 * Google Gemini Direct REST API Call
 */
async function callGeminiAPI(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  // Using official Gemini 2.5 Flash / Flash model endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\n【用户问题/分析任务】:\n${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const errMsg =
      errJson.error?.message ||
      `Gemini API 请求失败 (HTTP ${response.status}): 请检查 API-Key 是否正确或网络权限。`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "大模型未返回有效文本。";
  return text;
}

/**
 * DeepSeek Direct REST API Call (OpenAI-compatible)
 */
async function callDeepSeekAPI(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  customBaseUrl?: string
): Promise<string> {
  const baseUrl = customBaseUrl?.trim() || "https://api.deepseek.com";
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const payload = {
    model: "deepseek-chat", // DeepSeek standard model name mapped to deepseek-v4-pro
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2500,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const errMsg =
      errJson.error?.message ||
      `DeepSeek API 请求失败 (HTTP ${response.status}): 请检查 API-Key 是否正确及账户余额。`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text =
    data.choices?.[0]?.message?.content || "大模型未返回有效文本。";
  return text;
}

/**
 * Helper to build rich topological context for AI
 */
export function buildGraphContext(graph: GraphData, solverResult: SolverResult): string {
  const nodesList = graph.nodes
    .map((n) => `${n.id}(${n.label || "节点"})`)
    .join(", ");
  const edgesList = graph.edges
    .map((e) => `[${e.source} - ${e.target} | 权值: ${e.weight} ${graph.unit} | 备注: ${e.label || "无"}]`)
    .join("\n");
  const mstEdgesList = solverResult.mstEdges
    .map((e) => `• 边 ${e.source}-${e.target} (权值: ${e.weight} ${graph.unit})`)
    .join("\n");

  return `
【当前网络拓扑背景与运筹数据】:
- 工程案例名称: ${graph.name}
- 计量单位: ${graph.unit}
- 顶点集合 V (${graph.nodes.length} 个): ${nodesList}
- 可行边集合 E (${graph.edges.length} 条):
${edgesList}

【最小生成树 (MST) 计算结果】:
- 求解算法: ${solverResult.algorithm}
- 最优总权值 (min ∑w): ${solverResult.totalWeight} ${graph.unit}
- 选入 MST 骨干边数: ${solverResult.mstEdges.length} 条
- 选入 MST 边清单:
${mstEdgesList}
`;
}
