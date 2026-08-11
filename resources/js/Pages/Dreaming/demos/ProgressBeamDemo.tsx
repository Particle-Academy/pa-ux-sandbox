import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Tooltip,
} from "@particle-academy/react-fancy";

/**
 * ProgressBeam — react-fancy primitive for ambient background-job
 * indication. Renders as a slim horizontal beam pinned to the top
 * (or bottom) edge of a container. Each parallel job becomes one
 * colored slice scaled by its progress; indeterminate jobs render
 * as a sweeping shimmer. Tooltip per slice exposes job name + agent
 * + percent. Click anywhere on the beam to expand a roster popover
 * listing every job.
 *
 * Use cases:
 *   • app top-bar: show what every agent is doing right now
 *   • a single panel: indicate work being done inside that panel
 *   • a chat message: show the agent's tool-call progress beneath it
 *
 * Designed to be ignorable when idle and informative on glance —
 * different from a full roster dock (which is always-on, in-your-face).
 */
type Job = {
  id: string;
  agent: { name: string; color: string };
  name: string;
  /** 0..1 — undefined means indeterminate. */
  progress?: number;
  status: "running" | "done" | "failed";
  /** Wall-clock ms started. */
  startedAt: number;
};

const AGENTS = [
  { name: "Planner", color: "#a855f7" },
  { name: "Scribe", color: "#10b981" },
  { name: "Forecaster", color: "#3b82f6" },
  { name: "Auditor", color: "#f59e0b" },
];

const TASKS = [
  "summarizing the meeting",
  "drafting Q3 forecast",
  "checking compliance rules",
  "regenerating chart",
  "indexing transcript",
  "rewriting customer summary",
  "validating sheet formulas",
  "calling /v2/audit",
];

export function ProgressBeamDemo() {
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const [variant, setVariant] = useState<"thin" | "stout">("thin");
  const [auto, setAuto] = useState(true);
  const [jobs, setJobs] = useState<Job[]>(() => seedJobs());
  const tickRef = useRef<number>(performance.now());

  const addJob = useCallback(() => {
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const name = TASKS[Math.floor(Math.random() * TASKS.length)];
    const indeterminate = Math.random() < 0.25;
    setJobs((cur) => [
      ...cur,
      {
        id: `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        agent,
        name,
        progress: indeterminate ? undefined : 0,
        status: "running",
        startedAt: Date.now(),
      },
    ]);
  }, []);

  const clear = () => setJobs([]);

  // Tick jobs forward.
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = performance.now();
      const dt = now - tickRef.current;
      tickRef.current = now;
      setJobs((cur) =>
        cur
          .map((j) => {
            if (j.status !== "running") return j;
            if (typeof j.progress !== "number") return j;
            const next = j.progress + dt / (3500 + Math.random() * 6000);
            if (next >= 1) {
              const failed = Math.random() < 0.1;
              return {
                ...j,
                progress: 1,
                status: failed ? ("failed" as const) : ("done" as const),
              };
            }
            return { ...j, progress: next };
          })
          // Drop done/failed jobs after a short cool-down so the beam clears.
          .filter((j) =>
            j.status === "running" ? true : Date.now() - j.startedAt < 8000,
          ),
      );
    }, 120);
    return () => window.clearInterval(t);
  }, []);

  // Auto-spawn new jobs.
  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => {
      if (Math.random() < 0.5) addJob();
    }, 1800);
    return () => window.clearInterval(t);
  }, [auto, addJob]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">ProgressBeam</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Slim ambient progress beam pinned to a container edge. Each parallel
          agent job becomes a colored slice; indeterminate jobs shimmer.
          Hover for detail, click to expand the roster.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Position"
            list={[
              { value: "top", label: "top edge" },
              { value: "bottom", label: "bottom edge" },
            ]}
            value={position}
            onValueChange={(v) => setPosition(v as "top" | "bottom")}
          />
          <Select
            label="Thickness"
            list={[
              { value: "thin", label: "thin (ambient)" },
              { value: "stout", label: "stout (assertive)" },
            ]}
            value={variant}
            onValueChange={(v) => setVariant(v as "thin" | "stout")}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={auto} onCheckedChange={setAuto} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Auto-spawn jobs
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="relative overflow-hidden p-4">
          <ProgressBeam jobs={jobs} position={position} variant={variant} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" color="violet" onClick={addJob}>
              + spawn job
            </Button>
            <Button size="sm" onClick={clear}>
              clear
            </Button>
            <span className="ml-2 text-[11px] text-zinc-500">
              {jobs.filter((j) => j.status === "running").length} running ·{" "}
              {jobs.filter((j) => j.status === "done").length} done ·{" "}
              {jobs.filter((j) => j.status === "failed").length} failed
            </span>
          </div>
          <div className="mt-6 h-56 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-[12px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            <p>
              This is the host container. The beam runs along its edge — visible
              without stealing focus. Resize this region; the beam stays pinned.
              When all jobs finish, the beam fades to a hairline rule so the
              container looks unchanged.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProgressBeam({
  jobs,
  position,
  variant,
}: {
  jobs: Job[];
  position: "top" | "bottom";
  variant: "thin" | "stout";
}) {
  const [open, setOpen] = useState(false);
  const running = jobs.filter((j) => j.status === "running");
  const total = Math.max(1, running.length);
  const h = variant === "thin" ? 2 : 6;

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        className={`absolute inset-x-0 flex cursor-pointer ${
          position === "top" ? "top-0" : "bottom-0"
        }`}
        style={{ height: h }}
        title={open ? "click to collapse roster" : "click to expand roster"}
      >
        {running.length === 0 ? (
          <div className="h-full w-full bg-zinc-200 opacity-50 dark:bg-zinc-800" />
        ) : (
          running.map((j) => <BeamSlice key={j.id} job={j} width={100 / total} />)
        )}
      </div>

      {open && jobs.length > 0 && (
        <div
          className={`absolute inset-x-2 z-10 rounded-md border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ${
            position === "top" ? "top-3" : "bottom-3"
          }`}
        >
          <div className="mb-1.5 flex items-center gap-2 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-zinc-500">
              Running jobs
            </span>
            <Badge color="violet">{running.length}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="ml-auto"
            >
              close
            </Button>
          </div>
          <ul className="space-y-1 text-[12px]">
            {jobs.map((j) => (
              <li
                key={j.id}
                className={`flex items-center gap-2 rounded px-1 py-0.5 ${
                  j.status === "failed"
                    ? "bg-rose-50 dark:bg-rose-950/30"
                    : j.status === "done"
                      ? "bg-emerald-50 dark:bg-emerald-950/30"
                      : ""
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: j.agent.color }}
                />
                <span className="font-medium" style={{ color: j.agent.color }}>
                  {j.agent.name}
                </span>
                <span className="text-zinc-500">·</span>
                <span>{j.name}</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-400">
                  {j.status === "running"
                    ? typeof j.progress === "number"
                      ? `${Math.round(j.progress * 100)}%`
                      : "…"
                    : j.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function BeamSlice({ job, width }: { job: Job; width: number }) {
  const indeterminate = typeof job.progress !== "number";
  return (
    <Tooltip
      content={
        <div className="text-[12px]">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: job.agent.color }}
            />
            <span className="font-medium" style={{ color: job.agent.color }}>
              {job.agent.name}
            </span>
          </div>
          <div className="mt-0.5 text-zinc-600 dark:text-zinc-300">
            {job.name}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
            {indeterminate
              ? "running · indeterminate"
              : `${Math.round((job.progress ?? 0) * 100)}%`}
          </div>
        </div>
      }
    >
      <div
        className="relative h-full overflow-hidden"
        style={{
          width: `${width}%`,
          backgroundColor: job.agent.color + "26",
        }}
      >
        {indeterminate ? (
          <div
            className="absolute inset-y-0 left-0 h-full w-1/3 animate-pulse rounded-r-full"
            style={{ backgroundColor: job.agent.color }}
          />
        ) : (
          <div
            className="h-full"
            style={{
              width: `${(job.progress ?? 0) * 100}%`,
              backgroundColor: job.agent.color,
              transition: "width 200ms linear",
            }}
          />
        )}
      </div>
    </Tooltip>
  );
}

function seedJobs(): Job[] {
  return [
    {
      id: "seed-1",
      agent: AGENTS[0],
      name: TASKS[1],
      progress: 0.32,
      status: "running",
      startedAt: Date.now() - 3000,
    },
    {
      id: "seed-2",
      agent: AGENTS[1],
      name: TASKS[0],
      progress: undefined,
      status: "running",
      startedAt: Date.now() - 1500,
    },
    {
      id: "seed-3",
      agent: AGENTS[3],
      name: TASKS[2],
      progress: 0.74,
      status: "running",
      startedAt: Date.now() - 5500,
    },
  ];
}
