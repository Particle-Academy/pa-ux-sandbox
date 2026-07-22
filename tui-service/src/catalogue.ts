import { McpClient } from "./mcp.js";
import { SHOWCASE_EXAMPLES_BY_SLUG } from "@particle-academy/fancy-tui/showcase";
import previews from "@particle-academy/fancy-tui/showcase/previews.json" with { type: "json" };

/**
 * The catalogue the docs TUI browses — the real MCP `list-components` output,
 * organised the way the /packages page organises it: by product FAMILY within
 * a THEME, not a flat list of every repo.
 *
 * The family/theme fields come from the MCP response itself (sourced server-side
 * from `PackageFamily`), so this file never re-derives grouping — there is one
 * source and both the web listing and this browser read it.
 *
 * Fetched once and cached. The registry only changes on deploy, and re-fetching
 * per keystroke would hammer the MCP for data that cannot have moved.
 */

/** A component as the MCP returns it, after family enrichment. */
export type McpComponent = {
  name: string;
  title: string;
  package: string;
  description: string;
  family: string;
  familyName: string;
  group: string;
  url: string;
};

/** One component in the browser, with the terminal-preview fact resolved. */
export type CatalogueComponent = McpComponent & {
  /**
   * Whether this component has a real terminal preview. True only for the
   * fancy-tui package: those are Ink components that DRAW in a terminal.
   * Everything else is a web / React component with nothing to render in a
   * console — the distinction the navigation makes visible.
   */
  previewable: boolean;
  /**
   * Key into fancy-tui's showcase examples, else null.
   *
   * This service runs Ink, so it renders the LIVE component: the detail pane
   * looks the example up by this slug and puts `example.node` straight into its
   * own tree. That is the entire reason the docs UI is a Node service.
   */
  previewSlug: string | null;
  /**
   * The captured Ink frame — a FALLBACK, for a component the installed
   * fancy-tui has a capture for but no live example (a version skew). Null when
   * there is no capture either.
   */
  previewFrame: string | null;
  /** The source snippet shown alongside a preview, else null. */
  previewSource: string | null;
  /**
   * Whether the live example RESPONDS to input — an Accordion you can toggle, an
   * Input you can type in. When true the detail pane offers `[enter] interact`,
   * which opens a persistent, animated preview session. Static examples (a
   * Badge, a Separator) and capture-only fallbacks are false.
   */
  interactive: boolean;
};

export type Family = {
  slug: string;
  name: string;
  group: string;
  components: CatalogueComponent[];
};

export type Catalogue = {
  /** Themes in listing order, each with its families. */
  themes: Array<{ group: string; families: Family[] }>;
  /** Flat family list, for lookups. */
  families: Family[];
  total: number;
  previewableCount: number;
};

type ListComponentsResult = { count: number; groups: string[]; items: McpComponent[] };

/**
 * Captured Ink frames from fancy-tui's `npm run showcase`, keyed by slug.
 *
 * A DERIVED artifact — fancy-tui renders its example table at build time for
 * consumers that cannot run Ink (the web gallery is a browser page). This
 * service can run Ink, so it only reads these as a fallback.
 */
type Preview = { slug: string; name: string; group: string; source: string; frame: string };
const PREVIEWS = new Map<string, Preview>(
  (previews as { components: Preview[] }).components.map((p) => [p.slug, p]),
);

/**
 * The registry prefixes fancy-tui components with `tui-`; showcase slugs do not.
 *
 * Exported because it is the ONE place that translation lives: the detail pane
 * resolves a live example through the slug this returns.
 */
const TUI_PACKAGE = "fancy-tui";
export function previewSlugFor(component: McpComponent): string | null {
  if (component.package !== TUI_PACKAGE) return null;
  // `tui-badge` → `badge`; the bare `fancy-tui` entry maps to nothing.
  const slug = component.name.startsWith("tui-") ? component.name.slice(4) : component.name;
  // A live example is the preferred source; a capture alone still counts, so a
  // fancy-tui that ships one but not the other never blanks the pane.
  return SHOWCASE_EXAMPLES_BY_SLUG.has(slug) || PREVIEWS.has(slug) ? slug : null;
}

function resolvePreview(component: McpComponent): CatalogueComponent {
  const slug = previewSlugFor(component);
  const preview = slug ? PREVIEWS.get(slug) : undefined;
  const example = slug ? SHOWCASE_EXAMPLES_BY_SLUG.get(slug) : undefined;
  return {
    ...component,
    previewable: slug !== null,
    previewSlug: slug,
    previewFrame: preview?.frame ?? null,
    previewSource: preview?.source ?? null,
    // Interactive only when a LIVE example says so — a capture-only fallback
    // cannot be operated, and a scrollback example cannot be windowed. Read
    // defensively: the `interactive` flag arrives with fancy-tui 0.8.0, and an
    // older installed copy simply reports everything non-interactive.
    interactive: Boolean(
      (example as { interactive?: boolean } | undefined)?.interactive && !example?.scrollback,
    ),
  };
}

/**
 * Fetch the catalogue from the MCP server and shape it into themes → families.
 *
 * The theme order is the MCP's own `groups` array, so the docs browser lists
 * families exactly as /packages does. A family with no components is dropped —
 * it would be an empty row.
 */
export async function fetchCatalogue(mcp: McpClient): Promise<Catalogue> {
  const result = await mcp.callTool<ListComponentsResult>("list-components");
  const components = result.items.map(resolvePreview);

  const byFamily = new Map<string, Family>();
  for (const c of components) {
    let family = byFamily.get(c.family);
    if (!family) {
      family = { slug: c.family, name: c.familyName, group: c.group, components: [] };
      byFamily.set(c.family, family);
    }
    family.components.push(c);
  }

  // A previewable family (fancy-tui) sorts its previewable components first, so
  // the ones the terminal can actually draw lead the list.
  for (const family of byFamily.values()) {
    family.components.sort(
      (a, b) => Number(b.previewable) - Number(a.previewable) || a.name.localeCompare(b.name),
    );
  }

  // A family with a terminal preview is HOISTED out of its main-site theme into
  // a leading "terminal" group. The /packages page groups fancy-tui under
  // tooling; here the whole point is to make the previewable packages obvious
  // and reachable first, so they lead — and the default cursor lands on one.
  // Everything else keeps its main-site theme, so the grouping still mirrors the
  // site below the fold.
  const PREVIEW_GROUP = "terminal";
  for (const family of byFamily.values()) {
    if (family.components.some((c) => c.previewable)) family.group = PREVIEW_GROUP;
  }

  const themeOrder = [PREVIEW_GROUP, ...result.groups];
  const rank = (g: string) => {
    const i = themeOrder.indexOf(g);
    return i === -1 ? themeOrder.length : i;
  };

  const families = [...byFamily.values()].sort(
    (a, b) => rank(a.group) - rank(b.group) || a.name.localeCompare(b.name),
  );

  const themes: Catalogue["themes"] = [];
  for (const family of families) {
    let theme = themes.find((t) => t.group === family.group);
    if (!theme) {
      theme = { group: family.group, families: [] };
      themes.push(theme);
    }
    theme.families.push(family);
  }

  return {
    themes,
    families,
    total: components.length,
    previewableCount: components.filter((c) => c.previewable).length,
  };
}

/**
 * Catalogue cache with a soft TTL.
 *
 * The registry only changes on deploy, so a long TTL is safe; the refresh
 * exists so a redeploy is picked up without restarting the service. A failed
 * refresh keeps serving the last good catalogue rather than breaking the demo.
 */
export class CatalogueCache {
  private cached: Catalogue | null = null;
  private fetchedAt = 0;
  private inflight: Promise<Catalogue> | null = null;

  constructor(
    private readonly mcp: McpClient,
    private readonly ttlMs = 5 * 60_000,
  ) {}

  async get(now: number): Promise<Catalogue> {
    if (this.cached && now - this.fetchedAt < this.ttlMs) return this.cached;
    if (this.inflight) return this.inflight;

    this.inflight = fetchCatalogue(this.mcp)
      .then((catalogue) => {
        this.cached = catalogue;
        this.fetchedAt = now;
        return catalogue;
      })
      .catch((err) => {
        // Serve stale rather than fail — a transient MCP hiccup should not blank
        // a page a visitor is already reading.
        if (this.cached) return this.cached;
        throw err;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }
}
