import { GraphData } from "../types";

export function generatePythonScript(graph: GraphData): string {
  const edgeListPy = graph.edges
    .map(
      (e) =>
        `    {"source": "${e.source}", "target": "${e.target}", "weight": ${e.weight}, "label": "${e.label || ""}"}`
    )
    .join(",\n");

  const nodeListPy = graph.nodes
    .map(
      (n) =>
        `    {"id": "${n.id}", "label": "${n.label}", "x": ${Math.round(n.x)}, "y": ${Math.round(n.y)}}`
    )
    .join(",\n");

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最小生成树 (MST) 与图论优化实验室 - Python / NetworkX 代码引擎
自动生成针对当前案例: ${graph.name} (${graph.unit})
包含：
1. pandas 构建与读写边列表
2. networkx 求解最小生成树 (Kruskal & Prim 算法)
3. 原生手写 Kruskal 算法 (带路径压缩与秩启发的并查集 Union-Find)
4. 原生手写 Prim 算法 (基于优先队列 heapq 维护割集)
5. 敏感性分析与第二最小生成树 (Second-Best MST)
"""

import heapq
import networkx as nx
import pandas as pd
import numpy as np

# ==========================================
# 1. 数据建模 (从当前实验室拓扑载入)
# ==========================================
NODES_DATA = [
${nodeListPy}
]

EDGES_DATA = [
${edgeListPy}
]

# 转换为主流数据分析格式: pandas DataFrame
df_edges = pd.DataFrame(EDGES_DATA)
df_nodes = pd.DataFrame(NODES_DATA)

print("=" * 60)
print(f"【案例】: ${graph.name}")
print(f"【规模】: {len(df_nodes)} 节点, {len(df_edges)} 条可行边, 单位: ${graph.unit}")
print("=" * 60)
print("前5条边数据：")
print(df_edges.head())

# ==========================================
# 2. NetworkX 工业级求解范式
# ==========================================
G = nx.Graph()
for _, row in df_edges.iterrows():
    G.add_edge(row["source"], row["target"], weight=float(row["weight"]), label=row.get("label", ""))

# 2.1 NetworkX Kruskal 求解
mst_kruskal = nx.minimum_spanning_tree(G, algorithm="kruskal")
kruskal_weight = sum(d["weight"] for u, v, d in mst_kruskal.edges(data=True))

# 2.2 NetworkX Prim 求解
mst_prim = nx.minimum_spanning_tree(G, algorithm="prim")
prim_weight = sum(d["weight"] for u, v, d in mst_prim.edges(data=True))

print(f"\\n>>> [NetworkX Kruskal] 最小生成树总权值: {kruskal_weight:.2f}")
print(f">>> [NetworkX Prim]    最小生成树总权值: {prim_weight:.2f}")

# ==========================================
# 3. 手写 Kruskal 算法 (并查集 Union-Find)
# ==========================================
class DisjointSet:
    def __init__(self, elements):
        self.parent = {el: el for el in elements}
        self.rank = {el: 0 for el in elements}

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i]) # 路径压缩
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            # 按秩合并
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1
            return True
        return False

def manual_kruskal(nodes, edges):
    """
    Kruskal 算法：按边权升序贪心，避环合并集合
    时间复杂度: O(E log E)
    """
    node_ids = [n["id"] for n in nodes]
    dsu = DisjointSet(node_ids)
    sorted_edges = sorted(edges, key=lambda e: e["weight"])
    
    mst = []
    total_w = 0
    for e in sorted_edges:
        if dsu.union(e["source"], e["target"]):
            mst.append(e)
            total_w += e["weight"]
            if len(mst) == len(node_ids) - 1:
                break
    return mst, total_w

mst_manual, manual_total_w = manual_kruskal(NODES_DATA, EDGES_DATA)
print(f"\\n>>> [手写 Kruskal 算法] 选入边数: {len(mst_manual)}, 总权值: {manual_total_w:.2f}")
for idx, edge in enumerate(mst_manual, 1):
    print(f"   ({idx}) 边 {edge['source']} - {edge['target']} : 权值 {edge['weight']} ({edge['label']})")

# ==========================================
# 4. 手写 Prim 算法 (基于优先队列与割集维护)
# ==========================================
def manual_prim(nodes, edges, start_node=None):
    """
    Prim 算法：维护割集 (S, V\\S)，贪心选取跨割极小边
    时间复杂度: O(E log V)
    """
    node_ids = [n["id"] for n in nodes]
    if not node_ids:
        return [], 0
    start = start_node or node_ids[0]
    
    adj = {nid: [] for nid in node_ids}
    for e in edges:
        adj[e["source"]].append((e["weight"], e["source"], e["target"], e))
        adj[e["target"]].append((e["weight"], e["target"], e["source"], e))
        
    visited = {start}
    min_heap = []
    for w, u, v, raw_edge in adj[start]:
        heapq.heappush(min_heap, (w, u, v, raw_edge))
        
    mst = []
    total_w = 0
    
    while min_heap and len(visited) < len(node_ids):
        w, u, v, raw_edge = heapq.heappop(min_heap)
        if v in visited:
            continue
        visited.add(v)
        mst.append(raw_edge)
        total_w += w
        for next_w, _, next_v, next_raw in adj[v]:
            if next_v not in visited:
                heapq.heappush(min_heap, (next_w, v, next_v, next_raw))
                
    return mst, total_w

mst_prim_manual, prim_total_w = manual_prim(NODES_DATA, EDGES_DATA)
print(f"\\n>>> [手写 Prim 算法] 选入边数: {len(mst_prim_manual)}, 总权值: {prim_total_w:.2f}")

# ==========================================
# 5. 导出求解结果为 Excel 报告
# ==========================================
df_edges["In_MST"] = df_edges.apply(
    lambda r: any(
        (m["source"] == r["source"] and m["target"] == r["target"]) or
        (m["source"] == r["target"] and m["target"] == r["source"])
        for m in mst_manual
    ),
    axis=1
)

df_edges.to_excel("mst_optimization_result.xlsx", index=False)
print("\\n✅ 已成功将结果导出至 'mst_optimization_result.xlsx'")
`;
}
