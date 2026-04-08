import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AttackScenario, SimEdge, SimNode } from '../types';

// ── Save payload shape ───────────────────────────────────────────────────────
export interface SaveSimulationPayload {
  scenario: AttackScenario;
  risk_score: number;
  nodes: SimNode[];
}

// ── Store interface ──────────────────────────────────────────────────────────
interface SimulationState {
  nodes: SimNode[];
  edges: SimEdge[];
  riskScore: number;

  setNodes: (nodes: SimNode[] | ((prev: SimNode[]) => SimNode[])) => void;
  setEdges: (edges: SimEdge[] | ((prev: SimEdge[]) => SimEdge[])) => void;
  setRiskScore: (score: number) => void;
  resetSimulationState: () => void;

  /** Persists a completed simulation to Supabase.
   *  Throws on failure so the caller can retry / show a toast. */
  saveSimulation: (payload: SaveSimulationPayload) => Promise<void>;
}

// ── Store implementation ─────────────────────────────────────────────────────
export const useSimulationStore = create<SimulationState>((set) => ({
  nodes: [],
  edges: [],
  riskScore: 0,

  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    })),

  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    })),

  setRiskScore: (riskScore) => set({ riskScore }),

  resetSimulationState: () => set({ nodes: [], edges: [], riskScore: 0 }),

  saveSimulation: async (payload: SaveSimulationPayload) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const { data, error } = await supabase
        .from('simulations')
        .insert({
          user_id: user.id,
          scenario: payload.scenario,
          risk_score: payload.risk_score,
          nodes: payload.nodes,
        })
        .select();

      if (error) {
        console.error('[SimulationStore] Supabase insert failed:', error);
        throw new Error(error.message);
      }
      console.log('[SimulationStore] Simulation saved to Supabase');
    } catch (err) {
      console.error('[SimulationStore] saveSimulation error:', err);
      throw err;
    }
  },
}));
