import { createCollector, type Collector, type CollectorOptions, type RouteInfo } from "@particle-academy/fancy-heuristics-js";

/**
 * The showcase's own interaction analytics: one fancy-heuristics-js collector
 * per tab, run under the fancy-compliance `analytics` category.
 *
 * fancy-heuristics-js 0.4 denies consent by default and takes the decision as
 * an input. So the collector is built ONCE with the visitor's current
 * `analytics` decision and then told about every change through
 * `setConsent()`: denied means no listener and no request; granting starts it;
 * withdrawing stops it at once and drops anything not yet sent. A refusal never
 * builds a second collector, and a re-grant reuses the first.
 *
 * The collector lives here rather than inside the pixel because the pixel's
 * options stop at `route`: the v2 collector also takes the page `title` as its
 * own field, and the showcase passes the head the SERVER resolved
 * (`seo.title`), which is the title the person actually sees.
 *
 * Agent activity is not collected here (`track.agent: false`):
 * AgentAnalyticsSink already sends it from the agent-integrations bus, and two
 * producers would count every agent action twice.
 */

/** `SelfSite::pixel()`, narrowed to what the collector needs. */
export type SelfCollect = { siteKey: string; endpoint: string; collect: boolean } | null;

export type PageContext = { route: RouteInfo | undefined; title: string | undefined };

type Factory = (opts: CollectorOptions) => Collector;

let context: PageContext = { route: undefined, title: undefined };
let active: { key: string; collector: Collector; granted: boolean } | null = null;

/** The route and title each view will carry. Read lazily, on every view. */
export function setPageContext(next: PageContext): void {
    context = next;
}

/**
 * The page context from an Inertia page's props: the shared `analyticsRoute`
 * (`HandleInertiaRequests`) and the server-resolved `seo.title`.
 */
export function pageContextFrom(props: Record<string, unknown> | null | undefined): PageContext {
    const raw = (props?.analyticsRoute ?? null) as { name?: unknown; pattern?: unknown } | null;
    const seo = (props?.seo ?? null) as { title?: unknown } | null;

    let route: RouteInfo | undefined;
    if (raw && typeof raw === "object") {
        route = {};
        if (typeof raw.name === "string" && raw.name !== "") route.name = raw.name;
        if (typeof raw.pattern === "string" && raw.pattern !== "") route.pattern = raw.pattern;
        if (route.name === undefined && route.pattern === undefined) route = undefined;
    }

    return { route, title: typeof seo?.title === "string" && seo.title !== "" ? seo.title : undefined };
}

/**
 * Bring the collector in line with the configured site and the consent
 * decision. Safe to call on every render.
 */
export function syncSelfAnalytics(self: SelfCollect, granted: boolean, factory: Factory = createCollector): void {
    if (self === null || !self.collect) {
        resetSelfAnalytics();
        return;
    }

    const key = `${self.siteKey}\n${self.endpoint}`;
    if (active !== null && active.key !== key) {
        resetSelfAnalytics();
    }

    if (active === null) {
        const collector = factory({
            siteKey: self.siteKey,
            endpoint: self.endpoint,
            consent: granted,
            route: () => context.route,
            title: () => context.title,
            track: { agent: false },
        });
        collector.start();
        active = { key, collector, granted };
        return;
    }

    if (active.granted !== granted) {
        active.granted = granted;
        active.collector.setConsent(granted);
    }
}

/** The running collector, if any (tests, and a manual `view()`). */
export function activeSelfCollector(): Collector | null {
    return active?.collector ?? null;
}

/** Stop and forget the collector: the site was removed or collection turned off. */
export function resetSelfAnalytics(): void {
    active?.collector.stop();
    active = null;
}
