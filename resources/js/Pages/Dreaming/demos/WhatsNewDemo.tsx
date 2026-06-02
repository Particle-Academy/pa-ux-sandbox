import { useCallback, useMemo, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Popover,
  Tabs,
} from "@particle-academy/react-fancy";

/**
 * WhatsNew — react-fancy primitive that surfaces every change an
 * agent (or another human) made while the user was away. Distinct
 * from EvidencePane (per-answer) and IntentTrail (live, ambient).
 * WhatsNew is the *async inbox* — a catalog that survives between
 * sessions.
 *
 * The catch is the read marker: by default, items dated before the
 * stored `lastSeenAt` are folded under "earlier" and dimmed. Items
 * after are highlighted. On open, `lastSeenAt` advances so next
 * visit only the next batch is highlighted.
 *
 * Each change has:
 *   • surface (where it landed)
 *   • verb (concise action label)
 *   • body (one-line summary)
 *   • agent (who did it)
 *   • severity (info / change / risky)
 *   • jumpTo (optional callback the host wires up to scroll/select)
 *
 * Dismiss-all clears the catalog. Dismiss-one removes a single item.
 */
type Severity = "info" | "change" | "risky";

type Change = {
  id: string;
  at: number;
  agent: { name: string; color: string };
  surface: string;
  verb: string;
  body: string;
  severity: Severity;
};

const SEV: Record<Severity, { color: string; label: string }> = {
  info: { color: "#71717a", label: "info" },
  change: { color: "#3b82f6", label: "change" },
  risky: { color: "#ef4444", label: "risky" },
};

const AGENTS = [
  { name: "Planner", color: "#a855f7" },
  { name: "Scribe", color: "#10b981" },
  { name: "Forecaster", color: "#3b82f6" },
  { name: "Auditor", color: "#f59e0b" },
];

const NOW = Date.now();

const SEED: Change[] = [
  {
    id: "c1",
    at: NOW - 28 * 60_000,
    agent: AGENTS[0],
    surface: "Q3 Forecast",
    verb: "updated ARR projection",
    body: "Bumped projected ARR from $1.22M → $1.40M after stacking renewals.",
    severity: "change",
  },
  {
    id: "c2",
    at: NOW - 22 * 60_000,
    agent: AGENTS[1],
    surface: "Meeting notes · 2026-05-10",
    verb: "summarized transcript",
    body: "Drafted 4-line tldr; flagged 2 unresolved owners.",
    severity: "info",
  },
  {
    id: "c3",
    at: NOW - 18 * 60_000,
    agent: AGENTS[3],
    surface: "Risk register",
    verb: "elevated Globex to red",
    body: "Compliance review unresolved; AE handoff incomplete.",
    severity: "risky",
  },
  {
    id: "c4",
    at: NOW - 9 * 60_000,
    agent: AGENTS[2],
    surface: "Pipeline chart",
    verb: "refreshed series",
    body: "Repulled this morning's Stripe events; chart now matches the warehouse.",
    severity: "info",
  },
  {
    id: "c5",
    at: NOW - 2 * 60_000,
    agent: AGENTS[0],
    surface: "Whiteboard · strategy",
    verb: "dropped 3 stickies",
    body: "Hypothesis, Risk, and Mitigation — clustered near the timeline.",
    severity: "change",
  },
];

export function WhatsNewDemo() {
  // Pretend the user last opened the app 12 minutes ago — anything newer is "fresh".
  const [lastSeenAt, setLastSeenAt] = useState<number>(NOW - 12 * 60_000);
  const [changes, setChanges] = useState<Change[]>(SEED);
  const [tab, setTab] = useState<"surfaces" | "agents">("surfaces");
  const [showDigest, setShowDigest] = useState(false);

  const fresh = useMemo(() => changes.filter((c) => c.at > lastSeenAt), [changes, lastSeenAt]);
  const earlier = useMemo(() => changes.filter((c) => c.at <= lastSeenAt), [changes, lastSeenAt]);

  const dismiss = (id: string) =>
    setChanges((cur) => cur.filter((c) => c.id !== id));
  const dismissAll = () => setChanges([]);
  const markRead = useCallback(() => setLastSeenAt(Date.now()), []);
  const reset = () => {
    setLastSeenAt(NOW - 12 * 60_000);
    setChanges(SEED);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">WhatsNew</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Inbox for asynchronous AI work. Catalogs everything an agent did
          while the user was away, grouped by surface or agent, with a clear
          fresh-vs-earlier split that advances as the user reads.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Group by"
            list={[
              { value: "surfaces", label: "surface" },
              { value: "agents", label: "agent" },
            ]}
            value={tab}
            onValueChange={(v) => setTab(v as "surfaces" | "agents")}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showDigest} onCheckedChange={setShowDigest} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Show inline digest (vs popover bell)
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button size="sm" variant="outline" onClick={reset}>
              reset seed
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium">Top bar (host app)</span>
            <span className="ml-auto">
              {showDigest ? (
                <Badge color={fresh.length > 0 ? "violet" : "zinc"}>
                  {fresh.length > 0 ? `${fresh.length} fresh` : "all caught up"}
                </Badge>
              ) : (
                <Popover>
                  <Popover.Trigger>
                    <Button size="sm" variant="outline">
                      🔔{" "}
                      {fresh.length > 0 ? (
                        <Badge color="violet">{fresh.length}</Badge>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content>
                    <WhatsNewBody
                      fresh={fresh}
                      earlier={earlier}
                      tab={tab}
                      onTabChange={setTab}
                      onDismiss={dismiss}
                      onDismissAll={dismissAll}
                      onMarkRead={markRead}
                      compact
                    />
                  </Popover.Content>
                </Popover>
              )}
            </span>
          </div>
          {showDigest && (
            <WhatsNewBody
              fresh={fresh}
              earlier={earlier}
              tab={tab}
              onTabChange={setTab}
              onDismiss={dismiss}
              onDismissAll={dismissAll}
              onMarkRead={markRead}
              compact={false}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function WhatsNewBody({
  fresh,
  earlier,
  tab,
  onTabChange,
  onDismiss,
  onDismissAll,
  onMarkRead,
  compact,
}: {
  fresh: Change[];
  earlier: Change[];
  tab: "surfaces" | "agents";
  onTabChange: (t: "surfaces" | "agents") => void;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onMarkRead: () => void;
  compact: boolean;
}) {
  const width = compact ? "w-80" : "w-full";
  return (
    <div className={`${width} space-y-3`}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          While you were away
        </span>
        <Badge color="violet">{fresh.length} fresh</Badge>
        <Badge color="zinc">{earlier.length} earlier</Badge>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={onMarkRead} disabled={fresh.length === 0}>
            mark all read
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismissAll}
            disabled={fresh.length + earlier.length === 0}
          >
            clear
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as "surfaces" | "agents")}>
        <Tabs.List>
          <Tabs.Tab value="surfaces">By surface</Tabs.Tab>
          <Tabs.Tab value="agents">By agent</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="surfaces">
          <GroupedList
            fresh={groupBy(fresh, (c) => c.surface)}
            earlier={groupBy(earlier, (c) => c.surface)}
            onDismiss={onDismiss}
          />
        </Tabs.Panel>
        <Tabs.Panel value="agents">
          <GroupedList
            fresh={groupBy(fresh, (c) => c.agent.name)}
            earlier={groupBy(earlier, (c) => c.agent.name)}
            onDismiss={onDismiss}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function GroupedList({
  fresh,
  earlier,
  onDismiss,
}: {
  fresh: Array<{ key: string; items: Change[] }>;
  earlier: Array<{ key: string; items: Change[] }>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="mt-2 space-y-3">
      {fresh.length > 0 && (
        <section>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Fresh
            </span>
            <div className="h-px flex-1 bg-violet-200 dark:bg-violet-900" />
          </div>
          {fresh.map((g) => (
            <GroupBlock key={g.key} title={g.key} items={g.items} onDismiss={onDismiss} fresh />
          ))}
        </section>
      )}

      {earlier.length > 0 && (
        <section>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Earlier
            </span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          {earlier.map((g) => (
            <GroupBlock key={g.key} title={g.key} items={g.items} onDismiss={onDismiss} />
          ))}
        </section>
      )}

      {fresh.length + earlier.length === 0 && (
        <div className="rounded-md border border-dashed border-zinc-300 p-3 text-center text-[12px] italic text-zinc-400 dark:border-zinc-700">
          Nothing to report. Inbox is clear.
        </div>
      )}
    </div>
  );
}

function GroupBlock({
  title,
  items,
  onDismiss,
  fresh = false,
}: {
  title: string;
  items: Change[];
  onDismiss: (id: string) => void;
  fresh?: boolean;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
        {title}{" "}
        <span className="text-zinc-400">· {items.length}</span>
      </div>
      <ul className={`space-y-1 ${fresh ? "" : "opacity-65"}`}>
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-2 rounded-md border border-zinc-200 px-2 py-1.5 text-[12px] dark:border-zinc-800"
          >
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: c.agent.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span style={{ color: c.agent.color }}>{c.agent.name}</span>
                <Badge
                  color={
                    c.severity === "risky"
                      ? "red"
                      : c.severity === "change"
                        ? "violet"
                        : "zinc"
                  }
                >
                  {SEV[c.severity].label}
                </Badge>
                <span className="font-mono text-[10px] text-zinc-400">
                  {ago(c.at)}
                </span>
              </div>
              <div className="mt-0.5">
                <span className="font-mono text-[11px] text-violet-700 dark:text-violet-300">
                  {c.verb}
                </span>
                <div className="text-zinc-600 dark:text-zinc-300">{c.body}</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDismiss(c.id)}>
              ×
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function groupBy<T>(items: T[], key: (t: T) => string) {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = map.get(k) ?? [];
    arr.push(it);
    map.set(k, arr);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

function ago(ms: number) {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.floor(d / 1_000)}s`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  return `${Math.floor(d / 3_600_000)}h`;
}
