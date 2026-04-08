import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  LayoutDashboard, Shield, AlertTriangle, Cpu, TrendingUp,
  Play, Zap, RefreshCw
} from 'lucide-react';
import { api, formatDate, getRiskColor } from '../lib/utils';
import { PageWrapper, GlassCard, StatCard, RiskMeter, SkeletonCard, EmptyState } from '../components/ui';
import type { DashboardStats } from '../types';

const RISK_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const CHART_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#10b981' }} className="font-mono font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      // API not available
    }
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  // Prepare chart data
  const trendData = stats?.recent?.slice().reverse().map((r, i) => ({
    time: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    risk: r.risk_score,
    type: r.attack_type,
    index: i,
  })) || [];

  const byTypeData = stats?.byType?.slice(0, 5).map(t => ({
    name: t.attack_type.split(' ').slice(0, 2).join(' '),
    count: t.count,
    avgRisk: Math.round(t.avg_risk),
  })) || [];

  const riskDist = [
    { name: 'Low (0-39)', value: stats?.recent?.filter(r => r.risk_score < 40).length || 0, color: '#22c55e' },
    { name: 'Med (40-59)', value: stats?.recent?.filter(r => r.risk_score >= 40 && r.risk_score < 60).length || 0, color: '#eab308' },
    { name: 'High (60-79)', value: stats?.recent?.filter(r => r.risk_score >= 60 && r.risk_score < 80).length || 0, color: '#f97316' },
    { name: 'Critical (80+)', value: stats?.recent?.filter(r => r.risk_score >= 80).length || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const avgRisk = Math.round(stats?.avgRisk || 0);

  return (
    <PageWrapper>
      <div className="flex flex-col min-h-screen bg-zinc-950 p-3 sm:p-4 gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <LayoutDashboard size={18} className="text-emerald-400" /> Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Your supply chain security overview</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 text-xs hover:text-white transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={() => navigate('/simulator')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/25 transition-colors"
            >
              <Play size={13} /> New Simulation
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !stats || stats.total === 0 ? (
          <GlassCard className="flex-1">
            <EmptyState
              icon={Shield}
              title="No simulation data yet"
              description="Run your first simulation to see dashboard metrics"
              action={
                <button
                  onClick={() => navigate('/simulator')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold"
                >
                  <Play size={14} /> Launch Simulator
                </button>
              }
            />
          </GlassCard>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <StatCard label="Total Simulations" value={stats.total} icon={Shield} color="emerald" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
                <StatCard label="Avg Risk Score" value={avgRisk} icon={TrendingUp}
                  color={avgRisk >= 70 ? 'red' : avgRisk >= 50 ? 'orange' : 'emerald'} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                <StatCard label="Max Risk Score" value={stats.maxRisk} icon={AlertTriangle}
                  color={stats.maxRisk >= 80 ? 'red' : 'orange'} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                <StatCard label="Attack Types" value={stats.byType?.length || 0} icon={Cpu} color="purple" />
              </motion.div>
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-3 gap-3">
              {/* Risk trend */}
              <GlassCard className="lg:col-span-2 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">Risk Score Trend</span>
                  <span className="text-xs text-zinc-500 ml-auto">Last {trendData.length} simulations</span>
                </div>
                {trendData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="risk" stroke="#10b981" strokeWidth={2} fill="url(#riskGrad)" name="Risk" dot={{ r: 3, fill: '#10b981' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
                    Run more simulations to see trends
                  </div>
                )}
              </GlassCard>

              {/* Overall risk gauge */}
              <GlassCard className="p-4 flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-medium text-white">Overall Risk Posture</p>
                <RiskMeter score={avgRisk} size="lg" />
                <div className="text-center">
                  <p className={`font-bold text-lg ${getRiskColor(avgRisk)}`}>
                    {avgRisk >= 80 ? 'CRITICAL' : avgRisk >= 60 ? 'HIGH RISK' : avgRisk >= 40 ? 'MODERATE' : 'LOW RISK'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Based on {stats.total} simulation{stats.total !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => navigate('/defender')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/25 transition-colors w-full justify-center"
                >
                  <Zap size={12} /> Analyze with AI
                </button>
              </GlassCard>
            </div>

            {/* Attack types + distribution */}
            <div className="grid lg:grid-cols-2 gap-3">
              {/* By attack type */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">Attacks by Type</span>
                </div>
                {byTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byTypeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Simulations" radius={[4, 4, 0, 0]}>
                        {byTypeData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">No data</div>
                )}
              </GlassCard>

              {/* Risk distribution pie */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">Risk Distribution</span>
                </div>
                {riskDist.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie
                          data={riskDist}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {riskDist.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {riskDist.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-zinc-400">{d.name}</span>
                          </div>
                          <span className="font-mono font-bold text-white">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">No data</div>
                )}
              </GlassCard>
            </div>

            {/* Top attack types list */}
            {byTypeData.length > 0 && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} className="text-orange-400" />
                  <span className="text-sm font-medium text-white">Top Attack Vectors</span>
                </div>
                <div className="space-y-2">
                  {stats.byType.slice(0, 5).map((t, i) => {
                    const pct = stats.total > 0 ? (t.count / stats.total) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-zinc-800 text-xs font-mono text-zinc-400 flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-300 truncate">{t.attack_type}</span>
                            <span className="font-mono text-zinc-500 ml-2 flex-shrink-0">{t.count}×</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                          </div>
                        </div>
                        <span className={`text-xs font-mono font-bold flex-shrink-0 ${getRiskColor(Math.round(t.avg_risk))}`}>
                          {Math.round(t.avg_risk)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Recent Simulations Table */}
            {stats.recent && stats.recent.length > 0 && (
              <GlassCard className="p-4 overflow-x-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">Recent Simulations</span>
                </div>
                <table className="w-full text-left text-xs text-zinc-400">
                  <thead className="bg-zinc-900/50 text-zinc-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 rounded-l-lg font-medium tracking-wider">Date</th>
                      <th className="px-3 py-2 font-medium tracking-wider">Scenario</th>
                      <th className="px-3 py-2 font-medium tracking-wider">Attack Type</th>
                      <th className="px-3 py-2 font-medium tracking-wider">Risk Score</th>
                      <th className="px-3 py-2 font-medium tracking-wider text-center">Affected</th>
                      <th className="px-3 py-2 rounded-r-lg font-medium tracking-wider text-center">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {stats.recent.map((sim) => (
                      <tr key={sim.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap">{formatDate(sim.created_at)}</td>
                        <td className="px-3 py-3 font-medium text-zinc-300">{sim.scenario_name}</td>
                        <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px]">{sim.attack_type.split(' ').slice(0, 2).join(' ')}</span></td>
                        <td className="px-3 py-3">
                          <span className={`font-mono font-bold ${getRiskColor(sim.risk_score)}`}>{sim.risk_score}/100</span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono">{sim.nodes_affected}</td>
                        <td className="px-3 py-3 text-center font-mono">{sim.duration_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
