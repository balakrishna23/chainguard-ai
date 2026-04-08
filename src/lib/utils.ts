import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';
import type { AttackScenario, PersistedSimulation, SimNode, Simulation } from '../types';

/** Maps a DB row to the legacy `Simulation` view used by dashboard / exports. */
function persistedToSimulation(row: PersistedSimulation): Simulation {
  const sc = row.scenario;
  const nodes = row.nodes ?? [];
  return {
    id: row.id,
    attack_type: sc?.type ?? '',
    scenario_name: sc?.name ?? 'Unknown',
    risk_score: row.risk_score,
    nodes_affected: nodes.filter((n) => n.status === 'compromised').length,
    created_at: row.created_at,
    duration_seconds: 0,
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function getRiskBg(score: number): string {
  if (score >= 80) return 'bg-red-500/20 border-red-500/30';
  if (score >= 60) return 'bg-orange-500/20 border-orange-500/30';
  if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-emerald-500/20 border-emerald-500/30';
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateShareUrl(simId: string): string {
  return `${window.location.origin}/simulator?id=${simId}`;
}

export const api = {
  // ── List / search simulations ──────────────────────────────────────────────
  async getSimulations(params?: {
    search?: string;
    attack_type?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, attack_type, limit = 15, offset = 0 } = params ?? {};

    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] getSimulations error:', error);
      throw new Error(error.message);
    }

    const rows = (data as PersistedSimulation[]) ?? [];
    let filtered = rows;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.scenario?.name?.toLowerCase().includes(q) ||
          r.scenario?.type?.toLowerCase().includes(q)
      );
    }
    if (attack_type) {
      filtered = filtered.filter((r) => r.scenario?.type === attack_type);
    }
    const total = filtered.length;
    const pageRows = filtered.slice(offset, offset + limit);
    return {
      simulations: pageRows.map(persistedToSimulation),
      total,
    };
  },

  // ── Save a simulation (e.g. SBOM flow) — matches `simulations` jsonb schema ──
  async saveSimulation(data: {
    id: string;
    attack_type: string;
    scenario_name: string;
    risk_score: number;
    nodes_affected: number;
    gemini_summary?: string;
    graph_snapshot?: unknown;
    duration_seconds?: number;
    total_nodes?: number;
    attack_path?: string[];
  }) {
    try {
      const scenario: AttackScenario = {
        id: 'synthetic',
        name: data.scenario_name,
        type: data.attack_type,
        description: data.gemini_summary?.slice(0, 500) ?? '',
        year: new Date().getFullYear(),
        severity: 'medium',
        entryPoint: '',
        propagationPath: [],
        initialNodes: [],
        initialEdges: [],
        color: '#64748b',
      };
      const snap = data.graph_snapshot as { nodes?: SimNode[] } | undefined;
      const nodes: SimNode[] = snap?.nodes?.length ? snap.nodes : [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('simulations').insert({
        user_id: user.id,
        scenario,
        risk_score: data.risk_score,
        nodes,
      });

      if (error) {
        console.error('[Supabase] saveSimulation error:', error);
        throw new Error(error.message);
      }
      console.log('[Supabase] saveSimulation ok');
      return data;
    } catch (err) {
      console.error('[Supabase] saveSimulation failed:', err);
      throw err;
    }
  },

  // ── Fetch single simulation by id ──────────────────────────────────────────
  async getSimulation(id: string) {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Supabase] getSimulation error:', error);
      throw new Error(error.message);
    }
    return persistedToSimulation(data as PersistedSimulation);
  },

  // ── Delete a simulation ────────────────────────────────────────────────────
  async deleteSimulation(id: string) {
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] deleteSimulation error:', error);
      throw new Error(error.message);
    }
    return { success: true };
  },

  // ── Aggregate stats (computed client-side to avoid RPC/view dependency) ────
  async getStats() {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] getStats error:', error);
      throw new Error(error.message);
    }

    const sims = ((data as PersistedSimulation[]) ?? []).map(persistedToSimulation);
    const byTypeMap: Record<string, { count: number; totalRisk: number }> = {};

    for (const s of sims) {
      if (!byTypeMap[s.attack_type]) {
        byTypeMap[s.attack_type] = { count: 0, totalRisk: 0 };
      }
      byTypeMap[s.attack_type].count++;
      byTypeMap[s.attack_type].totalRisk += s.risk_score;
    }

    return {
      total: sims.length,
      avgRisk: sims.length
        ? Math.round(sims.reduce((acc, s) => acc + s.risk_score, 0) / sims.length)
        : 0,
      maxRisk: sims.length ? Math.max(...sims.map((s) => s.risk_score)) : 0,
      byType: Object.entries(byTypeMap).map(([attack_type, v]) => ({
        attack_type,
        count: v.count,
        avg_risk: Math.round(v.totalRisk / v.count),
      })),
      recent: sims.slice(0, 5),
    };
  },
};
