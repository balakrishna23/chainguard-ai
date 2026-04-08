import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateStructuredAnalysis } from '../lib/ai';

export interface AnalysisNode {
  id: string;
  name: string;
  version?: string;
  type: 'library' | 'service' | 'database' | 'api' | 'unknown';
  risk?: 'critical' | 'high' | 'medium' | 'low' | 'safe';
}

export interface AnalysisEdge {
  source: string;
  target: string;
}

export interface Vulnerability {
  nodeId: string;
  nodeName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  cve?: string;
}

export interface Analysis {
  id: string;
  name: string;
  file_type: string | null;
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
  vulnerabilities: Vulnerability[];
  risk_score: number;
  report: string | null;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  created_at: string;
}

interface AnalyzerStore {
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  loading: boolean;
  analyzing: boolean;
  error: string | null;
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
  parseFile: (file: File) => Promise<void>;
  addNode: (node: AnalysisNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: AnalysisEdge) => void;
  runAnalysis: (name: string) => Promise<void>;
  fetchAnalyses: () => Promise<void>;
  reset: () => void;
}

function parsePackageJson(content: string): { nodes: AnalysisNode[]; edges: AnalysisEdge[] } {
  const pkg = JSON.parse(content);
  const nodes: AnalysisNode[] = [];
  const edges: AnalysisEdge[] = [];
  const rootId = pkg.name || 'root';
  nodes.push({ id: rootId, name: pkg.name || 'root', version: pkg.version, type: 'service' });
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  Object.entries(deps || {}).forEach(([name, version]) => {
    nodes.push({ id: name, name, version: version as string, type: 'library' });
    edges.push({ source: rootId, target: name });
  });
  return { nodes, edges };
}

function parseRequirementsTxt(content: string): { nodes: AnalysisNode[]; edges: AnalysisEdge[] } {
  const nodes: AnalysisNode[] = [];
  const edges: AnalysisEdge[] = [];
  const rootId = 'python-app';
  nodes.push({ id: rootId, name: 'Python App', type: 'service' });
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [name, version] = trimmed.split('==');
    const id = name.trim();
    nodes.push({ id, name: id, version: version?.trim(), type: 'library' });
    edges.push({ source: rootId, target: id });
  });
  return { nodes, edges };
}

function parseSbomJson(content: string): { nodes: AnalysisNode[]; edges: AnalysisEdge[] } {
  const sbom = JSON.parse(content);
  const nodes: AnalysisNode[] = [];
  const edges: AnalysisEdge[] = [];
  const components = sbom.components || sbom.packages || [];
  components.forEach((c: any) => {
    const id = c['bom-ref'] || c.name;
    nodes.push({ id, name: c.name, version: c.version, type: 'library' });
  });
  (sbom.dependencies || []).forEach((dep: any) => {
    (dep.dependsOn || []).forEach((target: string) => {
      edges.push({ source: dep.ref, target });
    });
  });
  return { nodes, edges };
}

function parsePomXml(content: string): { nodes: AnalysisNode[]; edges: AnalysisEdge[] } {
  const nodes: AnalysisNode[] = [];
  const edges: AnalysisEdge[] = [];
  const rootId = 'java-app';
  nodes.push({ id: rootId, name: 'Java App', type: 'service' });
  const depRegex = /<dependency>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
  let match;
  while ((match = depRegex.exec(content)) !== null) {
    const name = match[1].trim();
    nodes.push({ id: name, name, type: 'library' });
    edges.push({ source: rootId, target: name });
  }
  return { nodes, edges };
}

export const useAnalyzerStore = create<AnalyzerStore>((set, get) => ({
  analyses: [],
  currentAnalysis: null,
  loading: false,
  analyzing: false,
  error: null,
  nodes: [],
  edges: [],

  parseFile: async (file: File) => {
    const content = await file.text();
    let result = { nodes: [] as AnalysisNode[], edges: [] as AnalysisEdge[] };
    if (file.name.endsWith('package.json')) result = parsePackageJson(content);
    else if (file.name.endsWith('requirements.txt')) result = parseRequirementsTxt(content);
    else if (file.name.endsWith('.xml')) result = parsePomXml(content);
    else if (file.name.endsWith('.json')) result = parseSbomJson(content);
    set({ nodes: result.nodes, edges: result.edges });
  },

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  })),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),

  runAnalysis: async (name: string) => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;
    set({ analyzing: true, error: null });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ analyzing: false }); return; }

    // Create pending record
    const { data: record, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        name,
        nodes,
        edges,
        status: 'analyzing',
      })
      .select()
      .single();

    if (insertError) {
      set({ error: insertError.message, analyzing: false });
      return;
    }

    try {
      // Build prompt for Groq
      const nodeList = nodes.map((n) => `- ${n.name}${n.version ? ` v${n.version}` : ''} (${n.type})`).join('\n');
      const prompt = `You are a cybersecurity expert analyzing a software supply chain.

Here are the components in this system:
${nodeList}

Analyze each component for known vulnerabilities, CVEs, and security risks.
For each vulnerable component provide:
1. Severity (critical/high/medium/low)
2. CVE if known
3. Title of vulnerability
4. Brief description
5. Recommendation to fix

Also provide an overall risk score from 0-100.

Respond ONLY with valid JSON in this exact format:
{
  "risk_score": number,
  "vulnerabilities": [
    {
      "nodeId": "component-name",
      "nodeName": "Component Name",
      "severity": "critical|high|medium|low",
      "cve": "CVE-XXXX-XXXXX or null",
      "title": "Vulnerability title",
      "description": "Brief description",
      "recommendation": "How to fix"
    }
  ],
  "report": "Executive summary paragraph"
}`;

      const response = await generateStructuredAnalysis(prompt);
      const clean = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      // Update nodes with risk levels
      const enrichedNodes = nodes.map((n) => {
        const vuln = parsed.vulnerabilities?.find((v: any) => v.nodeId === n.id || v.nodeName === n.name);
        return { ...n, risk: vuln ? vuln.severity : 'safe' };
      });

      await supabase
        .from('analyses')
        .update({
          nodes: enrichedNodes,
          vulnerabilities: parsed.vulnerabilities ?? [],
          risk_score: parsed.risk_score ?? 0,
          report: parsed.report ?? '',
          status: 'complete',
        })
        .eq('id', record.id);

      set({
        currentAnalysis: {
          ...record,
          nodes: enrichedNodes,
          vulnerabilities: parsed.vulnerabilities ?? [],
          risk_score: parsed.risk_score ?? 0,
          report: parsed.report ?? '',
          status: 'complete',
        },
        analyzing: false,
      });
    } catch (err) {
      await supabase.from('analyses').update({ status: 'failed' }).eq('id', record.id);
      set({ error: 'Analysis failed. Check your Groq configuration and try again.', analyzing: false });
    }
  },

  fetchAnalyses: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) set({ error: error.message });
    else set({ analyses: data ?? [] });
    set({ loading: false });
  },

  reset: () => set({ nodes: [], edges: [], currentAnalysis: null, error: null }),
}));
