import type { FeatureTourItem } from "../shared/FeatureTour";

/**
 * The CMS tour. Every line is checkable against the shipped packages; the
 * source for each is named beside it (paths are in the fancy-cms-ui and
 * fancy-cms repos, at 0.13.1 and 0.8.1).
 */
export const CMS_TOUR: FeatureTourItem[] = [
    {
        // fancy-cms-ui README: "What's here", src/document/{types,ops,reduce}.ts
        icon: "layers",
        title: "One Stages document",
        body: "A page is a single JSON document: a flat map of nodes, each with per-breakpoint style props. Every edit is one PageOp through a pure reduce(), the same spine undo, revisions and agent edits go through.",
    },
    {
        // fancy-cms-ui README ("byte-identical output, verified by the parity harness"), parity/run.mjs + parity/html.mjs
        icon: "scale",
        title: "PHP and React, byte for byte",
        body: "The CSS emitter is deterministic, and the PHP renderer in particle-academy/fancy-cms is its twin: same CSS, same HTML. A parity harness in the repo renders canonical documents through both and compares the bytes.",
    },
    {
        // fancy-cms-ui README "Host-resolved responsive images", agent-guide/fonts.md, CHANGELOG 0.13.0
        icon: "image",
        title: "Images and fonts the host resolves",
        body: "An image names an asset handle and your imageResolver supplies the URL, size and variants. Fonts work the same way through a fontResolver to same-origin WOFF2. The renderer never fetches a font itself, and Inter 4.1 ships as an opt-in bundle.",
    },
    {
        // agent-guide/webmaster.md section 5; tests/no-inline-styles.test.tsx; CHANGELOG (base stylesheet replaces inline styles)
        icon: "shield-check",
        title: "No inline styles on published pages",
        body: "The renderer emits no style attributes: page CSS comes from one emitter, keyed by data-cms handles. Under a strict style-src, render with includeStyles={false} and serve that CSS in a nonce'd tag or a same-origin file.",
    },
    {
        // fancy-cms-ui README "Native icons"; fancy-cms README
        icon: "shapes",
        title: "The full Lucide set, opt in per glyph",
        body: "Icon nodes draw from the Lucide 0.511.0 catalogue: 1,803 names and aliases, 1,594 glyphs, with the same SVG from PHP and React. You import only the glyphs a page uses, and searchIcons() pages through names 20 at a time for an agent.",
    },
    {
        // agent-guide/{webmaster,professional-pages,fonts}.md in both packages; CHANGELOG 0.13.1 / 0.8.1
        icon: "book-open",
        title: "Webmaster guides in the package",
        body: "Both packages ship an agent-guide/ folder: a webmaster guide (what the inspectors can edit, resolvers, CSP, accessibility and pre-publish checks), a professional-pages bar and the font contract.",
    },
];

/** The guides, as they sit in each repo. */
export const CMS_GUIDES = [
    {
        title: "Authoring and React rendering",
        file: "agent-guide/webmaster.md",
        repo: "fancy-cms-ui",
        href: "https://github.com/Particle-Academy/fancy-cms-ui/blob/main/agent-guide/webmaster.md",
    },
    {
        title: "Hosting: render route, CSP, CLIs",
        file: "agent-guide/webmaster.md",
        repo: "fancy-cms",
        href: "https://github.com/Particle-Academy/fancy-cms/blob/main/agent-guide/webmaster.md",
    },
    {
        title: "The page bar agents build against",
        file: "agent-guide/professional-pages.md",
        repo: "fancy-cms-ui",
        href: "https://github.com/Particle-Academy/fancy-cms-ui/blob/main/agent-guide/professional-pages.md",
    },
    {
        title: "Host-resolved fonts",
        file: "agent-guide/fonts.md",
        repo: "fancy-cms-ui",
        href: "https://github.com/Particle-Academy/fancy-cms-ui/blob/main/agent-guide/fonts.md",
    },
] as const;
