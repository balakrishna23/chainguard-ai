export type ScenarioSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  entryNodeId: string;
  severity: ScenarioSeverity;
  attackType: string;
}

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'log4shell',
    name: 'Log4Shell (CVE-2021-44228)',
    description: 'A zero-day exploit in the popular Java logging framework Log4j. An attacker sends a crafted malicious string via any logged input structure (like HTTP headers), causing the server to reach out to an attacker-controlled LDAP server and execute malicious code via JNDI injection.',
    entryNodeId: 'backend-api', // Assuming a generic network or API gateway node
    severity: 'Critical',
    attackType: 'Remote Code Execution (RCE)'
  },
  {
    id: 'solarwinds',
    name: 'SolarWinds SUNBURST',
    description: 'A sophisticated state-sponsored supply chain attack where malicious actors gained access to the SolarWinds Orion build environment. They injected a backdoor into the digitally signed updates, which were then blindly distributed to thousands of enterprise and government clients.',
    entryNodeId: 'build-server', // Representing the compromised build infrastructure
    severity: 'Critical',
    attackType: 'Build Pipeline Compromise'
  },
  {
    id: 'dependency-confusion',
    name: 'Dependency Confusion',
    description: 'An attacker publishes a package to a public registry (like npm or PyPI) with the exact same name as a private internal package used by a company, but with a drastically higher version number. Package managers mistakenly prioritize the public, higher-version malicious package over the safe internal one.',
    entryNodeId: 'package-manager', // Representing the package resolution step
    severity: 'High',
    attackType: 'Registry Exploitation'
  }
];
