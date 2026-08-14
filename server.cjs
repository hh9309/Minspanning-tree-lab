var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app.post("/api/ai-diagnose", async (req, res) => {
    try {
      const { graphData, mstData, algorithm, caseContext } = req.body;
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          success: true,
          isMock: true,
          analysis: {
            title: "\u6700\u5C0F\u751F\u6210\u6811\u62D3\u6251\u4E0E\u5DE5\u7A0B\u8FD0\u7B79\u5B66\u8BCA\u65AD\u62A5\u544A (\u542F\u53D1\u5F0F\u8BC4\u4F30)",
            summary: `\u5F53\u524D\u7F51\u7EDC\u5305\u542B ${graphData.nodes?.length || 0} \u4E2A\u8282\u70B9\u4E0E ${graphData.edges?.length || 0} \u6761\u53EF\u884C\u8FB9\u3002\u8BA1\u7B97\u5F97\u5230\u6700\u5C0F\u751F\u6210\u6811\u603B\u6743\u503C\u4E3A ${mstData.totalWeight ?? "N/A"}\uFF0C\u5305\u542B ${mstData.selectedEdges?.length || 0} \u6761\u9AA8\u5E72\u8FB9\u3002`,
            criticalEdges: mstData.selectedEdges?.slice(0, 3).map((e) => ({
              edge: `${e.source} - ${e.target}`,
              weight: e.weight,
              reason: "\u4F5C\u4E3A\u5272\u96C6\u7684\u552F\u4E00\u6700\u8F7B\u8FB9\uFF0C\u6B64\u8FB9\u82E5\u53D7\u635F\u5C06\u5BFC\u81F4\u56FE\u5206\u88C2\u4E3A\u4E24\u4E2A\u72EC\u7ACB\u8FDE\u901A\u5206\u91CF\uFF0C\u5C5E\u4E8E\u5173\u952E\u8FDE\u901A\u5361\u53E3\uFF08Bridge\uFF09\u3002"
            })) || [],
            sensitivityAnalysis: `\u74F6\u9888\u8FB9\u6743\u91CD\u4E0A\u6D6E\u5BB9\u5FCD\u5EA6\u53D6\u51B3\u4E8E\u975E\u6811\u8FB9\u5728\u5BF9\u5E94\u57FA\u672C\u56DE\u8DEF\u4E2D\u7684\u6781\u5C0F\u5DEE\u503C\uFF1B\u4E00\u65E6\u6743\u503C\u8D85\u8FC7\u73AF\u4E0A\u66FF\u4EE3\u8FB9\uFF0CMST \u7ED3\u6784\u5C06\u53D1\u751F\u62D3\u6251\u8DC3\u8FC1\u3002`,
            vulnerabilityScore: 78,
            recommendations: [
              "\u5EFA\u8BAE\u5728\u6838\u5FC3\u5361\u53E3\u8282\u70B9\u4E4B\u95F4\u589E\u8BBE 1~2 \u6761\u5907\u7528\u5197\u4F59\u94FE\u8DEF\uFF0C\u6784\u6210 2-\u8FDE\u901A\u62D3\u6251\u4EE5\u9632\u5355\u70B9\u6545\u969C\u3002",
              "\u9488\u5BF9\u6743\u503C\u8FC7\u5927\u7684\u74F6\u9888\u8FB9\uFF08Bottleneck Edge\uFF09\uFF0C\u5EFA\u8BAE\u8FDB\u884C\u8DEF\u7531\u6210\u672C\u590D\u6838\u6216\u5206\u6D41\u5206\u644A\u3002",
              "\u5BF9\u4E8E\u5EA6\u6570\u5927\u4E8E 4 \u7684\u9AD8\u96C6\u805A\u4E2D\u5FC3\u8282\u70B9\uFF0C\u5EFA\u8BAE\u63D0\u5347\u4EA4\u6362\u8BBE\u5907\u541E\u5410\u5BB9\u9650\u3002"
            ]
          }
        });
      }
      const prompt = `\u4F60\u662F\u4E00\u4F4D\u4E16\u754C\u9876\u7EA7\u7684\u8FD0\u7B79\u5B66\u4E0E\u7F51\u7EDC\u6D41\u4F18\u5316\u4E13\u5BB6\u3001\u56FE\u8BBA\u7B97\u6CD5\u67B6\u6784\u5E08\u3002
\u8BF7\u5BF9\u4EE5\u4E0B\u65E0\u5411\u5E26\u6743\u7F51\u7EDC\u53CA\u5176\u8BA1\u7B97\u5F97\u5230\u7684\u6700\u5C0F\u751F\u6210\u6811 (MST) \u8FDB\u884C\u6DF1\u5165\u7684\u5DE5\u7A0B\u4E0E\u8FD0\u7B79\u5B66\u8BCA\u65AD\uFF1A

\u3010\u5E94\u7528\u80CC\u666F / \u6848\u4F8B\u3011: ${caseContext || "\u901A\u7528\u56FE\u8BBA\u7F51\u7EDC\u62D3\u6251"}
\u3010\u6C42\u89E3\u7B97\u6CD5\u3011: ${algorithm || "Kruskal / Prim"}
\u3010\u7F51\u7EDC\u57FA\u672C\u53C2\u6570\u3011:
- \u8282\u70B9\u6570: ${graphData.nodes?.length || 0}
- \u8FB9\u6570: ${graphData.edges?.length || 0}
- \u6240\u6709\u8FB9\u53CA\u6743\u503C: ${JSON.stringify(graphData.edges || [])}
- \u6700\u5C0F\u751F\u6210\u6811\u9009\u4E2D\u8FB9 (${mstData.selectedEdges?.length || 0} \u6761): ${JSON.stringify(mstData.selectedEdges || [])}
- \u6700\u5C0F\u751F\u6210\u6811\u603B\u6743\u91CD: ${mstData.totalWeight}

\u8BF7\u8FD4\u56DE\u4E25\u683C\u5408\u6CD5\u7684 JSON \u683C\u5F0F\u6570\u636E\uFF0C\u7ED3\u6784\u5982\u4E0B\uFF1A
{
  "title": "\u62A5\u544A\u6807\u9898",
  "summary": "200\u5B57\u4EE5\u5185\u7684\u4E13\u4E1A\u8FD0\u7B79\u5B66\u603B\u7ED3\uFF0C\u6DB5\u76D6\u5168\u7F51\u6700\u5C0F\u6210\u672C\u7279\u6027\u4E0E\u8FDE\u901A\u72B6\u6001",
  "criticalEdges": [
    {
      "edge": "\u8282\u70B9A - \u8282\u70B9B",
      "weight": 12.5,
      "reason": "\u4E3A\u4EC0\u4E48\u8FD9\u662F\u5173\u952E\u5361\u53E3\u8FB9/\u5272\u8FB9\uFF08Cut Edge\uFF09\uFF0C\u5BF9\u5168\u7F51\u9C81\u68D2\u6027\u7684\u5F71\u54CD"
    }
  ],
  "sensitivityAnalysis": "\u5173\u4E8E\u8FB9\u6743\u53D8\u52A8\u7684\u654F\u611F\u6027\u5206\u6790\uFF08\u5982\u5173\u952E\u8FB9\u6743\u91CD\u53D8\u52A8\u591A\u5C11\u4F1A\u5BFC\u81F4\u751F\u6210\u6811\u5F62\u6001\u6539\u53D8\uFF0C\u66FF\u4EE3\u65B9\u6848\u7684\u6210\u672C\u60E9\u7F5A\u7B49\uFF09",
  "vulnerabilityScore": 75, // 0-100 \u6574\u6570\uFF0C\u7F51\u7EDC\u8106\u5F31\u6027\u6307\u6570\uFF08\u6811\u7ED3\u6784\u672C\u8EAB\u65E0\u5197\u4F59\u56E0\u6B64\u8106\u5F31\u6027\u8F83\u9AD8\uFF09
  "redundancyAssessment": "\u5173\u4E8E\u5355\u70B9\u6545\u969C\uFF08SPOF\uFF09\u4E0E\u6B21\u4F18\u751F\u6210\u6811\uFF08Second-Best MST\uFF09\u5197\u4F59\u66FF\u4EE3\u7684\u8BC4\u4F30",
  "recommendations": [
    "\u9488\u5BF9\u5DE5\u7A0B\u5B9E\u8DF5\u7684\u5177\u4F53\u4F18\u5316\u5EFA\u8BAE1",
    "\u5EFA\u8BAE2",
    "\u5EFA\u8BAE3"
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      return res.json({ success: true, analysis: parsed });
    } catch (error) {
      console.error("AI Diagnose error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "AI \u8BCA\u65AD\u670D\u52A1\u5F02\u5E38"
      });
    }
  });
  app.post("/api/ai-generate-graph", async (req, res) => {
    try {
      const { description, nodeCount = 7 } = req.body;
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(400).json({
          success: false,
          error: "\u672A\u914D\u7F6E GEMINI_API_KEY\uFF0C\u8BF7\u5728 Settings > Secrets \u4E2D\u914D\u7F6E\u3002"
        });
      }
      const prompt = `\u6839\u636E\u7528\u6237\u7684\u9700\u6C42\u63CF\u8FF0\uFF0C\u751F\u6210\u4E00\u4E2A\u8FDE\u901A\u7684\u65E0\u5411\u5E26\u6743\u56FE\u62D3\u6251\u6570\u636E\u7528\u4E8E\u6700\u5C0F\u751F\u6210\u6811 (MST) \u5206\u6790\u4E0E\u6559\u5B66\u3002
\u9700\u6C42\u63CF\u8FF0: "${description}"
\u63A8\u8350\u8282\u70B9\u6570\u91CF: \u7EA6 ${nodeCount} \u4E2A\u8282\u70B9\uFF08\u786E\u4FDD\u8FDE\u901A\u4E14\u81F3\u5C11\u6709 |V|-1 \u5230 |V|*(|V|-1)/2 \u4E4B\u95F4\u7684\u4E30\u5BCC\u8FB9\u4EE5\u4F9B\u751F\u6210\u6811\u7B97\u6CD5\u63A8\u5BFC\u6F14\u793A\uFF09\u3002
\u5750\u6807\u7CFB\u7EDF: x \u8303\u56F4 [80, 720], y \u8303\u56F4 [80, 480]\uFF0C\u8BF7\u5408\u7406\u6392\u5E03\u5750\u6807\u8BA9\u56FE\u5F62\u89C6\u89C9\u6E05\u6670\u8212\u5C55\uFF0C\u907F\u514D\u8282\u70B9\u5806\u53E0\u3002

\u8BF7\u8FD4\u56DE\u4E25\u683C\u5408\u6CD5\u7684 JSON\uFF0C\u7ED3\u6784\u5982\u4E0B\uFF1A
{
  "name": "\u6848\u4F8B\u540D\u79F0",
  "unit": "\u6743\u503C\u5355\u4F4D (\u5982: \u4E07\u5143/km, ms, \u4E07\u5143, mm)",
  "description": "\u6848\u4F8B\u80CC\u666F\u63CF\u8FF0",
  "nodes": [
    { "id": "A", "label": "\u5317\u4EAC\u67A2\u7EBD", "x": 400, "y": 120, "type": "hub" }
  ],
  "edges": [
    { "id": "e1", "source": "A", "target": "B", "weight": 24.5, "label": "\u5149\u7F06\u5E72\u7EBF1" }
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      return res.json({ success: true, graph: parsed });
    } catch (error) {
      console.error("AI Generate Graph error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "\u751F\u6210\u56FE\u62D3\u6251\u5931\u8D25"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
