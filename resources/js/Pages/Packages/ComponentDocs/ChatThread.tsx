import { useEffect, useRef, useState } from "react";
import type { ComponentDoc } from "./types";
import { Badge, Button, ChatMessage, ChatThread, Composer, Icon, Text } from "@particle-academy/react-fancy";
import type { ChatMessageData, ChatThreadActivity, ChatThreadHandle } from "@particle-academy/react-fancy";

/*
 * Every time is fixed and formatted in UTC. These pages server-render, and a
 * locale clock read on the server and again in the browser would disagree.
 */
const BASE = Date.UTC(2026, 9, 27, 9, 0, 0);
const at = (minutes: number): number => BASE + minutes * 60_000;
const formatTime = (d: Date): string =>
    `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
const formatDay = (d: Date): string =>
    d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const REPLY = [
    "Here is the change. It keeps the old name as an alias, so nothing breaks:\n\n",
    "```ts\nexport const Action = Button; // @deprecated\n",
    "export { Button };\n```\n\n",
    "Run the suite once more before you tag it.",
];

function AgentChatDemo() {
    const [messages, setMessages] = useState<ChatMessageData[]>([
        { id: "m1", role: "user", content: "Can you alias `Action` to `Button`?", createdAt: at(0) },
        {
            id: "m2",
            role: "assistant",
            author: { name: "Fancy agent" },
            content: "Yes. Send me a message and I will stream a reply into this thread.",
            createdAt: at(1),
        },
    ]);
    const [replying, setReplying] = useState(false);
    const timer = useRef<number | null>(null);

    useEffect(() => () => {
        if (timer.current !== null) window.clearInterval(timer.current);
    }, []);

    const reply = (minute: number) => {
        const id = `a${minute}`;
        let sent = 0;
        setReplying(true);
        setMessages((m) => [
            ...m,
            { id, role: "assistant", author: { name: "Fancy agent" }, content: "", createdAt: at(minute), status: "streaming" },
        ]);
        timer.current = window.setInterval(() => {
            sent++;
            const done = sent >= REPLY.length;
            setMessages((m) =>
                m.map((x) =>
                    x.id === id ? { ...x, content: REPLY.slice(0, sent).join(""), status: done ? "sent" : "streaming" } : x,
                ),
            );
            if (done && timer.current !== null) {
                window.clearInterval(timer.current);
                timer.current = null;
                setReplying(false);
            }
        }, 700);
    };

    return (
        <ChatThread
            className="h-96 w-full max-w-xl rounded-xl border border-zinc-200 dark:border-zinc-700"
            heading="Agent"
            messages={messages}
            streaming="progressive"
            formatTime={formatTime}
            composer={
                <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
                    <Composer
                        placeholder={replying ? "The agent is answering…" : "Ask the agent…"}
                        sendDisabled={replying}
                        onSubmit={(text) => {
                            const minute = messages.length + 1;
                            setMessages((m) => [...m, { id: `u${minute}`, role: "user", content: text, createdAt: at(minute) }]);
                            reply(minute + 1);
                        }}
                    />
                </div>
            }
        />
    );
}

const PROPOSALS: ChatMessageData[] = [
    {
        id: "p0",
        role: "customer",
        author: { name: "Dana (customer)" },
        content: "My invoice for October shows two charges. Can you check?",
        createdAt: at(0),
    },
    {
        id: "p1",
        role: "agent",
        author: { name: "Triage" },
        content:
            "Hi Dana, you were charged twice because a retry ran after the first payment had already gone through. I have refunded the second charge; it reaches your card in 3 to 5 days.",
        createdAt: at(2),
        proposal: { id: "card_81", title: "Drafted reply", acceptLabel: "Send reply", rejectLabel: "Discard" },
    },
    {
        id: "p2",
        role: "agent",
        author: { name: "Triage" },
        content: "Set the ticket priority to **High**.",
        createdAt: at(3),
        proposal: { id: "card_82", title: "Field change" },
    },
];

function ProposalDemo() {
    const [messages, setMessages] = useState(PROPOSALS);
    const [log, setLog] = useState<string[]>([]);
    const [failNext, setFailNext] = useState(false);

    const decide = (message: ChatMessageData, state: "accepted" | "rejected") =>
        new Promise<void>((resolve, reject) => {
            window.setTimeout(() => {
                if (failNext) {
                    setFailNext(false);
                    reject(new Error("The server refused the decision."));
                    return;
                }
                setMessages((all) =>
                    all.map((m) => (m.id === message.id && m.proposal ? { ...m, proposal: { ...m.proposal, state } } : m)),
                );
                resolve();
            }, 900);
        });

    const record = (line: string) => setLog((l) => [line, ...l].slice(0, 5));

    return (
        <div className="grid w-full gap-3 lg:grid-cols-[1fr_16rem]">
            <ChatThread
                className="h-96 rounded-xl border border-zinc-200 dark:border-zinc-700"
                heading="Ticket #4411"
                headingLevel={3}
                messages={messages}
                ownRoles={["agent"]}
                formatTime={formatTime}
                onProposalAccept={(m) => decide(m, "accepted")}
                onProposalReject={(m) => decide(m, "rejected")}
                onActivity={(e: ChatThreadActivity) =>
                    record(e.type === "proposal-accept" || e.type === "proposal-reject" ? `${e.type} ${e.proposalId}` : e.type)
                }
                onActionError={(error, action) => record(`error on ${action.type}: ${(error as Error).message}`)}
            />
            <div className="space-y-2">
                <Button size="sm" color="zinc" onClick={() => setFailNext(true)} disabled={failNext}>
                    {failNext ? "Next decision will fail" : "Make the next decision fail"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMessages(PROPOSALS)}>
                    Reset the cards
                </Button>
                <Text size="xs" className="!text-zinc-500">
                    onActivity / onActionError
                </Text>
                <ul className="space-y-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                    {log.length === 0 ? <li>Accept or discard a card.</li> : log.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
            </div>
        </div>
    );
}

const SUPPORT: ChatMessageData[] = [
    { id: "s1", role: "customer", author: { name: "Dana" }, content: "The export button does nothing.", createdAt: at(-1440) },
    { id: "s2", role: "customer", author: { name: "Dana" }, content: "Here is what I see.", createdAt: at(-1438),
        attachments: [{ id: "f1", name: "screenshot.png", url: "#", mimeType: "image/png", size: 182_400 }] },
    { id: "s3", role: "staff", author: { name: "Sam" }, content: "Thanks Dana, looking now.", createdAt: at(-1400) },
    { id: "s4", role: "staff", author: { name: "Sam" }, content: "Reproduced on Safari only. Assigning to frontend.", createdAt: at(-1398), visibility: "internal" },
    { id: "s5", role: "system", content: "Ticket assigned to Frontend.", createdAt: at(-1397) },
    { id: "s6", role: "staff", author: { name: "Sam" }, content: "A fix ships today; I will confirm when it is live.", createdAt: at(30), status: "failed" },
    { id: "s7", role: "staff", author: { name: "Sam" }, content: "Fixed, and live. Can you try again?", createdAt: at(31), status: "pending" },
];

export const chatThreadDoc: ComponentDoc = {
    intro: (
        <p>
            A controlled message list for agent and support conversations. Messages are plain JSON, rendered
            through a sanitised <code>ContentRenderer</code>; the thread owns no message state and ships no
            input, so a <code>Composer</code> or <code>PromptInput</code> goes in its <code>composer</code> slot.
            An agent's suggested action is an approval card a human decides on, and the log follows new
            messages only while the reader is at the bottom.
        </p>
    ),
    examples: [
        {
            name: "Agent chat, streaming as it fills",
            description:
                "Send a message and the agent streams a reply. A message with status \"streaming\" is aria-busy; streaming=\"progressive\" shows the open code fence as it fills instead of holding it back. The Composer in the composer slot uses sendDisabled while the agent answers, so you can keep typing but not send.",
            render: () => <AgentChatDemo />,
            code: `const [messages, setMessages] = useState<ChatMessageData[]>([]);

<ChatThread
    className="h-96"
    heading="Agent"
    messages={messages}
    streaming="progressive"
    composer={
        <Composer
            sendDisabled={agentIsAnswering}
            onSubmit={(text) => send(text)}
        />
    }
/>

// While the reply arrives, update ONE message:
// { id, role: "assistant", content: soFar, status: "streaming" }
// and set status: "sent" when the stream ends.`,
        },
        {
            name: "Approval cards: the agent proposes, a human decides",
            description:
                "A message with a proposal is an approval card. It never acts on its own: the buttons call onProposalAccept / onProposalReject, and the returned Promise disables both until it settles. The card's state is yours; move it to accepted or rejected and the buttons become a badge. Make the next decision fail to see onActionError, and watch onActivity report every interaction.",
            render: () => <ProposalDemo />,
            code: `<ChatThread
    heading="Ticket #4411"
    headingLevel={3}
    messages={messages}
    ownRoles={["agent"]}
    onProposalAccept={(m) => api.decide(m.proposal!.id, "accept")}
    onProposalReject={(m) => api.decide(m.proposal!.id, "reject")}
    onActivity={(e) => presence.emit(e)}
    onActionError={(error, action) => toast(action.type + " failed")}
/>

// A card is a message:
{
    id: "p1",
    role: "agent",
    content: "Hi Dana, ...",
    createdAt: Date.now(),
    proposal: { id: "card_81", title: "Drafted reply", acceptLabel: "Send reply" },
}`,
        },
        {
            name: "A support thread: internal notes, days, groups, attachments",
            description:
                "The staff view: ownRoles=[\"staff\"] puts staff messages on the right. separators=\"day\" marks each calendar day, groupConsecutive merges a run from one author, and visibility \"internal\" is LABELLED, never filtered: pass only what this viewer may see. Attachments are links, never loaded inline. renderActions puts a retry on the failed message, and labels translates the visible strings.",
            render: () => (
                <ChatThread
                    className="h-[28rem] w-full max-w-xl rounded-xl border border-zinc-200 dark:border-zinc-700"
                    messages={SUPPORT}
                    ownRoles={["staff"]}
                    separators="day"
                    formatDay={formatDay}
                    formatTime={formatTime}
                    groupConsecutive
                    labels={{ internal: "Staff only", failed: "Not delivered" }}
                    renderAttachment={(file) => (
                        <Badge size="sm" color="zinc">
                            <Icon name="paperclip" size="xs" /> {file.name} · {Math.round((file.size ?? 0) / 1024)} KB
                        </Badge>
                    )}
                    renderActions={(m) =>
                        m.status === "failed" ? (
                            <Button size="xs" variant="ghost" icon="refresh-cw">
                                Retry
                            </Button>
                        ) : null
                    }
                    classNames={{ bubble: "shadow-sm" }}
                />
            ),
            code: `<ChatThread
    messages={visibleToThisViewer}
    ownRoles={["staff"]}
    separators="day"
    groupConsecutive
    labels={{ internal: "Staff only", failed: "Not delivered" }}
    renderAttachment={(file) => <Badge><Icon name="paperclip" size="xs" /> {file.name}</Badge>}
    renderActions={(m) =>
        m.status === "failed" ? <Button size="xs" onClick={() => retry(m)}>Retry</Button> : null
    }
    classNames={{ bubble: "shadow-sm" }}
/>`,
        },
        {
            name: "Load earlier, and drive the log from outside",
            description:
                "onLoadEarlier shows a control at the top; return a Promise and it is disabled until the older page arrives, and the message under the reader stays put. hasEarlier says when there is nothing left. Scroll up and add a message: the log does not move, and an \"N new messages\" control appears instead (bottomThreshold decides what counts as the bottom, onAtBottomChange reports it). The ref handle scrolls only the log, never the page.",
            render: () => <LoadEarlierDemo />,
            code: `const thread = useRef<ChatThreadHandle>(null);

<ChatThread
    ref={thread}
    messages={messages}
    onLoadEarlier={() => fetchOlder().then(prepend)}
    hasEarlier={olderRemain}
    stickToBottom
    bottomThreshold={48}
    onAtBottomChange={setAtBottom}
    empty={<Text>No messages yet.</Text>}
/>

thread.current?.scrollToLatest();
thread.current?.scrollToMessage("h1"); // false if not rendered`,
        },
        {
            name: "ChatMessage on its own, with content options",
            description:
                "One message, outside a thread: a pinned answer or a search result. message is the same JSON; actions fills the per-message slot and grouped drops the header. contentOptions reaches the message's ContentRenderer: here copy buttons stay on code but are off for tables, and onCopy reports each copy.",
            render: () => <StandaloneDemo />,
            code: `<ChatMessage
    message={{ id: "pin", role: "assistant", content: markdown, createdAt: Date.now() }}
    actions={<Button size="xs" variant="ghost" icon="pin">Unpin</Button>}
    contentOptions={{ copyButtons: { table: false }, onCopy: (e) => track(e.kind) }}
/>
<ChatMessage message={followUp} grouped />`,
        },
    ],
    props: [
        { name: "messages", type: `ChatMessageData[]`, default: "—", description: "The messages, oldest first. Controlled: the thread renders exactly these.", required: true },
        { name: "composer", type: `ReactNode`, default: "—", description: "Rendered below the log. Put a `Composer` or `PromptInput` here; the thread ships no input." },
        { name: "heading", type: `ReactNode`, default: "—", description: "Visible title. The log is labelled by it; without it the log gets `labels.log`." },
        { name: "headingLevel", type: `2 | 3 | 4 | 5 | 6`, default: `2`, description: "Heading level for `heading`." },
        { name: "ownRoles", type: `string[]`, default: `["user"]`, description: "Roles aligned as the viewer's own. `own` on a message overrides it." },
        { name: "streaming", type: `true | "progressive"`, default: `true`, description: "How a `status: \"streaming\"` message renders its unfinished tail: held back, or shown as it fills." },
        { name: "onProposalAccept", type: `(message) => void | Promise`, default: "—", description: "Accept on an approval card. A Promise disables both decisions until it settles." },
        { name: "onProposalReject", type: `(message) => void | Promise`, default: "—", description: "Reject on an approval card. Same acknowledgement as accept." },
        { name: "onActionError", type: `(error, action) => void`, default: "—", description: "A Promise from load-earlier or a decision rejected. Without it the rejection stays unhandled, so it still reaches the console." },
        { name: "onActivity", type: `(event: ChatThreadActivity) => void`, default: "—", description: "Every interaction (load earlier, accept, reject, jump to latest) as one event stream for presence and undo layers." },
        { name: "onLoadEarlier", type: `() => void | Promise`, default: "—", description: "Shows a \"Load earlier messages\" control; a Promise disables it until it settles." },
        { name: "hasEarlier", type: `boolean`, default: "true with `onLoadEarlier`", description: "Whether anything earlier remains." },
        { name: "loadingEarlier", type: `boolean`, default: "—", description: "Host-controlled loading state for the load-earlier control." },
        { name: "stickToBottom", type: `boolean`, default: `true`, description: "Follow new messages while the reader is at the bottom." },
        { name: "bottomThreshold", type: `number`, default: `48`, description: "How close to the bottom, in px, still counts as at the bottom." },
        { name: "onAtBottomChange", type: `(atBottom: boolean) => void`, default: "—", description: "The reader arrived at or left the bottom." },
        { name: "separators", type: `"none" | "day"`, default: `"none"`, description: "`day` inserts a separator at each local calendar-day change." },
        { name: "formatDay", type: `(date: Date) => string`, default: "locale date", description: "Formats a day separator." },
        { name: "formatTime", type: `(date: Date) => string`, default: "locale time", description: "Formats a message time." },
        { name: "groupConsecutive", type: `boolean | number`, default: `false`, description: "Merge consecutive messages from one author: `true` within 5 minutes, or a window in ms. Internal and public never merge." },
        { name: "renderActions", type: `(message) => ReactNode`, default: "—", description: "The per-message actions slot. Return `null` for none." },
        { name: "renderAttachment", type: `(attachment, message) => ReactNode`, default: "—", description: "Replace how one attachment renders. Still wrapped in `[data-chat-attachment]`." },
        { name: "contentOptions", type: `{ extensions?, copyButtons?, onCopy?, clipboardWriter?, lineSpacing? }`, default: "—", description: "Passed to every message's `ContentRenderer`. `unsafe` is deliberately absent." },
        { name: "labels", type: `Partial<ChatThreadLabels>`, default: "—", description: "Every visible string, for translation." },
        { name: "empty", type: `ReactNode`, default: "—", description: "Shown in the log when there are no messages." },
        { name: "classNames", type: `ChatThreadClassNames`, default: "—", description: "root, heading, log, composer, separator, jump, and the message parts: message, bubble, header, actions, proposal." },
        { name: "ref", type: `Ref<ChatThreadHandle>`, default: "—", description: "`scrollToLatest()`, `scrollToMessage(id)` and `element`. Only the log scrolls." },
        { name: "ChatMessage — message", type: `ChatMessageData`, default: "—", description: "The one message to render." },
        { name: "ChatMessage — actions", type: `ReactNode`, default: "—", description: "The per-message actions slot." },
        { name: "ChatMessage — grouped", type: `boolean`, default: `false`, description: "A continuation of the previous message's group: the header is omitted." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Stable handles:</strong> <code>[data-chat-message]</code> with <code>data-chat-role</code>,
            <code> [data-chat-proposal]</code> with <code>data-chat-proposal-state</code> and
            <code> [data-chat-proposal-action=&quot;accept&quot; | &quot;reject&quot;]</code>, and
            <code> [data-react-fancy-chat-thread-jump]</code>. The log is <code>role=&quot;log&quot;</code> with
            polite updates. <strong>The thread never decides visibility:</strong> an internal note is labelled,
            not hidden, so filter on the server and pass only what this viewer may see.
        </p>
    ),
};

const HISTORY: ChatMessageData[] = Array.from({ length: 6 }, (_, i) => ({
    id: `h${i + 1}`,
    role: i % 2 === 0 ? "user" : "assistant",
    content: `Earlier message ${i + 1}.`,
    createdAt: at(-60 + i),
}));

function LoadEarlierDemo() {
    const thread = useRef<ChatThreadHandle>(null);
    const [messages, setMessages] = useState<ChatMessageData[]>(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: `r${i + 1}`,
            role: i % 2 === 0 ? "user" : "assistant",
            content: `Recent message ${i + 1}.`,
            createdAt: at(i),
        })),
    );
    const [olderRemain, setOlderRemain] = useState(true);
    const [atBottom, setAtBottom] = useState(true);
    const [found, setFound] = useState<string | null>(null);

    return (
        <div className="w-full max-w-xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    color="zinc"
                    onClick={() =>
                        setMessages((m) => [
                            ...m,
                            { id: `n${m.length}`, role: "assistant", content: `New message ${m.length + 1}.`, createdAt: at(m.length) },
                        ])
                    }
                >
                    Add a message
                </Button>
                <Button size="sm" variant="ghost" onClick={() => thread.current?.scrollToLatest()}>
                    scrollToLatest()
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFound(String(thread.current?.scrollToMessage("h1")))}>
                    scrollToMessage("h1")
                </Button>
                <Badge size="sm" color={atBottom ? "green" : "amber"}>
                    {atBottom ? "at the bottom" : "scrolled up"}
                </Badge>
                {found !== null && (
                    <Text size="xs" className="!text-zinc-500">
                        returned {found}
                    </Text>
                )}
            </div>
            <ChatThread
                ref={thread}
                className="h-72 rounded-xl border border-zinc-200 dark:border-zinc-700"
                messages={messages}
                formatTime={formatTime}
                onLoadEarlier={() =>
                    new Promise<void>((resolve) =>
                        window.setTimeout(() => {
                            setMessages((m) => [...HISTORY, ...m]);
                            setOlderRemain(false);
                            resolve();
                        }, 800),
                    )
                }
                hasEarlier={olderRemain}
                loadingEarlier={false}
                stickToBottom
                bottomThreshold={48}
                onAtBottomChange={setAtBottom}
                empty={<Text size="sm">No messages yet.</Text>}
                classNames={{ jump: "!rounded-full" }}
            />
        </div>
    );
}

const PINNED = `The kit's three install routes:

| Route | Command |
|---|---|
| npm | npm install @particle-academy/react-fancy |
| vendor | npx fancy-cli@latest add chat-thread |

\`\`\`bash
npx fancy-cli@latest add chat-thread
\`\`\``;

function StandaloneDemo() {
    const [copies, setCopies] = useState<string[]>([]);

    return (
        <div className="w-full max-w-xl space-y-1">
            <ChatMessage
                message={{ id: "pin", role: "assistant", author: { name: "Fancy agent" }, content: PINNED, createdAt: at(5) }}
                formatTime={formatTime}
                actions={
                    <Button size="xs" variant="ghost" icon="pin">
                        Unpin
                    </Button>
                }
                contentOptions={{
                    copyButtons: { table: false },
                    onCopy: (e) => setCopies((c) => [`${e.kind}: ${e.ok ? "copied" : "failed"}`, ...c].slice(0, 3)),
                }}
            />
            <ChatMessage
                message={{ id: "pin2", role: "assistant", author: { name: "Fancy agent" }, content: "Both routes give you the same component.", createdAt: at(5) }}
                formatTime={formatTime}
                grouped
            />
            {copies.length > 0 && (
                <Text size="xs" className="!text-zinc-500">
                    onCopy: {copies.join(", ")}
                </Text>
            )}
        </div>
    );
}
