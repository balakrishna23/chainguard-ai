import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  Zap, Upload, Send, Copy, Check, Loader2, Trash2,
  FileText, MessageSquare, AlertTriangle,
  CheckCircle, XCircle, Plus, X
} from 'lucide-react';
import { streamChat, analyzeSBOM } from '../lib/ai';
import { api } from '../lib/utils';
import { PageWrapper, GlassCard, Spinner, Skeleton } from '../components/ui';
import type { ChatMessage } from '../types';

const SAMPLE_SBOM = `# SBOM - my-ecommerce-app v2.1.0
log4j-core:2.14.1
spring-boot:2.5.0
jackson-databind:2.12.3
commons-text:1.9
openssl:1.0.1e
lodash:4.17.4
moment:2.18.1
node-fetch:2.6.0
axios:0.19.0
jsonwebtoken:8.5.1
mongoose:5.10.0
express:4.17.1
react:16.8.0
webpack:4.42.0
babel-core:6.26.3`;

const STARTER_QUESTIONS = [
  'What is a supply chain attack?',
  'How do I secure my CI/CD pipeline?',
  'What is an SBOM and why does it matter?',
  'How can I detect typosquatting attacks?',
];

type Tab = 'chat' | 'sbom';

export default function DefenderPage() {
  const [tab, setTab] = useState<Tab>('chat');
  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', role: 'assistant', timestamp: new Date(),
    content: "I'm ChainGuard AI, your supply chain security expert. Ask me anything — vulnerabilities, mitigation strategies, SBOM analysis, or how to harden your pipelines.",
  }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SBOM
  const [sbomText, setSbomText] = useState('');
  const [sbomAnalysis, setSbomAnalysis] = useState('');
  const [analyzingBom, setAnalyzingBom] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [manualName, setManualName] = useState('');
  const [manualVersion, setManualVersion] = useState('');
  const [manualType, setManualType] = useState<'library' | 'service' | 'database' | 'api'>('library');
  const [manualNodes, setManualNodes] = useState<Array<{name: string; version: string; type: string}>>([]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendChat(text?: string) {
    const content = text || chatInput;
    if (!content.trim() || chatLoading) return;
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content, timestamp: new Date() };
    const assistantId = uuidv4();
    setMessages(prev => [...prev, userMsg, {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true
    }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user', content: m.content
      }));
      let full = '';
      for await (const chunk of streamChat(history, content)) {
        full += chunk;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: full } : m));
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? {
        ...m, content: 'Error connecting to Groq. Check your `GROQ_API_KEY` configuration and try again.', isStreaming: false
      } : m));
    } finally {
      setChatLoading(false);
    }
  }

  async function handleAnalyzeSBOM() {
    console.log('[Defender] handleAnalyzeSBOM called', { hasManualNodes: manualNodes.length, hasSbomText: sbomText.trim().length });
    const hasManualNodes = manualNodes.length > 0;
    const hasSbomText = sbomText.trim().length > 0;
    if (!hasSbomText && !hasManualNodes) {
      toast.error('Add at least one node or paste SBOM text');
      return;
    }
    setAnalyzingBom(true);
    setSbomAnalysis('');
    try {
      const manualNodeText = manualNodes
        .map((node) => `${node.name}${node.version ? `:${node.version}` : ''} (${node.type})`)
        .join('\n');
      const analysisInput = [sbomText.trim(), manualNodeText].filter(Boolean).join('\n');
      const result = await analyzeSBOM(analysisInput);
      setSbomAnalysis(result);

      // Save to backend
      const criticalCount = (result.match(/critical/gi) || []).length;
      const highCount = (result.match(/\bhigh\b/gi) || []).length;
      const medCount = (result.match(/\bmedium\b/gi) || []).length;
      await api.saveSimulation({
        id: uuidv4(),
        attack_type: 'SBOM Analysis',
        scenario_name: 'SBOM Vulnerability Scan',
        risk_score: Math.min(100, criticalCount * 20 + highCount * 10 + medCount * 5),
        nodes_affected: (analysisInput.match(/\n/g) || []).length,
        gemini_summary: result.slice(0, 500),
      }).catch(() => {});
      toast.success('SBOM analyzed!');
    } catch {
      toast.error('Analysis failed — check your Groq configuration');
    }
    setAnalyzingBom(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSbomText(text);
    toast.success(`Loaded ${file.name}`);
  }

  function handleAddManualNode() {
    if (!manualName.trim()) return;
    setManualNodes(prev => [...prev, {
      name: manualName.trim(),
      version: manualVersion.trim(),
      type: manualType
    }]);
    setManualName('');
    setManualVersion('');
    setManualType('library');
  }

  function copyAnalysis() {
    navigator.clipboard.writeText(sbomAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  }

  // Simple markdown-ish renderer
  function renderMessage(content: string) {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-white text-sm mt-3 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-white text-base mt-3 mb-1">{line.slice(2)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} className="text-white font-semibold block">{line.slice(2, -2)}</strong>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-zinc-300">{line.slice(2)}</li>;
        if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal text-zinc-300">{line.replace(/^\d+\. /, '')}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <span key={i} className="block text-zinc-300">{line}</span>;
      });
  }

  return (
    <PageWrapper>
      <div className="flex flex-col h-full min-h-screen bg-zinc-950 p-3 sm:p-4 gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Zap size={18} className="text-emerald-400" /> AI Defender
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Chat with Groq AI or analyze your SBOM for vulnerabilities</p>
          </div>
          <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1">
            {(['chat', 'sbom'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  tab === t ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t === 'chat' ? '💬 Chat' : '📋 SBOM'}
              </button>
            ))}
          </div>
        </div>

        {/* Chat tab */}
        {tab === 'chat' && (
          <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
            {/* Chat */}
            <GlassCard className="flex-1 flex flex-col min-h-0" style={{ minHeight: '500px' }}>
              <div className="flex items-center gap-2 p-3 border-b border-zinc-800/60">
                <MessageSquare size={14} className="text-emerald-400" />
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Security Chat</span>
                {chatLoading && <Spinner size={12} className="ml-auto" />}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-100 rounded-tr-sm'
                        : 'bg-zinc-800/60 border border-zinc-700/40 text-zinc-200 rounded-tl-sm'
                    }`}>
                      <div className="space-y-0.5">
                        {renderMessage(msg.content)}
                        {msg.isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-zinc-800/60">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                    placeholder="Ask about supply chain security..."
                    className="flex-1 bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={chatLoading || !chatInput.trim()}
                    className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                  >
                    {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Starter questions */}
            <div className="lg:w-56 flex-shrink-0 space-y-3">
              <GlassCard className="p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Quick Questions</p>
                <div className="space-y-1.5">
                  {STARTER_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendChat(q)}
                      disabled={chatLoading}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors border border-transparent hover:border-zinc-700/40 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tips</p>
                <ul className="space-y-2 text-xs text-zinc-500">
                  <li>• Ask about specific CVEs</li>
                  <li>• Describe your tech stack</li>
                  <li>• Request SBOM templates</li>
                  <li>• Ask for remediation plans</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        )}

        {/* SBOM tab */}
        {tab === 'sbom' && (
          <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
            {/* SBOM input */}
            <div className="flex-1 flex flex-col gap-3">
              <GlassCard className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-emerald-400" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider">SBOM / Dependencies</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSbomText(SAMPLE_SBOM)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white transition-colors"
                    >
                      Load Example
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Upload size={11} /> Upload
                    </button>
                    <input ref={fileRef} type="file" accept=".txt,.json,.xml,.csv" onChange={handleFileUpload} className="hidden" />
                  </div>
                </div>
                <textarea
                  value={sbomText}
                  onChange={e => setSbomText(e.target.value)}
                  placeholder={`Paste your SBOM, package-lock.json, requirements.txt, or dependency list here...\n\nExample:\nlog4j-core:2.14.1\nspring-boot:2.5.0\nlodash:4.17.4`}
                  className="flex-1 bg-transparent resize-none p-4 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none min-h-64"
                />
                {/* Manual Node Entry */}
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 mt-6 mx-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus size={16} className="text-emerald-400" />
                    <h3 className="text-white font-semibold">Add Node Manually</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Package name (e.g. lodash)"
                      className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <input
                      type="text"
                      value={manualVersion}
                      onChange={(e) => setManualVersion(e.target.value)}
                      placeholder="Version (e.g. 4.17.20)"
                      className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value as any)}
                      className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    >
                      <option value="library">Library</option>
                      <option value="service">Service</option>
                      <option value="database">Database</option>
                      <option value="api">API</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddManualNode}
                    disabled={!manualName.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Node
                  </button>

                  {/* Manual nodes list */}
                  {manualNodes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-zinc-500">Added nodes ({manualNodes.length})</p>
                      {manualNodes.map((node, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/40 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{node.name}</span>
                            {node.version && <span className="text-xs text-zinc-500">v{node.version}</span>}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{node.type}</span>
                          </div>
                          <button
                            onClick={() => setManualNodes(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">
                    {sbomText ? `${sbomText.split('\n').length} lines` : 'No content'}
                  </span>
                  <div className="flex gap-2">
                    {sbomText && (
                      <button onClick={() => setSbomText('')} className="text-zinc-500 hover:text-white">
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={handleAnalyzeSBOM}
                      disabled={analyzingBom || (!sbomText.trim() && manualNodes.length === 0)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {analyzingBom ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Zap size={14} /> Analyze with Groq</>}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Analysis result */}
            <div className="flex-1 flex flex-col">
              <GlassCard className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-emerald-400" />
                    <span className="text-xs text-zinc-400 uppercase tracking-wider">AI Analysis</span>
                  </div>
                  {sbomAnalysis && (
                    <button
                      onClick={copyAnalysis}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {copied ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {analyzingBom ? (
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => <Skeleton key={i} className={`h-3 ${i % 3 === 2 ? 'w-1/2' : 'w-full'}`} />)}
                      <div className="flex items-center gap-2 text-emerald-400 text-sm mt-4">
                        <Loader2 size={16} className="animate-spin" />
                        Groq is scanning for vulnerabilities…
                      </div>
                    </div>
                  ) : sbomAnalysis ? (
                    <div className="text-sm text-zinc-300 space-y-1">
                      {sbomAnalysis.split('\n').map((line, i) => {
                        if (line.startsWith('## ') || line.startsWith('**')) {
                          return <h3 key={i} className="font-bold text-white mt-4 mb-1 first:mt-0">{line.replace(/[#*]/g, '').trim()}</h3>;
                        }
                        if (line.includes('CRITICAL') || line.includes('critical')) {
                          return <p key={i} className="text-red-300 flex gap-2"><XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />{line}</p>;
                        }
                        if (line.toLowerCase().includes('high')) {
                          return <p key={i} className="text-orange-300 flex gap-2"><AlertTriangle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />{line}</p>;
                        }
                        if (line.toLowerCase().includes('fix') || line.toLowerCase().includes('patch') || line.toLowerCase().includes('update')) {
                          return <p key={i} className="text-emerald-300 flex gap-2"><CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />{line}</p>;
                        }
                        if (line.startsWith('- ') || line.startsWith('* ')) {
                          return <p key={i} className="ml-4 text-zinc-300 list-disc">• {line.slice(2)}</p>;
                        }
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-zinc-600">
                      <FileText size={40} className="opacity-30" />
                      <p className="text-sm">Paste your SBOM and click "Analyze with Groq" to get<br />a prioritized vulnerability report</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
