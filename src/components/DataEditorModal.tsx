import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Download,
  Grid,
  FileSpreadsheet,
  Network,
  RotateCcw,
  Check
} from "lucide-react";
import * as XLSX from "xlsx";
import { GraphData, GraphNode, GraphEdge } from "../types";

interface DataEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: GraphData;
  onUpdateGraph: (newGraph: GraphData) => void;
}

export const DataEditorModal: React.FC<DataEditorModalProps> = ({
  isOpen,
  onClose,
  graph,
  onUpdateGraph,
}) => {
  const [activeTab, setActiveTab] = useState<"edgelist" | "matrix" | "import" | "generator">("edgelist");

  // Local draft state
  const [nodes, setNodes] = useState<GraphNode[]>(graph.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(graph.edges);
  const [graphName, setGraphName] = useState(graph.name);
  const [graphUnit, setGraphUnit] = useState(graph.unit);

  // New Edge input state
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newWeight, setNewWeight] = useState<number>(10);
  const [newLabel, setNewLabel] = useState("");

  // New Node input state
  const [newNodeId, setNewNodeId] = useState("");
  const [newNodeLabel, setNewNodeLabel] = useState("");

  // Generator config
  const [genType, setGenType] = useState<"complete" | "grid" | "circle" | "random">("circle");
  const [genNodeCount, setGenNodeCount] = useState(6);

  if (!isOpen) return null;

  const handleAddEdge = () => {
    if (!newSource || !newTarget || newSource === newTarget) return;
    const edgeId = `e_${Date.now()}`;
    const newEdge: GraphEdge = {
      id: edgeId,
      source: newSource,
      target: newTarget,
      weight: Number(newWeight) || 1,
      label: newLabel || undefined,
    };
    setEdges([...edges, newEdge]);
    setNewLabel("");
  };

  const handleDeleteEdge = (id: string) => {
    setEdges(edges.filter((e) => e.id !== id));
  };

  const handleAddNode = () => {
    if (!newNodeId || nodes.some((n) => n.id === newNodeId)) return;
    const newNode: GraphNode = {
      id: newNodeId,
      label: newNodeLabel || `节点 ${newNodeId}`,
      x: Math.round(150 + Math.random() * 500),
      y: Math.round(100 + Math.random() * 350),
      type: "default",
    };
    setNodes([...nodes, newNode]);
    setNewNodeId("");
    setNewNodeLabel("");
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
  };

  const handleSaveAndApply = () => {
    onUpdateGraph({
      ...graph,
      name: graphName,
      unit: graphUnit,
      nodes,
      edges,
    });
    onClose();
  };

  // Matrix Cell Weight Update
  const handleMatrixCellChange = (uId: string, vId: string, valStr: string) => {
    if (uId === vId) return;
    const val = parseFloat(valStr);

    const existingIndex = edges.findIndex(
      (e) => (e.source === uId && e.target === vId) || (e.source === vId && e.target === uId)
    );

    if (isNaN(val) || val <= 0) {
      // Remove edge
      if (existingIndex >= 0) {
        setEdges(edges.filter((_, idx) => idx !== existingIndex));
      }
    } else {
      if (existingIndex >= 0) {
        const updated = [...edges];
        updated[existingIndex] = { ...updated[existingIndex], weight: val };
        setEdges(updated);
      } else {
        setEdges([
          ...edges,
          {
            id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            source: uId,
            target: vId,
            weight: val,
            label: `${uId}-${vId}`,
          },
        ]);
      }
    }
  };

  // Excel / CSV File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          alert("Excel 文件内容为空！");
          return;
        }

        // Auto map columns
        const nodeSet = new Set<string>();
        const importedEdges: GraphEdge[] = [];

        rawData.forEach((row, idx) => {
          const source = String(row["source"] || row["起点"] || row["源节点"] || row["From"] || row["u"] || "");
          const target = String(row["target"] || row["终点"] || row["目标节点"] || row["To"] || row["v"] || "");
          const weight = parseFloat(row["weight"] || row["权重"] || row["权值"] || row["Cost"] || row["w"] || 10);
          const label = String(row["label"] || row["业务标签"] || row["名称"] || "");

          if (source && target && source !== target) {
            nodeSet.add(source);
            nodeSet.add(target);
            importedEdges.push({
              id: `imp_e_${idx + 1}`,
              source,
              target,
              weight: isNaN(weight) ? 10 : weight,
              label: label || undefined,
            });
          }
        });

        const nodeArr = Array.from(nodeSet);
        const count = nodeArr.length;
        const importedNodes: GraphNode[] = nodeArr.map((id, i) => {
          const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
          return {
            id,
            label: id,
            x: Math.round(400 + Math.min(220, count * 26) * Math.cos(angle)),
            y: Math.round(260 + Math.min(220, count * 26) * Math.sin(angle)),
            type: "default",
          };
        });

        setNodes(importedNodes);
        setEdges(importedEdges);
        setGraphName(file.name.replace(/\.[^/.]+$/, ""));
        alert(`成功导入 ${importedNodes.length} 个节点与 ${importedEdges.length} 条边！`);
      } catch (err: any) {
        alert(`解析文件失败: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Fast Graph Generators
  const handleGenerateGraph = () => {
    const n = Math.max(3, Math.min(16, genNodeCount));
    const generatedNodes: GraphNode[] = [];
    const generatedEdges: GraphEdge[] = [];

    const centerX = 400;
    const centerY = 260;
    const radius = Math.min(200, n * 24);

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      generatedNodes.push({
        id: `v${i + 1}`,
        label: `节点 v${i + 1}`,
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle)),
        type: i === 0 ? "hub" : "default",
      });
    }

    if (genType === "circle") {
      // Ring + chords
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        generatedEdges.push({
          id: `ge_${i}_${next}`,
          source: generatedNodes[i].id,
          target: generatedNodes[next].id,
          weight: Math.floor(5 + Math.random() * 15),
          label: `环边 ${i + 1}-${next + 1}`,
        });
      }
      // Add a few chords
      for (let i = 0; i < Math.floor(n / 2); i++) {
        const opp = (i + Math.floor(n / 2)) % n;
        generatedEdges.push({
          id: `chord_${i}_${opp}`,
          source: generatedNodes[i].id,
          target: generatedNodes[opp].id,
          weight: Math.floor(18 + Math.random() * 20),
          label: `对角弦`,
        });
      }
    } else if (genType === "complete") {
      // Complete graph Kn
      let edgeCounter = 1;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          generatedEdges.push({
            id: `k_${i}_${j}`,
            source: generatedNodes[i].id,
            target: generatedNodes[j].id,
            weight: Math.floor(3 + Math.random() * 30),
            label: `K_${edgeCounter++}`,
          });
        }
      }
    } else if (genType === "grid") {
      // Grid lattice
      const cols = Math.ceil(Math.sqrt(n));
      const startX = 160;
      const startY = 100;
      const gapX = 140;
      const gapY = 110;
      generatedNodes.forEach((node, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        node.x = startX + c * gapX;
        node.y = startY + r * gapY;
      });
      // Horizontal & vertical grid connections
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        // Right neighbor
        if (c + 1 < cols && i + 1 < n) {
          generatedEdges.push({
            id: `gh_${i}`,
            source: generatedNodes[i].id,
            target: generatedNodes[i + 1].id,
            weight: Math.floor(4 + Math.random() * 16),
          });
        }
        // Bottom neighbor
        if (i + cols < n) {
          generatedEdges.push({
            id: `gv_${i}`,
            source: generatedNodes[i].id,
            target: generatedNodes[i + cols].id,
            weight: Math.floor(4 + Math.random() * 16),
          });
        }
      }
    } else {
      // Random Geometric Graph
      for (let i = 0; i < n; i++) {
        generatedNodes[i].x = Math.round(100 + Math.random() * 600);
        generatedNodes[i].y = Math.round(80 + Math.random() * 380);
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dist = Math.hypot(
            generatedNodes[i].x - generatedNodes[j].x,
            generatedNodes[i].y - generatedNodes[j].y
          );
          if (dist < 260 || Math.random() < 0.3) {
            generatedEdges.push({
              id: `geo_${i}_${j}`,
              source: generatedNodes[i].id,
              target: generatedNodes[j].id,
              weight: Math.max(1, Math.round(dist / 14)),
            });
          }
        }
      }
    }

    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setGraphName(`随机拓扑 [${genType.toUpperCase()} - ${n}阶]`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E2E4E8] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                多模式建图与数据沙盒 (Graph Data Sandbox)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                支持交互边列表、邻接矩阵微调、Excel 批量导入与参数化随机网络生成
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

        {/* Global Metadata inputs */}
        <div className="px-5 py-2.5 bg-[#F8F9FA] border-b border-[#E2E4E8] flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">网络名称:</span>
            <input
              type="text"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              className="bg-white text-slate-900 px-2.5 py-1 rounded border border-[#E2E4E8] outline-none w-48 font-medium shadow-2xs focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">权值单位:</span>
            <input
              type="text"
              value={graphUnit}
              onChange={(e) => setGraphUnit(e.target.value)}
              className="bg-white text-emerald-700 px-2.5 py-1 rounded border border-[#E2E4E8] outline-none w-28 font-mono font-bold shadow-2xs focus:border-blue-500"
            />
          </div>
          <div className="ml-auto text-slate-500 font-mono">
            规模: <strong className="text-blue-700 font-bold">{nodes.length}</strong> 点 /{" "}
            <strong className="text-blue-700 font-bold">{edges.length}</strong> 边
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E4E8] bg-white px-4">
          <button
            onClick={() => setActiveTab("edgelist")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "edgelist"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Network className="w-4 h-4" />
            <span>边列表交互表格</span>
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "matrix"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>邻接矩阵编辑器</span>
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "import"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Excel / CSV 批量导入</span>
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "generator"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>拓扑快速生成器</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto min-h-[360px] bg-[#F4F5F7]">
          {/* TAB 1: EDGE LIST & NODE LIST */}
          {activeTab === "edgelist" && (
            <div className="flex flex-col gap-4">
              {/* Add Node Sub-bar */}
              <div className="bg-white p-3 rounded-xl border border-[#E2E4E8] flex items-center gap-3 text-xs shadow-xs flex-wrap">
                <span className="font-bold text-slate-800">添加顶点:</span>
                <input
                  type="text"
                  placeholder="节点ID (如 A1)"
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                  className="bg-[#F8F9FA] text-slate-900 px-2.5 py-1 rounded border border-[#E2E4E8] w-28 font-mono outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="节点名称 (如 浦东主站)"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  className="bg-[#F8F9FA] text-slate-900 px-2.5 py-1 rounded border border-[#E2E4E8] w-36 outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddNode}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加点</span>
                </button>
              </div>

              {/* Add Edge Sub-bar */}
              <div className="bg-white p-3 rounded-xl border border-[#E2E4E8] flex items-center gap-3 text-xs flex-wrap shadow-xs">
                <span className="font-bold text-slate-800">添加边:</span>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="bg-[#F8F9FA] text-slate-800 px-2.5 py-1 rounded border border-[#E2E4E8] font-mono outline-none"
                >
                  <option value="">选择起点</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} ({n.label})
                    </option>
                  ))}
                </select>
                <span className="text-slate-400 font-bold">↔</span>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="bg-[#F8F9FA] text-slate-800 px-2.5 py-1 rounded border border-[#E2E4E8] font-mono outline-none"
                >
                  <option value="">选择终点</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} ({n.label})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="权值"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                  className="bg-[#F8F9FA] text-emerald-700 font-mono font-bold px-2.5 py-1 rounded border border-[#E2E4E8] w-20 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="业务标签 (选填)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="bg-[#F8F9FA] text-slate-900 px-2.5 py-1 rounded border border-[#E2E4E8] w-32 outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddEdge}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加边</span>
                </button>
              </div>

              {/* Existing Edges Table */}
              <div className="border border-[#E2E4E8] rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="sticky top-0 bg-[#F8F9FA] text-slate-600 border-b border-[#E2E4E8] font-bold">
                      <tr>
                        <th className="p-2.5">边序号</th>
                        <th className="p-2.5">起点 (u)</th>
                        <th className="p-2.5">终点 (v)</th>
                        <th className="p-2.5">权重 w(e)</th>
                        <th className="p-2.5">标签说明</th>
                        <th className="p-2.5 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E8] text-slate-700">
                      {edges.map((edge, idx) => (
                        <tr key={edge.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-400">e_{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">{edge.source}</td>
                          <td className="p-2.5 font-bold text-slate-900">{edge.target}</td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={edge.weight}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setEdges(
                                  edges.map((item) =>
                                    item.id === edge.id ? { ...item, weight: val } : item
                                  )
                                );
                              }}
                              className="bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E4E8] text-emerald-700 font-bold w-20 outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="p-2.5 font-sans text-slate-500">{edge.label || "-"}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleDeleteEdge(edge.id)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 transition"
                              title="删除此边"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADJACENCY MATRIX */}
          {activeTab === "matrix" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-600">
                💡 <strong>对称邻接矩阵</strong>：单元格数值代表两节点间的边权。输入大于 0 的数值自动建立/修改边，输入 0 或清空则删除边。
              </p>
              <div className="overflow-x-auto border border-[#E2E4E8] rounded-xl p-3 bg-white shadow-xs">
                <table className="text-xs border-collapse font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 bg-[#F8F9FA] border border-[#E2E4E8] text-slate-600 font-bold">G</th>
                      {nodes.map((n) => (
                        <th key={n.id} className="p-2 bg-[#F8F9FA] border border-[#E2E4E8] text-blue-700 font-bold min-w-[52px] text-center">
                          {n.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((rowNode) => (
                      <tr key={rowNode.id}>
                        <th className="p-2 bg-[#F8F9FA] border border-[#E2E4E8] text-blue-700 font-bold text-center">
                          {rowNode.id}
                        </th>
                        {nodes.map((colNode) => {
                          const isDiagonal = rowNode.id === colNode.id;
                          const foundEdge = edges.find(
                            (e) =>
                              (e.source === rowNode.id && e.target === colNode.id) ||
                              (e.source === colNode.id && e.target === rowNode.id)
                          );

                          return (
                            <td
                              key={colNode.id}
                              className={`p-1 border border-[#E2E4E8] text-center ${
                                isDiagonal ? "bg-slate-100" : foundEdge ? "bg-emerald-50/50" : "bg-white"
                              }`}
                            >
                              {isDiagonal ? (
                                <span className="text-slate-400 font-bold">-</span>
                              ) : (
                                <input
                                  type="text"
                                  value={foundEdge ? foundEdge.weight : ""}
                                  placeholder="∞"
                                  onChange={(e) =>
                                    handleMatrixCellChange(rowNode.id, colNode.id, e.target.value)
                                  }
                                  className="w-12 text-center bg-transparent text-emerald-700 font-bold outline-none border-b border-transparent focus:border-blue-500 placeholder:text-slate-300"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EXCEL / CSV IMPORT */}
          {activeTab === "import" && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#E2E4E8] rounded-2xl bg-white text-center gap-4 shadow-xs">
              <div className="p-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  上传 Excel (.xlsx / .xls) 或 CSV 文件批量建图
                </h4>
                <p className="text-xs text-slate-500 max-w-md">
                  表格需包含列名：<strong>起点 (source), 终点 (target), 权重 (weight), 标签 (label)</strong>。系统将自动提取端点并完成拓扑布局。
                </p>
              </div>

              <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition">
                <span>选择本地表格文件</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 4: FAST TOPOLOGY GENERATOR */}
          {activeTab === "generator" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: "circle", label: "环状 + 弦图 (Ring)", desc: "环状骨干附带内部对角跨越弦" },
                  { type: "complete", label: "完全图 Kn", desc: "任意两点均有边，边数密集 O(V²)" },
                  { type: "grid", label: "网格拓扑 (Grid)", desc: "规则网格阵列，多见于供电管网" },
                  { type: "random", label: "随机几何图 (Geometric)", desc: "空间欧几里得随机邻域散点" },
                ].map((g) => (
                  <button
                    key={g.type}
                    onClick={() => setGenType(g.type as any)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      genType === g.type
                        ? "bg-blue-50/50 border-blue-500 text-blue-900 shadow-xs"
                        : "bg-white border-[#E2E4E8] text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-bold text-xs mb-1 block">{g.label}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">{g.desc}</span>
                  </button>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E4E8] flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">顶点数量 (|V|):</span>
                  <input
                    type="range"
                    min="4"
                    max="14"
                    value={genNodeCount}
                    onChange={(e) => setGenNodeCount(parseInt(e.target.value, 10))}
                    className="w-32 accent-blue-600"
                  />
                  <span className="font-mono text-blue-700 font-bold text-sm">
                    {genNodeCount} 个顶点
                  </span>
                </div>

                <button
                  onClick={handleGenerateGraph}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  一键生成随机网络
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E2E4E8] flex items-center justify-between bg-[#F8F9FA]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E4E8] transition shadow-2xs"
          >
            取消修改
          </button>
          <button
            onClick={handleSaveAndApply}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
          >
            <Check className="w-4 h-4" />
            <span>保存并应用拓扑数据</span>
          </button>
        </div>
      </div>
    </div>
  );
};
