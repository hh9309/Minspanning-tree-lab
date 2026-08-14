import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // API: AI Topological & Cost Diagnostic
  app.post("/api/ai-diagnose", async (req, res) => {
    try {
      const { graphData, mstData, algorithm, caseContext } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // High quality heuristic fallback diagnosis if no API key provided
        return res.json({
          success: true,
          isMock: true,
          analysis: {
            title: "最小生成树拓扑与工程运筹学诊断报告 (启发式评估)",
            summary: `当前网络包含 ${graphData.nodes?.length || 0} 个节点与 ${graphData.edges?.length || 0} 条可行边。计算得到最小生成树总权值为 ${mstData.totalWeight ?? "N/A"}，包含 ${mstData.selectedEdges?.length || 0} 条骨干边。`,
            criticalEdges: mstData.selectedEdges?.slice(0, 3).map((e: any) => ({
              edge: `${e.source} - ${e.target}`,
              weight: e.weight,
              reason: "作为割集的唯一最轻边，此边若受损将导致图分裂为两个独立连通分量，属于关键连通卡口（Bridge）。"
            })) || [],
            sensitivityAnalysis: `瓶颈边权重上浮容忍度取决于非树边在对应基本回路中的极小差值；一旦权值超过环上替代边，MST 结构将发生拓扑跃迁。`,
            vulnerabilityScore: 78,
            recommendations: [
              "建议在核心卡口节点之间增设 1~2 条备用冗余链路，构成 2-连通拓扑以防单点故障。",
              "针对权值过大的瓶颈边（Bottleneck Edge），建议进行路由成本复核或分流分摊。",
              "对于度数大于 4 的高集聚中心节点，建议提升交换设备吞吐容限。"
            ]
          }
        });
      }

      const prompt = `你是一位世界顶级的运筹学与网络流优化专家、图论算法架构师。
请对以下无向带权网络及其计算得到的最小生成树 (MST) 进行深入的工程与运筹学诊断：

【应用背景 / 案例】: ${caseContext || "通用图论网络拓扑"}
【求解算法】: ${algorithm || "Kruskal / Prim"}
【网络基本参数】:
- 节点数: ${graphData.nodes?.length || 0}
- 边数: ${graphData.edges?.length || 0}
- 所有边及权值: ${JSON.stringify(graphData.edges || [])}
- 最小生成树选中边 (${mstData.selectedEdges?.length || 0} 条): ${JSON.stringify(mstData.selectedEdges || [])}
- 最小生成树总权重: ${mstData.totalWeight}

请返回严格合法的 JSON 格式数据，结构如下：
{
  "title": "报告标题",
  "summary": "200字以内的专业运筹学总结，涵盖全网最小成本特性与连通状态",
  "criticalEdges": [
    {
      "edge": "节点A - 节点B",
      "weight": 12.5,
      "reason": "为什么这是关键卡口边/割边（Cut Edge），对全网鲁棒性的影响"
    }
  ],
  "sensitivityAnalysis": "关于边权变动的敏感性分析（如关键边权重变动多少会导致生成树形态改变，替代方案的成本惩罚等）",
  "vulnerabilityScore": 75, // 0-100 整数，网络脆弱性指数（树结构本身无冗余因此脆弱性较高）
  "redundancyAssessment": "关于单点故障（SPOF）与次优生成树（Second-Best MST）冗余替代的评估",
  "recommendations": [
    "针对工程实践的具体优化建议1",
    "建议2",
    "建议3"
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      return res.json({ success: true, analysis: parsed });
    } catch (error: any) {
      console.error("AI Diagnose error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "AI 诊断服务异常"
      });
    }
  });

  // API: AI Generate Graph from Natural Language or Structured Description
  app.post("/api/ai-generate-graph", async (req, res) => {
    try {
      const { description, nodeCount = 7 } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          success: false,
          error: "未配置 GEMINI_API_KEY，请在 Settings > Secrets 中配置。"
        });
      }

      const prompt = `根据用户的需求描述，生成一个连通的无向带权图拓扑数据用于最小生成树 (MST) 分析与教学。
需求描述: "${description}"
推荐节点数量: 约 ${nodeCount} 个节点（确保连通且至少有 |V|-1 到 |V|*(|V|-1)/2 之间的丰富边以供生成树算法推导演示）。
坐标系统: x 范围 [80, 720], y 范围 [80, 480]，请合理排布坐标让图形视觉清晰舒展，避免节点堆叠。

请返回严格合法的 JSON，结构如下：
{
  "name": "案例名称",
  "unit": "权值单位 (如: 万元/km, ms, 万元, mm)",
  "description": "案例背景描述",
  "nodes": [
    { "id": "A", "label": "北京枢纽", "x": 400, "y": 120, "type": "hub" }
  ],
  "edges": [
    { "id": "e1", "source": "A", "target": "B", "weight": 24.5, "label": "光缆干线1" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      return res.json({ success: true, graph: parsed });
    } catch (error: any) {
      console.error("AI Generate Graph error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "生成图拓扑失败"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
