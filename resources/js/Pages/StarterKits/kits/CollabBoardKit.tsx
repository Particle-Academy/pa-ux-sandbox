import { useEffect, useRef, useState } from "react";
import { Action, Avatar, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";

type StickyNote = {
    id: string;
    x: number;
    y: number;
    color: string;
    author: string;
    text: string;
};

type AgentActivity = { id: string; agent: string; verb: string; ts: number };

const COLORS = ["#fde68a", "#bef264", "#a5b4fc", "#fda4af", "#7dd3fc"];

const SEED: StickyNote[] = [
    { id: "s1", x: 60,  y: 60,  color: "#fde68a", author: "Glenn",  text: "Onboarding feels heavy at step 3" },
    { id: "s2", x: 240, y: 100, color: "#a5b4fc", author: "Rita",   text: "Try one-click templates" },
    { id: "s3", x: 420, y: 60,  color: "#bef264", author: "Claude", text: "Bridge into the form so I can autofill" },
    { id: "s4", x: 120, y: 220, color: "#fda4af", author: "Sam",    text: "Track time-to-first-board" },
];

const AGENT = { id: "claude", name: "Claude", color: "#a855f7" };

export function CollabBoardKit() {
    const [notes, setNotes] = useState(SEED);
    const [activity, setActivity] = useState<AgentActivity[]>([]);
    const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);

    const addNote = () => {
        const id = `s${Date.now().toString(36)}`;
        setNotes((n) => [
            ...n,
            { id, x: 80 + Math.random() * 200, y: 80 + Math.random() * 100, color: COLORS[n.length % COLORS.length], author: "You", text: "New note — type to edit" },
        ]);
        log("you", `drop sticky #${id}`);
    };

    const log = (who: string, verb: string) => {
        setActivity((a) => [{ id: `e${Date.now().toString(36)}`, agent: who, verb, ts: Date.now() }, ...a].slice(0, 8));
    };

    // Simulate the agent moving around the board + dropping a note every few seconds.
    useEffect(() => {
        let alive = true;
        let i = 0;
        const tick = async () => {
            while (alive) {
                await new Promise((r) => setTimeout(r, 2000));
                if (!alive) break;
                const x = 60 + Math.random() * 480;
                const y = 60 + Math.random() * 240;
                setCursor({ x, y });
                if (i++ % 3 === 2) {
                    const id = `agent-${Date.now().toString(36)}`;
                    setNotes((n) => [
                        ...n,
                        { id, x, y, color: "#c4b5fd", author: "Claude", text: ["Add a 'skip' affordance here", "This step needs a callout", "Worth pinning?", "Try mood-meter for confidence"][i % 4] },
                    ]);
                    log(AGENT.name, `whiteboard_add_sticky id=${id}`);
                }
            }
        };
        tick();
        return () => { alive = false; };
    }, []);

    const onDown = (e: React.MouseEvent, id: string) => {
        const note = notes.find((n) => n.id === id);
        if (!note) return;
        setDragging({ id, ox: e.clientX - note.x, oy: e.clientY - note.y });
    };

    const onMove = (e: React.MouseEvent) => {
        if (dragging) {
            const next = notes.map((n) =>
                n.id === dragging.id ? { ...n, x: e.clientX - dragging.ox, y: e.clientY - dragging.oy } : n,
            );
            setNotes(next);
        }
    };

    const onUp = () => {
        if (dragging) {
            log("you", `move ${dragging.id}`);
            setDragging(null);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
            <Card>
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                    <Heading level={3} size="sm">Whiteboard · "Onboarding overhaul"</Heading>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs">
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: AGENT.color }} />
                            {AGENT.name} live
                        </span>
                        <Action color="violet" size="sm" onClick={addNote}>Add note</Action>
                    </div>
                </div>
                <div
                    ref={boardRef}
                    onMouseMove={onMove}
                    onMouseUp={onUp}
                    onMouseLeave={onUp}
                    className="relative h-[360px] overflow-hidden bg-zinc-50 dark:bg-zinc-950"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(120,120,120,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.08) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                >
                    {notes.map((n) => (
                        <div
                            key={n.id}
                            onMouseDown={(e) => onDown(e, n.id)}
                            className="absolute w-[180px] cursor-grab rounded-md p-2 text-[12px] shadow-md active:cursor-grabbing"
                            style={{ left: n.x, top: n.y, background: n.color, color: "#3f3f46" }}
                        >
                            <div className="flex items-center gap-1.5 text-[10px] opacity-70">
                                <Avatar name={n.author} size="sm" />
                                <span className="font-medium">{n.author}</span>
                            </div>
                            <div className="mt-1">{n.text}</div>
                        </div>
                    ))}
                    {cursor && (
                        <div
                            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
                            style={{ left: cursor.x, top: cursor.y }}
                        >
                            <span className="block h-3 w-3 rounded-full" style={{ background: AGENT.color, boxShadow: `0 0 0 4px ${AGENT.color}33` }} />
                            <span
                                className="absolute left-3 top-3 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] text-white"
                                style={{ background: AGENT.color }}
                            >
                                {AGENT.name}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <Card.Body>
                    <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">Agent activity</Text>
                    <ul className="mt-2 max-h-[320px] space-y-1.5 overflow-y-auto">
                        {activity.length === 0 ? (
                            <Text size="xs" className="italic !text-zinc-400">Waiting for Claude…</Text>
                        ) : (
                            activity.map((a) => (
                                <li key={a.id} className="text-[11px]">
                                    <Badge color={a.agent === AGENT.name ? "violet" : "zinc"} size="sm">{a.agent}</Badge>
                                    <span className="ml-2 font-mono text-zinc-600 dark:text-zinc-300">{a.verb}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </Card.Body>
            </Card>
        </div>
    );
}
