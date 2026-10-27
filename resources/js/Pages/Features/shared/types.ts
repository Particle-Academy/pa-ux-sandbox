/**
 * The Feature data shapes, as `App\Support\FeatureSites` and
 * `FeatureSiteController` send them. One server-side source; nothing here is
 * typed by hand on the client.
 */

/** What the nav dropdown needs — the shared `features` Inertia prop. */
export type FeatureNav = {
    slug: string;
    name: string;
    /** One line, true of the shipped packages. */
    tagline: string;
    /** A Lucide icon name, rendered through react-fancy's `<Icon>`. */
    icon: string;
    /** `/features/{slug}`. */
    href: string;
};

/** A Feature's own identity, applied as scoped CSS variables. */
export type FeatureTheme = {
    accent: string;
    accentDark: string;
    surface: string;
    surfaceDark: string;
    /** Display-font role, mapped to the site's own stacks in features.css. */
    font: "sans" | "display" | "mono" | "serif";
};

/** One member package, resolved through PackageRegistry. */
export type FeatureMember = {
    slug: string;
    name: string;
    tagline: string;
    /** "React" | "Node / TypeScript" | "PHP" | "Python", as the family labels it. */
    language: string;
    registry: "npm" | "composer" | "pypi" | null;
    /** The install id: `@particle-academy/fancy-flow`, `particle-academy/fancy-flow-php`, … */
    distribution: string | null;
    /** `npm install …` / `composer require …` / `pip install …`, built from the registry. */
    install: string | null;
    /** `/packages/{slug}`. */
    href: string;
    repoUrl: string | null;
};

/** An agent-integrations bridge the Feature's surface is driven through. */
export type FeatureBridge = {
    name: string;
    import: string;
    tools: string;
};

/**
 * The Feature's course in the curriculum, as a link. Null whenever the course
 * is not published and listed, so a page never links to a 404.
 */
export type FeatureCourse = {
    slug: string;
    title: string;
    /** `/learn/{slug}`. */
    href: string;
};

/** The `feature` prop every `/features/{slug}` page receives. */
export type ResolvedFeature = FeatureNav & {
    component: string;
    course: FeatureCourse | null;
    theme: FeatureTheme;
    bridges: FeatureBridge[];
    members: FeatureMember[];
    /** Distinct member languages, in first-seen order. */
    languages: string[];
};

/**
 * Latest published version per member slug — a DEFERRED prop, so `undefined`
 * until it arrives, and `null` for a member whose registry could not say.
 */
export type FeatureVersions = Record<string, string | null> | undefined;

/** Props every `/features/{slug}` page component receives. */
export type FeaturePageProps = {
    feature: ResolvedFeature;
    versions?: FeatureVersions;
};

/** One card on the `/features` index. */
export type FeatureSiteCard = FeatureNav & {
    theme: FeatureTheme;
    memberCount: number;
    languages: string[];
};
