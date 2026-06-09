import { useState } from "react";
import { Board, StickyNote } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { Button } from "@particle-academy/react-fancy";

/**
 * Collaborative Board — the real @particle-academy/fancy-whiteboard <Board>:
 * a pan-zoom canvas (drag to pan, wheel to zoom) holding positioned items.
 * Each <StickyNote> is controlled (`item` + `onChange`) and drags itself in
 * world space; the Board applies the viewport transform once at the root.
 */

type Note = {
    id: string;
    kind: "sticky";
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    color: string;
};

const COLORS = ["#fde68a", "#bef264", "#a5b4fc", "#fda4af", "#7dd3fc"];

const SEED: Note[] = [
    { id: "s1", kind: "sticky", x: 60, y: 50, width: 170, height: 96, text: "Onboarding feels heavy at step 3", color: "#fde68a" },
    { id: "s2", kind: "sticky", x: 260, y: 110, width: 170, height: 96, text: "Try one-click templates", color: "#a5b4fc" },
    { id: "s3", kind: "sticky", x: 470, y: 60, width: 170, height: 96, text: "Bridge into the form so an agent can autofill", color: "#bef264" },
    { id: "s4", kind: "sticky", x: 150, y: 230, width: 170, height: 96, text: "Track time-to-first-board", color: "#fda4af" },
];

export function CollabBoardKit() {
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [notes, setNotes] = useState<Note[]>(SEED);

    const updateNote = (next: Note) =>
        setNotes((arr) => arr.map((n) => (n.id === next.id ? next : n)));

    const addNote = () =>
        setNotes((arr) => [
            ...arr,
            {
                id: `s${arr.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
                kind: "sticky",
                x: 80 + Math.random() * 240,
                y: 70 + Math.random() * 160,
                width: 170,
                height: 96,
                text: "New note — double-click to edit",
                color: COLORS[arr.length % COLORS.length],
            },
        ]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Whiteboard · "Onboarding overhaul"</span>
                <Button color="violet" size="sm" onClick={addNote}>Add note</Button>
            </div>
            <div className="h-[400px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Board className="h-full w-full" viewport={viewport} onViewportChange={setViewport} minZoom={0.4} maxZoom={2.5}>
                    {notes.map((n) => (
                        <StickyNote key={n.id} item={n} onChange={updateNote} />
                    ))}
                </Board>
            </div>
        </div>
    );
}
