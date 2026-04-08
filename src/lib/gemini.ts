import { GoogleGenAI } from '@google/genai';

const API_KEY = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';

let genAI: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
  }
  return genAI;
}

export async function generateAttackSteps(scenarioName: string, entryPoint: string, affectedNodes: string[]): Promise<string> {
  const client = getClient();
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

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return response.text || 'Unable to generate attack steps.';
}

export async function generateMitigation(nodeName: string, cve: string, nodeType: string): Promise<string> {
  const client = getClient();
  const prompt = `You are a security engineer. Provide immediate mitigation steps for:

Component: ${nodeName} (${nodeType})
CVE: ${cve || 'Unknown vulnerability'}

Provide:
1. Immediate containment (1-2 actions)
2. Short-term fix (patch/workaround)
3. Long-term hardening (2-3 recommendations)
4. Monitoring signals to watch

Be actionable and specific. Under 300 words.`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return response.text || 'Unable to generate mitigation.';
}

export async function analyzeSBOM(sbomContent: string): Promise<string> {
  const client = getClient();
  const prompt = `You are a supply chain security expert. Analyze this SBOM/dependency list:

${sbomContent.substring(0, 3000)}

Provide:
1. **Critical Vulnerabilities** (CVEs if known)
2. **High Risk Dependencies** with specific concerns
3. **License Issues** (GPL conflicts, etc.)
4. **Prioritized Fix List** (numbered, most urgent first)
5. **Quick Wins** (easy upgrades/replacements)

Format with clear headers and bullet points. Be specific about versions and CVEs.`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return response.text || 'Unable to analyze SBOM.';
}

export async function* streamChat(messages: { role: string; content: string }[], userMessage: string): AsyncGenerator<string> {
  const client = getClient();
  
  const systemPrompt = `You are ChainGuard AI, an expert cybersecurity assistant specializing in supply chain security. 
You help security teams understand attack vectors, defend their software supply chains, analyze dependencies, and respond to incidents.
Be concise, technical, and actionable. Use markdown formatting.`;

  const allMessages = [
    ...messages.map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content }] })),
    { role: 'user' as const, parts: [{ text: userMessage }] }
  ];

  const stream = await client.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: allMessages,
    config: {
      systemInstruction: systemPrompt,
    }
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

export async function generateSimulationSummary(
  scenarioName: string,
  riskScore: number,
  nodesAffected: number,
  attackType: string
): Promise<string> {
  const client = getClient();
  const prompt = `Summarize this supply chain simulation in 2-3 sentences for a security report:
Scenario: ${scenarioName}
Attack Type: ${attackType}
Risk Score: ${riskScore}/100
Nodes Compromised: ${nodesAffected}

Be concise and professional.`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return response.text || '';
}
