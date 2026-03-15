import type { AgentNode, Connection, AgentConfig, Execution } from "./types";

export const NODE_TYPES = [
  { type: "input" as const, label: "Input", icon: "ArrowRightCircle", color: "#3b82f6" },
  { type: "llm" as const, label: "LLM", icon: "Brain", color: "#8b5cf6" },
  { type: "tool" as const, label: "Tool", icon: "Wrench", color: "#f59e0b" },
  { type: "router" as const, label: "Router", icon: "GitBranch", color: "#ec4899" },
  { type: "output" as const, label: "Output", icon: "CheckCircle", color: "#22c55e" },
];

export const INITIAL_NODES: AgentNode[] = [
  { id: "node-1", type: "input", label: "User Input", x: 60, y: 80, status: "idle", config: {} },
  { id: "node-2", type: "llm", label: "GPT-4 Turbo", x: 280, y: 80, status: "idle", config: { model: "gpt-4-turbo" } },
  { id: "node-3", type: "tool", label: "Web Search", x: 500, y: 80, status: "idle", config: { tool: "web_search" } },
  { id: "node-4", type: "output", label: "Response", x: 720, y: 80, status: "idle", config: {} },
];

export const INITIAL_CONNECTIONS: Connection[] = [
  { from: "node-1", to: "node-2" },
  { from: "node-2", to: "node-3" },
  { from: "node-3", to: "node-4" },
];

export const INITIAL_CONFIG: AgentConfig = {
  name: "Research Assistant",
  model: "gpt-4-turbo",
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: "You are a helpful research assistant that can search the web and synthesize information.",
  streaming: true,
  memory: true,
  logging: false,
  environment: "Dev",
  tools: ["web_search", "calculator"],
  tags: ["research", "assistant"],
};

export const MOCK_EXECUTIONS: Execution[] = [
  {
    id: "exec-1",
    timestamp: Date.now() - 300000,
    duration: 2340,
    tokens: 1847,
    status: "success",
    nodeResults: [
      { nodeId: "node-1", output: "What is quantum computing?", latency: 12 },
      { nodeId: "node-2", output: "Processing query with context...", latency: 1450 },
      { nodeId: "node-3", output: "Found 12 relevant sources", latency: 680 },
      { nodeId: "node-4", output: "Quantum computing uses qubits...", latency: 198 },
    ],
  },
  {
    id: "exec-2",
    timestamp: Date.now() - 180000,
    duration: 4120,
    tokens: 3201,
    status: "success",
    nodeResults: [
      { nodeId: "node-1", output: "Compare React vs Vue", latency: 8 },
      { nodeId: "node-2", output: "Analyzing frameworks...", latency: 2100 },
      { nodeId: "node-3", output: "Found 8 comparison articles", latency: 1540 },
      { nodeId: "node-4", output: "React uses JSX, Vue uses templates...", latency: 472 },
    ],
  },
  {
    id: "exec-3",
    timestamp: Date.now() - 60000,
    duration: 8500,
    tokens: 502,
    status: "timeout",
    nodeResults: [
      { nodeId: "node-1", output: "Summarize all AI papers from 2025", latency: 10 },
      { nodeId: "node-2", output: "Query too broad, attempting...", latency: 3200 },
      { nodeId: "node-3", output: "Timeout: too many results", latency: 5290 },
    ],
  },
];

export const TOOL_OPTIONS = [
  { value: "web_search", label: "Web Search" },
  { value: "calculator", label: "Calculator" },
  { value: "code_interpreter", label: "Code Interpreter" },
  { value: "image_gen", label: "Image Generation" },
  { value: "file_reader", label: "File Reader" },
  { value: "database", label: "Database Query" },
  { value: "email", label: "Email Sender" },
  { value: "calendar", label: "Calendar" },
];

export const LATENCY_DATA = {
  labels: ["12:00", "12:05", "12:10", "12:15", "12:20", "12:25"],
  series: [
    { label: "Latency (ms)", data: [120, 340, 200, 890, 450, 230], color: "#6366f1" },
  ],
};

export const TOKEN_BAR_DATA = [
  { label: "Input", value: 320 },
  { label: "LLM", value: 1450 },
  { label: "Tool", value: 680 },
  { label: "Output", value: 198 },
];

export const STATUS_DONUT_DATA = [
  { label: "Success", value: 24, color: "#22c55e" },
  { label: "Error", value: 3, color: "#ef4444" },
  { label: "Timeout", value: 2, color: "#f59e0b" },
];
