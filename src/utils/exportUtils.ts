import * as XLSX from "xlsx";
import type { RefObject } from "react";
import { GraphData, SolverResult } from "../types";

/**
 * Export full Graph and MST Solver Results to a formatted Excel file
 */
export function exportToExcel(graph: GraphData, result: SolverResult, filename: string = "最小生成树全过程运筹求解与审计报告.xlsx") {
  const wb = XLSX.utils.book_new();

  const mstEdgeSet = new Set(result.mstEdges.map((e) => e.id));

  // 1. Edge List Sheet
  const edgeRows = graph.edges.map((e) => ({
    边ID: e.id,
    起点: e.source,
    终点: e.target,
    权重: e.weight,
    业务标签: e.label || "",
    "是否属于MST (最小生成树)": mstEdgeSet.has(e.id) ? "★ 选中入树" : "未选入 (非树边)",
  }));
  const wsEdges = XLSX.utils.json_to_sheet(edgeRows);
  XLSX.utils.book_append_sheet(wb, wsEdges, "1-边列表与生成树标记");

  // 2. Node Info & Degree Sheet
  const degreeMap: Record<string, number> = {};
  graph.nodes.forEach((n) => (degreeMap[n.id] = 0));
  result.mstEdges.forEach((e) => {
    if (degreeMap[e.source] !== undefined) degreeMap[e.source]++;
    if (degreeMap[e.target] !== undefined) degreeMap[e.target]++;
  });

  const nodeRows = graph.nodes.map((n) => ({
    节点ID: n.id,
    名称: n.label,
    X坐标: Math.round(n.x),
    Y坐标: Math.round(n.y),
    节点类型: n.type || "default",
    "生成树度数 (MST Degree)": degreeMap[n.id] || 0,
    "拓扑角色": (degreeMap[n.id] || 0) === 1 ? "叶子节点 (Leaf/终端)" : (degreeMap[n.id] || 0) >= 3 ? "汇聚中心 (Hub/中枢)" : "中继节点 (Relay)",
  }));
  const wsNodes = XLSX.utils.json_to_sheet(nodeRows);
  XLSX.utils.book_append_sheet(wb, wsNodes, "2-节点拓扑与度数统计");

  // 3. Step Execution Log Sheet
  const stepRows = result.steps.map((s) => ({
    步骤序号: s.step,
    决策动作: s.action,
    步骤标题: s.title,
    详细推导逻辑: s.description,
    "当前累积权值": s.currentWeight,
  }));
  const wsSteps = XLSX.utils.json_to_sheet(stepRows);
  XLSX.utils.book_append_sheet(wb, wsSteps, "3-算法逐步推导日志");

  // 4. Summary Metrics Sheet
  const summaryRows = [
    { 指标名称: "工程/网络名称", 指标数值: graph.name },
    { 指标名称: "权值物理单位", 指标数值: graph.unit },
    { 指标名称: "求解算法", 指标数值: result.algorithm.toUpperCase() },
    { 指标名称: "网络顶点总数 |V|", 指标数值: graph.nodes.length },
    { 指标名称: "可行边总数 |E|", 指标数值: graph.edges.length },
    { 指标名称: "最小生成树边数 |V|-1", 指标数值: result.mstEdges.length },
    { 指标名称: "全网总权值极小值 min ∑w(e)", 指标数值: result.totalWeight },
    { 指标名称: "最重瓶颈边 (Bottleneck Edge)", 指标数值: result.bottleneckEdge ? `(${result.bottleneckEdge.source}, ${result.bottleneckEdge.target}) 权值=${result.bottleneckEdge.weight}` : "无" },
    { 指标名称: "算法执行耗时 (ms)", 指标数值: `${result.executionTimeMs} ms` },
    { 指标名称: "生成树无环全连通性校验", 指标数值: result.isOptimal ? "通过 (Optimal MST)" : "部分连通 (Forest)" },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "4-运筹优化汇总指标");

  // 5. Non-Tree Edge Sensitivity Sheet
  const nonTreeRows = graph.edges
    .filter((e) => !mstEdgeSet.has(e.id))
    .map((e) => ({
      非树边ID: e.id,
      端点: `${e.source} ↔ ${e.target}`,
      边权值: e.weight,
      业务标签: e.label || "-",
      舍弃定理: "圈性质 (Cycle Property) - 权值严格大于环上已有树边",
      备份容灾潜力: e.weight <= result.totalWeight * 0.3 ? "高 (成本较低)" : "中/低 (备选建设)",
    }));
  const wsNonTree = XLSX.utils.json_to_sheet(nonTreeRows);
  XLSX.utils.book_append_sheet(wb, wsNonTree, "5-冗余非树边与灵敏度");

  // Trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Export CSV
 */
export function exportToCSV(graph: GraphData, result: SolverResult, filename: string = "mst_edges.csv") {
  const mstEdgeSet = new Set(result.mstEdges.map((e) => e.id));
  const headers = ["EdgeID", "Source", "Target", "Weight", "Label", "In_MST", "Unit"];
  const rows = graph.edges.map((e) => [
    e.id,
    e.source,
    e.target,
    e.weight,
    `"${e.label || ""}"`,
    mstEdgeSet.has(e.id) ? "1" : "0",
    graph.unit,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export SVG vector diagram
 */
export function exportToSVG(
  svgElementOrRef: RefObject<SVGSVGElement | null> | SVGSVGElement | null | undefined,
  filename: string = "mst_topology.svg"
) {
  const el = (svgElementOrRef && "current" in svgElementOrRef) ? svgElementOrRef.current : (svgElementOrRef as SVGSVGElement | null);
  if (!el) {
    alert("无法获取 SVG 画布元素");
    return;
  }

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(el);

  // Add namespaces if missing
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export const exportSVG = exportToSVG;

/**
 * Generate comprehensive Markdown Audit Report with at least 6 structured sections
 */
export function generateMarkdownReport(graph: GraphData, result: SolverResult): string {
  const mstEdgeSet = new Set(result.mstEdges.map((e) => e.id));

  // Compute node degree in MST
  const nodeDegrees: Record<string, number> = {};
  graph.nodes.forEach((n) => (nodeDegrees[n.id] = 0));
  result.mstEdges.forEach((e) => {
    if (nodeDegrees[e.source] !== undefined) nodeDegrees[e.source]++;
    if (nodeDegrees[e.target] !== undefined) nodeDegrees[e.target]++;
  });

  const leafNodes = graph.nodes.filter((n) => (nodeDegrees[n.id] || 0) === 1);
  const hubNodes = graph.nodes.filter((n) => (nodeDegrees[n.id] || 0) >= 3);
  const relayNodes = graph.nodes.filter((n) => (nodeDegrees[n.id] || 0) === 2);

  const nonTreeEdges = graph.edges.filter((e) => !mstEdgeSet.has(e.id));
  const avgEdgeWeight = (result.totalWeight / (result.mstEdges.length || 1)).toFixed(2);
  const density = ((2 * graph.edges.length) / (graph.nodes.length * (graph.nodes.length - 1))).toFixed(3);

  return `# 最小生成树与图论运筹优化全过程审计报告 (MST Optimization & Engineering Audit Report)

**工程项目名称**: ${graph.name}  
**度量物理单位**: ${graph.unit}  
**运筹求解算法**: ${result.algorithm.toUpperCase()} 算法  
**报告审计时间**: ${new Date().toLocaleString("zh-CN")}  
**全连通最优性**: ${result.isOptimal ? "✅ 全局最优解 (Global Optimum, 无环全连通)" : "⚠️ 非完全连通森林 (Spanning Forest)"}  

---

## 第一部分：工程项目背景与网络拓扑基数 (Project Overview & Topology Baseline)

### 1.1 拓扑基础参数
- **网络顶点基数 $|V|$**: ${graph.nodes.length} 个端点 / 站点 / 设备
- **备选走廊边数 $|E|$**: ${graph.edges.length} 条可行敷设路径
- **网络拓扑密度 (Density)**: $D = \\frac{2|E|}{|V|(|V|-1)} = ${density}$（${parseFloat(density) > 0.4 ? "稠密图/网状拓扑" : "稀疏图/树状拓扑"}）
- **骨干目标边数 $|V|-1$**: ${graph.nodes.length - 1} 条（无环树结构充要条件）

### 1.2 节点清单与网络角色划分
| 节点标识 | 节点名称 | 坐标位置 (X, Y) | 树中连接度数 | 运筹拓扑角色 |
| :--- | :--- | :--- | :--- | :--- |
${graph.nodes
  .map((n) => {
    const deg = nodeDegrees[n.id] || 0;
    const role = deg === 1 ? "🍃 叶子终端 (Leaf)" : deg >= 3 ? "🌟 汇聚中枢 (Hub)" : "🔄 中继节点 (Relay)";
    return `| \`${n.id}\` | ${n.label} | (${Math.round(n.x)}, ${Math.round(n.y)}) | **${deg}** | ${role} |`;
  })
  .join("\n")}

- **汇聚中枢节点 (${hubNodes.length}个)**: ${hubNodes.map((n) => `\`${n.id}\`(${n.label})`).join(", ") || "无"}
- **中继转发节点 (${relayNodes.length}个)**: ${relayNodes.map((n) => `\`${n.id}\`(${n.label})`).join(", ") || "无"}
- **叶子边缘终端 (${leafNodes.length}个)**: ${leafNodes.map((n) => `\`${n.id}\`(${n.label})`).join(", ") || "无"}

---

## 第二部分：运筹优化核心指标与目标函数评估 (Operations Research Metrics)

| 评价维度 | 统计值 | 计量单位 | 运筹学释义与工程价值 |
| :--- | :--- | :--- | :--- |
| **最小总建设成本 $\\min \\sum w(e)$** | **${result.totalWeight}** | ${graph.unit} | 目标函数最优值，较全冗余网络大幅节省资金 |
| **MST 骨干选入边数** | **${result.mstEdges.length}** | 条 | 严格等于 $|V|-1$，保证图的连通性且无多余环路 |
| **骨干链路平均成本** | **${avgEdgeWeight}** | ${graph.unit}/条 | 单条骨干走廊的平均建设/权值水平 |
| **最大瓶颈边 $\\max_{e \\in T} w(e)$** | **${result.bottleneckEdge ? result.bottleneckEdge.weight : "N/A"}** | ${graph.unit} | 瓶颈生成树 (MBST) 核心极值，单条最大开销 |
| **算法求解耗时** | **${result.executionTimeMs}** | 毫秒 (ms) | 贪心准则与并查集/优先队列的快速收敛响应 |
| **次优生成树 (Second-Best)** | **${result.secondBestMST ? result.secondBestMST.totalWeight : "-"}** | ${graph.unit} | ${result.secondBestMST ? `替代增量 $\\Delta w = ${result.secondBestMST.weightDiff} ${graph.unit}$` : "无替代方案"} |

---

## 第三部分：最小生成树 (MST) 骨干链路决策清单 (Selected Backbone Edges)

本工程通过 **${result.algorithm.toUpperCase()}** 算法贪心筛选，选入以下 **${result.mstEdges.length}** 条最优骨干边：

| 决策序号 | 起点 $u$ | 终点 $v$ | 边权值 ($w$) | 成本占比 | 链路业务说明 | 选入准则依据 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${result.mstEdges
  .map((e, idx) => {
    const pct = result.totalWeight > 0 ? ((e.weight / result.totalWeight) * 100).toFixed(1) : "0.0";
    return `| #${idx + 1} | \`${e.source}\` | \`${e.target}\` | **${e.weight} ${graph.unit}** | ${pct}% | ${e.label || "主干骨干走廊"} | ★ 割性质轻量跨越边 (Light Edge) |`;
  })
  .join("\n")}

---

## 第四部分：冗余非树边与避环舍弃分析 (Non-Tree Edges & Cycle Elimination)

在候选边集 $E$ 中，共有 **${nonTreeEdges.length}** 条边未被选入生成树，避免了资金重复投入与网络信号环路风暴：

| 备选边ID | 走向端点 | 权值 | 避环舍弃原因与圈性质 (Cycle Property) 证明 | 容灾备份潜力 |
| :--- | :--- | :--- | :--- | :--- |
${nonTreeEdges.length === 0
  ? "| 无 | - | - | 所有可行边均已组成生成树 | - |"
  : nonTreeEdges
      .map((e) => {
        const potential = e.weight <= result.totalWeight * 0.35 ? "🟢 推荐作为首选热备链路" : "🟡 建议作为二级冷备路径";
        return `| \`${e.id}\` | \`${e.source}\` ↔ \`${e.target}\` | **${e.weight} ${graph.unit}** | 与当前生成树构成基本回路，权值为环上最大边（根据圈性质定理舍弃） | ${potential} |`;
      })
      .join("\n")}

---

## 第五部分：算法推导轨迹与分步决策审计 (Step-by-Step Decision Audit)

以下为求解器在执行过程中的完整状态推导审计记录（共 ${result.steps.length} 步决策）：

| 步骤 | 决策动作 | 步骤主题 | 详细推导机制与集合状态 | 累积权值 |
| :--- | :--- | :--- | :--- | :--- |
${result.steps
  .slice(0, 15)
  .map(
    (s) =>
      `| S${s.step} | \`${s.action}\` | ${s.title} | ${s.description.replace(/\|/g, "/")} | **${s.currentWeight} ${graph.unit}** |`
  )
  .join("\n")}
${result.steps.length > 15 ? `\n*(注：因篇幅限制，审计表展示前 15 步决策，完整日志可在 Excel 中查看)*` : ""}

---

## 第六部分：工程实施建议与抗毁性加固方案 (Engineering & Resilience Recommendations)

1. **单点故障 (SPOF) 与关键割边防护**:
   - 生成树具有极小连通性，任意一条树边断开均会导致网络分裂为两个非连通子图。
   - 重点监测度数为 1 的终端节点链路（如 ${leafNodes.slice(0, 3).map((n) => `\`${n.id}\``).join(", ") || "关键边"}）及高负载汇聚中枢。

2. **环路容灾 (Ring Protection) 加固策略**:
   - 建议在预算允许前提下，选取上述第四部分中权值较小的非树边（如权重最小的备选边）作为 **1+1 光保护/热备用链路**，形成双归属保护环。

3. **边权灵敏度与造价波动容忍区间**:
   - 当某条树边的成本上升幅度不超过其基本回路中最小非树边替代差 $\\Delta w$ 时，当前最优生成树拓扑保持不变。

---
*本报告由「最小生成树与图论优化实验室」自动生成，符合运筹学与系统工程国家标准规范。*
`;
}

export const exportToMarkdown = generateMarkdownReport;
