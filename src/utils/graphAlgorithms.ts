import {
  GraphData,
  GraphNode,
  GraphEdge,
  SolverResult,
  StepLog,
  DSUState,
  DSUSet,
  CycleInfo
} from "../types";

// Palette for DSU components
const COMPONENT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#84CC16", // Lime
];

/**
 * Union-Find (Disjoint Set Union) Helper
 */
export class DisjointSet {
  parent: Record<string, string> = {};
  rank: Record<string, number> = {};

  constructor(elements: string[]) {
    elements.forEach((el) => {
      this.parent[el] = el;
      this.rank[el] = 0;
    });
  }

  find(i: string): string {
    if (this.parent[i] === i) {
      return i;
    }
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      if (this.rank[rootI] < this.rank[rootJ]) {
        this.parent[rootI] = rootJ;
      } else if (this.rank[rootI] > this.rank[rootJ]) {
        this.parent[rootJ] = rootI;
      } else {
        this.parent[rootJ] = rootI;
        this.rank[rootI]++;
      }
      return true;
    }
    return false;
  }

  getState(elements: string[]): DSUState {
    const rootMap: Record<string, string[]> = {};
    elements.forEach((el) => {
      const root = this.find(el);
      if (!rootMap[root]) {
        rootMap[root] = [];
      }
      rootMap[root].push(el);
    });

    const sets: DSUSet[] = Object.keys(rootMap).map((root, index) => ({
      root,
      members: rootMap[root],
      color: COMPONENT_COLORS[index % COMPONENT_COLORS.length],
    }));

    return {
      parent: { ...this.parent },
      rank: { ...this.rank },
      sets,
    };
  }
}

/**
 * Kruskal's Algorithm with detailed execution step generator
 */
export function runKruskal(graph: GraphData): SolverResult {
  const startTime = performance.now();
  const nodeIds = graph.nodes.map((n) => n.id);
  const edges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const dsu = new DisjointSet(nodeIds);

  const steps: StepLog[] = [];
  const mstEdges: GraphEdge[] = [];
  const rejectedEdgeIds: string[] = [];
  let currentWeight = 0;

  // Step 0: Initialization
  steps.push({
    step: 0,
    title: "初始化：边按权重升序排列，建立独立不相交集合",
    description: `共 ${nodeIds.length} 个顶点，${edges.length} 条边。每点构成一个独立连通分量 (集合数 = ${nodeIds.length})。`,
    action: "inspect",
    codeLine: 1,
    highlightEdges: [],
    highlightNodes: [],
    rejectedEdges: [],
    dsuState: dsu.getState(nodeIds),
    currentWeight: 0,
  });

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const rootU = dsu.find(edge.source);
    const rootV = dsu.find(edge.target);
    const stepNum = steps.length;

    // Inspecting edge
    steps.push({
      step: stepNum,
      title: `考察边 e${i + 1}: (${edge.source}, ${edge.target})，权值 = ${edge.weight}`,
      description: `正在通过并查集查找两端点根节点：Find(${edge.source}) = ${rootU}，Find(${edge.target}) = ${rootV}。`,
      edgeId: edge.id,
      action: "inspect",
      codeLine: 4,
      highlightEdges: [...mstEdges.map((e) => e.id), edge.id],
      highlightNodes: [edge.source, edge.target],
      rejectedEdges: [...rejectedEdgeIds],
      dsuState: dsu.getState(nodeIds),
      currentWeight,
    });

    if (rootU !== rootV) {
      // Accept edge
      dsu.union(edge.source, edge.target);
      mstEdges.push(edge);
      currentWeight += edge.weight;

      steps.push({
        step: steps.length,
        title: `【贪心接纳】加入边 (${edge.source}, ${edge.target})`,
        description: `根节点不相同 (${rootU} ≠ ${rootV})，未形成闭合回路。执行 Union 操作合并集合，生成树边数增加至 ${mstEdges.length}/${nodeIds.length - 1}。`,
        edgeId: edge.id,
        action: "accept",
        codeLine: 6,
        highlightEdges: mstEdges.map((e) => e.id),
        highlightNodes: [edge.source, edge.target],
        rejectedEdges: [...rejectedEdgeIds],
        dsuState: dsu.getState(nodeIds),
        currentWeight,
      });

      if (mstEdges.length === nodeIds.length - 1) {
        break;
      }
    } else {
      // Reject edge (forms cycle)
      rejectedEdgeIds.push(edge.id);
      steps.push({
        step: steps.length,
        title: `【避环舍弃】舍弃边 (${edge.source}, ${edge.target})`,
        description: `两端点已处于同一连通分支 (公共根 ${rootU})。加入将导致圈 (Cycle) 形成，根据圈性质直接舍弃此边！`,
        edgeId: edge.id,
        action: "reject",
        codeLine: 8,
        highlightEdges: mstEdges.map((e) => e.id),
        highlightNodes: [edge.source, edge.target],
        rejectedEdges: [...rejectedEdgeIds],
        dsuState: dsu.getState(nodeIds),
        currentWeight,
      });
    }
  }

  // Final Step: Complete
  const isOptimal = mstEdges.length === nodeIds.length - 1 || nodeIds.length <= 1;
  const bottleneckEdge = mstEdges.length > 0 ? [...mstEdges].sort((a, b) => b.weight - a.weight)[0] : undefined;

  steps.push({
    step: steps.length,
    title: isOptimal ? "求解完成：最小生成树构建完毕" : "图非全连通：生成了生成森林 (Spanning Forest)",
    description: `已选入 ${mstEdges.length} 条边，全网总权值极小化为 ${Number(currentWeight.toFixed(2))}。瓶颈边权值为 ${bottleneckEdge ? bottleneckEdge.weight : "N/A"}。`,
    action: "complete",
    codeLine: 10,
    highlightEdges: mstEdges.map((e) => e.id),
    highlightNodes: nodeIds,
    rejectedEdges: rejectedEdgeIds,
    dsuState: dsu.getState(nodeIds),
    currentWeight: Number(currentWeight.toFixed(2)),
  });

  const endTime = performance.now();
  return {
    algorithm: "kruskal",
    steps,
    mstEdges,
    totalWeight: Number(currentWeight.toFixed(2)),
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
    isOptimal,
    bottleneckEdge,
  };
}

/**
 * Prim's Algorithm with Cut Property and priority queue step generator
 */
export function runPrim(graph: GraphData, startNodeId?: string): SolverResult {
  const startTime = performance.now();
  const nodes = graph.nodes;
  if (nodes.length === 0) {
    return {
      algorithm: "prim",
      steps: [],
      mstEdges: [],
      totalWeight: 0,
      executionTimeMs: 0,
      isOptimal: true,
    };
  }

  const rootId = startNodeId || nodes[0].id;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const steps: StepLog[] = [];
  const mstEdges: GraphEdge[] = [];
  let currentWeight = 0;

  const cutS = new Set<string>([rootId]);
  const cutNotS = new Set<string>(nodes.map((n) => n.id).filter((id) => id !== rootId));

  // Step 0: Pick initial root
  steps.push({
    step: 0,
    title: `初始化割集：选定起始根节点 [${rootId}]`,
    description: `将顶点 ${rootId} 置于已选割集 S 中，其余 ${cutNotS.size} 个顶点处于未选割集 V\\S。`,
    action: "cut-grow",
    codeLine: 1,
    highlightEdges: [],
    highlightNodes: [rootId],
    cutS: Array.from(cutS),
    cutNotS: Array.from(cutNotS),
    currentWeight: 0,
  });

  while (cutNotS.size > 0) {
    // Find all cross edges crossing the cut (S, V \ S)
    const candidateEdges: { edge: GraphEdge; fromS: string; toNotS: string }[] = [];

    for (const edge of graph.edges) {
      const uInS = cutS.has(edge.source);
      const vInS = cutS.has(edge.target);

      if (uInS && !vInS) {
        candidateEdges.push({ edge, fromS: edge.source, toNotS: edge.target });
      } else if (!uInS && vInS) {
        candidateEdges.push({ edge, fromS: edge.target, toNotS: edge.source });
      }
    }

    if (candidateEdges.length === 0) {
      // Graph is disconnected
      break;
    }

    // Sort candidate cross edges
    candidateEdges.sort((a, b) => a.edge.weight - b.edge.weight);
    const minCandidate = candidateEdges[0];

    // Step: Inspect Cut frontier
    steps.push({
      step: steps.length,
      title: `割集维护与优先队列扫描：发现 ${candidateEdges.length} 条跨割边缘边`,
      description: `跨越割 (S, V\\S) 的候选边中，最轻边为 (${minCandidate.edge.source}, ${minCandidate.edge.target})，权值 = ${minCandidate.edge.weight}。`,
      action: "inspect",
      codeLine: 4,
      highlightEdges: [...mstEdges.map((e) => e.id), minCandidate.edge.id],
      highlightNodes: [minCandidate.fromS, minCandidate.toNotS],
      cutS: Array.from(cutS),
      cutNotS: Array.from(cutNotS),
      candidateEdges: candidateEdges.map((c) => ({
        edgeId: c.edge.id,
        source: c.edge.source,
        target: c.edge.target,
        weight: c.edge.weight,
      })),
      currentWeight,
    });

    // Step: Grow Cut S
    cutS.add(minCandidate.toNotS);
    cutNotS.delete(minCandidate.toNotS);
    mstEdges.push(minCandidate.edge);
    currentWeight += minCandidate.edge.weight;

    steps.push({
      step: steps.length,
      title: `【割性质定理采纳】吸纳节点 [${minCandidate.toNotS}] 并加入边 (${minCandidate.edge.source}, ${minCandidate.edge.target})`,
      description: `依据割性质 (Cut Property)：跨越割的权重最小边必定属于某棵最小生成树。割集 S 扩大为 ${cutS.size}/${nodes.length} 个节点。`,
      edgeId: minCandidate.edge.id,
      nodeId: minCandidate.toNotS,
      action: "accept",
      codeLine: 6,
      highlightEdges: mstEdges.map((e) => e.id),
      highlightNodes: Array.from(cutS),
      cutS: Array.from(cutS),
      cutNotS: Array.from(cutNotS),
      currentWeight,
    });
  }

  const isOptimal = mstEdges.length === nodes.length - 1 || nodes.length <= 1;
  const bottleneckEdge = mstEdges.length > 0 ? [...mstEdges].sort((a, b) => b.weight - a.weight)[0] : undefined;

  steps.push({
    step: steps.length,
    title: isOptimal ? "Prim 算法推导完成：生成树覆盖全网" : "图非全连通：生成部分连通分量",
    description: `已选定 ${mstEdges.length} 条边，全网总权值为 ${Number(currentWeight.toFixed(2))}。`,
    action: "complete",
    codeLine: 8,
    highlightEdges: mstEdges.map((e) => e.id),
    highlightNodes: Array.from(cutS),
    cutS: Array.from(cutS),
    cutNotS: Array.from(cutNotS),
    currentWeight: Number(currentWeight.toFixed(2)),
  });

  const endTime = performance.now();
  return {
    algorithm: "prim",
    steps,
    mstEdges,
    totalWeight: Number(currentWeight.toFixed(2)),
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
    isOptimal,
    bottleneckEdge,
  };
}

/**
 * Reverse-Delete Algorithm (破圈法)
 */
export function runReverseDelete(graph: GraphData): SolverResult {
  const startTime = performance.now();
  const nodeIds = graph.nodes.map((n) => n.id);
  const edges = [...graph.edges].sort((a, b) => b.weight - a.weight); // Descending order!

  let currentEdges = [...graph.edges];
  const steps: StepLog[] = [];
  const deletedEdgeIds: string[] = [];

  // Helper to check if graph is connected using BFS/DFS
  function isConnected(nodeList: string[], edgeList: GraphEdge[]): boolean {
    if (nodeList.length <= 1) return true;
    const adj: Record<string, string[]> = {};
    nodeList.forEach((id) => (adj[id] = []));
    edgeList.forEach((e) => {
      if (adj[e.source] && adj[e.target]) {
        adj[e.source].push(e.target);
        adj[e.target].push(e.source);
      }
    });

    const visited = new Set<string>();
    const queue = [nodeList[0]];
    visited.add(nodeList[0]);

    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const v of adj[u] || []) {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }
    return visited.size === nodeList.length;
  }

  let totalWeight = currentEdges.reduce((sum, e) => sum + e.weight, 0);

  // Step 0: Initialization
  steps.push({
    step: 0,
    title: "破圈法 (Reverse-Delete) 初始化：边权降序排列",
    description: `从完整连通网开始，共有 ${currentEdges.length} 条边，总权值 = ${totalWeight}。算法将从最重边开始尝试删除。`,
    action: "inspect",
    codeLine: 1,
    highlightEdges: currentEdges.map((e) => e.id),
    highlightNodes: nodeIds,
    rejectedEdges: [],
    currentWeight: totalWeight,
  });

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    // Check if removing this edge keeps the graph connected
    const testEdges = currentEdges.filter((e) => e.id !== edge.id);
    const connectedAfterRemoval = isConnected(nodeIds, testEdges);

    if (connectedAfterRemoval) {
      // The edge is part of a cycle and is the heaviest edge on that cycle -> delete it!
      currentEdges = testEdges;
      deletedEdgeIds.push(edge.id);
      totalWeight -= edge.weight;

      steps.push({
        step: steps.length,
        title: `【破圈删除】移除极大圈边 (${edge.source}, ${edge.target})，权值 = ${edge.weight}`,
        description: `该边处于闭合回路中且权值极大。删除后图依然连通 (连通顶点数 ${nodeIds.length})，成功破圈消减冗余环！`,
        edgeId: edge.id,
        action: "delete",
        codeLine: 5,
        highlightEdges: currentEdges.map((e) => e.id),
        highlightNodes: [edge.source, edge.target],
        rejectedEdges: [...deletedEdgeIds],
        currentWeight: Number(totalWeight.toFixed(2)),
      });
    } else {
      // The edge is a bridge! We must keep it.
      steps.push({
        step: steps.length,
        title: `【保留关键桥边】保留边 (${edge.source}, ${edge.target})，权值 = ${edge.weight}`,
        description: `该边为网络割边/桥 (Bridge)，若删除将导致图分裂为两个不连通分量，必须保留在生成树中！`,
        edgeId: edge.id,
        action: "accept",
        codeLine: 7,
        highlightEdges: currentEdges.map((e) => e.id),
        highlightNodes: [edge.source, edge.target],
        rejectedEdges: [...deletedEdgeIds],
        currentWeight: Number(totalWeight.toFixed(2)),
      });
    }
  }

  const mstEdges = currentEdges;
  const isOptimal = mstEdges.length === nodeIds.length - 1 || nodeIds.length <= 1;

  steps.push({
    step: steps.length,
    title: "破圈法求解完成：已收敛至无环极小生成树",
    description: `共破圈删除了 ${deletedEdgeIds.length} 条冗余大边，保留 ${mstEdges.length} 条骨干边，最终 MST 权值为 ${Number(totalWeight.toFixed(2))}。`,
    action: "complete",
    codeLine: 9,
    highlightEdges: mstEdges.map((e) => e.id),
    highlightNodes: nodeIds,
    rejectedEdges: deletedEdgeIds,
    currentWeight: Number(totalWeight.toFixed(2)),
  });

  const endTime = performance.now();
  return {
    algorithm: "reverse-delete",
    steps,
    mstEdges,
    totalWeight: Number(totalWeight.toFixed(2)),
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
    isOptimal,
    bottleneckEdge: mstEdges.length > 0 ? [...mstEdges].sort((a, b) => b.weight - a.weight)[0] : undefined,
  };
}

/**
 * Finds the simple path between two nodes in a tree using DFS
 */
function findTreePath(
  treeEdges: GraphEdge[],
  start: string,
  end: string
): { pathNodes: string[]; pathEdges: GraphEdge[] } | null {
  const adj: Record<string, { neighbor: string; edge: GraphEdge }[]> = {};
  treeEdges.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = [];
    if (!adj[e.target]) adj[e.target] = [];
    adj[e.source].push({ neighbor: e.target, edge: e });
    adj[e.target].push({ neighbor: e.source, edge: e });
  });

  const visited = new Set<string>();
  const pathNodes: string[] = [];
  const pathEdges: GraphEdge[] = [];

  function dfs(curr: string): boolean {
    visited.add(curr);
    pathNodes.push(curr);
    if (curr === end) return true;

    for (const { neighbor, edge } of adj[curr] || []) {
      if (!visited.has(neighbor)) {
        pathEdges.push(edge);
        if (dfs(neighbor)) return true;
        pathEdges.pop();
      }
    }
    pathNodes.pop();
    return false;
  }

  const found = dfs(start);
  return found ? { pathNodes, pathEdges } : null;
}

/**
 * Finds Fundamental Cycle formed by adding a non-tree edge into the MST
 */
export function findFundamentalCycle(
  nodesOrGraph: GraphNode[] | GraphData,
  treeEdges: GraphEdge[],
  nonTreeEdge: GraphEdge
): CycleInfo | null {
  const pathResult = findTreePath(treeEdges, nonTreeEdge.source, nonTreeEdge.target);
  if (!pathResult) return null;

  const cycleNodes = pathResult.pathNodes;
  const cycleEdges = [...pathResult.pathEdges, nonTreeEdge];
  const maxWeightEdge = [...cycleEdges].sort((a, b) => b.weight - a.weight)[0];

  return {
    cycleNodes,
    cycleEdges: cycleEdges.map((e) => e.id),
    maxWeightEdge,
  };
}

/**
 * Universal runner for all MST algorithms
 */
export function runAlgorithm(
  graph: GraphData,
  algorithm: string,
  options?: { startNodeId?: string; clusterK?: number }
): SolverResult {
  switch (algorithm) {
    case "kruskal":
      return runKruskal(graph);
    case "prim":
      return runPrim(graph, options?.startNodeId);
    case "reverse-delete":
      return runReverseDelete(graph);
    case "second-best":
      return runSecondBestMST(graph);
    case "clustering":
      return runClustering(graph, options?.clusterK || 2);
    default:
      return runKruskal(graph);
  }
}

/**
 * Tree Hierarchy Layout alias
 */
export function computeHierarchyLayout(
  graph: GraphData,
  treeEdges: GraphEdge[],
  rootId: string
): { id: string; x: number; y: number; depth: number }[] {
  return calculateTreeHierarchy(graph.nodes, treeEdges, rootId);
}

/**
 * Second-Best Minimum Spanning Tree Solver
 * Finds candidate MST by replacing each non-tree edge with the max edge on its fundamental cycle
 */
export function runSecondBestMST(graph: GraphData): SolverResult {
  const baseResult = runKruskal(graph);
  const mstEdges = baseResult.mstEdges;
  const mstEdgeSet = new Set(mstEdges.map((e) => e.id));
  const nonTreeEdges = graph.edges.filter((e) => !mstEdgeSet.has(e.id));

  let minDiff = Infinity;
  let bestReplacedIn: GraphEdge | null = null;
  let bestReplacedOut: GraphEdge | null = null;
  let secondBestEdges: GraphEdge[] = [];

  for (const nonTreeEdge of nonTreeEdges) {
    const cycle = findFundamentalCycle(graph.nodes, mstEdges, nonTreeEdge);
    if (cycle && cycle.maxWeightEdge) {
      // Find the maximum weight tree edge on the fundamental cycle
      const treePathEdges = mstEdges.filter((e) => cycle.cycleEdges.includes(e.id));
      if (treePathEdges.length > 0) {
        const maxTreeEdge = treePathEdges.sort((a, b) => b.weight - a.weight)[0];
        const diff = nonTreeEdge.weight - maxTreeEdge.weight;

        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          bestReplacedIn = nonTreeEdge;
          bestReplacedOut = maxTreeEdge;
          secondBestEdges = mstEdges.filter((e) => e.id !== maxTreeEdge.id).concat(nonTreeEdge);
        }
      }
    }
  }

  const secondBestWeight =
    bestReplacedIn && bestReplacedOut
      ? Number((baseResult.totalWeight + minDiff).toFixed(2))
      : baseResult.totalWeight;

  return {
    ...baseResult,
    algorithm: "second-best",
    secondBestMST:
      bestReplacedIn && bestReplacedOut
        ? {
            edges: secondBestEdges,
            totalWeight: secondBestWeight,
            replacedIn: bestReplacedIn,
            replacedOut: bestReplacedOut,
            weightDiff: Number(minDiff.toFixed(2)),
          }
        : undefined,
  };
}

/**
 * MST-based Single-Linkage Clustering into k clusters
 */
export function runClustering(graph: GraphData, k: number = 3): SolverResult {
  const kruskalRes = runKruskal(graph);
  const mstEdges = [...kruskalRes.mstEdges].sort((a, b) => b.weight - a.weight);

  // Remove k-1 heaviest edges
  const cutCount = Math.min(k - 1, mstEdges.length);
  const removedEdges = mstEdges.slice(0, cutCount);
  const remainingEdges = mstEdges.slice(cutCount);

  // Re-run DSU on remaining edges to assign clusters
  const nodeIds = graph.nodes.map((n) => n.id);
  const dsu = new DisjointSet(nodeIds);
  remainingEdges.forEach((e) => dsu.union(e.source, e.target));

  const state = dsu.getState(nodeIds);
  const clusterMap: Record<string, number> = {};
  state.sets.forEach((set, idx) => {
    set.members.forEach((nodeId) => {
      clusterMap[nodeId] = idx + 1;
    });
  });

  return {
    ...kruskalRes,
    algorithm: "clustering",
    mstEdges: remainingEdges,
    totalWeight: Number(remainingEdges.reduce((acc, e) => acc + e.weight, 0).toFixed(2)),
  };
}

/**
 * Tree Hierarchy Layout (Tree levels given root)
 */
export function calculateTreeHierarchy(
  nodes: GraphNode[],
  treeEdges: GraphEdge[],
  rootId: string
): { id: string; x: number; y: number; depth: number }[] {
  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => (adj[n.id] = []));
  treeEdges.forEach((e) => {
    if (adj[e.source] && adj[e.target]) {
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    }
  });

  const levels: Record<number, string[]> = {};
  const depths: Record<string, number> = {};
  const visited = new Set<string>();

  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
  visited.add(rootId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    depths[id] = depth;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(id);

    for (const neighbor of adj[id] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, depth: depth + 1 });
      }
    }
  }

  // Include any unvisited nodes on bottom level
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const maxDepth = Object.keys(levels).length;
      if (!levels[maxDepth]) levels[maxDepth] = [];
      levels[maxDepth].push(n.id);
      depths[n.id] = maxDepth;
    }
  });

  const totalLevels = Object.keys(levels).length;
  const result: { id: string; x: number; y: number; depth: number }[] = [];

  const canvasWidth = 720;
  const canvasHeight = 440;
  const startY = 70;
  const levelHeight = totalLevels > 1 ? (canvasHeight - 120) / (totalLevels - 1) : 0;

  Object.entries(levels).forEach(([depthStr, nodeGroup]) => {
    const depth = parseInt(depthStr, 10);
    const y = startY + depth * levelHeight;
    const count = nodeGroup.length;
    const spacing = canvasWidth / (count + 1);

    nodeGroup.forEach((id, index) => {
      const x = (index + 1) * spacing;
      result.push({ id, x, y, depth });
    });
  });

  return result;
}
