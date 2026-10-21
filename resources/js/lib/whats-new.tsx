import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { router } from "@inertiajs/react";
import { WhatsNew, type WhatsNewGroup } from "@particle-academy/fancy-inertia/whats-new";

/**
 * The showcase's "What's new" notice: fancy-whats-new, dogfooded for new
 * package releases and major feature updates.
 *
 * Mounted ONCE, in the provider tree (showcase-app.tsx), so it survives
 * navigation and shows on the first load after a deploy or a sign-in. Fed by
 * `GET /whats-new?since=` (WhatsNewController). A signed-in person's "seen"
 * cursor lives on their account (`/me/seen-notices`, through fancy-inertia's
 * `seenUrl`); a guest's in localStorage. `firstVisit` and `missed` stay at the
 * package defaults ("latest", "all").
 *
 * The provider sits ABOVE Inertia's <App>, where usePage() throws, so who is
 * signed in comes from the page JSON on first load and from every navigation
 * after it. The header's "What's new" button calls `show()`.
 */

const SEEN_URL = "/me/seen-notices";

interface ShowcaseWhatsNewApi {
    /** Show the current cards again (the header button). */
    show: () => void;
}

const WhatsNewContext = createContext<ShowcaseWhatsNewApi>({ show: () => {} });

/** The header button's handle on the site-wide notice. */
export function useShowcaseWhatsNew(): ShowcaseWhatsNewApi {
    return useContext(WhatsNewContext);
}

/** fancy-whats-new's `load(since)`: the groups newer than `since`, newest first. */
export async function loadWhatsNew(since: string | null): Promise<WhatsNewGroup[]> {
    const url = since ? `/whats-new?since=${encodeURIComponent(since)}` : "/whats-new";
    const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" });

    // A failed answer throws, and the notice shows nothing: never guess at news.
    if (!res.ok) throw new Error(`GET ${url} answered ${res.status}`);

    return (await res.json()) as WhatsNewGroup[];
}

/** Who is signed in on an Inertia page, or null for a guest. */
export function accountFromPage(page: unknown): string | null {
    const user = (page as { props?: { auth?: { user?: { name?: string; github_username?: string | null } | null } } } | null)
        ?.props?.auth?.user;

    if (!user) return null;

    return user.github_username || user.name || "signed-in";
}

/** The page Inertia booted with, from the JSON it embeds in the document. */
function initialPage(): unknown {
    const json = document.querySelector('script[data-page="app"][type="application/json"]')?.textContent;
    if (!json) return null;

    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function ShowcaseWhatsNew({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    // `undefined` until mounted: the notice renders nothing on the server, and
    // waits to know who is signed in before it reads any store.
    const [account, setAccount] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        setAccount(accountFromPage(initialPage()));

        return router.on("navigate", (event) => {
            setAccount(accountFromPage((event as CustomEvent<{ page: unknown }>).detail?.page));
        });
    }, []);

    const api = useMemo<ShowcaseWhatsNewApi>(() => ({ show: () => setOpen(true) }), []);

    return (
        <WhatsNewContext.Provider value={api}>
            {children}
            {account !== undefined && (
                <WhatsNew
                    load={loadWhatsNew}
                    seenUrl={account ? SEEN_URL : null}
                    open={open}
                    onOpenChange={setOpen}
                    // Lifted above the mobile bottom nav (landing.css).
                    className="showcase-whats-new"
                />
            )}
        </WhatsNewContext.Provider>
    );
}
