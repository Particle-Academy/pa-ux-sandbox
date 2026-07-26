import { useCallback, useState } from "react";
import {
    runCohort,
    type CohortPolicy,
    type ExecutorRegistry,
    type FlowGraph,
} from "@particle-academy/fancy-flow/engine";
import { Badge } from "@particle-academy/react-fancy";
import { CircleCheckBig, ShieldCheck, ShieldOff, SkipForward, TriangleAlert } from "lucide-react";

/**
 * Trigger collision, run live.
 *
 * One event fires three workflows. The second one archives the deal — which
 * deletes it. Run it UNGUARDED and the third still runs, emails about a deal
 * that no longer exists, and reports `ok: true`: no exception, no log line, a
 * green row. That silent success is the whole problem.
 *
 * Everything here is the real `runCohort` from `@particle-academy/fancy-flow/engine`
 * over three real graphs. The guard is an ordinary closure reading the same
 * in-memory record store the archive step deletes from — nothing is faked to make
 * the point, including the failure.
 */

type Deal = { id: number; name: string; owner: string };

/** A two-node flow: the shared trigger, then the one step this workflow owns. */
const flow = (kind: string, label: string): FlowGraph =>
    ({
        nodes: [
            {
                id: "t",
                type: "manual_trigger",
                position: { x: 0, y: 0 },
                data: { kind: "manual_trigger", label: "Deal updated", config: {} },
            },
            { id: "step", type: kind, position: { x: 180, y: 0 }, data: { kind, label, config: {} } },
        ],
        edges: [{ id: "e1", source: "t", target: "step" }],
    }) as FlowGraph;

const WORKFLOWS = [
    { name: "Enrich deal", kind: "transform", steps: ["Deal updated", "Score & enrich"] },
    { name: "Archive deal", kind: "data_store", steps: ["Deal updated", "Archive + delete"] },
    { name: "Notify owner", kind: "notify", steps: ["Deal updated", "Email the owner"] },
] as const;

const FLOWS = WORKFLOWS.map((w) => flow(w.kind, w.name));

type Row = {
    status: "waiting" | "ran" | "skipped";
    /** What the workflow actually did — or why it didn't. */
    detail: string;
    /** True when the run reported success but acted on a record that was gone. */
    silent?: boolean;
};

const IDLE: Row[] = WORKFLOWS.map(() => ({ status: "waiting", detail: "Not run yet." }));

export default function TriggerCohortDemo() {
    const [policy, setPolicy] = useState<CohortPolicy>("serial-guarded");
    const [rows, setRows] = useState<Row[]>(IDLE);
    const [dealAlive, setDealAlive] = useState(true);
    const [running, setRunning] = useState(false);

    const run = useCallback(async () => {
        setRunning(true);
        setRows(IDLE);

        // A fresh "database" per run — one deal, the one the trigger fired for.
        const deals = new Map<number, Deal>([
            [41, { id: 41, name: "Acme Renewal", owner: "sam@example.com" }],
        ]);
        setDealAlive(true);

        const executors: ExecutorRegistry = {
            manual_trigger: () => ({ dealId: 41 }),
            transform: () => {
                const deal = deals.get(41);
                return { text: `Scored “${deal?.name}” 87/100 and tagged it renewal.` };
            },
            data_store: () => {
                deals.delete(41);
                setDealAlive(false);
                return { text: "Archived deal #41 to cold storage and deleted the row." };
            },
            // The victim. Note it does not check anything — like most nodes, it
            // trusts that the record it was triggered for is still there.
            notify: () => {
                const deal = deals.get(41);
                return {
                    text: `Emailed ${deal?.owner}: “Your deal ‘${deal?.name}’ just closed.”`,
                    gone: deal === undefined,
                };
            },
        };

        const results = await runCohort(FLOWS, executors, undefined, {
            policy,
            // The precondition, re-checked immediately before each workflow starts.
            guard: () => deals.has(41),
            reason: () => "deal #41 no longer exists",
        });

        setRows(
            results.map((r) => {
                if (r.skipped) {
                    return { status: "skipped", detail: r.skippedReason ?? "guard did not pass" };
                }
                const step = (r.outputs?.step ?? {}) as { text?: string; gone?: boolean };
                return {
                    status: "ran",
                    detail: step.text ?? "(no output)",
                    silent: step.gone === true,
                };
            }),
        );
        setRunning(false);
    }, [policy]);

    const guarded = policy === "serial-guarded";

    return (
        <div className="rounded-xl border border-zinc-200 bg-white/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {(
                        [
                            ["serial-guarded", "Guarded", <ShieldCheck key="g" size={14} />],
                            ["serial", "Unguarded", <ShieldOff key="u" size={14} />],
                        ] as const
                    ).map(([value, label, icon]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setPolicy(value)}
                            className={[
                                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition",
                                policy === value
                                    ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                                    : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900",
                            ].join(" ")}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Deal #41 —{" "}
                        {dealAlive ? (
                            <span className="text-emerald-600 dark:text-emerald-400">in the database</span>
                        ) : (
                            <span className="text-rose-600 dark:text-rose-400">deleted</span>
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={run}
                        disabled={running}
                        className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                    >
                        {running ? "Running…" : "Fire the trigger"}
                    </button>
                </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {guarded ? (
                    <>
                        <strong className="text-zinc-800 dark:text-zinc-200">Guarded.</strong> Same three
                        workflows, same order — the only difference is that the guard,{" "}
                        <code className="text-xs">deals.has(41)</code>, is re-checked immediately before
                        each one starts. Not at dispatch: the hazard is what changed in between.
                    </>
                ) : (
                    <>
                        <strong className="text-zinc-800 dark:text-zinc-200">Unguarded.</strong> Ordered,
                        but nothing asks whether the deal is still there — what a loop over{" "}
                        <code className="text-xs">runFlow</code> gives you, minus the arbitrary ordering it
                        would also throw in. Watch what the third one sends.
                    </>
                )}
            </p>

            <ol className="mt-4 space-y-2">
                {WORKFLOWS.map((w, i) => {
                    const row = rows[i];
                    return (
                        <li
                            key={w.name}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40"
                        >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                {i + 1}
                            </span>
                            <span className="w-32 shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {w.name}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                                {w.steps.join(" → ")}
                            </span>

                            {row.status === "waiting" && (
                                <Badge color="zinc">waiting</Badge>
                            )}
                            {row.status === "skipped" && (
                                <Badge color="amber">
                                    <SkipForward size={11} /> skipped
                                </Badge>
                            )}
                            {row.status === "ran" && !row.silent && (
                                <Badge color="green">
                                    <CircleCheckBig size={11} /> ok
                                </Badge>
                            )}
                            {row.status === "ran" && row.silent && (
                                <Badge color="red">
                                    <TriangleAlert size={11} /> ok — but wrong
                                </Badge>
                            )}

                            <span
                                className={[
                                    "min-w-0 flex-1 text-sm",
                                    row.silent
                                        ? "text-rose-600 dark:text-rose-400"
                                        : row.status === "skipped"
                                          ? "text-amber-700 dark:text-amber-400"
                                          : "text-zinc-600 dark:text-zinc-400",
                                ].join(" ")}
                            >
                                {row.detail}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {rows.some((r) => r.silent) && (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                    That run <strong>succeeded</strong>. Nothing threw, nothing was logged, and the customer
                    got an email about “undefined”. Switch to Guarded and fire it again.
                </p>
            )}

            <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[12px] leading-relaxed text-zinc-300">
                <code>{`import { runCohort } from "@particle-academy/fancy-flow/engine";

await runCohort([enrich, archive, notify], executors, undefined, {
  guard:  () => deals.has(41),              // re-checked before EACH workflow
  reason: () => "deal #41 no longer exists", // recorded on the skipped result
});`}</code>
            </pre>

            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                On a queue it's the same contract, made durable:{" "}
                <code className="text-xs">FancyFlow::dispatchCohort()</code> in{" "}
                <code className="text-xs">fancy-flow-php</code> enqueues only the head, hands the cohort on
                as each run settles, and records a skipped run's reason on the run itself. A run parked on a
                human approval holds the cohort until someone decides.
            </p>
        </div>
    );
}
