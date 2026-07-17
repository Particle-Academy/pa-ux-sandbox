import React, { useMemo, useState } from "react";
import { PassThrough } from "node:stream";
import { render, useInput } from "ink";
import {
  ActivityIndicator, Badge, Button, Callout, Card, Checkbox, CodeView, Command, Composer,
  FancyTuiProvider, Header, KeyHint, LiveRegion, MessageList, MultiSwitch, Panel, Progress,
  Row, Separator, Spinner, Stack, StatusBar, Table, Tabs, Text, Timeline, ToolCall,
  TuiSurfaceProvider, createTuiSurfaceRegistry, detectKeyboardCapabilities,
  type CursorPosition, type MessageData, type ToolCallData,
} from "@particle-academy/fancy-tui";
import { MicroMcpServer, attachInProcess, registerTuiBridge } from "@particle-academy/agent-integrations";
import { FileHumanPlusEventStore } from "@particle-academy/agent-integrations/human-plus/node";

const registry = createTuiSurfaceRegistry();
const eventStore = new FileHumanPlusEventStore("storage/framework/cache/fancy-tui-events.jsonl");
const server = new MicroMcpServer({ info: { name: "fancy-tui-dogfood", version: "0.1.0" } });
registerTuiBridge(server, { registry, eventStore, appId: "px-ui-sandbox-tui", sessionId: `local-${process.pid}` });
attachInProcess(server);

const initialMessages: MessageData[] = [
  { id: "welcome", role: "system", name: "Fancy TUI", content: "# Human+ agent console\n\nMessages above are committed to Ink `Static`; live activity renders below." },
  { id: "agent-ready", role: "agent", name: "Agent", content: "Ready. Ask me to inspect a surface or run a tool.\n\n```ts\nconst delivery = ['push', 'pull'] as const\n```" },
];

function AgentConsole() {
  const [route, setRoute] = useState("console"); const [messages, setMessages] = useState(initialMessages);
  const [prompt, setPrompt] = useState(""); const [cursor, setCursor] = useState<CursorPosition>({ offset: 0 });
  const [thinking, setThinking] = useState(false); const [tool, setTool] = useState<ToolCallData | null>(null);
  useInput((input, key) => { if (key.ctrl && input === "g") setRoute((value) => value === "console" ? "gallery" : "console"); });
  const send = (value: string) => {
    if (!value.trim() || thinking) return; const id = String(Date.now()); setMessages((items) => [...items, { id, role: "user", name: "You", content: value }]);
    setPrompt(""); setCursor({ offset: 0 }); setThinking(true); setTool({ id: `${id}:tool`, name: "tui_surface_read", status: "pending", detail: "prompt" });
    setTimeout(() => { setTool({ id: `${id}:tool`, name: "tui_surface_read", status: "success", detail: "stable handle: prompt" }); setMessages((items) => [...items, { id: `${id}:reply`, role: "agent", name: "Agent", content: `Received **${value.replace(/[<>]/g, "")}**. The same command bus is available through pushed MCP events or the durable inbox.` }]); setThinking(false); }, 350);
  };
  return <Stack>
    <Header title="Fancy TUI" subtitle="Human+ agent console" status={<Badge tone="success">MCP live</Badge>} />
    <Tabs id="routes" value={route} onChange={setRoute} tabs={[{ id: "console", label: "Console" }, { id: "gallery", label: "Gallery" }]} />
    {route === "console" ? <Panel title="Conversation" flexGrow={1}>
      <MessageList messages={messages} />
      <LiveRegion>{tool ? <ToolCall call={tool} /> : null}{thinking ? <Spinner label="thinking…" /> : null}</LiveRegion>
      <Separator label="Prompt" />
      <Composer id="prompt" value={prompt} onChange={setPrompt} onSubmit={send} placeholder="Enter submits · Alt+Enter adds a line" />
    </Panel> : <Gallery />}
    <StatusBar left={<Row><KeyHint keys="Ctrl+G" label="switch view" /><KeyHint keys="Tab" label="focus" /></Row>} right={<Text tone="muted">inbox persisted · PID {process.pid}</Text>} />
  </Stack>;
}

function Gallery() {
  const [checked, setChecked] = useState(true); const [mode, setMode] = useState("push"); const [command, setCommand] = useState("");
  const rows = [{ id: "push", mode: "Push", state: "connected" }, { id: "pull", mode: "Inbox", state: "durable" }];
  return <Stack>
    <Row><Card title="Feedback" width="50%"><Stack><ActivityIndicator status="success" label="tool complete" /><Progress value={72} label="context" /><Callout title="Trust but verify" tone="warning">Destructive actions stage for confirmation.</Callout></Stack></Card>
    <Card title="Controls" width="50%"><Stack><Checkbox id="activity" checked={checked} onChange={setChecked} label="Broadcast AgentActivity" /><MultiSwitch id="delivery" value={mode} onChange={setMode} options={[{ id: "push", label: "Push" }, { id: "pull", label: "Inbox" }]} /><Button id="gallery-action" onPress={() => setChecked(!checked)}>Toggle</Button></Stack></Card></Row>
    <Table id="delivery-table" rows={rows} rowId={(row) => row.id} columns={[{ id: "mode", header: "Delivery", render: (row) => row.mode }, { id: "state", header: "State", render: (row) => row.state }]} />
    <Timeline items={[{ id: "1", title: "Persist event", tone: "success" }, { id: "2", title: "Push notification", tone: "agent" }, { id: "3", title: "Agent acknowledges", tone: "tool" }]} />
    <CodeView language="ts" code={'registerTuiBridge(server, { registry, eventStore })'} />
    <Command id="gallery-command" query={command} onQueryChange={setCommand} commands={[{ id: "console", label: "Open agent console" }, { id: "inbox", label: "Inspect durable inbox" }]} onSelect={(id) => setCommand(id)} />
  </Stack>;
}

function App() {
  const capabilities = useMemo(() => detectKeyboardCapabilities(), []);
  return <FancyTuiProvider capabilities={capabilities}><TuiSurfaceProvider registry={registry}><AgentConsole /></TuiSurfaceProvider></FancyTuiProvider>;
}

const smoke = process.argv.includes("--smoke");
const smokeInput = new PassThrough() as PassThrough & { isTTY: boolean; setRawMode(mode: boolean): void; ref(): void; unref(): void };
smokeInput.isTTY = true;
smokeInput.setRawMode = () => {};
smokeInput.ref = () => {};
smokeInput.unref = () => {};
const instance = render(<App />, smoke ? { stdin: smokeInput } : undefined);
if (smoke) setTimeout(() => instance.unmount(), 600);
await instance.waitUntilExit();
