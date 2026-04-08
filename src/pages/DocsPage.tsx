import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Book, Play, Zap, FileText, Code, Settings } from 'lucide-react';

const CATEGORIES = [
  {
    title: 'Getting Started',
    icon: Book,
    items: ['Introduction to ChainGuard AI', 'Quick Start Guide', 'Supported Package Managers'],
  },
  {
    title: 'Attack Simulator',
    icon: Play,
    items: ['Running Your First Simulation', 'Understanding the Graph', 'Custom Scenarios', 'Exporting Results'],
  },
  {
    title: 'AI Defender',
    icon: Zap,
    items: ['Uploading SBOMs', 'How Groq Analyzes Risk', 'Reading AI Triage Summaries'],
  },
  {
    title: 'SBOM Scanner',
    icon: FileText,
    items: ['Generating an SBOM', 'Format Support (SPDX, CycloneDX)', 'Continuous Integration'],
  },
  {
    title: 'API Reference',
    icon: Code,
    items: ['Authentication', 'Simulations API', 'Upload API', 'Webhooks'],
  },
  {
    title: 'Account & Settings',
    icon: Settings,
    items: ['Managing Team Members', 'Billing', 'Integrations'],
  },
];

export default function DocsPage() {
  useEffect(() => { document.title = 'Documentation — ChainGuard AI'; }, []);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      {/* Navbar Minimal */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl flex-shrink-0">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">ChainGuard AI</span>
            <span className="text-zinc-500 text-sm ml-2">Docs</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="relative hidden md:block">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                 type="text" 
                 placeholder="Search docs (Ctrl+K)" 
                 className="w-64 bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
               />
             </div>
            <Link to="/simulator" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">Go to App</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1400px] mx-auto w-full flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-zinc-800/60 p-6 overflow-y-auto h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="space-y-8">
            {CATEGORIES.map((category, idx) => {
              const Icon = category.icon;
              return (
                <div key={idx}>
                  <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-3 text-sm">
                    <Icon size={16} className="text-emerald-400" />
                    {category.title}
                  </div>
                  <ul className="space-y-2 border-l border-zinc-800 pl-4 ml-2">
                    {category.items.map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors block">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="text-emerald-400 font-mono text-sm mb-4">Getting Started / Introduction</div>
            <h1 className="text-4xl font-bold font-display mb-6">Introduction to ChainGuard AI</h1>
            <p className="text-zinc-300 text-lg leading-relaxed mb-8">
              ChainGuard AI is an advanced platform for visualizing, simulating, and defending against software supply chain attacks. It uses Groq-backed AI to triage vulnerabilities and provide actionable remediation steps.
            </p>

            <div className="mb-10 p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Zap size={16} className="text-emerald-500" /> Prerequisites
              </h3>
              <ul className="list-disc pl-5 text-zinc-400 space-y-1 text-sm">
                <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>For SBOM uploads: A valid cyclonedx.json or spdx.json file</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold font-display mt-10 mb-4 pb-2 border-b border-zinc-800">Core Concepts</h2>
            
            <div className="space-y-8 mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">1. The Dependency Graph</h3>
                <p className="text-zinc-400 leading-relaxed">
                  The dependency graph is a visual representation of your software's building blocks. Nodes represent packages, services, or environments, and edges represent the relationships between them.
                </p>
                <div className="my-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800 overflow-x-auto">
                  <pre className="text-zinc-300 text-sm"><code>{`{
  "nodes": [
    { "id": "server", "label": "App Server" },
    { "id": "lib-a", "label": "log4j-core" }
  ],
  "edges": [
    { "source": "server", "target": "lib-a" }
  ]
}`}</code></pre>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">2. Attack Simulation</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Simulations allow you to see how a vulnerability in a transitive dependency could propagate through your system and compromise critical assets.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                    <div className="font-semibold mb-1 text-emerald-400">Log4Shell</div>
                    <p className="text-xs text-zinc-500">Simulate JNDI lookup vulnerability propagation.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                    <div className="font-semibold mb-1 text-cyan-400">SolarWinds</div>
                    <p className="text-xs text-zinc-500">Simulate build pipeline compromise.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">3. AI Defender</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Instead of drowning in hundreds of CVE alerts, AI Defender parses your SBOM and provides a prioritized, human-readable triage report.
                </p>
              </div>
            </div>

            <div className="mt-16 flex justify-between border-t border-zinc-800 pt-8">
              <a href="#" className="text-zinc-500 hover:text-zinc-300">Previous: None</a>
              <a href="#" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">Next: Quick Start Guide <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
        </main>
        
        {/* Right Sidebar (Table of contents) */}
        <aside className="hidden xl:block w-64 p-8 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">On this page</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Prerequisites</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Core Concepts</a>
              <ul className="pl-3 mt-2 space-y-2 border-l-2 border-zinc-800">
                 <li><a href="#" className="hover:text-emerald-400 transition-colors">1. The Dependency Graph</a></li>
                 <li><a href="#" className="hover:text-emerald-400 transition-colors">2. Attack Simulation</a></li>
                 <li><a href="#" className="hover:text-emerald-400 transition-colors">3. AI Defender</a></li>
              </ul>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
