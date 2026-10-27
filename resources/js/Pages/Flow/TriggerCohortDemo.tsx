import { useCallback, useState } from "react";
import {
    runCohort,
    type CohortPolicy,
    type ExecutorRegistry,
    type FlowGraph,
} from "@particle-academy/fancy-flow/engine";
import { Badge, Button, Callout, Text } from "@particle-academy/react-fancy";
import { CircleCheckBig, SkipForward, TriangleAlert } from "lucide-react";

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
        <div className="flow-cohort">
            <div className="flow-cohort__bar">
                <div className="flow-cohort__policy" role="group" aria-label="Cohort policy">
                    {(
                        [
                            ["serial-guarded", "Guarded", "shield-check"],
                            ["serial", "Unguarded", "shield-off"],
                        ] as const
                    ).map(([value, label, icon]) => (
                        <Button
                            key={value}
                            icon={icon}
                            variant={policy === value ? "default" : "ghost"}
                            color={policy === value ? "sky" : undefined}
                            aria-pressed={policy === value}
                            data-policy={value}
                            onClick={() => setPolicy(value)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                <div className="flow-cohort__fire">
                    <Text as="span" size="sm" color="muted" aria-live="polite">
                        Deal #41:{" "}
                        {dealAlive ? (
                            <Badge color="emerald" variant="soft" size="md">in the database</Badge>
                        ) : (
                            <Badge color="rose" variant="soft" size="md">deleted</Badge>
                        )}
                    </Text>
                    <Button color="sky" icon="zap" onClick={run} disabled={running} data-action="fire-trigger">
                        {running ? "Running…" : "Fire the trigger"}
                    </Button>
                </div>
            </div>

            <Text as="p" size="sm" color="muted" className="flow-cohort__explain">
                {guarded ? (
                    <>
                        <strong>Guarded.</strong> Same three workflows, same order. The only difference is
                        that the guard, <code className="feature-code">deals.has(41)</code>, is re-checked
                        immediately before each one starts. Not at dispatch: the hazard is what changed in
                        between.
                    </>
                ) : (
                    <>
                        <strong>Unguarded.</strong> Ordered, but nothing asks whether the deal is still
                        there. That is what a loop over <code className="feature-code">runFlow</code> gives
                        you, minus the arbitrary ordering it would also throw in. Watch what the third one
                        sends.
                    </>
                )}
            </Text>

            <ol className="flow-cohort__rows">
                {WORKFLOWS.map((w, i) => {
                    const row = rows[i];
                    return (
                        <li key={w.name} className="flow-cohort__row" data-row-status={row.silent ? "silent" : row.status}>
                            <span className="flow-cohort__n" aria-hidden>
                                {i + 1}
                            </span>
                            <Text as="span" size="sm" weight="semibold" className="flow-cohort__name">
                                {w.name}
                            </Text>
                            <code className="feature-code flow-cohort__steps">{w.steps.join(" → ")}</code>

                            {row.status === "waiting" && <Badge color="zinc" size="md">waiting</Badge>}
                            {row.status === "skipped" && (
                                <Badge color="amber" size="md">
                                    <SkipForward size={11} aria-hidden /> skipped
                                </Badge>
                            )}
                            {row.status === "ran" && !row.silent && (
                                <Badge color="green" size="md">
                                    <CircleCheckBig size={11} aria-hidden /> ok
                                </Badge>
                            )}
                            {row.status === "ran" && row.silent && (
                                <Badge color="red" size="md">
                                    <TriangleAlert size={11} aria-hidden /> ok, but wrong
                                </Badge>
                            )}

                            <Text as="span" size="sm" className="flow-cohort__detail">
                                {row.detail}
                            </Text>
                        </li>
                    );
                })}
            </ol>

            {rows.some((r) => r.silent) && (
                <Callout color="rose" icon={<TriangleAlert size={16} aria-hidden />}>
                    That run <strong>succeeded</strong>. Nothing threw, nothing was logged, and the customer
                    got an email about “undefined”. Switch to Guarded and fire it again.
                </Callout>
            )}

            <pre className="flow-code">
                <code>{`import { runCohort } from "@particle-academy/fancy-flow/engine";

await runCohort([enrich, archive, notify], executors, undefined, {
  guard:  () => deals.has(41),              // re-checked before EACH workflow
  reason: () => "deal #41 no longer exists", // recorded on the skipped result
});`}</code>
            </pre>

            <Text as="p" size="sm" color="muted">
                On a queue it is the same contract, made durable:{" "}
                <code className="feature-code">FancyFlow::dispatchCohort()</code> in{" "}
                <code className="feature-code">fancy-flow-php</code> enqueues only the head, hands the cohort
                on as each run settles, and records a skipped run's reason on the run itself. A run parked on
                a human approval holds the cohort until someone decides.
            </Text>
        </div>
    );
}
