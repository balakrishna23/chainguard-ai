import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  History, Search, Trash2, Download, Play, RefreshCw,
  Filter, FileText, Share2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api, formatDate, getRiskColor, getRiskLabel, generateShareUrl } from '../lib/utils';
import { PageWrapper, GlassCard, RiskBadge, EmptyState, Skeleton, Spinner } from '../components/ui';
import type { PersistedSimulation } from '../types';

const ATTACK_TYPES = ['All', 'RCE via Logging Library', 'Build Pipeline Backdoor', 'Open Source Trojan', 'CI/CD Compromise', 'SBOM Analysis'];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PersistedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const PER_PAGE = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords((data as PersistedSimulation[]) ?? []);
      console.log('[HistoryPage] Loaded', data?.length ?? 0, 'simulations');
    } catch (err) {
      console.error('[HistoryPage] Failed to load history:', err);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [search, filterType]);

  const filtered = useMemo(() => {
    let list = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.scenario?.name?.toLowerCase().includes(q) ||
          r.scenario?.type?.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'All') {
      list = list.filter((r) => r.scenario?.type === filterType);
    }
    return list;
  }, [records, search, filterType]);

  const total = filtered.length;
  const simulations = useMemo(
    () => filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE),
    [filtered, page]
  );

  async function deleteSimulation(id: string) {
    setDeleting(id);
    try {
      await api.deleteSimulation(id);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
    setDeleting(null);
  }

  function exportSinglePDF(sim: PersistedSimulation) {
    const doc = new jsPDF();
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ChainGuard AI — Simulation Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(160, 160, 160);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    doc.setDrawColor(16, 185, 129);
    doc.line(14, 32, 196, 32);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(sim.scenario.name, 14, 42);

    const affected = sim.nodes.filter((n) => n.status === 'compromised').length;
    const details = [
      ['Attack Type', sim.scenario.type],
      ['Risk Score', `${sim.risk_score}/100 (${getRiskLabel(sim.risk_score)})`],
      ['Nodes Affected', String(affected)],
      ['Date', formatDate(sim.created_at)],
      ['Simulation ID', sim.id],
    ];

    autoTable(doc, {
      startY: 48,
      head: [['Field', 'Value']],
      body: details,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: 'bold' },
      bodyStyles: { fillColor: [28, 28, 35], textColor: [200, 200, 200] },
      alternateRowStyles: { fillColor: [35, 35, 45] },
    });

    doc.save(`chainguard-sim-${sim.id.slice(0, 8)}.pdf`);
    toast.success('PDF exported!');
  }

  function exportAllPDF() {
    if (simulations.length === 0) { toast.error('No simulations to export'); return; }
    const doc = new jsPDF();
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('ChainGuard AI — Full Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(160, 160, 160);
    doc.text(`${simulations.length} simulations · ${new Date().toLocaleString()}`, 14, 28);
    doc.setDrawColor(16, 185, 129);
    doc.line(14, 32, 196, 32);

    autoTable(doc, {
      startY: 38,
      head: [['Scenario', 'Type', 'Risk', 'Nodes', 'Date']],
      body: simulations.map((s) => [
        s.scenario.name.slice(0, 30),
        s.scenario.type.slice(0, 25),
        `${s.risk_score}/100`,
        String(s.nodes.filter((n) => n.status === 'compromised').length),
        formatDate(s.created_at).split(',')[0],
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0] },
      bodyStyles: { fillColor: [28, 28, 35], textColor: [200, 200, 200], fontSize: 8 },
      alternateRowStyles: { fillColor: [35, 35, 45] },
    });

    doc.save('chainguard-full-report.pdf');
    toast.success('Full report exported!');
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <PageWrapper>
      <div className="flex flex-col h-full min-h-screen bg-zinc-950 p-3 sm:p-4 gap-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
              {loading ? <Spinner size={18} className="text-emerald-400" /> : <History size={18} className="text-emerald-400" />}
              Simulation History
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">{total} simulations recorded</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportAllPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/25 transition-colors"
            >
              <Download size={13} /> Export All
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 text-xs hover:text-white transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-zinc-900/60 border border-zinc-700/40 rounded-lg px-3 py-2">
              <Search size={13} className="text-zinc-500 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search scenarios, types..."
                className="bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-zinc-500" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-zinc-900/60 border border-zinc-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {ATTACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Table */}
        <GlassCard className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : simulations.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No simulations yet"
              description="Run a simulation to see it here"
              action={
                <button
                  onClick={() => navigate('/simulator')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/25 transition-colors"
                >
                  <Play size={14} /> Launch Simulator
                </button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/60">
                      <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider font-medium">Scenario</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider font-medium hidden md:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider font-medium">Risk</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider font-medium hidden sm:table-cell">Nodes</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider font-medium hidden lg:table-cell">Date</th>
                      <th className="text-right px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulations.map((sim, i) => (
                      <motion.tr
                        key={sim.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-zinc-900/60 hover:bg-zinc-800/30 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white truncate max-w-[200px]">{sim.scenario.name}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[200px] mt-0.5">{sim.scenario.cve ?? sim.scenario.description.slice(0, 60)}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-zinc-400 truncate max-w-[160px] block">{sim.scenario.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-sm ${getRiskColor(sim.risk_score)}`}>{sim.risk_score}</span>
                            <RiskBadge score={sim.risk_score} />
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-zinc-400 font-mono">
                            {sim.nodes.filter((n) => n.status === 'compromised').length}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-zinc-500 text-xs">{formatDate(sim.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/simulator?id=${sim.id}`)}
                              title="Replay simulation"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <Play size={13} />
                            </button>
                            <button
                              onClick={() => { navigator.clipboard.writeText(generateShareUrl(sim.id)); toast.success('Link copied!'); }}
                              title="Share link"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <Share2 size={13} />
                            </button>
                            <button
                              onClick={() => exportSinglePDF(sim)}
                              title="Export PDF"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => deleteSimulation(sim.id)}
                              title="Delete"
                              disabled={deleting === sim.id}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            >
                              {deleting === sim.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/60">
                  <span className="text-xs text-zinc-500">
                    Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
