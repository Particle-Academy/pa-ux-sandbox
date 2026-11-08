import { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { useConsent } from "@particle-academy/fancy-compliance-ui";
import { mountPixel, type PixelHandle, type PixelMode, type PixelStyle } from "@particle-academy/fancy-pixel";
import { pageContextFrom, setPageContext, syncSelfAnalytics } from "../analytics/selfAnalytics";

/** `SelfSite::pixel()`: the admin-pasted Fancy Pixel snippet, as mount options. */
type SelfPixel = {
    siteKey: string;
    endpoint: string;
    style: PixelStyle | null;
    mode: PixelMode | null;
    collect: boolean;
    href: string | null;
} | null;

/**
 * The showcase's own Fancy Pixel and analytics collector, under `analytics`
 * consent.
 *
 * The snippet used to be printed raw into the page, where it ran before anyone
 * had been asked and could not be stopped afterwards. Now the server never
 * prints a Fancy Pixel snippet (showcase-app.blade.php) and this mounts it from
 * the npm packages instead, in two halves:
 *
 *  - **The badge** (fancy-pixel). With no consent it is the badge alone, with
 *    no endpoint, which fancy-pixel guarantees sends nothing. With `analytics`
 *    allowed it also sends its liveness beacon. It never runs the collector
 *    itself (`collect: false`).
 *  - **The collector** (fancy-heuristics-js, `analytics/selfAnalytics.ts`).
 *    Built once with the current `analytics` decision and then told about
 *    every change with `setConsent()`: denied sends nothing, granting starts
 *    it, withdrawing stops it at once. Each view carries the Laravel route
 *    name and pattern (`analyticsRoute`) and the server-resolved title
 *    (`seo.title`) as separate fields.
 *
 * One pixel per tab, not per page. Layout remounts on every Inertia visit, and
 * a pixel torn down and rebuilt each time would beacon on every navigation, so
 * the handle lives at module scope and only a consent change rebuilds it.
 *
 * The server holds the same line (GateSelfAnalytics): a batch carrying this
 * site's key from someone who has not consented is dropped.
 */
let mounted: { handle: PixelHandle; full: boolean; key: string } | null = null;

export function ShowcasePixel() {
    const page = usePage<{ selfPixel?: SelfPixel }>();
    const pixel = (page.props.selfPixel ?? null) as SelfPixel;
    const { allows } = useConsent();
    const full = allows("analytics");
    const key = pixel === null ? "" : JSON.stringify(pixel);

    // The route and title the next view reads. Set during render so it is
    // current before the collector's first view, and again from Inertia's own
    // navigate event, which carries the new page's props.
    setPageContext(pageContextFrom(page.props as Record<string, unknown>));
    useEffect(() => {
        const onNavigate = (event: Event) => {
            const next = (event as CustomEvent<{ page?: { props?: Record<string, unknown> } }>).detail?.page?.props;
            if (next) setPageContext(pageContextFrom(next));
        };
        document.addEventListener("inertia:navigate", onNavigate);
        return () => document.removeEventListener("inertia:navigate", onNavigate);
    }, []);

    useEffect(() => {
        syncSelfAnalytics(
            pixel === null ? null : { siteKey: pixel.siteKey, endpoint: pixel.endpoint, collect: pixel.collect },
            full,
        );
    }, [full, key, pixel]); // idempotent: a new props object for the same snippet changes nothing

    useEffect(() => {
        if (pixel === null) {
            mounted?.handle.destroy();
            mounted = null;
            return;
        }
        if (mounted !== null && mounted.full === full && mounted.key === key) {
            return;
        }
        mounted?.handle.destroy();
        mounted = {
            full,
            key,
            handle: mountPixel({
                siteKey: pixel.siteKey,
                style: pixel.style ?? undefined,
                mode: pixel.mode ?? undefined,
                href: pixel.href ?? undefined,
                // No endpoint = badge only: no beacon, no network.
                endpoint: full ? pixel.endpoint : undefined,
                // The collector is selfAnalytics', which takes the title too.
                collect: false,
            }),
        };
        // Deliberately no cleanup: unmounting the layout is a navigation, not a
        // withdrawal. Only a change in consent (or the snippet) rebuilds it; a
        // new props object for the same snippet returns early above.
    }, [full, key, pixel]);

    return null;
}
