import { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { useConsent } from "@particle-academy/fancy-compliance-ui";
import { mountPixel, type PixelHandle, type PixelMode, type PixelStyle } from "@particle-academy/fancy-pixel";

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
 * The showcase's own Fancy Pixel, mounted under `analytics` consent.
 *
 * The snippet used to be printed raw into the page, where it ran before anyone
 * had been asked and could not be stopped afterwards. Now the server never
 * prints a Fancy Pixel snippet (showcase-app.blade.php) and this mounts it from
 * the npm package instead:
 *
 *  - **No consent** (first visit, refused, withdrawn, or a new policy): the
 *    badge alone, with no endpoint, which fancy-pixel guarantees sends nothing.
 *  - **`analytics` allowed**: the full pixel, beacon + fancy-heuristics
 *    collector, exactly what the snippet configured.
 *  - **Withdrawn**: the handle's `destroy()` stops the collector and the
 *    observers, so it genuinely stops, rather than asking for a reload.
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
    const pixel = (usePage<{ selfPixel?: SelfPixel }>().props.selfPixel ?? null) as SelfPixel;
    const { allows } = useConsent();
    const full = allows("analytics");
    const key = pixel === null ? "" : JSON.stringify(pixel);

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
                // No endpoint = badge only: no beacon, no collection, no network.
                endpoint: full ? pixel.endpoint : undefined,
                collect: full ? pixel.collect : false,
            }),
        };
        // Deliberately no cleanup: unmounting the layout is a navigation, not a
        // withdrawal. Only a change in consent (or the snippet) rebuilds it; a
        // new props object for the same snippet returns early above.
    }, [full, key, pixel]);

    return null;
}
