import { useReducer, useEffect, useCallback } from "react";
import {
  Navbar,
  Breadcrumbs,
  Action,
  Dropdown,
  Tabs,
  Badge,
  Avatar,
  Toast,
  useToast,
} from "@particle-academy/react-fancy";
import type {
  KitchenSinkState,
  KitchenSinkAction,
  AgentNode,
} from "./kitchen-sink/types";
import {
  INITIAL_NODES,
  INITIAL_CONNECTIONS,
  INITIAL_CONFIG,
  MOCK_EXECUTIONS,
  NODE_TYPES,
} from "./kitchen-sink/data";
import { CanvasTab } from "./kitchen-sink/CanvasTab";
import { MonitorTab } from "./kitchen-sink/MonitorTab";
import { SettingsTab } from "./kitchen-sink/SettingsTab";

function reducer(state: KitchenSinkState, action: KitchenSinkAction): KitchenSinkState {
  switch (action.type) {
    case "ADD_NODE": {
      const id = `node-${Date.now()}`;
      const maxX = state.nodes.reduce((m, n) => Math.max(m, n.x), 0);
      const node: AgentNode = {
        id,
        type: action.payload.nodeType,
        label: action.payload.label,
        x: maxX + 220,
        y: 80 + Math.random() * 100,
        status: "idle",
        config: {},
      };
      return { ...state, nodes: [...state.nodes, node] };
    }
    case "REMOVE_NODE":
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.payload),
        connections: state.connections.filter(
          (c) => c.from !== action.payload && c.to !== action.payload,
        ),
      };
    case "CONNECT_NODES":
      return { ...state, connections: [...state.connections, action.payload] };
    case "START_RUN":
      return { ...state, isRunning: true };
    case "UPDATE_NODE_STATUS":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.nodeId ? { ...n, status: action.payload.status } : n,
        ),
      };
    case "COMPLETE_RUN":
      return {
        ...state,
        isRunning: false,
        executions: [...state.executions, action.payload],
      };
    case "UPDATE_CONFIG":
      return { ...state, config: { ...state.config, ...action.payload } };
    case "ADD_CHAT_MESSAGE":
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "TOGGLE_CHAOS":
      return { ...state, chaosMode: !state.chaosMode };
    case "CHAOS_TICK": {
      const roll = Math.random();
      // Randomize node statuses (Canvas tab)
      if (roll < 0.15 && state.nodes.length > 0) {
        const idx = Math.floor(Math.random() * state.nodes.length);
        const statuses: AgentNode["status"][] = ["idle", "running", "complete", "error"];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const nodes = [...state.nodes];
        nodes[idx] = { ...nodes[idx], status: newStatus };
        return { ...state, nodes };
      }
      // Jitter node positions (Canvas tab)
      if (roll < 0.25 && state.nodes.length > 0) {
        const idx = Math.floor(Math.random() * state.nodes.length);
        const nodes = [...state.nodes];
        nodes[idx] = {
          ...nodes[idx],
          x: Math.max(20, nodes[idx].x + (Math.random() - 0.5) * 80),
          y: Math.max(20, nodes[idx].y + (Math.random() - 0.5) * 60),
        };
        return { ...state, nodes };
      }
      // Toggle config booleans (Settings tab)
      if (roll < 0.35) {
        const toggles: (keyof Pick<typeof state.config, "streaming" | "memory" | "logging">)[] = [
          "streaming", "memory", "logging",
        ];
        const key = toggles[Math.floor(Math.random() * toggles.length)];
        return { ...state, config: { ...state.config, [key]: !state.config[key] } };
      }
      // Randomize environment (Settings tab)
      if (roll < 0.45) {
        const envs = ["Dev", "Staging", "Prod"];
        return {
          ...state,
          config: { ...state.config, environment: envs[Math.floor(Math.random() * envs.length)] },
        };
      }
      // Randomize temperature and maxTokens (Settings tab)
      if (roll < 0.55) {
        return {
          ...state,
          config: {
            ...state.config,
            temperature: Math.round(Math.random() * 20) / 10,
            maxTokens: [1024, 2048, 4096, 8192, 16384][Math.floor(Math.random() * 5)],
          },
        };
      }
      // Add a random execution (Monitor tab)
      if (roll < 0.65) {
        const statuses: ("success" | "error" | "timeout")[] = ["success", "error", "timeout"];
        const exec = {
          id: `exec-chaos-${Date.now()}`,
          timestamp: Date.now(),
          duration: Math.floor(Math.random() * 8000) + 500,
          tokens: Math.floor(Math.random() * 5000) + 100,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          nodeResults: state.nodes.slice(0, Math.floor(Math.random() * state.nodes.length) + 1).map((n) => ({
            nodeId: n.id,
            output: ["Processing...", "Error: timeout", "Done", "Retrying..."][Math.floor(Math.random() * 4)],
            latency: Math.floor(Math.random() * 3000) + 10,
          })),
        };
        return { ...state, executions: [...state.executions, exec] };
      }
      // Inject a chat message (Monitor tab)
      if (roll < 0.75) {
        const chaosMessages = [
          "Help, the chaos is spreading!",
          "Why is everything on fire?",
          "I didn't authorize this deployment.",
          "The nodes are moving on their own...",
          "Temperature is out of control!",
        ];
        const msg = {
          id: `msg-chaos-${Date.now()}`,
          role: Math.random() < 0.5 ? "user" as const : "assistant" as const,
          content: chaosMessages[Math.floor(Math.random() * chaosMessages.length)],
        };
        return { ...state, chatMessages: [...state.chatMessages, msg] };
      }
      // Change agent name (Settings tab / Navbar)
      if (roll < 0.85) {
        const names = ["Chaos Agent", "Research Assistant", "Rogue Bot", "SKYNET v0.1", "Confused Helper", "Agent Smith"];
        return {
          ...state,
          config: { ...state.config, name: names[Math.floor(Math.random() * names.length)] },
        };
      }
      // Switch active tab randomly
      if (roll < 0.92) {
        const tabs = ["canvas", "monitor", "settings"];
        return { ...state, activeTab: tabs[Math.floor(Math.random() * tabs.length)] };
      }
      return state;
    }
    default:
      return state;
  }
}

const INITIAL_STATE: KitchenSinkState = {
  nodes: INITIAL_NODES,
  connections: INITIAL_CONNECTIONS,
  executions: MOCK_EXECUTIONS,
  activeTab: "canvas",
  config: INITIAL_CONFIG,
  isRunning: false,
  chatMessages: [],
  chaosMode: false,
};

function KitchenSinkInner() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (!state.chaosMode) return;
    const interval = setInterval(() => {
      dispatch({ type: "CHAOS_TICK" });
      if (Math.random() < 0.2) {
        const messages = [
          "Node status changed randomly!",
          "Config toggled by chaos!",
          "Environment shifted!",
          "Entropy increasing...",
        ];
        toast({
          title: "Chaos Mode",
          description: messages[Math.floor(Math.random() * messages.length)],
          variant: "warning",
        });
      }
    }, 400);
    return () => clearInterval(interval);
  }, [state.chaosMode, toast]);

  const handleTabChange = useCallback(
    (tab: string) => dispatch({ type: "SET_TAB", payload: tab }),
    [],
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      {/* Navbar */}
      <Navbar className="shrink-0 rounded-none border-b border-zinc-200 dark:border-zinc-700">
        <Navbar.Brand>
          <span className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span className="text-base font-bold">AgentForge</span>
          </span>
        </Navbar.Brand>
        <Navbar.Items>
          <Navbar.Item href="#">
            <Breadcrumbs>
              <Breadcrumbs.Item href="#">Workspace</Breadcrumbs.Item>
              <Breadcrumbs.Item active>{state.config.name}</Breadcrumbs.Item>
            </Breadcrumbs>
          </Navbar.Item>
        </Navbar.Items>
        <div className="ml-auto flex items-center gap-2">
          <Badge size="sm" color={state.chaosMode ? "red" : "green"} variant="soft" dot>
            {state.chaosMode ? "Chaos" : "Stable"}
          </Badge>
          <Action
            size="sm"
            variant="circle"
            icon="zap"
            onClick={() => dispatch({ type: "TOGGLE_CHAOS" })}
            title="Toggle Chaos Mode"
          />
          <Dropdown>
            <Dropdown.Trigger>
              <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Avatar size="xs" fallback="JD" />
                <span className="text-sm">John</span>
              </button>
            </Dropdown.Trigger>
            <Dropdown.Items>
              <Dropdown.Item onClick={() => {}}>Profile</Dropdown.Item>
              <Dropdown.Item onClick={() => {}}>Settings</Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item onClick={() => {}}>Sign Out</Dropdown.Item>
            </Dropdown.Items>
          </Dropdown>
        </div>
      </Navbar>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Node Palette Sidebar */}
        <aside className="w-48 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Node Palette
          </p>
          {NODE_TYPES.map((nt) => (
            <button
              key={nt.type}
              onClick={() =>
                dispatch({ type: "ADD_NODE", payload: { nodeType: nt.type, label: nt.label } })
              }
              className="mb-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: nt.color }}
              />
              <span>{nt.label}</span>
            </button>
          ))}
          <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Pipeline
            </p>
            <p className="text-xs text-zinc-500">
              {state.nodes.length} nodes, {state.connections.length} connections
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {state.executions.length} executions
            </p>
          </div>
        </aside>

        {/* Main Content with Tabs */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs activeTab={state.activeTab} defaultTab="canvas" variant="underline" onTabChange={handleTabChange}>
            <Tabs.List>
              <Tabs.Tab value="canvas">Canvas</Tabs.Tab>
              <Tabs.Tab value="monitor">Monitor</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panels>
              <Tabs.Panel value="canvas">
                <div className="py-4">
                  <CanvasTab state={state} dispatch={dispatch} />
                </div>
              </Tabs.Panel>
              <Tabs.Panel value="monitor">
                <div className="py-4">
                  <MonitorTab state={state} dispatch={dispatch} />
                </div>
              </Tabs.Panel>
              <Tabs.Panel value="settings">
                <div className="py-4">
                  <SettingsTab state={state} dispatch={dispatch} />
                </div>
              </Tabs.Panel>
            </Tabs.Panels>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export function KitchenSinkDemo() {
  return (
    <Toast.Provider position="bottom-right">
      <KitchenSinkInner />
    </Toast.Provider>
  );
}
