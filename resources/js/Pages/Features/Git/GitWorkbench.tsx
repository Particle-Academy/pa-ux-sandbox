import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    BranchPicker,
    CommitComposer,
    CommitHistory,
    CreateReviewForm,
    DiffViewer,
    ReviewList,
    WorkingTree,
    type CommitDraft,
} from "@particle-academy/fancy-git-ui";
import "@particle-academy/fancy-git-ui/styles.css";
import type { CreateReviewInput } from "@particle-academy/fancy-git";
import { MicroMcpServer, attachInProcess, registerGitBridge, type InProcessTransport } from "@particle-academy/agent-integrations";
import { Badge, Button, Callout, Card, CodeView, Heading, Tabs, Text } from "@particle-academy/react-fancy";
import { GIT_BRANCHES, GIT_COMMITS, GIT_DIFF, GIT_REVIEWS, GIT_STATUS } from "../../Packages/gitFixtures";
import { applyGitProposal, currentBranch, stagedPaths, summarize, validateProposal, type QueuedProposal, type RepoState } from "./gitModel";

/**
 * The live Git demo: fancy-git-ui's real, controlled surfaces over one seeded
 * repository, with the real `registerGitBridge` mounted on an in-page MCP
 * server beside them.
 *
 * Nothing runs git and nothing leaves the page. The host (this file) owns the
 * repository as data; the components emit intents; the bridge's mutations
 * QUEUE proposals for a person to confirm, because that is what the bridge
 * does by default (`allowApply` is off).
 */

const SEED: RepoState = { status: GIT_STATUS, commits: GIT_COMMITS, branches: GIT_BRANCHES, reviews: GIT_REVIEWS };

type ToolCall = { label: string; tool: string; args: Record<string, unknown> };

/** What the "agent" buttons send. Each is a real MCP tools/call to the bridge. */
const AGENT_CALLS: ToolCall[] = [
    { label: "Read status", tool: "git_status", args: {} },
    { label: "Read the log", tool: "git_log", args: { limit: 2 } },
    { label: "Propose: stage the test", tool: "git_stage", args: { paths: ["tests/run-cohort.test.ts"] } },
    { label: "Propose: commit", tool: "git_commit", args: { message: "test(runtime): cover runCohort" } },
    { label: "Propose: check out main", tool: "git_checkout", args: { target: "main" } },
    { label: "Try to apply directly", tool: "git_stage", args: { paths: ["CHANGELOG.md"], apply: true } },
];

type ToolResult = { tool: string; text: string; isError: boolean };

export default function GitWorkbench() {
    const [repo, setRepo] = useState<RepoState>(SEED);
    const repoRef = useRef(repo);
    repoRef.current = repo;

    const [queue, setQueue] = useState<QueuedProposal[]>([]);
    const [log, setLog] = useState<string[]>([]);
    const [tab, setTab] = useState("changes");

    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
    const [mode, setMode] = useState<"unified" | "split">("unified");
    const [acceptance, setAcceptance] = useState<Record<string, "accepted" | "rejected" | "pending">>({});
    const [draft, setDraft] = useState<CommitDraft>({ message: "", description: "" });
    const [selectedCommit, setSelectedCommit] = useState<string | undefined>(GIT_COMMITS[0].id);
    const [selectedBranch, setSelectedBranch] = useState<string | undefined>(currentBranch(SEED));
    const [selectedReview, setSelectedReview] = useState<number | undefined>(GIT_REVIEWS[0]?.number);
    const [reviewDraft, setReviewDraft] = useState<CreateReviewInput>({
        title: "",
        body: "",
        sourceBranch: currentBranch(SEED),
        targetBranch: "main",
        draft: false,
    });

    const [tools, setTools] = useState<string[]>([]);
    const [result, setResult] = useState<ToolResult | null>(null);
    const [busy, setBusy] = useState(false);
    const transportRef = useRef<InProcessTransport | null>(null);
    const rpcId = useRef(1);
    const seq = useRef(0);

    /**
     * Queue a proposal from the person, for a component whose own control says
     * "propose" (BranchPicker's "Propose checkout"): it lands in the same queue
     * the agent's proposals do, and applies only on Confirm.
     */
    const proposeAsYou = (operation: string, args: Record<string, unknown>) => {
        try {
            validateProposal(repoRef.current, operation, args);
            seq.current += 1;
            const id = `p${seq.current}`;
            setQueue((q) => [...q, { id, by: "you", operation, arguments: args, summary: summarize(operation, args) }]);
        } catch (error) {
            setLog((l) => [`You: ${error instanceof Error ? error.message : String(error)}`, ...l].slice(0, 6));
        }
    };

    /** A person's own action applies at once; they are the one who confirms. */
    const act = useCallback((operation: string, args: Record<string, unknown>) => {
        try {
            const { state, note } = applyGitProposal(repoRef.current, { operation, arguments: args });
            setRepo(state);
            setLog((l) => [`You: ${note}`, ...l].slice(0, 6));
            return true;
        } catch (error) {
            setLog((l) => [`You: ${error instanceof Error ? error.message : String(error)}`, ...l].slice(0, 6));
            return false;
        }
    }, []);

    // ── The real bridge, on a real (in-page) MCP server ────────────────────
    useEffect(() => {
        const server = new MicroMcpServer({ info: { name: "features-git-demo", version: "1.0.0" } });
        const bridge = registerGitBridge(server, {
            agent: { id: "demo-agent", name: "Agent", color: "#ea580c" },
            adapter: {
                status: async () => repoRef.current.status,
                log: async ({ limit, skip }) => repoRef.current.commits.slice(skip ?? 0, (skip ?? 0) + (limit ?? 20)),
                diff: async () => ({ patch: GIT_DIFF }),
                reviews: async () => ({ items: repoRef.current.reviews }),
                propose: async (operation, args) => {
                    const { apply: _apply, ...rest } = args;
                    validateProposal(repoRef.current, operation, rest);
                    const proposal = { operation, arguments: rest, summary: summarize(operation, rest) };
                    if (_apply !== true) {
                        seq.current += 1;
                        setQueue((q) => [...q, { ...proposal, id: `p${seq.current}`, by: "agent" }]);
                    }
                    return proposal;
                },
            },
        });
        const transport = attachInProcess(server);
        transportRef.current = transport;

        void rpc<{ tools?: { name: string }[] }>("tools/list", {}).then((r) => setTools((r.tools ?? []).map((t) => t.name)));

        return () => {
            bridge.dispose();
            transportRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function rpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
        const tx = transportRef.current;
        if (!tx) return Promise.reject(new Error("The bridge is not mounted yet."));
        const id = rpcId.current++;
        return new Promise<T>((resolve, reject) => {
            const unsubscribe = tx.onServerMessage((message) => {
                const m = message as { id?: number; result?: T; error?: { message?: string } };
                if (m.id !== id) return;
                unsubscribe();
                if (m.error) reject(new Error(m.error.message ?? "tool error"));
                else resolve(m.result as T);
            });
            tx.deliver({ jsonrpc: "2.0", id, method, params } as never).catch((error: unknown) => {
                unsubscribe();
                reject(error);
            });
        });
    }

    const callTool = async (call: ToolCall) => {
        setBusy(true);
        try {
            const r = await rpc<{ content?: { type: string; text?: string }[]; isError?: boolean }>("tools/call", {
                name: call.tool,
                arguments: call.args,
            });
            const text = (r.content ?? []).map((c) => c.text ?? "").join("\n");
            setResult({ tool: `${call.tool} ${JSON.stringify(call.args)}`, text, isError: r.isError === true });
        } catch (error) {
            setResult({ tool: call.tool, text: error instanceof Error ? error.message : String(error), isError: true });
        } finally {
            setBusy(false);
        }
    };

    const confirm = (proposal: QueuedProposal) => {
        try {
            const { state, note } = applyGitProposal(repoRef.current, proposal);
            setRepo(state);
            setLog((l) => [`Confirmed (${proposal.by === "agent" ? "agent" : "yours"}): ${note}`, ...l].slice(0, 6));
        } catch (error) {
            setLog((l) => [`Could not apply: ${error instanceof Error ? error.message : String(error)}`, ...l].slice(0, 6));
        }
        setQueue((q) => q.filter((p) => p.id !== proposal.id));
    };

    const discard = (proposal: QueuedProposal) => {
        setQueue((q) => q.filter((p) => p.id !== proposal.id));
        setLog((l) => [`Discarded: ${proposal.summary}`, ...l].slice(0, 6));
    };

    const pendingStage = queue.some((p) => p.operation === "stage" || p.operation === "unstage");
    const pendingCheckout = queue.some((p) => p.operation === "checkout");
    const staged = stagedPaths(repo);
    const branchNames = useMemo(() => repo.branches.filter((b) => !b.remote).map((b) => b.name), [repo.branches]);

    return (
        <div className="git-bench" data-git-demo="">
            <div className="git-bench__main">
                <div className="git-bench__head">
                    <Heading as="h2" size="sm" weight="semibold" className="git-bench__title">
                        On {currentBranch(repo)}
                    </Heading>
                    <Text as="span" size="sm" color="muted">
                        {repo.status.files.length} changed, {staged.length} staged, {repo.commits.length} commits, {repo.reviews.length} reviews
                    </Text>
                </div>

                <Tabs activeTab={tab} onTabChange={setTab} variant="underline">
                    <Tabs.List>
                        <Tabs.Tab value="changes">Changes</Tabs.Tab>
                        <Tabs.Tab value="history">History</Tabs.Tab>
                        <Tabs.Tab value="reviews">Pull requests</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panels>
                        <Tabs.Panel value="changes">
                            <div className="git-bench__stack">
                                <WorkingTree
                                    value={repo.status}
                                    selectedPaths={selectedPaths}
                                    onSelectedPathsChange={setSelectedPaths}
                                    onStage={(paths) => act("stage", { paths }) && setSelectedPaths([])}
                                    onUnstage={(paths) => act("unstage", { paths }) && setSelectedPaths([])}
                                    pending={pendingStage}
                                />
                                <DiffViewer value={GIT_DIFF} mode={mode} onModeChange={setMode} acceptance={acceptance} onAcceptanceChange={setAcceptance} />
                                <CommitComposer
                                    value={draft}
                                    onChange={setDraft}
                                    onSubmit={(value) => {
                                        const message = [value.message, value.description].filter(Boolean).join("\n\n");
                                        if (act("commit", { message })) setDraft({ message: "", description: "" });
                                    }}
                                />
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="history">
                            <div className="git-bench__stack">
                                <BranchPicker
                                    value={repo.branches}
                                    selectedName={selectedBranch}
                                    onSelectedNameChange={setSelectedBranch}
                                    onCheckout={(name) => proposeAsYou("checkout", { target: name })}
                                    pending={pendingCheckout}
                                />
                                <CommitHistory value={repo.commits} selectedId={selectedCommit} onSelectedIdChange={setSelectedCommit} />
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="reviews">
                            <div className="git-bench__stack">
                                <ReviewList value={repo.reviews} selectedNumber={selectedReview} onSelectedNumberChange={setSelectedReview} />
                                <CreateReviewForm
                                    value={reviewDraft}
                                    onChange={setReviewDraft}
                                    branches={branchNames}
                                    onSubmit={(value) => {
                                        if (act("review_create", { ...value })) setReviewDraft((d) => ({ ...d, title: "", body: "" }));
                                    }}
                                />
                            </div>
                        </Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
            </div>

            <Card variant="outlined" className="git-bench__agent" data-git-agent="">
                <Card.Header>
                    <Heading as="h3" size="sm" weight="semibold">
                        Be the agent
                    </Heading>
                </Card.Header>
                <Card.Body>
                    <Text as="p" size="sm" color="muted">
                        Each button sends a real MCP <code className="feature-code">tools/call</code> to <code className="feature-code">registerGitBridge</code>, mounted in this page. Writes come back as proposals.
                    </Text>
                    <div className="git-bench__calls">
                        {AGENT_CALLS.map((call) => (
                            <Button key={call.label} size="sm" onClick={() => void callTool(call)} disabled={busy || tools.length === 0}>
                                {call.label}
                            </Button>
                        ))}
                    </div>

                    {result && (
                        <div className="git-bench__result" data-git-tool-result={result.isError ? "error" : "ok"}>
                            <Text as="div" size="sm" weight="semibold" className="git-bench__mono">
                                {result.tool}
                            </Text>
                            <CodeView value={result.text} readOnly maxHeight={180} minHeight={60} />
                        </div>
                    )}

                    <Heading as="h4" size="xs" weight="semibold" className="git-bench__subhead">
                        Waiting for you ({queue.length})
                    </Heading>
                    {queue.length === 0 ? (
                        <Text as="p" size="sm" color="muted">
                            No proposals. Ask the agent to stage, commit or check out.
                        </Text>
                    ) : (
                        <ul className="git-bench__queue">
                            {queue.map((proposal) => (
                                <li key={proposal.id}>
                                    <Callout color="amber" icon={null}>
                                        <div className="git-bench__proposal" data-git-proposal={proposal.operation}>
                                            <Text as="span" size="sm">
                                                <Badge variant="soft" size="md">
                                                    {proposal.by === "agent" ? "Agent" : "You"}
                                                </Badge>{" "}
                                                {proposal.summary}
                                            </Text>
                                            <div className="git-bench__proposal-actions">
                                                <Button size="sm" color="orange" onClick={() => confirm(proposal)}>
                                                    Confirm
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => discard(proposal)}>
                                                    Discard
                                                </Button>
                                            </div>
                                        </div>
                                    </Callout>
                                </li>
                            ))}
                        </ul>
                    )}

                    {log.length > 0 && (
                        <ul className="git-bench__log" aria-live="polite">
                            {log.map((line, i) => (
                                <li key={`${i}-${line}`}>
                                    <Text as="span" size="sm" color="muted">
                                        {line}
                                    </Text>
                                </li>
                            ))}
                        </ul>
                    )}

                    {tools.length > 0 && (
                        <div className="git-bench__tools">
                            <Heading as="h4" size="xs" weight="semibold" className="git-bench__subhead">
                                Tools on this server ({tools.length}, read live from tools/list)
                            </Heading>
                            <div className="git-bench__tool-list" data-git-tools="">
                                {tools.map((name) => (
                                    <Badge key={name} variant="outline" size="md">
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
