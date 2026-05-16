import { SharedWhiteboard } from "@particle-academy/agent-integrations/components/shared-whiteboard";
import "@particle-academy/agent-integrations/styles.css";
import "@particle-academy/fancy-whiteboard/styles.css";
import type { StickyNoteItem } from "@particle-academy/fancy-whiteboard";

const SEED_NOTES: StickyNoteItem[] = [
  {
    id: "seed1",
    kind: "sticky",
    x: 80,
    y: 80,
    width: 240,
    height: 140,
    text: 'Click "Start shared session" →\nthen pipe an agent in via the cURL recipe.',
    color: "#fde68a",
  },
];

/**
 * The whole "shared whiteboard with agent UX" experience is now a single
 * component shipped by @particle-academy/agent-integrations. Drop it into
 * any page that has a whiteboard-share relay endpoint mounted.
 */
export function WhiteboardSharedDemo() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <SharedWhiteboard
        initialNotes={SEED_NOTES}
        agent={{ id: "agent", name: "Agent", color: "#a855f7" }}
        shareBaseUrl="/whiteboard-share"
        header={
          <header className="mb-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Whiteboard — Shared Session</h1>
            <p className="text-sm text-zinc-500">
              The entire UX below — share controls, agent panel, presence, MCP server, relay
              wiring — is one component:{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                &lt;SharedWhiteboard /&gt;
              </code>
              . Click <em>Start shared session</em> to mint a token; copy the cURL recipe to
              connect any external MCP client.
            </p>
          </header>
        }
      />
    </div>
  );
}
