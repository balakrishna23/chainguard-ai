import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  Play, Shield, AlertTriangle, Loader2, Copy, Save,
  Share2, RotateCcw, Zap, ChevronDown, ChevronUp, Info, X
} from 'lucide-react';
import { ATTACK_SCENARIOS, NODE_COLORS, NODE_TYPE_ICONS } from '../lib/scenarios';
import { generateAttackSteps, generateMitigation, generateSimulationSummary, analyzeSimulationResults } from '../lib/ai';
import { api, cn, sleep, generateShareUrl, getRiskColor } from '../lib/utils';
import { PageWrapper, GlassCard, RiskMeter, SeverityBadge, Spinner } from '../components/ui';
import { TerminalLog, type TerminalLogRef } from '../components/TerminalLog';
import { useSimulationStore, type SaveSimulationPayload } from '../store/simulationStore';
import type { SimNode, SimEdge } from '../types';

interface NodeDetail {
  node: SimNode;
  mitigation?: string;
  loadingMitigation?: boolean;
}

export default function SimulatorPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { nodes, edges, riskScore, setNodes, setEdges, setRiskScore, saveSimulation } = useSimulationStore();
  const [scenario, setScenario] = useState(ATTACK_SCENARIOS[0]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const terminalRef = useRef<TerminalLogRef>(null);
  const [aiSteps, setAiSteps] = useState('');
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [simId, setSimId] = useState(() => uuidv4());
  const [showLog, setShowLog] = useState(true);
  const abortRef = useRef(false);

  const isGraphSetup = useRef(false);

  useEffect(() => {
    if (!svgRef.current || edges.length === 0 || nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    const W = svgRef.current.clientWidth || 700;
    const H = svgRef.current.clientHeight || 400;
    const scaleX = (x: number) => (x / 900) * W;
    const scaleY = (y: number) => (y / 450) * H;

    // 1. Setup Phase (Headless graph container initialization exactly once!)
    if (!isGraphSetup.current) {
      svg.selectAll('*').remove();
      const gLayer = svg.append('g').attr('class', 'content-layer');
      
      svg.call(
        d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.4, 3.5])
          .on('zoom', e => gLayer.attr('transform', e.transform))
      );

      d3.select('body').selectAll('.d3-tooltip').remove();
      d3.select('body').append('div')
        .attr('class', 'd3-tooltip absolute hidden bg-zinc-900 border border-zinc-700/60 p-3 rounded-lg shadow-xl pointer-events-none z-[100] transition-opacity duration-200 opacity-0')
        .style('min-width', '160px');

      isGraphSetup.current = true;
    }

    const g = svg.select('.content-layer');
    const tooltip = d3.select('.d3-tooltip');

    // 2. EDGES Update Pattern
    const edgeSelection = g.selectAll<SVGLineElement, SimEdge>('.edge-link')
      .data(edges, d => d.id);

    edgeSelection.enter().append('line')
      .attr('class', 'edge-link')
      .attr('x1', d => scaleX(nodes.find(n => n.id === d.source)?.x ?? 0))
      .attr('y1', d => scaleY(nodes.find(n => n.id === d.source)?.y ?? 0))
      .attr('x2', d => scaleX(nodes.find(n => n.id === d.target)?.x ?? 0))
      .attr('y2', d => scaleY(nodes.find(n => n.id === d.target)?.y ?? 0))
      .attr('stroke', '#33415540')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d.type === 'dependency' ? 'none' : '4,3')
      .merge(edgeSelection)
      .transition().duration(600)
      .attr('stroke', d => d.compromised ? '#ef444460' : '#33415540')
      .attr('stroke-width', d => d.compromised ? 2 : 1);

    edgeSelection.exit().remove();

    // 3. NODES Update Pattern
    const nodeSelection = g.selectAll<SVGGElement, SimNode>('.node-group')
      .data(nodes, d => d.id);

    const nodeEnter = nodeSelection.enter().append('g')
      .attr('class', 'node-group')
      .attr('transform', d => `translate(${scaleX(d.x)},${scaleY(d.y)})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => setSelectedNode({ node: d }))
      .on('mouseover', function(event, d) {
         tooltip.classed('hidden', false).style('opacity', 1)
           .html(`
             <div class="font-bold text-white mb-2 pb-1 border-b border-zinc-800 text-sm">${d.label}</div>
             <div class="text-[11px] text-zinc-400 mb-1 flex justify-between">Type: <span class="text-zinc-200 capitalize font-mono">${d.type}</span></div>
             <div class="text-[11px] text-zinc-400 flex justify-between">Status: <span class="uppercase font-bold ${d.status === 'safe' ? 'text-emerald-400' : d.status === 'vulnerable' ? 'text-orange-400' : d.status === 'patched' ? 'text-blue-400' : 'text-red-400'}">${d.status}</span></div>
           `);
      })
      .on('mousemove', function(event) {
         tooltip.style('left', (event.pageX + 20) + 'px').style('top', (event.pageY - 20) + 'px');
      })
      .on('mouseout', () => tooltip.style('opacity', 0));

    // Glow circle background
    nodeEnter.append('circle')
      .attr('class', 'base-bg')
      .attr('r', 22)
      .attr('stroke-width', 1.5)
      .style('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.5))');

    // Pulsing danger ring (hidden until triggered via logic block below)
    nodeEnter.append('circle')
      .attr('class', 'pulse-ring')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    nodeEnter.append('text')
      .attr('class', 'icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '14px')
      .text(d => NODE_TYPE_ICONS[d.type] || '📦');

    nodeEnter.append('text')
      .attr('class', 'label-text')
      .attr('text-anchor', 'middle')
      .attr('y', 34)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    const nodeMerged = nodeEnter.merge(nodeSelection);

    // Dynamic morphing - 60fps headless transitions native to D3!
    nodeMerged.select('.base-bg')
      .transition().duration(600).ease(d3.easeCubicOut)
      .attr('fill', d => NODE_COLORS[d.status].fill)
      .attr('stroke', d => d.status === 'patched' ? '#3b82f6' : d.status === 'vulnerable' ? '#f97316' : NODE_COLORS[d.status].stroke)
      .attr('stroke-width', d => d.status === 'compromised' || d.status === 'vulnerable' ? 2.5 : 1.5)
      .style('filter', d => d.status === 'vulnerable' ? 'drop-shadow(0 0 10px rgba(249,115,22,0.6))' : 'drop-shadow(0 0 4px rgba(0,0,0,0.5))');

    nodeMerged.select('.label-text')
      .attr('fill', d => NODE_COLORS[d.status].text)
      .text(d => d.label.length > 14 ? d.label.slice(0, 12) + '…' : d.label);

    // Independent pulsing memory-loop
    nodeMerged.each(function(d) {
       const ring = d3.select(this).select('.pulse-ring');
       if (d.status === 'compromised') {
          if (!ring.classed('animating')) {
             ring.classed('animating', true);
             ring.attr('stroke', '#ef4444');
             function triggerPulse() {
                if (!ring.classed('animating')) return; // Exit loop if status changes
                ring.attr('r', 22).attr('opacity', 0.8)
                  .transition().duration(1500).ease(d3.easeQuadOut)
                  .attr('r', 45).attr('opacity', 0)
                  .on('end', triggerPulse);
             }
             triggerPulse();
          }
       } else {
          ring.classed('animating', false).interrupt().attr('opacity', 0);
       }
    });

    nodeSelection.exit().remove();
  }, [nodes, edges]);

  // Clean unmount for tooltip overlays
  useEffect(() => { return () => { d3.select('.d3-tooltip').remove(); } }, []);

  function resetScenario(sc = scenario) {
    isGraphSetup.current = false;
    setNodes([...sc.initialNodes.map(n => ({ ...n }))]);
    setEdges([...sc.initialEdges.map(e => ({ ...e }))]);
    setRiskScore(0);
    terminalRef.current?.clearLogs();
    setAiSteps('');
    setDone(false);
    setRunning(false);
    setSelectedNode(null);
    abortRef.current = false;
    setSimId(uuidv4());
  }

  function changeScenario(sc: typeof scenario) {
    setScenario(sc);
    resetScenario(sc);
  }

  async function launchAttack() {
    if (running) return;
    abortRef.current = false;
    setRunning(true);
    setDone(false);
    setSaveStatus('idle');
    terminalRef.current?.clearLogs();
    setAiSteps('');
    resetScenario();


    // Propagate attack
    const path = scenario.propagationPath;
    let score = 0;
    for (let i = 0; i < path.length; i++) {
      if (abortRef.current) break;
      const nodeId = path[i];
      await sleep(i === 0 ? 400 : 1200);

      setNodes(prev => prev.map(n =>
        n.id === nodeId ? { ...n, status: 'compromised' } : n
      ));
      setEdges(prev => prev.map(e =>
        e.source === nodeId || e.target === nodeId ? { ...e, compromised: true } : e
      ));

      const node = scenario.initialNodes.find(n => n.id === nodeId);
      const weight = node?.riskLevel === 'critical' ? 20 : node?.riskLevel === 'high' ? 15 : 10;
      score = Math.min(100, score + weight);
      setRiskScore(score);
      
      const isInitial = i === 0;
      const type = isInitial ? 'compromise' : 'spread';
      const msg = isInitial 
        ? `${node?.label} compromised via ${scenario.cve || 'zero-day exploit'}`
        : `Lateral movement detected: spreading to ${node?.label} (${node?.type})`;
      
      terminalRef.current?.addLog(type, msg);
    }

    if (!abortRef.current) {
      terminalRef.current?.addLog('system', `Simulation complete. Final Risk Score: ${score}/100.`);
      setDone(true);

      // Trigger post-simulation AI analysis
      setLoadingSteps(true);
      toast.loading('Groq analyzing post-breach data...', { id: 'post-analysis' });
      
      const compromisedNodes = path.map(id => scenario.initialNodes.find(n => n.id === id)?.label || id);
      let analysisText = '';
      
      try {
        analysisText = await analyzeSimulationResults(scenario.name, scenario.type, compromisedNodes, score);
        setAiSteps(analysisText);
        toast.success('Analysis complete', { id: 'post-analysis' });
      } catch {
        toast.error('Groq analysis failed', { id: 'post-analysis' });
      }
      setLoadingSteps(false);
      
      // Persist run to Supabase (scenario + score + graph nodes)
      executeSave({ scenario, risk_score: score });
    }
    setRunning(false);
  }

  async function executeSave(payload: Omit<SaveSimulationPayload, 'nodes'>, attempt: number = 1) {
    setSaveStatus('saving');
    toast.loading(attempt === 1 ? 'Saving simulation...' : 'Retrying save...', { id: 'save-status' });

    const { nodes: currentNodes } = useSimulationStore.getState();

    try {
      await saveSimulation({
        ...payload,
        nodes: currentNodes,
      });
      setSaveStatus('success');
      toast.success('Simulation state persisted', {
        id: 'save-status',
        style: { fontSize: '12px', background: '#18181b', color: '#a1a1aa', border: '1px solid #27272a' },
      });
    } catch {
      if (attempt === 1) {
        // Exponential-ish backoff before a single retry
        await sleep(1500);
        await executeSave(payload, 2);
      } else {
        setSaveStatus('error');
        toast.error('Persistence failed. Data not recorded.', { id: 'save-status' });
      }
    }
  }

  async function handleMitigation(node: SimNode) {
    setSelectedNode(prev => prev ? { ...prev, loadingMitigation: true } : null);
    try {
      const text = await generateMitigation(node.label, node.cve || 'Unknown', node.type);
      setSelectedNode(prev => prev ? { ...prev, mitigation: text, loadingMitigation: false } : null);
    } catch {
      toast.error('Failed to get mitigation');
      setSelectedNode(prev => prev ? { ...prev, loadingMitigation: false } : null);
    }
  }



  async function patchNode(nodeId: string) {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'patched' } : n));
    setEdges(prev => prev.map(e => (e.source === nodeId || e.target === nodeId) ? { ...e, compromised: false } : e));
    terminalRef.current?.addLog('mitigation', `Mitigation deployed. Node ${nodeId} patched and isolated.`);
    toast.success('Node patched ✅');
    setSelectedNode(null);
  }

  const compromisedCount = nodes.filter(n => n.status === 'compromised').length;

  return (
    <PageWrapper>
      <div className="flex flex-col h-full min-h-screen bg-zinc-950 p-3 sm:p-4 gap-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Play size={18} className="text-emerald-400" /> Attack Simulator
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Select a scenario and launch to see real-time propagation</p>
          </div>
          <div className="flex items-center gap-2">
            {done && (
              <>
                <button
                  onClick={() => { navigator.clipboard.writeText(generateShareUrl(simId)); toast.success('Link copied!'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 text-xs hover:bg-zinc-700/60 transition-colors"
                >
                  <Share2 size={13} /> Share
                </button>
              </>
            )}
            <button
              onClick={() => resetScenario()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 text-xs hover:bg-zinc-700/60 transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-3 flex-1 min-h-0">
          {/* Left panel */}
          <div className="xl:w-64 flex flex-col gap-3 flex-shrink-0">
            {/* Scenario selector */}
            <GlassCard className="p-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Scenario</p>
              <div className="space-y-1">
                {ATTACK_SCENARIOS.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => changeScenario(sc)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs transition-all border',
                      scenario.id === sc.id
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                    )}
                  >
                    <div className="font-medium truncate">{sc.name}</div>
                    <div className="text-zinc-600 mt-0.5">{sc.year} · {sc.type}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Risk meter */}
            <GlassCard className="p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Risk Score</p>
              <RiskMeter score={riskScore} size="md" />
              <div className="w-full space-y-1 text-xs text-zinc-500">
                <div className="flex justify-between">
                  <span>Nodes compromised</span>
                  <span className={cn('font-mono font-bold', compromisedCount > 0 ? 'text-red-400' : 'text-zinc-400')}>{compromisedCount}/{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attack type</span>
                  <span className="text-zinc-300 font-mono truncate max-w-[120px]" title={scenario.type}>{scenario.type.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                {scenario.cve && (
                  <div className="flex justify-between">
                    <span>CVE</span>
                    <span className="text-orange-400 font-mono">{scenario.cve}</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Launch button */}
            <button
              onClick={running ? () => { abortRef.current = true; setRunning(false); } : launchAttack}
              className={cn(
                'w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                running
                  ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-emerald-500/20'
              )}
            >
              {running ? (
                <><Loader2 size={16} className="animate-spin" /> Stop Attack</>
              ) : (
                <><Play size={16} /> Launch Attack</>
              )}
            </button>

            {/* Scenario info */}
            <GlassCard className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={12} className="text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">About</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{scenario.description}</p>
              <SeverityBadge severity={scenario.severity} />
            </GlassCard>
          </div>

          {/* Center: graph */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <GlassCard className="flex-1 relative overflow-hidden" style={{ minHeight: '380px' }}>
              <div className="absolute top-2 left-2 text-xs text-zinc-600 z-10 font-mono">
                Scroll to zoom · Click node for details
              </div>
              <svg ref={svgRef} className="w-full h-full" style={{ minHeight: '380px' }} />
              {!running && !done && riskScore === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center space-y-2 opacity-40">
                    <Shield size={40} className="mx-auto text-zinc-600" />
                    <p className="text-zinc-600 text-sm">Select a scenario and launch attack</p>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Attack log */}
            <GlassCard className="flex flex-col relative" style={{ minHeight: '220px', maxHeight: '220px' }}>
               <TerminalLog ref={terminalRef} />
            </GlassCard>
          </div>

          {/* Right panel: AI steps */}
          {(aiSteps || loadingSteps) && (
            <div className="xl:w-72 flex-shrink-0">
              <GlassCard className="h-full p-4 overflow-y-auto" style={{ maxHeight: '640px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-xs text-zinc-400 uppercase tracking-wider">AI Analysis</span>
                </div>
                {loadingSteps ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <Spinner size={14} /> Analyzing breach data…
                  </div>
                ) : (
                  <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">{aiSteps}</div>
                )}
              </GlassCard>
            </div>
          )}
        </div>

        {/* Node detail modal */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={e => e.target === e.currentTarget && setSelectedNode(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg bg-zinc-900 border border-zinc-700/60 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{NODE_TYPE_ICONS[selectedNode.node.type]}</span>
                    <div>
                      <div className="font-semibold text-white">{selectedNode.node.label}</div>
                      <div className="text-xs text-zinc-500">{selectedNode.node.type} · v{selectedNode.node.version}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-zinc-800/60 rounded-lg p-3">
                      <div className="text-zinc-500 text-xs mb-1">Status</div>
                      <div className={cn('font-mono font-semibold capitalize', {
                        'text-red-400': selectedNode.node.status === 'compromised',
                        'text-orange-400': selectedNode.node.status === 'vulnerable',
                        'text-emerald-400': selectedNode.node.status === 'patched' || selectedNode.node.status === 'safe',
                      })}>{selectedNode.node.status}</div>
                    </div>
                    <div className="bg-zinc-800/60 rounded-lg p-3">
                      <div className="text-zinc-500 text-xs mb-1">Risk Level</div>
                      <SeverityBadge severity={selectedNode.node.riskLevel} />
                    </div>
                  </div>
                  {selectedNode.node.cve && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <div className="text-xs text-orange-400 font-mono font-bold">{selectedNode.node.cve}</div>
                      <div className="text-xs text-zinc-400 mt-1">{selectedNode.node.description}</div>
                    </div>
                  )}
                  {selectedNode.node.description && !selectedNode.node.cve && (
                    <p className="text-sm text-zinc-400">{selectedNode.node.description}</p>
                  )}

                  {selectedNode.mitigation && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-400 font-semibold uppercase">AI Mitigation</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(selectedNode.mitigation!); toast.success('Copied!'); }}
                          className="text-zinc-500 hover:text-white"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">{selectedNode.mitigation}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMitigation(selectedNode.node)}
                      disabled={!!selectedNode.loadingMitigation}
                      className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {selectedNode.loadingMitigation ? <Spinner size={14} /> : <Zap size={14} />}
                      Ask AI
                    </button>
                    {selectedNode.node.status === 'compromised' && (
                      <button
                        onClick={() => patchNode(selectedNode.node.id)}
                        className="flex-1 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/25 transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield size={14} /> Patch Node
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
