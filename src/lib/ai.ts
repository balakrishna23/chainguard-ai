const AI_API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_AI_API_URL) ||
  '/api/groq';

async function generate(prompt: string): Promise<string> {
  const res = await fetch(`${AI_API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    let message = `Groq error: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // fall back to the HTTP status text when no JSON body is available
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data.response || '';
}

async function* streamGenerate(prompt: string): AsyncGenerator<string> {
  const res = await fetch(`${AI_API_BASE}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    let message = `Groq error: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore malformed error bodies
    }
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const lines = event
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'));

      for (const line of lines) {
        const payload = line.slice(5).trim();
        if (!payload) continue;
        if (payload === '[DONE]') return;

        try {
          const json = JSON.parse(payload);
          if (json.error) throw new Error(json.error);
          if (json.token) yield json.token;
        } catch (error) {
          if (error instanceof Error && jsonLikeError(payload)) {
            throw error;
          }
        }
      }
    }
  }
}

function jsonLikeError(payload: string) {
  return payload.startsWith('{') && payload.endsWith('}');
}

export async function generateAttackSteps(
  scenarioName: string,
  entryPoint: string,
  affectedNodes: string[]
): Promise<string> {
  const prompt = `You are a cybersecurity expert analyzing a supply chain attack.

Attack Scenario: ${scenarioName}
Entry Point: ${entryPoint}
Affected Components: ${affectedNodes.join(', ')}

Provide a realistic, detailed attack timeline with:
1. Initial compromise method
2. Lateral movement steps (3-5 steps)
3. Data exfiltration or damage assessment
4. Detection indicators (IOCs)
5. Estimated time to full compromise

Format as numbered steps. Be specific and technical. Keep it under 400 words.`;

  return await generate(prompt);
}

export async function analyzeSimulationResults(
  scenarioName: string,
  attackType: string,
  compromisedNodes: string[],
  riskScore: number
): Promise<string> {
  const prompt = `Analyze this simulated breach:
Scenario: ${scenarioName}
Type: ${attackType}
Score: ${riskScore}/100
Compromised Nodes: ${compromisedNodes.join(', ')}

Provide a structured report:
1. SUMMARY: Provide a 2-sentence summary.
2. RISKS: Identify 2 key vulnerabilities exposed.
3. RECOMMENDATIONS: Provide 2 immediate mitigation steps.

Keep it highly concise. Maximum 150 words total. Do not use asterisks or markdown formatting. Use uppercase section headers exactly as written above.`;

  return await generate(prompt);
}

export async function generateMitigation(
  nodeName: string,
  cve: string,
  nodeType: string
): Promise<string> {
  const prompt = `You are a security engineer. Provide immediate mitigation steps for:

Component: ${nodeName} (${nodeType})
CVE: ${cve || 'Unknown vulnerability'}

Provide:
1. Immediate containment (1-2 actions)
2. Short-term fix (patch/workaround)
3. Long-term hardening (2-3 recommendations)
4. Monitoring signals to watch

Be actionable and specific. Under 300 words.`;

  return await generate(prompt);
}

export async function analyzeSBOM(sbomContent: string): Promise<string> {
  const prompt = `You are a supply chain security expert. Analyze this SBOM/dependency list:

${sbomContent.substring(0, 3000)}

Provide:
1. **Critical Vulnerabilities** (CVEs if known)
2. **High Risk Dependencies** with specific concerns
3. **License Issues** (GPL conflicts, etc.)
4. **Prioritized Fix List** (numbered, most urgent first)
5. **Quick Wins** (easy upgrades/replacements)

Format with clear headers and bullet points. Be specific about versions and CVEs.`;

  return await generate(prompt);
}

export async function* streamChat(
  messages: { role: string; content: string }[],
  userMessage: string
): AsyncGenerator<string> {
  const systemPrompt = `You are ChainGuard AI, an expert cybersecurity assistant specializing in supply chain security.
You help security teams understand attack vectors, defend their software supply chains, analyze dependencies, and respond to incidents.
Be concise, technical, and actionable. Use markdown formatting.`;

  const historyText = messages
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}

${historyText}
User: ${userMessage}
Assistant:`;

  yield* streamGenerate(fullPrompt);
}

export async function generateSimulationSummary(
  scenarioName: string,
  riskScore: number,
  nodesAffected: number,
  attackType: string
): Promise<string> {
  const prompt = `Summarize this supply chain simulation in 2-3 sentences for a security report:
Scenario: ${scenarioName}
Attack Type: ${attackType}
Risk Score: ${riskScore}/100
Nodes Compromised: ${nodesAffected}

Be concise and professional.`;

  return await generate(prompt);
}

export async function generateStructuredAnalysis(prompt: string): Promise<string> {
  return await generate(prompt);
}
