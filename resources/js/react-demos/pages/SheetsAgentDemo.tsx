import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SheetWorkbook, createEmptyWorkbook, createEmptySheet } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
import {
  ToolRegistry,
  registerSheetsBridge,
  useSheetsAdapter,
  useSheetsActivityHighlights,
} from "@particle-academy/agent-integrations";
import "@particle-academy/agent-integrations/styles.css";

/**
 * SheetsAgentDemo — wires fancy-sheets' <SheetWorkbook> to the
 * agent-integrations sheets bridge using the new helpers from v0.4.0:
 *
 *   • ToolRegistry — plain in-memory tool host. No MCP server, no
 *     transport, no relay. In-process agents call tools directly via
 *     `host.callTool("sheet_set_cell", { … })`.
 *
 *   • useSheetsAdapter() — returns a stable adapter object the bridge
 *     accepts, plus the controlled state to feed into <SheetWorkbook>.
 *
 *   • useSheetsActivityHighlights() — derives a CellHighlightMap from
 *     the presence registry so agent edits visibly pulse on the human's
 *     screen in the agent's color.
 *
 * Three "agents" with distinct colors run scripted scenarios so you can
 * watch the highlights light up and see the workbook update in real time.
 * The "Custom call" panel lets you fire any tool by hand.
 */

const AGENTS = [
  { id: "planner", name: "Planner", color: "#a855f7" },
  { id: "scribe", name: "Scribe", color: "#10b981" },
  { id: "auditor", name: "Auditor", color: "#f59e0b" },
] as const;

type AgentId = (typeof AGENTS)[number]["id"];

function seedWorkbook() {
  const wb = createEmptyWorkbook();
  const sheet = createEmptySheet("deals", "Deal pipeline");
  sheet.cells = {
    A1: { value: "Account", format: { bold: true } },
    B1: { value: "Status", format: { bold: true } },
    C1: { value: "ARR", format: { bold: true } },
    D1: { value: "Owner", format: { bold: true } },
    A2: { value: "Acme" }, B2: { value: "Active" }, C2: { value: 120000 }, D2: { value: "Ada" },
    A3: { value: "Globex" }, B3: { value: "Trial" }, C3: { value: 45000 }, D3: { value: "Linus" },
    A4: { value: "Initech" }, B4: { value: "—" }, C4: { value: 0 }, D4: { value: "—" },
    A5: { value: "Hooli" }, B5: { value: "Churned" }, C5: { value: 0 }, D5: { value: "Grace" },
  };
  wb.sheets = [sheet];
  wb.activeSheetId = sheet.id;
  return wb;
}

type Scripted = { agent: AgentId; tool: string; args: Record<string, unknown>; note: string };

const SCENARIO: Scripted[] = [
  { agent: "planner", tool: "sheet_set_cell", args: { address: "B3", value: "Renewal" }, note: "Planner upgrades Globex → Renewal" },
  { agent: "planner", tool: "sheet_set_cell", args: { address: "C3", value: 60000 }, note: "Planner bumps ARR to $60k" },
  { agent: "scribe", tool: "sheet_set_cell", args: { address: "A4", value: "Initech Corp" }, note: "Scribe canonicalizes legal name" },
  { agent: "scribe", tool: "sheet_set_cell", args: { address: "B4", value: "Prospect" }, note: "Scribe activates new account" },
  { agent: "auditor", tool: "sheet_set_cell", args: { address: "D5", value: null }, note: "Auditor clears unassigned owner" },
  { agent: "planner", tool: "sheet_set_range", args: { cells: { C4: 25000, D4: "Linus" } }, note: "Planner fills Initech revenue + owner" },
];

type LogEntry = { at: number; agent: string; agentColor: string; line: string };

export function SheetsAgentDemo() {
  const wb = useSheetsAdapter(seedWorkbook(), { screenId: "deals-sheet" });
  const highlights = useSheetsActivityHighlights({ screenId: "deals-sheet", ttlMs: 3000 });

  const [log, setLog] = useState<LogEntry[]>([]);
  const note = useCallback((agent: typeof AGENTS[number], line: string) => {
    setLog((cur) =>
      [{ at: Date.now(), agent: agent.name, agentColor: agent.color, line }, ...cur].slice(0, 12),
    );
  }, []);

  // One ToolRegistry per agent — agent identity is baked into the bridge,
  // so each agent's edits broadcast under their own color via presence.
  const hosts = useMemo(() => {
    const out = new Map<AgentId, ToolRegistry>();
    for (const a of AGENTS) out.set(a.id, new ToolRegistry());
    return out;
  }, []);

  // Register the sheets bridge against every host with the same adapter,
  // so any of the three agents can drive the same workbook.
  useEffect(() => {
    const disposers: Array<() => void> = [];
    for (const a of AGENTS) {
      const host = hosts.get(a.id)!;
      const bridge = registerSheetsBridge(host, {
        adapter: wb.adapter,
        agent: { id: a.id, name: a.name, color: a.color },
      });
      disposers.push(bridge.dispose);
    }
    return () => disposers.forEach((d) => d());
  }, [hosts, wb.adapter]);

  // Scenario player.
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const runOne = useCallback(
    async (idx: number) => {
      const s = SCENARIO[idx];
      if (!s) return;
      const agent = AGENTS.find((a) => a.id === s.agent)!;
      const host = hosts.get(s.agent)!;
      note(agent, `${s.tool}(${JSON.stringify(s.args)})`);
      await host.callTool(s.tool, s.args);
    },
    [hosts, note],
  );

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const loop = async () => {
      for (let i = step; i < SCENARIO.length; i++) {
        if (cancelled) return;
        await runOne(i);
        setStep(i + 1);
        await new Promise((r) => setTimeout(r, 1400));
        if (!playingRef.current) return;
      }
      setPlaying(false);
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [playing, step, runOne]);

  const resetAll = useCallback(() => {
    setPlaying(false);
    setStep(0);
    setLog([]);
    wb.setWorkbook(seedWorkbook());
  }, [wb]);

  // Custom tool-call panel.
  const [customAgent, setCustomAgent] = useState<AgentId>("planner");
  const [customAddress, setCustomAddress] = useState("E2");
  const [customValue, setCustomValue] = useState("hello");
  const runCustom = useCallback(async () => {
    const host = hosts.get(customAgent)!;
    const agent = AGENTS.find((a) => a.id === customAgent)!;
    const raw = customValue.trim();
    const parsed: string | number | null =
      raw === "" ? null : !isNaN(Number(raw)) ? Number(raw) : raw;
    note(agent, `sheet_set_cell(${customAddress} = ${JSON.stringify(parsed)})`);
    await host.callTool("sheet_set_cell", { address: customAddress, value: parsed });
  }, [hosts, customAgent, customAddress, customValue, note]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Sheets · Shared agent session
        </h1>
        <p className="mt-2 text-zinc-500">
          Three in-process agents drive the same <code>SheetWorkbook</code> through
          plain <code>ToolRegistry.callTool()</code> — no MCP server, no relay. Edits
          pulse in the agent's color via{" "}
          <code>useSheetsActivityHighlights()</code>.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Scenario player</span>
          <span className="text-[11px] text-zinc-500">
            step {Math.min(step, SCENARIO.length)} / {SCENARIO.length}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={step >= SCENARIO.length && !playing}
              className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-40"
            >
              {playing ? "❚❚ pause" : step >= SCENARIO.length ? "done" : "▶ play"}
            </button>
            <button
              onClick={() => {
                if (step < SCENARIO.length) {
                  runOne(step);
                  setStep((s) => s + 1);
                }
              }}
              disabled={playing || step >= SCENARIO.length}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              step →
            </button>
            <button
              onClick={resetAll}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              reset
            </button>
          </div>
        </div>
        <ol className="space-y-1 text-[12px]">
          {SCENARIO.map((s, i) => {
            const agent = AGENTS.find((a) => a.id === s.agent)!;
            const past = i < step;
            const cur = i === step && playing;
            return (
              <li
                key={i}
                className={`flex items-baseline gap-2 rounded px-2 py-0.5 ${
                  cur ? "bg-violet-50 dark:bg-violet-950/30" : ""
                } ${past ? "opacity-50" : ""}`}
              >
                <span className="font-mono text-[10px] text-zinc-400 w-4">{i + 1}.</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: agent.color + "22", color: agent.color }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: agent.color }}
                  />
                  {agent.name}
                </span>
                <span>{s.note}</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-400">
                  {s.tool}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          Workbook
          <span className="text-[11px] text-zinc-500">
            ({Object.keys(highlights).length} live highlight{Object.keys(highlights).length === 1 ? "" : "s"})
          </span>
          {wb.activeCell && (
            <span className="ml-auto font-mono text-[11px] text-zinc-500">
              active: {wb.activeCell}
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <SheetWorkbook
            data={wb.workbook}
            onChange={wb.setWorkbook}
            onActiveCellChange={wb.onActiveCellChange}
            highlights={highlights}
            columnCount={8}
            rowCount={12}
            hideTabs
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 text-sm font-medium">Custom tool call</div>
          <div className="space-y-2 text-[12px]">
            <label className="block">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                As agent
              </span>
              <select
                value={customAgent}
                onChange={(e) => setCustomAgent(e.target.value as AgentId)}
                className="w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
              >
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                Cell address
              </span>
              <input
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1 font-mono dark:border-zinc-700"
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                Value (number or text; empty for null)
              </span>
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1 font-mono dark:border-zinc-700"
              />
            </label>
            <button
              onClick={runCustom}
              className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
            >
              callTool("sheet_set_cell", {"{…}"})
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-medium">Activity log</div>
          {log.length === 0 ? (
            <div className="text-[11px] italic text-zinc-400">
              Nothing yet — play the scenario or fire a custom call.
            </div>
          ) : (
            <ol className="space-y-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              {log.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-400 shrink-0">
                    {new Date(l.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span style={{ color: l.agentColor }} className="font-semibold shrink-0">
                    {l.agent}
                  </span>
                  <span className="truncate">{l.line}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
