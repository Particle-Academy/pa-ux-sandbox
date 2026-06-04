/**
 * The "Why / What / How" editorial strip shown on both the package detail page
 * and each component page. One clean, shared treatment so the two stay in sync.
 *
 * Design notes (kept deliberately restrained — the content is dense, so the
 * chrome must be calm): a hairline card, a single tone accent per column (dot +
 * label), generous line-height, and **subtle** inline code — a faint tint, not
 * the heavy grey fills that made the previous version look noisy.
 */
import type { ReactNode } from "react";

type Tone = "why" | "what" | "how";

const TONE: Record<Tone, { label: string; dot: string; text: string }> = {
    why: {
        label: "Why",
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-300/90",
    },
    what: {
        label: "What",
        dot: "bg-sky-400",
        text: "text-sky-700 dark:text-sky-300/90",
    },
    how: {
        label: "How",
        dot: "bg-emerald-400",
        text: "text-emerald-700 dark:text-emerald-300/90",
    },
};

// Subtle inline-code treatment shared by every card body. A faint violet tint +
// light monospace — readable inside flowing prose, never a row of grey chips.
const PROSE =
    "text-[13.5px] leading-[1.72] text-zinc-600 dark:text-zinc-300/90 " +
    "[&_code]:font-mono [&_code]:text-[0.85em] [&_code]:font-medium " +
    "[&_code]:text-violet-700 dark:[&_code]:text-violet-300 " +
    "[&_code]:rounded-[4px] [&_code]:bg-violet-50/70 dark:[&_code]:bg-violet-400/10 " +
    "[&_code]:px-[0.3em] [&_code]:py-[0.05em] " +
    "[&_em]:not-italic [&_em]:text-zinc-700 dark:[&_em]:text-zinc-200";

function ContextCard({ tone, body }: { tone: Tone; body: string }) {
    const t = TONE[tone];
    return (
        <div className="rounded-xl border border-zinc-200/80 bg-white/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mb-3 flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${t.dot}`} />
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${t.text}`}>
                    {t.label}
                </span>
            </div>
            <div className={PROSE} dangerouslySetInnerHTML={{ __html: body }} />
        </div>
    );
}

export function ContextCards({ why, what, how }: { why: string; what: string; how: string }) {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            <ContextCard tone="why" body={why} />
            <ContextCard tone="what" body={what} />
            <ContextCard tone="how" body={how} />
        </div>
    );
}

/** Shown on a component page when no editorial entry exists yet. */
export function ContextPending({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
            {children}
        </div>
    );
}
