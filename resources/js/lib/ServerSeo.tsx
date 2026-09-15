import { usePage } from "@inertiajs/react";
import { Seo } from "@particle-academy/fancy-inertia/seo";

/** The head `App\Providers\SeoServiceProvider` resolved for this request. */
export type SharedSeo = {
    title: string;
    description: string;
    canonical: string;
    image: string | null;
    type: string;
    robots: string;
};

/**
 * The page's head, exactly as the server resolved it.
 *
 * The fancy-seo Blade baseline writes the head into the first byte, and `<Seo>`
 * takes it over after hydration and on SPA navigation. Every page used to pass
 * its OWN title and description here, so the two disagreed: a family page sent
 * "Fancy 3D — package family — Fancy UI" and the tab then said "Fancy 3D —
 * Fancy UI"; the home page flipped to "Fancy UI for React, Inertia, and
 * Laravel", and the component pages restored "agent-bridgeable" after the
 * server had stopped saying it. A crawler that renders JavaScript indexes the
 * second version.
 *
 * So there is one source. The server shares what it resolved as the `seo` prop
 * (HandleInertiaRequests), and this replays it verbatim. The provider's
 * `titleTemplate` is `%s` for the same reason: the server's titles are already
 * complete, and templating them again would say "— Fancy UI — Fancy UI".
 */
export function ServerSeo() {
    const { seo } = usePage<{ seo?: SharedSeo }>().props;

    if (!seo) {
        return <Seo />;
    }

    return (
        <Seo
            title={seo.title}
            description={seo.description}
            canonical={seo.canonical}
            image={seo.image ?? undefined}
            type={seo.type === "article" ? "article" : "website"}
            noindex={seo.robots.includes("noindex")}
        />
    );
}
