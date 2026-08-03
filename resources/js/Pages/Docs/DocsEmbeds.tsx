import { Fragment, type ReactNode } from "react";
import { FlowViewer } from "@particle-academy/fancy-flow";
import "@particle-academy/fancy-flow/styles.css";

/**
 * Live components inside a docs page.
 *
 * Docs are markdown → HTML, so there is no way to put a real component in one.
 * That is fine for prose and wrong for anything a reader needs to *see* — a
 * workflow described in words is a workflow nobody pictures. This follows the
 * precedent the changelog page already set with its `<!--PACKAGES-->` marker:
 * the markdown carries a placeholder, the page swaps in the real thing.
 *
 *   <!--EMBED:flow-viewer-->
 *
 * An unknown key renders NOTHING rather than throwing — a typo in a docs file
 * should cost a missing diagram, not a blank page.
 */

/** The graph used by the Human+ docs embed: an agent-driven approval flow. */
const APPROVAL_FLOW = {
    nodes: [
        { id: "t", type: "@particle-academy/manual_trigger", position: { x: 0, y: 80 }, data: { kind: "@particle-academy/manual_trigger" } },
        { id: "d", type: "@particle-academy/transform", position: { x: 230, y: 80 }, data: { kind: "@particle-academy/transform" } },
        { id: "a", type: "@particle-academy/human_approval", position: { x: 460, y: 80 }, data: { kind: "@particle-academy/human_approval" } },
        { id: "o", type: "@particle-academy/output", position: { x: 690, y: 80 }, data: { kind: "@particle-academy/output" } },
    ],
    edges: [
        { id: "e1", source: "t", target: "d" },
        { id: "e2", source: "d", target: "a" },
        { id: "e3", source: "a", target: "o" },
    ],
} as never;

const EMBEDS: Record<string, () => ReactNode> = {
    "flow-viewer": () => (
        <FlowViewer
            graph={APPROVAL_FLOW}
            variant="list"
            statuses={{ t: "ok", d: "ok", a: "pending", o: "pending" } as never}
        />
    ),
};

const MARKER = /<!--EMBED:([a-z0-9-]+)-->/g;

/**
 * Renders docs HTML, swapping `<!--EMBED:key-->` markers for real components.
 *
 * Splitting rather than parsing keeps every other byte of the page on the exact
 * `dangerouslySetInnerHTML` path it was on before, so nothing about existing
 * pages changes.
 */
export function DocsBody({ html }: { html: string }) {
    if (!html.includes("<!--EMBED:")) {
        return <div className="docs-prose" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    const parts: ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    MARKER.lastIndex = 0;
    while ((match = MARKER.exec(html)) !== null) {
        const before = html.slice(cursor, match.index);
        if (before) {
            parts.push(
                <div key={`html-${cursor}`} className="docs-prose" dangerouslySetInnerHTML={{ __html: before }} />,
            );
        }

        const render = EMBEDS[match[1]];
        if (render) {
            parts.push(
                <div key={`embed-${match.index}`} className="my-6" data-docs-embed={match[1]}>
                    {render()}
                </div>,
            );
        }

        cursor = match.index + match[0].length;
    }

    const rest = html.slice(cursor);
    if (rest) {
        parts.push(<div key="html-tail" className="docs-prose" dangerouslySetInnerHTML={{ __html: rest }} />);
    }

    return <Fragment>{parts}</Fragment>;
}
