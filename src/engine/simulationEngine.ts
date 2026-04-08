export type NodeStatus = 'safe' | 'vulnerable' | 'compromised';

export interface SimulationNode {
  id: string;
  type: string;
  dependencies: string[];
  status: NodeStatus;
  [key: string]: any; // Allow extensibility for UI properties
}

export interface SimulationState {
  nodes: SimulationNode[];
  riskScore: number;
  stepCount: number;
  logMessage: string;
  isComplete: boolean;
}

export type SimulationCallback = (state: SimulationState) => void;

export interface SimulationConfig {
  maxSteps?: number;
  stepIntervalMs?: number;
  onUpdate: SimulationCallback;
  /**
   * Probability (0.0 to 1.0) of a node becoming compromised per step 
   * if one of its dependencies is compromised, mapped by node type.
   */
  probabilities?: Record<string, number>;
}

const DEFAULT_PROBABILITIES: Record<string, number> = {
  'database': 0.3,
  'api': 0.6,
  'server': 0.5,
  'library': 0.8,
  'frontend': 0.4,
  'backend': 0.6,
  'default': 0.5
};

export class SimulationEngine {
  private nodes: SimulationNode[] = [];
  private stepCount: number = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = {
      maxSteps: 20,
      stepIntervalMs: 1000,
      probabilities: DEFAULT_PROBABILITIES,
      ...config
    };
  }

  /**
   * Starts the simulation with the given initial topology.
   * If an entryNodeId is provided, that node gets instantly compromised.
   */
  public start(initialNodes: SimulationNode[], entryNodeId?: string): void {
    if (this.timer) {
      this.stop();
    }
    
    // Deep copy to ensure we don't mutate the original input accidentally
    this.nodes = JSON.parse(JSON.stringify(initialNodes));
    
    // Auto-compromise the entry node if specified
    if (entryNodeId) {
      const entryNode = this.nodes.find(n => n.id === entryNodeId);
      if (entryNode) {
        entryNode.status = 'compromised';
      }
    }

    this.stepCount = 0;
    
    // Trigger initial state
    this.notifyUpdate('Simulation initialized.');

    this.timer = setInterval(() => {
      this.runStep();
    }, this.config.stepIntervalMs);
  }

  /**
   * Halts the running simulation.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Executes a single step of the simulation synchronously.
   */
  public runStep(): void {
    this.stepCount++;
    const { changed, spreadCount } = this.propagate();
    const risk = this.calculateRisk();
    const maxSteps = this.config.maxSteps || 20;

    const isComplete = this.stepCount >= maxSteps || !changed;
    let message = `Step ${this.stepCount}: `;
    
    if (spreadCount > 0) {
      message += `Attack spread to ${spreadCount} new node(s).`;
    } else {
      message += `No lateral movement detected.`;
    }

    if (isComplete) {
      this.stop();
      if (!changed && this.stepCount > 1) {
        message += ' Attack contained.';
      } else if (this.stepCount >= maxSteps) {
        message += ' Maximum steps reached.';
      }
    }

    this.notifyUpdate(message, isComplete);
  }

  /**
   * Calculates lateral movement based on dependencies and type probabilities.
   */
  private propagate(): { changed: boolean; spreadCount: number } {
    let changed = false;
    let spreadCount = 0;
    
    // We base the next state entirely on the current state to prevent 
    // cascading propagation within a single tick.
    const nextNodes = JSON.parse(JSON.stringify(this.nodes)) as SimulationNode[];
    const compromisedIds = new Set(this.nodes.filter(n => n.status === 'compromised').map(n => n.id));

    for (let i = 0; i < this.nodes.length; i++) {
      const currentNode = this.nodes[i];
      
      // Node is already compromised, skip checking for infection
      if (currentNode.status === 'compromised') continue;

      // Check if any of this node's dependencies are compromised
      const hasCompromisedDep = currentNode.dependencies.some(depId => compromisedIds.has(depId));

      if (hasCompromisedDep) {
        const probs = this.config.probabilities || DEFAULT_PROBABILITIES;
        const probability = probs[currentNode.type.toLowerCase()] ?? probs['default'];
        
        // Roll the dice
        if (Math.random() < probability) {
          nextNodes[i].status = 'compromised';
          changed = true;
          spreadCount++;
        } else if (nextNodes[i].status !== 'vulnerable') {
          // If the attack failed but touched the node, mark it vulnerable (at risk)
          nextNodes[i].status = 'vulnerable';
          changed = true;
        }
      }
    }

    this.nodes = nextNodes;
    return { changed, spreadCount };
  }

  /**
   * Derives a global risk score 0-100 based on the severity of the network state.
   */
  private calculateRisk(): number {
    if (this.nodes.length === 0) return 0;

    let score = 0;
    this.nodes.forEach(node => {
      if (node.status === 'compromised') {
        score += 1.0;
      } else if (node.status === 'vulnerable') {
        score += 0.3; // Vulnerable nodes contribute partially to risk
      }
    });

    return Math.min(Math.round((score / this.nodes.length) * 100), 100);
  }

  /**
   * Helper to format and send the current state via the callback.
   */
  private notifyUpdate(logMessage: string, isComplete: boolean = false): void {
    const riskScore = this.calculateRisk();
    this.config.onUpdate({
      // Provide copies so the receiver can't break the engine's internal array
      nodes: JSON.parse(JSON.stringify(this.nodes)), 
      riskScore,
      stepCount: this.stepCount,
      logMessage,
      isComplete
    });
  }
}
