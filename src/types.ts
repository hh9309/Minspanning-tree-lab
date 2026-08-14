/**
 * Minimum Spanning Tree Lab - TypeScript Definitions
 */

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type?: "hub" | "station" | "client" | "sensor" | "default";
  clusterId?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  label?: string;
  isMST?: boolean;
}

export interface GraphData {
  name: string;
  unit: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type AlgorithmType = "kruskal" | "prim" | "reverse-delete" | "second-best" | "clustering";

export interface DSUSet {
  root: string;
  members: string[];
  color: string;
}

export interface DSUState {
  parent: Record<string, string>;
  rank: Record<string, number>;
  sets: DSUSet[];
}

export interface StepLog {
  step: number;
  title: string;
  description: string;
  edgeId?: string;
  nodeId?: string;
  action: "inspect" | "accept" | "reject" | "cut-grow" | "delete" | "complete" | "cycle-detected";
  codeLine: number;
  highlightEdges: string[];
  highlightNodes: string[];
  rejectedEdges?: string[];
  cutS?: string[]; // Nodes in tree (Prim cut set S)
  cutNotS?: string[]; // Nodes not in tree (V \ S)
  candidateEdges?: { edgeId: string; source: string; target: string; weight: number }[];
  dsuState?: DSUState;
  currentWeight: number;
}

export interface SolverResult {
  algorithm: AlgorithmType;
  steps: StepLog[];
  mstEdges: GraphEdge[];
  totalWeight: number;
  executionTimeMs: number;
  isOptimal: boolean;
  secondBestMST?: {
    edges: GraphEdge[];
    totalWeight: number;
    replacedIn: GraphEdge;
    replacedOut: GraphEdge;
    weightDiff: number;
  };
  bottleneckEdge?: GraphEdge;
}

export interface CycleInfo {
  cycleNodes: string[];
  cycleEdges: string[];
  maxWeightEdge?: GraphEdge;
}

export interface CaseStudy {
  id: string;
  title: string;
  category: "power" | "water" | "pcb" | "clustering" | "traffic" | "telecom";
  unit: string;
  description: string;
  engineeringContext: string;
  recommendedRoot?: string;
  graph: GraphData;
}

export interface AIDiagnosisData {
  title: string;
  summary: string;
  criticalEdges: {
    edge: string;
    weight: number;
    reason: string;
  }[];
  sensitivityAnalysis: string;
  vulnerabilityScore: number;
  redundancyAssessment?: string;
  recommendations: string[];
}
