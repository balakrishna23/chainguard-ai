import { GitBranch, Cpu, Globe, AlertTriangle, Lock, Search } from 'lucide-react';

export const THREATS = [
  {
    id: 'dependency-confusion',
    icon: GitBranch,
    label: 'Dependency Confusion',
    description: 'An attack technique where an attacker publishes a malicious package with the same name as a private package to a public registry. Because package managers are often configured to prioritize public registries over private ones, or may simply poll them first, the malicious package is downloaded instead of the private, legitimate one.',
    mitigation: 'Use scoped packages, configure strict repository priorities in your package manager (e.g., .npmrc), and utilize lockfiles to ensure package resolution is predictable.',
  },
  {
    id: 'build-pipeline-backdoors',
    icon: Cpu,
    label: 'Build Pipeline Backdoors',
    description: 'A sophisticated attack where malicious actors gain access to a company\'s Continuous Integration/Continuous Deployment (CI/CD) pipelines. Once inside, they inject malicious code during the build process. Since the code seems to come from trusted, signed internal builds, it\'s incredibly hard to detect.',
    mitigation: 'Implement strict access controls, require multi-factor authentication for developers, utilize ephemeral build agents, and generate/verify provenance for all builds (e.g., using SLSA frameworks).',
  },
  {
    id: 'registry-poisoning',
    icon: Globe,
    label: 'Registry Poisoning',
    description: 'Attackers compromise package registries (like npm, PyPI, or RubyGems) directly, or compromise the accounts of popular maintainers. They then push malicious updates to widely used packages, instantly distributing malware to millions of downstream projects.',
    mitigation: 'Enforce MFA for all package publishers, rigorously scan incoming additions to artifact repositories, and maintain private, curated internal registries proxying public ones.',
  },
  {
    id: 'typosquatting',
    icon: AlertTriangle,
    label: 'Typosquatting',
    description: 'Attackers register names of packages that are very similar to popular legitimate packages (e.g., "react-dom" becomes "react-don"). When a developer makes a small typo during installation, they end up downloading the malicious package instead.',
    mitigation: 'Be vigilant during package installation, use automated tools to spell-check dependencies in package manifests against internal allowed lists.',
  },
  {
    id: 'code-signing-bypass',
    icon: Lock,
    label: 'Code Signing Bypass',
    description: 'An attack that involves stealing or forging digital certificates used to sign software. With a compromised certificate, attackers can sign their malware to make it appear as if it comes from a legitimate, trusted vendor, bypassing OS-level security checks.',
    mitigation: 'Store private keys in HSMs (Hardware Security Modules), tightly monitor internal signing infrastructure, and proactively watch for certificate revocations.',
  },
  {
    id: 'malicious-maintainers',
    icon: Search,
    label: 'Malicious Maintainers',
    description: 'Sometimes, an attacker will gain the trust of an open-source project by making legitimate contributions over time, eventually becoming a maintainer. Then, they insert subtle vulnerabilities or backdoors into the project. Alternatively, a project may be "sold" to a malicious actor.',
    mitigation: 'Conduct thorough reviews of all dependency updates, especially major version bumps or changes in ownership, and use community reputation tools and security scorecards.',
  },
];

export const POSTS = [
  {
    slug: 'xz-utils-backdoor',
    title: 'Understanding the XZ Utils Backdoor',
    excerpt: 'A detailed breakdown of how the sophisticated XZ Utils supply chain attack unfolded over years, and how you can detect similar anomalies.',
    date: 'April 2, 2024',
    author: 'Marcus Webb',
    category: 'Threat Intel',
    image: 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30',
    content: `
The XZ Utils backdoor (CVE-2024-3094) represents a watershed moment in open-source software security. Unlike high-volume automated attacks, this was a multi-year, highly targeted social engineering operation.

## The Long Con
The attacker, operating under the pseudonym "Jia Tan," spent years building trust within the XZ Utils community. They contributed legitimate code, engaged in issue tracking, and eventually gained co-maintainership of the project.

## The Technical Execution
The backdoor was masterfully hidden. It wasn't simple malicious code inserted into the core logic. Instead, it was obfuscated within the test suite data files and extracted during the build process *only* when building Debian or RPM packages on x86_64 Linux systems.

Once executed, it hooked into the OpenSSH daemon (sshd) during the RSA decryption process, allowing the attacker to bypass authentication and execute remote commands via a hardcoded public key.

## Defending Against "The Next XZ"
Detecting a patient, skilled insider threat is incredibly difficult. However, there are systemic improvements we must adopt:
* **Behavioral Analysis in CI/CD:** If a build process suddenly runs slower or executes unexpected shell commands, it should block the release.
* **Reviewing Build Assets:** Source code is not enough. The build scripts (\`configure\`, \`make\`) and their outputs must be verified against their inputs.
* **Community Vigilance:** The open-source community needs better funding and support to prevent burnout, which attackers use as an entry point.
`,
  },
  {
    slug: 'groq-vulnerability-triage',
    title: 'How Groq is Accelerating Vulnerability Triage',
    excerpt: 'Exploring the capabilities of LLMs in parsing vast amounts of CVE data to deliver actionable, contextual remediation advice.',
    date: 'March 15, 2024',
    author: 'James Okafor',
    category: 'AI / Research',
    image: 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30',
    content: `
Security teams are drowning in alerts. Modern applications pull in thousands of dependencies, resulting in endless lists of CVEs—many of which are false positives or unactionable. 

## The Triage Problem
When a CVE drops, security analysts must ask:
1. Is this dependency actually loaded in memory?
2. Is the vulnerable function executed by our application flow?
3. What is the immediate remediation path?

Answering these questions manually for 50+ vulnerabilities a day is impossible.

## Enter Groq
By feeding Software Bill of Materials (SBOM) data and vulnerability data into Groq-backed models, we are changing how triage works at ChainGuard AI.

Groq-backed inference excels at low-latency context retrieval and summarization. Instead of presenting a generic CVE description, the model can analyze the structure of your application graph and output insights like:
> "You have CVE-2024-XXXX in \`library-b\`. However, you only use \`library-a\` to parse JSON, and \`library-b\` is an optional XML-parsing dependency. The vulnerable execution path is unreached. Priority: Low."

By moving from abstract vulnerabilities to concrete exploitability, AI is allowing security teams to focus on the 5% of alerts that actually pose a risk to their supply chain.
`,
  },
  {
    slug: 'future-of-sboms',
    title: 'The Future of SBOMs: From Compliance to Active Defense',
    excerpt: 'Software Bill of Materials have become a compliance check box. Here is how organizations are using them as an active defense mechanism.',
    date: 'February 28, 2024',
    author: 'Sarah Chen',
    category: 'Best Practices',
    image: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30',
    content: `
Since the US Executive Order on Cybersecurity, Software Bill of Materials (SBOMs) have become a buzzword. Unfortunately, for many organizations, generating an SBOM is just a compliance checkbox—a JSON file generated at build time and immediately stored away in a digital filing cabinet.

## Static vs. Active SBOMs
An SBOM is only valuable if it is actionable.

An **Active Defense** approach treats the SBOM as a living graph of your application's surface area. 

### 1. Continuous Evaluation
Instead of scanning code only at build time, ingest SBOMs into a real-time risk database. When a new Zero-Day is announced, your systems should instantly query the central SBOM graph and map exposure across the entire organization in seconds, not days.

### 2. Runtime Integrity Checks
In advanced implementations, an SBOM can dictate runtime behavior. By using eBPF or similar kernel-level tools, applications can verify that they are only executing binaries and loading dependencies explicitly defined in the signed SBOM. Any deviation blocks execution.

### Conclusion
Treating an SBOM as a document is a missed opportunity. Treat it as the architectural blueprint for your dynamic defense layers.
`,
  },
  {
    slug: 'securing-cicd-pipelines',
    title: 'Securing Your CI/CD Pipeline Against Insider Threats',
    excerpt: 'Practical steps to lock down your build infrastructure, verify provenance, and ensure code integrity from commit to deploy.',
    date: 'February 10, 2024',
    author: 'Priya Nair',
    category: 'Engineering',
    image: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    content: `
If an attacker compromises your CI/CD pipeline, they control your software. They can inject backdoors into your releases without ever touching your source code repository, effectively bypassing all traditional code reviews and SAST scanners.

## The Pillars of CI/CD Security
To protect your pipeline, you must adopt a zero-trust mindset for your build environment.

### 1. Ephemeral Environments
Never reuse build agents. Every build should start from a clean, hardened image and be destroyed immediately after. This prevents advanced persistent threats from dwelling inside your Jenkins or Action runners.

### 2. Least Privilege Service Accounts
Your CI/CD provider should not have root access to your cloud environment. Use OpenID Connect (OIDC) to grant short-lived, scoped credentials to your pipeline based on the exact repository and branch being built.

### 3. Build Provenance
How do your customers know the binary they downloaded was actually produced by your source code? Frameworks like SLSA (Supply-chain Levels for Software Artifacts) provide guidelines for generating non-falsifiable provenance records. When a build completes, the pipeline should sign a manifesto declaring exactly what source commit produced the artifact, and what environment built it.

Pipeline security is no longer an ops problem; it is the front line of software development.
`,
  },
  {
    slug: 'log4shell-two-years-later',
    title: 'Log4Shell Two Years Later: Lessons Learned',
    excerpt: 'Reflecting on the biggest vulnerability in internet history. What changed, what didn\'t, and what we must do better.',
    date: 'December 10, 2023',
    author: 'Marcus Webb',
    category: 'Retrospective',
    image: 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30',
    content: `
Two years ago, the Log4Shell vulnerability (CVE-2021-44228) set the internet on fire. An unauthenticated remote code execution vulnerability in one of the most ubiquitous logging libraries (Log4j) meant virtually every enterprise was exposed.

## What Did We Learn?
The incident laid bare the fragility of modern software engineering. We learned that deep, transitive dependencies are black boxes for most organizations. 

We saw enterprise incident response teams scrambling for weeks, asking developers to "grep" their filesystems to figure out if they were vulnerable.

## What Changed?
* **Visibility Tools:** The incident massively accelerated the adoption of SBOMs and dependency mapping tools (like ChainGuard AI).
* **Funding OSS:** There is a renewed, albeit slow, effort to fund critical open-source infrastructure projects. We realized that billion-dollar ecosystems were relying on libraries maintained by volunteers in their spare time.

## What Didn't Change?
Unfortunately, thousands of production servers are *still* running vulnerable versions of Log4j. The remediation tail for supply chain vulnerabilities is incredibly long. 

Until aggressive, automated patch management becomes the industry standard, Log4Shell will remain an exploitable vector for years to come.
`,
  },
  {
    slug: 'announcing-chainguard-enterprise',
    title: 'Announcing ChainGuard Enterprise',
    excerpt: 'Today we are excited to announce the general availability of ChainGuard Enterprise, designed for large-scale security operations.',
    date: 'November 1, 2023',
    author: 'Team ChainGuard',
    category: 'Company News',
    image: 'bg-gradient-to-br from-zinc-500/20 to-zinc-400/20 border-zinc-500/30',
    content: `
We are thrilled to launch ChainGuard Enterprise—our solution for large organizations that need granular control over their software supply chain security.

## Built for Scale
After working with 50+ design partners, we realized that while developers love our Attack Simulator, security analysts need a more robust set of tools. 

ChainGuard Enterprise introduces:
* **Custom Attack Modeling:** Don't just replay Log4Shell. Model bespoke attacks targeting your specific architecture.
* **SIEM Integrations:** Natively export security events and simulation results to Splunk, Datadog, or Azure Sentinel.
* **Role-Based Access Control:** Define strict permissions for who can run simulations, view reports, or manage SBOM policies.

## Looking Forward
Our mission remains clearly focused on ending supply chain attacks. With the Enterprise release, we are taking a massive step towards making our dynamic defense technology accessible to the world's most critical infrastructure providers.

We can't wait to see how you use it.
`,
  },
];
