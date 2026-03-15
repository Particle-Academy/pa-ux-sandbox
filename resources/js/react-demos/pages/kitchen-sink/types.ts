export interface AgentNode {
  id: string;
  type: "llm" | "tool" | "router" | "output" | "input";
  label: string;
  x: number;
  y: number;
  status: "idle" | "running" | "complete" | "error";
  config: Record<string, unknown>;
}

export interface Connection {
  from: string;
  to: string;
}

export interface Execution {
  id: string;
  timestamp: number;
  duration: number;
  tokens: number;
  status: "success" | "error" | "timeout";
  nodeResults: { nodeId: string; output: string; latency: number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface AgentConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;
  memory: boolean;
  logging: boolean;
  environment: string;
  tools: string[];
  tags: string[];
}

export interface KitchenSinkState {
  nodes: AgentNode[];
  connections: Connection[];
  executions: Execution[];
  activeTab: string;
  config: AgentConfig;
  isRunning: boolean;
  chatMessages: ChatMessage[];
  chaosMode: boolean;
}

export type KitchenSinkAction =
  | { type: "ADD_NODE"; payload: { nodeType: AgentNode["type"]; label: string } }
  | { type: "REMOVE_NODE"; payload: string }
  | { type: "CONNECT_NODES"; payload: Connection }
  | { type: "START_RUN" }
  | { type: "UPDATE_NODE_STATUS"; payload: { nodeId: string; status: AgentNode["status"] } }
  | { type: "COMPLETE_RUN"; payload: Execution }
  | { type: "UPDATE_CONFIG"; payload: Partial<AgentConfig> }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "SET_TAB"; payload: string }
  | { type: "TOGGLE_CHAOS" }
  | { type: "CHAOS_TICK" };
