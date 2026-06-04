/**
 * Sandbox CMS element registry — the host extends the CMS's default registry
 * with islands that render the existing bespoke markup, so a seeded CMS doc
 * reproduces a page pixel-for-pixel. Island renderers return INNER content; the
 * node's `className` (passthrough) carries the existing CSS class on the wrapper.
 *
 * Two flavours of island here:
 *  - **hero-***: fine-grained bits of the hero (gradient h1, CTA, card) so the
 *    hero stays inline-editable node-by-node.
 *  - **section-***: a whole downstream Home section, rendered by re-using the
 *    exact exported component from `Pages/Home.tsx`. These are interactive /
 *    data-driven (live demos, server package list) → correctly islands, and
 *    pixel-identical by construction since it's the same component.
 *
 * The registry is a **factory** so section islands can close over the real
 * server data (`packages`, `companions`, `total`) the way the live Home page does.
 */
import { Link } from "@inertiajs/react";
import { ArrowRight, Github, Layers, Package, Terminal, Zap } from "lucide-react";
import { Button, Card, FauxClient } from "@particle-academy/react-fancy";
import { defaultRegistry, type ElementRegistry } from "@particle-academy/fancy-cms-ui/react";
import {
  HumanPlus,
  ComponentsShowcase,
  type PackageRow,
  type CompanionRow,
} from "../Pages/Home";

export interface SandboxData {
  packages: PackageRow[];
  companions: CompanionRow[];
  total: number;
}

export const HERO_CODE_HTML = `<span class="tok-c">// One surface. Two participants.</span>
<span class="tok-k">import</span> { ArtBoard, ArtPiece } <span class="tok-k">from</span> <span class="tok-s">"@particle-academy/fancy-artboard"</span>;
<span class="tok-k">import</span> { registerArtboardBridge } <span class="tok-k">from</span> <span class="tok-s">"@particle-academy/agent-integrations"</span>;

<span class="tok-k">export default function</span> <span class="tok-t">DesignReview</span>() {
  <span class="tok-k">const</span> [board, setBoard] = <span class="tok-n">useState</span>(initialBoard);
  <span class="tok-k">return</span> (
    &lt;<span class="tok-t">ArtBoard</span> <span class="tok-a">value</span>={board} <span class="tok-a">onChange</span>={setBoard}&gt;
      &lt;<span class="tok-t">ArtPiece</span> <span class="tok-a">id</span>=<span class="tok-s">"hero-v3"</span> <span class="tok-a">kind</span>=<span class="tok-s">"jsx"</span> /&gt;
    &lt;/<span class="tok-t">ArtBoard</span>&gt;
  );
}`;

export function makeSandboxRegistry(data: SandboxData): ElementRegistry {
  // Host JSX islands — the escape hatch the `jsx` Element resolves by `island`
  // key. The ONE allowed place for non-Element React (live demos, server data).
  const islands: Record<string, () => JSX.Element> = {
    "components-preview": () => <ComponentsShowcase total={data.total} />,
  };
  return {
    ...sandboxRegistry,
    // `jsx` Element — render a registered island by key (props.island).
    jsx: ({ node }) => islands[lit(node.props.island)]?.() ?? null,
    // Whole-section islands — the real Home components, fed the same server data.
    // (Packages is now a CMS repeater in the seed; HumanPlus stays an island —
    // it's live, interactive agent demos that can't be static Elements.)
    "section-human-plus": () => <HumanPlus />,
    "section-components": () => <ComponentsShowcase total={data.total} />,
    // section-philosophy + section-quickstart removed — now real CMS Elements in the seed.
    // section-explore removed — the Explore section is now real CMS Elements
    // (a repeater bound to `explore`) in home-seed.ts.
  };
}

/** Resolve a seeded literal prop to a string. */
const lit = (v: unknown): string => (v == null ? "" : String(v));

export const sandboxRegistry: ElementRegistry = {
  ...defaultRegistry,

  // CMS `button` element → a real react-fancy Button, so authored buttons match
  // the rest of the site. Maps the CMS variant (primary/ghost/outline) onto
  // react-fancy's Button API.
  button: ({ node }) => {
    const label = lit(node.props.label) || lit(node.props.content) || "Button";
    const variant = lit(node.props.variant) || "primary";
    const href = lit(node.props.href) || undefined;
    const buttonProps =
      variant === "ghost" || variant === "outline"
        ? ({ variant: "ghost" as const })
        : ({ color: "violet" as const });
    return (
      <Button {...buttonProps} href={href}>
        {label}
      </Button>
    );
  },

  // `card` Element → a real react-fancy Card so authored cards match the site.
  card: ({ children }) => <Card padding="md">{children}</Card>,

  // `device` Element — a FauxClient frame (browser / device / bare) that renders
  // its child Elements as real, interactive UI inside. This is how the CMS hosts
  // a code/app preview (e.g. the hero) without bespoke chrome markup.
  device: ({ node, children }) => (
    <FauxClient
      variant={(lit(node.props.variant) || "browser") as "browser" | "device" | "bare"}
      url={lit(node.props.url) || undefined}
      meta={lit(node.props.meta) || undefined}
    >
      {children}
    </FauxClient>
  ),

  "hero-eyebrow": () => (
    <>
      <span className="dot" />
      <span>v0.2 · Particle Academy</span>
    </>
  ),

  "hero-h1": () => (
    <>
      Components for the surfaces where{" "}
      <span className="gradient-text">humans and agents work together</span>.
    </>
  ),

  "hero-cta": () => (
    <>
      <Link className="btn btn-primary" href="/docs">
        <Terminal size={15} />
        Install the kit
      </Link>
      <Link className="btn btn-ghost" href="/agent-playground">
        See Human+ in action
        <ArrowRight size={15} />
      </Link>
    </>
  ),

  "hero-meta": ({ node }) => {
    const packages = typeof node.props.packages === "number" ? node.props.packages : 12;
    return (
      <>
        <span className="meta-item">
          <Package size={13} /> {packages} UI packages
        </span>
        <span className="meta-item">
          <Github size={13} /> MIT licensed
        </span>
        <span className="meta-item">
          <Zap size={13} /> <code>tailwindcss &gt;= 4</code>
        </span>
        <span className="meta-item">
          <Layers size={13} /> React 19 · PHP 8.4
        </span>
      </>
    );
  },

  "hero-card": () => (
    <FauxClient variant="browser" url="resources/js/Pages/DesignReview.tsx" meta="UTF-8 · TSX">
      <div className="codeblock" dangerouslySetInnerHTML={{ __html: HERO_CODE_HTML }} />
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--border-1)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          background: "var(--bg-1)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--emerald-500)",
            boxShadow: "0 0 0 3px color-mix(in oklch, var(--emerald-500) 22%, transparent)",
          }}
        />
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>agent · fancy-ui.mcp</span>
        <span style={{ color: "var(--fg-2)", flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>
          artboard_add_piece ✓
        </span>
      </div>
    </FauxClient>
  ),
};
