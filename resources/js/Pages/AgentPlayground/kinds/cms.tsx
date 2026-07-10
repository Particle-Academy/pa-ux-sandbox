/**
 * cms kind — a CMS page on the fancy-doc-commons node model, driven by
 * registerCmsBridge (agent-integrations 0.27+, built on registerDocBridge).
 *
 * The surface renders a `DocTree<StyledNode>` directly: the substrate's
 * deterministic CSS emitter (`emitTreeCss`) compiles each node's per-breakpoint
 * style to `[data-cms-node="…"]` rules, and a tiny recursive renderer draws the
 * node tree. An agent adds/moves/styles nodes with `cms_*` tools and the page
 * updates live — the greenfield CMS bridge, proven end-to-end.
 */
import type { ReactNode } from "react";
import { registerCmsBridge } from "@particle-academy/agent-integrations/bridges/cms";
import {
  emitTreeCss,
  fractionalKey,
  childrenOf,
  type DocTree,
  type StyledNode,
} from "@particle-academy/fancy-doc-commons";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type CmsState = { doc: DocTree<StyledNode> };

const seed = (): CmsState => {
  const o1 = fractionalKey(null, null);
  const c1 = fractionalKey(null, null);
  const c2 = fractionalKey(c1, null);
  return {
    doc: {
      nodes: {
        sec: {
          id: "sec",
          type: "section",
          parent: null,
          order: o1,
          props: {},
          layout: "stack",
          style: { base: { padding: { value: 32, unit: "px" }, gap: { value: 14, unit: "px" }, background: "#0b1220" } },
        },
        h: {
          id: "h",
          type: "heading",
          parent: "sec",
          order: c1,
          props: { content: "Agent-authored page" },
          style: { base: { color: "#e2e8f0", fontSize: { value: 30, unit: "px" }, fontWeight: 700 } },
        },
        p: {
          id: "p",
          type: "paragraph",
          parent: "sec",
          order: c2,
          props: { content: "Ask the agent to add sections + text with cms_add, restyle them with cms_set_style, and reorder with cms_move." },
          style: { base: { color: "#94a3b8", fontSize: { value: 15, unit: "px" }, lineHeight: 1.6 } },
        },
      },
    },
  };
};

/** Node content by type — the substrate is content-agnostic; a CMS surface maps
 *  `type` + `props` to markup. Containers render only their children. */
function nodeContent(node: StyledNode): ReactNode {
  const p = node.props as Record<string, unknown>;
  switch (node.type) {
    case "heading":
    case "text":
    case "paragraph":
    case "callout":
      return typeof p.content === "string" ? p.content : null;
    case "image":
      return typeof p.src === "string" ? <img src={p.src} alt={typeof p.alt === "string" ? p.alt : ""} style={{ maxWidth: "100%", display: "block" }} /> : null;
    case "button":
      return <span>{typeof p.label === "string" ? p.label : "Button"}</span>;
    default:
      return typeof p.content === "string" ? p.content : null;
  }
}

function CmsNode({ tree, id }: { tree: DocTree<StyledNode>; id: string }) {
  const node = tree.nodes[id];
  if (!node) return null;
  return (
    <div data-cms-node={id}>
      {nodeContent(node)}
      {childrenOf(tree, id).map((child) => (
        <CmsNode key={child.id} tree={tree} id={child.id} />
      ))}
    </div>
  );
}

function CmsSurface({ state }: SurfaceProps) {
  const s = state as CmsState;
  // Deterministic CSS for the whole tree, scoped to [data-cms-node="…"].
  const css = emitTreeCss(s.doc, { selectorFor: (id) => `[data-cms-node="${id}"]` });
  return (
    <div style={{ height: 480 }} className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <style>{css}</style>
      {childrenOf(s.doc, null).map((root) => (
        <CmsNode key={root.id} tree={s.doc} id={root.id} />
      ))}
    </div>
  );
}

export const cmsKind: KindModule = {
  kind: "cms",
  label: "CMS Page",
  description: "A CMS page on the fancy-doc-commons node model. Drive it with cms_* tools: add/update/remove/move nodes, set_style / set_layout, and confirm/reject staged edits.",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as CmsState | null) ?? seed();
    return registerCmsBridge(server, {
      adapter: {
        get: () => read().doc,
        set: (next) => ctx.setActiveState({ doc: next }),
      },
      agent: ctx.agent,
    });
  },
  Surface: CmsSurface,
};
