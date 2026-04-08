export interface SimNode {
  id: string;
  label: string;
  type: 'service' | 'library' | 'ci' | 'registry' | 'database' | 'api' | 'build';
  version?: string;
  vendor?: string;
  x: number;
  y: number;
  status: 'safe' | 'vulnerable' | 'compromised' | 'patched';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  cve?: string;
  description?: string;
}

export interface SimEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency' | 'data' | 'auth' | 'build';
  compromised?: boolean;
}

export interface AttackScenario {
  id: string;
  name: string;
  type: string;
  cve?: string;
  description: string;
  year: number;
  severity: 'critical' | 'high' | 'medium';
  entryPoint: string;
  propagationPath: string[];
  initialNodes: SimNode[];
  initialEdges: SimEdge[];
  attackSteps?: string[];
  color: string;
}

/** Row from Supabase `simulations` (jsonb columns) */
export interface PersistedSimulation {
  id: string;
  scenario: AttackScenario;
  risk_score: number;
  nodes: SimNode[];
  created_at: string;
}

export interface Simulation {
  id: string;
  attack_type: string;
  scenario_name: string;
  risk_score: number;
  nodes_affected: number;
  gemini_summary?: string;
  graph_snapshot?: { nodes: SimNode[]; edges: SimEdge[] };
  created_at: string;
  duration_seconds: number;
  total_nodes?: number;
  attack_path?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SBOMEntry {
  name: string;
  version: string;
  license?: string;
  cves?: string[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardStats {
  total: number;
  avgRisk: number;
  maxRisk: number;
  byType: { attack_type: string; count: number; avg_risk: number }[];
  recent: { id: string; created_at: string; scenario_name: string; risk_score: number; attack_type: string; nodes_affected: number; duration_seconds: number }[];
}
