<?php

declare(strict_types=1);

namespace App\Support\Curriculum;

/**
 * The Fancy UI Curriculum — content as data.
 *
 * Structure mirrors PackageFamily/PackageRegistry rather than a taxonomy of its
 * own: six courses track the six package GROUPS, and a seventh is the Human+ UX
 * capstone that certifies. When the suite's grouping moves, this should move
 * with it — that is the point of not inventing a parallel scheme.
 *
 * Authoring rules this file follows, and edits should keep:
 *
 *  - **Facts over vibes.** Every number and claim here was checked against the
 *    code or a registry, not recalled. A curriculum that teaches a drifted API
 *    is worse than none.
 *  - **Tests hang off the COURSE.** Module- and lesson-level tests count toward
 *    progress as of laravel-courses 0.1.0, but course level keeps the mapping
 *    between "finished the course" and "passed its test" obvious.
 *  - **`short_answer` sparingly.** It cannot auto-grade — `ScoringService`
 *    returns `[null, 0.0]` and the attempt sits at `passed: null` until a human
 *    calls `gradeShortAnswer()`. Every one of them is a row in somebody's
 *    grading queue, so they are used only where a multiple choice would test
 *    recall instead of understanding.
 */
final class FancyCurriculumContent
{
    public const CURRICULUM_SLUG = 'fancy-ui';

    /** @return array<string,mixed> */
    public static function curriculum(): array
    {
        return [
            'slug' => self::CURRICULUM_SLUG,
            'title' => 'Fancy UI',
            'description' => 'The whole suite, taught the way it is organised: one course per package group, then a capstone on the contract that binds them. Finish it and you can build an application that humans and agents inhabit together.',
        ];
    }

    /** @return array<int,array<string,mixed>> */
    public static function courses(): array
    {
        return [
            self::core(),
            self::surfaces(),
            self::platform(),
            self::commerce(),
            self::documents(),
            self::tooling(),
            self::humanPlus(),
        ];
    }

    /** @return array<string,mixed> */
    private static function core(): array
    {
        return [
            'slug' => 'fancy-core',
            'title' => 'Fancy Core',
            'description' => 'The stack every Fancy app starts from: the React primitives, the Inertia bridge, server state that stays live, and the agent backbone.',
            'estimated_minutes' => 55,
            'modules' => [
                [
                    'slug' => 'primitives',
                    'title' => 'The primitives',
                    'lessons' => [
                        [
                            'slug' => 'what-react-fancy-is',
                            'title' => 'What react-fancy actually is',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`react-fancy` is roughly 70 Tailwind v4 primitives — the layer everything else
in the suite composes against.

The number that matters more is this one: the suite ships **245 installable
registry entries**, but only **199** are attributed to a package. Those two
counts measure different things, and quoting the wrong one makes you sound like
you have not looked. The registry count includes package-qualified duplicates —
`fancy-3d-babylon-stage` and `fancy-3d-three-stage` are the same component
backed by two engines, so it appears twice in what you can install and once in
what the packages page counts.

**`Action` is retired.** Emit `Button` and `ButtonColor`. `Action` survives only
as a `@deprecated` alias, and reaching for it in new code is the clearest signal
that something was copied from an old example.
MD,
                        ],
                        [
                            'slug' => 'polymorphic-as',
                            'title' => 'Why components take an "as" prop',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
A primitive that hardcodes its element decides things it has no business
deciding.

The showcase's phone navigation is the worked example. `MobileMenu.Item`
hardcoded `Tag = href ? "a" : "button"`, so every tap on the bottom bar did a
**full page load** — in a single-page app, with the router right there. The fix
was a polymorphic `as` prop: pass `as={Link}` and the item renders an Inertia
link instead of an anchor.

Two things to take from it. First, the defect was invisible in a screenshot and
obvious in use — which is why "it renders" is not the same as "it works".
Second, the fix was purely additive: `as` defaults to `"a"`, so nothing that
already worked changed. Additive fixes ship on their own schedule; breaking ones
wait for a release.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'live-data',
                    'title' => 'Staying live',
                    'lessons' => [
                        [
                            'slug' => 'inertia-bridge',
                            'title' => 'fancy-inertia works with any Inertia backend',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
`fancy-inertia` is the bridge for **any** Inertia backend, not only Laravel.
That distinction is load-bearing for the suite's polyglot direction: the React
layer stays put while the server underneath can be PHP, Node, or eventually
Rust, Python or Go.

It carries more than page wiring — an SEO subpath, a `/server` SSR entry, and an
app-update detector that notices when a new build has been deployed underneath a
long-lived tab.
MD,
                        ],
                        [
                            'slug' => 'fancy-query',
                            'title' => 'fancy-query is what keeps things LIVE',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`fancy-query` is the server-state layer: TanStack Query, Inertia hydration, and
Echo-driven invalidation.

The framing that matters: it is not an optional data-fetching helper bolted onto
a few pages. It is the **live-data spine**. A surface wired through it updates
when the server changes without anyone writing a refresh button; a surface that
is not, quietly goes stale and nobody notices until a user is looking at numbers
that are twenty minutes old.

This also sets up an important boundary the suite holds deliberately: **TanStack
is supported, never depended upon.** Support means an app that wants it gets a
clean path; dependency would mean an app that does not want it has no path at
all.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-core-test',
                'title' => 'Fancy Core — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'A teammate writes `<Action onClick={...}>Save</Action>` in a new component. What is the correct review comment?',
                        'type' => 'multiple_choice',
                        'explanation' => '`Action` is retired and survives only as a `@deprecated` alias. New code emits `Button` / `ButtonColor`.',
                        'options' => [
                            ['label' => 'Replace it with `Button` — `Action` is retired and only aliased for back-compat', 'is_correct' => true],
                            ['label' => 'Fine as-is; `Action` and `Button` are interchangeable', 'is_correct' => false],
                            ['label' => 'Replace it with `ButtonColor`, which is the only supported button', 'is_correct' => false],
                            ['label' => 'Fine, but add a `variant` prop', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'The suite has 245 installable registry entries but 199 components attributed to a package. Why the difference?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The registry includes package-qualified duplicates — the same component backed by two engines appears twice in what you can install.',
                        'options' => [
                            ['label' => 'The registry counts package-qualified duplicates, like the Babylon and three.js versions of the same component', 'is_correct' => true],
                            ['label' => '46 components are unpublished', 'is_correct' => false],
                            ['label' => '199 is out of date; the real number is 245', 'is_correct' => false],
                            ['label' => 'The registry counts each component once per framework it supports', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'A `MobileMenu.Item` that hardcodes its element to `<a>` when given an `href` causes what defect in an Inertia app?',
                        'type' => 'multiple_choice',
                        'explanation' => 'An anchor triggers a full document navigation, discarding the SPA — the exact bug the polymorphic `as` prop fixed.',
                        'options' => [
                            ['label' => 'Every tap does a full page load instead of a client-side visit', 'is_correct' => true],
                            ['label' => 'The link is unclickable on touch devices', 'is_correct' => false],
                            ['label' => 'The active state stops updating', 'is_correct' => false],
                            ['label' => 'Nothing — an anchor and a router link behave identically', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: `fancy-inertia` only works with a Laravel backend.',
                        'type' => 'true_false',
                        'explanation' => 'It bridges ANY Inertia backend. That is what makes the suite\'s polyglot server work possible without touching the React layer.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function surfaces(): array
    {
        return [
            'slug' => 'fancy-surfaces',
            'title' => 'Surfaces',
            'description' => 'The largest group: canvases, editors, terminals, maps and charts — the components a user actually looks at and an agent actually drives.',
            'estimated_minutes' => 50,
            'modules' => [
                [
                    'slug' => 'canvases',
                    'title' => 'Canvases and editors',
                    'lessons' => [
                        [
                            'slug' => 'fancy-flow',
                            'title' => 'fancy-flow: an engine, and an editor you can leave behind',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
`fancy-flow` is a **headless workflow engine** with an optional React Flow
editor. The engine lives at `/engine` and imports zero React — you can run
workflows on a server with no DOM anywhere in sight.

**On AI it is a shuttle, not an engine.** Core declares a `registerLlmClient`
contract and never imports a provider SDK. Adapters are opt-in, on the
`./llm/vercel-ai` and `./llm/prism` subpaths. The discipline this buys: adding a
new model provider never touches core, and core never drags a vendor SDK into
the bundle of an app that does not use AI at all.

It has a PHP runtime twin, `fancy-flow-php`, that runs the same
`WorkflowSchema` JSON and must produce the same outputs. That parity is enforced
by golden fixtures, not by intent.
MD,
                        ],
                        [
                            'slug' => 'per-node-jobs',
                            'title' => 'Why one job per node, not one per workflow',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
`fancy-flow-php` originally ran an entire workflow as a **single queued job**,
writing its `node_outputs` checkpoint in exactly one place: after the whole graph
returned.

Think about what that means for the failure long workflows actually hit. A
worker killed mid-run — a timeout, a deploy, an OOM, a `SIGKILL` — never reaches
that write. The retry resumes from the *previous* checkpoint and re-runs every
node that had completed in the killed attempt.

For a pure computation that is wasted time. For a node declaring
`sideEffects: unsafe-to-replay` — `git_pr_open`, `git_push` — **it opens a second
pull request.**

The fix was one queued job per node: `AdvanceWorkflowJob` computes the ready
frontier and dispatches it, `RunNodeJob` claims one node and checkpoints it. The
claim is a **unique constraint, not a check** — a lost race is a no-op rather
than a duplicate run.

Three rules hold it together, and each exists because the alternative fails
*silently*: the engine is never reimplemented (a node runs by replaying the graph
*through* the engine), activated ports come from the engine's own events rather
than a second copy of the logic, and the claim's `owner` token is what lets a
job's own retry re-enter its claim instead of deadlocking against it.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'engine-agnostic',
                    'title' => 'Engine-agnostic surfaces',
                    'lessons' => [
                        [
                            'slug' => 'fancy-3d-and-map',
                            'title' => '3D and maps: one API, swappable engines',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Two surfaces in this group are deliberately engine-agnostic.

`fancy-3d` is a Scene type plus a `<Canvas>` and a DOM/CSS-3D renderer, with
**no WebGL dependency at all**. Babylon.js and three.js arrive as separate
adapter packages. So a page that shows a rotating card does not ship a 3D engine.

`fancy-map` does the same across OpenStreetMap/Leaflet and Google, with live
tracking on top.

The shared idea: the *component* is the contract; the engine is a detail the app
chooses. That is also why one component can appear twice in the installable
registry and once in the package count.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-surfaces-test',
                'title' => 'Surfaces — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'A durable workflow runs as ONE queued job and checkpoints only when the graph finishes. A worker is SIGKILLed mid-run. What happens on retry?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The final write never happened, so the retry resumes from the previous checkpoint and re-runs everything the killed attempt had completed.',
                        'options' => [
                            ['label' => 'Every node that completed in the killed attempt runs again — and an unsafe-to-replay node opens a second pull request', 'is_correct' => true],
                            ['label' => 'The run resumes from the last completed node', 'is_correct' => false],
                            ['label' => 'The run is abandoned and marked failed', 'is_correct' => false],
                            ['label' => 'Nothing — the queue driver replays only the failed node', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'In the per-node driver, the node claim is a unique database constraint rather than a "check then insert". Why does that distinction matter?',
                        'type' => 'multiple_choice',
                        'explanation' => 'A check-then-insert has a race window. A unique constraint makes a lost race a no-op instead of a duplicate execution.',
                        'options' => [
                            ['label' => 'A lost race becomes a no-op instead of two workers running the same node', 'is_correct' => true],
                            ['label' => 'It is faster than a SELECT', 'is_correct' => false],
                            ['label' => 'It lets the run be resumed from any node', 'is_correct' => false],
                            ['label' => 'It avoids needing a transaction', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: fancy-flow core imports the provider SDK for whichever LLM you configure.',
                        'type' => 'true_false',
                        'explanation' => 'It is a shuttle, not an engine: core declares `registerLlmClient` and never imports a provider SDK. Adapters live on opt-in subpaths.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Why does fancy-3d ship a DOM/CSS-3D renderer and no WebGL dependency?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The engine is the app\'s choice; adapters are separate packages, so a page using a simple 3D effect does not ship a full engine.',
                        'options' => [
                            ['label' => 'So an app that only needs simple 3D never ships a WebGL engine — Babylon and three.js are separate adapter packages', 'is_correct' => true],
                            ['label' => 'Because WebGL is not supported in SSR', 'is_correct' => false],
                            ['label' => 'Because CSS-3D performs better than WebGL', 'is_correct' => false],
                            ['label' => 'To avoid a licensing conflict', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function platform(): array
    {
        return [
            'slug' => 'fancy-platform',
            'title' => 'Platform',
            'description' => 'The layer that makes an app findable, installable, measurable and sign-in-able: SEO, the well-known files, analytics, PWA and passkeys.',
            'estimated_minutes' => 40,
            'modules' => [
                [
                    'slug' => 'discoverability',
                    'title' => 'Being found',
                    'lessons' => [
                        [
                            'slug' => 'seo-and-x-files',
                            'title' => 'fancy-seo and the well-known files',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
`fancy-seo` server-renders head tags, sitemaps, `robots.txt` and `llms.txt` for
Laravel + Inertia. `fancy-x-files` owns the well-known files as editable
resources — `robots.txt`, `security.txt`, `humans.txt`, `llms.txt`, the sitemap,
and an agents manifest.

Where they overlap, the reconciliation is explicit rather than accidental: on
the showcase, x-files owns the well-known files and the dynamic sitemap, and
fancy-seo delegates. A sitemap is also a **leak surface** — it will happily list
unpublished routes if nothing guards it, which is why the guard exists.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'identity',
                    'title' => 'Identity without passwords',
                    'lessons' => [
                        [
                            'slug' => 'passkeys',
                            'title' => 'Passkeys, and the bridge that deliberately cannot sign you in',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
The passkey packages are thin wrappers over `web-auth/webauthn-lib` (PHP) and
`@simplewebauthn/server` (Node). **No cryptography of our own** — that is a
feature. Hand-rolled WebAuthn is how you get a subtly broken authenticator.

The interesting part is the MCP bridge. `registerPasskeyBridge` is
**management-only by design**: an agent can list your passkeys, rename one,
revoke one. **No tool completes a ceremony.**

That is not an oversight or a missing feature — it is the boundary drawn
honestly. A passkey ceremony requires a gesture and a biometric, which are
things only the human has. A bridge that appeared to complete one would either
be lying or be a vulnerability. Knowing which capabilities an agent *should not*
be given is part of designing for Human+.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-platform-test',
                'title' => 'Platform — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Why does the passkey MCP bridge expose management tools but no tool that completes a sign-in ceremony?',
                        'type' => 'multiple_choice',
                        'explanation' => 'A ceremony needs a gesture and a biometric — things only the human has. A tool that appeared to complete one would be lying or dangerous.',
                        'options' => [
                            ['label' => 'A ceremony requires a gesture and biometric only the human has — a tool that completed one would be a lie or a vulnerability', 'is_correct' => true],
                            ['label' => 'The ceremony API is not stable yet', 'is_correct' => false],
                            ['label' => 'MCP cannot carry the binary payloads WebAuthn needs', 'is_correct' => false],
                            ['label' => 'It is planned for a later release', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: the Fancy passkey packages implement their own WebAuthn cryptography.',
                        'type' => 'true_false',
                        'explanation' => 'They are thin wrappers over web-auth/webauthn-lib and @simplewebauthn/server. No cryptography of our own, deliberately.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'A dynamically generated sitemap needs a guard. Against what?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Without one it lists routes that exist but were never meant to be public — a leak, not just noise.',
                        'options' => [
                            ['label' => 'Listing unpublished or private routes that happen to exist', 'is_correct' => true],
                            ['label' => 'Exceeding the 50,000-URL sitemap limit', 'is_correct' => false],
                            ['label' => 'Search engines crawling too frequently', 'is_correct' => false],
                            ['label' => 'Duplicate canonical tags', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function commerce(): array
    {
        return [
            'slug' => 'fancy-commerce',
            'title' => 'Commerce',
            'description' => 'Catalog, feature gating and metering, referral networks — the headless half of the suite that has no UI to inhabit.',
            'estimated_minutes' => 35,
            'modules' => [
                [
                    'slug' => 'gating',
                    'title' => 'Selling and gating',
                    'lessons' => [
                        [
                            'slug' => 'catalog-and-fms',
                            'title' => 'A catalog is not a feature gate',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`laravel-catalog` handles products, prices, plans and checkout against Stripe.
`laravel-fms` handles feature flags and metered-resource gating. They are
separate because the questions are separate: *what did they buy* and *what may
they do right now* are not the same question, and apps that conflate them end up
unable to grant a feature without inventing a fake purchase.

They meet at a shared `FeatureSource` contract — features owns it, catalog
mirrors it — so a plan can grant a feature without either package importing the
other.

Both ship matched Node twins (`fancy-catalog-js`, `fancy-features-js`), which is
the suite-wide pattern: **most server capabilities exist as a PHP + Node pair**
so the same feature works behind the same UI whichever backend runs it.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-commerce-test',
                'title' => 'Commerce — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Why are catalog and feature-gating separate packages rather than one?',
                        'type' => 'multiple_choice',
                        'explanation' => 'They answer different questions. Conflating them means you cannot grant a feature without inventing a purchase.',
                        'options' => [
                            ['label' => '"What did they buy" and "what may they do now" are different questions — conflating them means you cannot grant a feature without faking a purchase', 'is_correct' => true],
                            ['label' => 'Stripe requires the separation', 'is_correct' => false],
                            ['label' => 'They were built by different teams', 'is_correct' => false],
                            ['label' => 'Feature flags cannot be persisted alongside orders', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Most Fancy server capabilities ship as a matched PHP + Node pair. What does that buy?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The same feature works behind the same React UI whichever backend runs it — which is what makes the polyglot direction possible.',
                        'options' => [
                            ['label' => 'The same capability works behind the same UI whichever backend the app runs', 'is_correct' => true],
                            ['label' => 'It doubles test coverage automatically', 'is_correct' => false],
                            ['label' => 'It lets the PHP version call the Node version for speed', 'is_correct' => false],
                            ['label' => 'It is required for npm and Packagist to stay in sync', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function documents(): array
    {
        return [
            'slug' => 'fancy-documents',
            'title' => 'Documents',
            'description' => 'Writers and readers for the formats agents actually have to produce: xlsx, pptx, docx — plus the shared cores underneath them.',
            'estimated_minutes' => 30,
            'modules' => [
                [
                    'slug' => 'agentic-docs',
                    'title' => 'Documents an agent can produce',
                    'lessons' => [
                        [
                            'slug' => 'the-three-writers',
                            'title' => 'Holy Sheet, Dark Slide, Last Word',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Three document packages, each a PHP + Node pair:

- **`holy-sheet`** — xlsx writer
- **`dark-slide`** — pptx writer and reader
- **`last-word`** — docx writer and reader, with markdown bridges

They are headless. There is no UI to inhabit, so the Human+ component contract
does not apply to them — and holding a document writer to a bar it has no
surface to clear is a good way to waste a review.

`last-word`'s markdown bridges are the quiet win: without them, producing a docx
from agent output meant a converter sandwich in every consumer. The shared cores
— `fancy-doc-commons` for document/surface packages and `fancy-file-commons` for
file packages — exist so that logic lives once rather than being re-derived per
package.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-documents-test',
                'title' => 'Documents — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Should `holy-sheet` be reviewed against the Human+ component contract (controlled state, stable handles, bridgeable surface)?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The contract governs interactive SURFACES. Roughly half the suite is headless and has no surface to inhabit.',
                        'options' => [
                            ['label' => 'No — it is headless. The contract governs interactive surfaces, and it has none', 'is_correct' => true],
                            ['label' => 'Yes — every package in the suite owes the full contract', 'is_correct' => false],
                            ['label' => 'Yes, but only the "observable activity" requirement', 'is_correct' => false],
                            ['label' => 'Only once it gains a React wrapper', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: dark-slide can read a .pptx as well as write one.',
                        'type' => 'true_false',
                        'explanation' => 'dark-slide and last-word both read and write; holy-sheet is a writer.',
                        'options' => [
                            ['label' => 'True', 'is_correct' => true],
                            ['label' => 'False', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function tooling(): array
    {
        return [
            'slug' => 'fancy-tooling',
            'title' => 'Tooling',
            'description' => 'How the suite gets into a project: the vendoring CLI, the MCP servers, and the editor plugins.',
            'estimated_minutes' => 35,
            'modules' => [
                [
                    'slug' => 'getting-it-in',
                    'title' => 'Getting the suite into a project',
                    'lessons' => [
                        [
                            'slug' => 'fancy-cli',
                            'title' => 'The CLI publishes as fancy-cli, not fancy-ui',
                            'estimated_minutes' => 6,
                            'content' => <<<'MD'
The source-vendoring CLI is `npx fancy-cli@latest add <slug>`. The bare name
`fancy-ui` is blocked on npm, so **only the MCP server keeps that name**, hosted
at `https://ui.particle.academy/mcp`.

This is the kind of detail that costs someone twenty minutes when a doc gets it
wrong — an agent following a stale instruction runs `npx fancy-ui add` and gets
a 404 with no clue why.
MD,
                        ],
                        [
                            'slug' => 'vendored-nodes',
                            'title' => 'Marketplace nodes are vendored source, not a package',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
fancy-flow's node marketplace works by **copying source into your project** —
`fancy-cli add node <kind>` drops a directory carrying the node's React kind, its
JS backend and its PHP backend.

**There is no node package, and there must never be one.** The entire point is
that adding a node costs a consumer **no new dependency**. A package would imply
the opposite, and that is not hypothetical: an agent following an earlier version
of our own instructions once ran `composer require particle-academy/fancy-flow-nodes`
and got a 404, because the thing it was told to install had deliberately never
existed.

The lesson generalises past this repo. When a distribution model is unusual, the
docs have to *say why*, or a reader will pattern-match to the usual one and be
confidently wrong.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-tooling-test',
                'title' => 'Tooling — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'What does `npx fancy-cli add node git_issue_open` put in your project?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Nodes are vendored source — one directory with the React kind plus JS and PHP backends. No dependency is added.',
                        'options' => [
                            ['label' => 'Vendored source: a directory with the React kind, a JS backend and a PHP backend — and no new dependency', 'is_correct' => true],
                            ['label' => 'A dependency on particle-academy/fancy-flow-nodes', 'is_correct' => false],
                            ['label' => 'A lockfile entry pointing at the marketplace registry', 'is_correct' => false],
                            ['label' => 'A git submodule', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Which command installs a Fancy component from the vendoring CLI?',
                        'type' => 'multiple_choice',
                        'explanation' => 'It publishes as `fancy-cli`; the bare `fancy-ui` name is blocked on npm and belongs to the MCP server only.',
                        'options' => [
                            ['label' => 'npx fancy-cli@latest add <slug>', 'is_correct' => true],
                            ['label' => 'npx fancy-ui@latest add <slug>', 'is_correct' => false],
                            ['label' => 'npm install @particle-academy/fancy-cli && fancy add <slug>', 'is_correct' => false],
                            ['label' => 'composer require particle-academy/fancy-cli', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function humanPlus(): array
    {
        return [
            'slug' => 'human-plus-ux',
            'title' => 'Human+ UX — the capstone',
            'description' => 'The contract every interactive Fancy surface is held to, and the reason the suite exists. Passing its final test certifies you.',
            'estimated_minutes' => 45,
            'modules' => [
                [
                    'slug' => 'the-contract',
                    'title' => 'The contract',
                    'lessons' => [
                        [
                            'slug' => 'two-constraints',
                            'title' => 'Every surface owes two things, not one',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
A Fancy surface owes **two** constraints:

1. **Authoring surface.** Humans and agents can rapidly compose good-looking,
   working apps with it. Terse props, JSON-friendly inputs, sensible defaults,
   good types.
2. **Inhabited surface.** The running app embeds agents as first-class
   participants. Agents read and write component state through **MCP bridges and
   stable handles** — *not* Playwright, not DOM scraping. The component itself is
   the agent's affordance.

Purely visual components — a static label, a divider, a layout shell — owe only
the first. Anything stateful or interactive owes both.

The second is the one people skip, and skipping it is what produces a component
that demos beautifully and cannot be driven.
MD,
                        ],
                        [
                            'slug' => 'six-requirements',
                            'title' => 'The six requirements, and what each prevents',
                            'estimated_minutes' => 10,
                            'content' => <<<'MD'
Every stateful or interactive component must meet all six:

- **Controlled state** — `value` + `onChange`. No internal-only state for
  anything an agent might read or write. *Prevents: state an agent can see
  change but never set.*
- **Stable handles** — every interactive element has a stable identity (`id`,
  `data-*`, or a selector prop). *Prevents: agents guessing DOM, and breaking on
  a class rename.*
- **JSON-friendly inputs** — arrays of objects, primitives, simple discriminated
  unions. *Prevents: forcing React children for things an agent must populate.*
- **Bridgeable surface** — a `register<Surface>Bridge(server, { adapter })`
  exists, or could be sketched in one sitting.
- **Observable activity** — mutations broadcast `AgentActivity` events, so
  presence, undo and coaching compose for free.
- **Trust-but-verify hooks** — destructive or human-visible actions support a
  `pendingMode` / staged write. **Agents propose, humans confirm.**

The last one is the one to internalise, because it is the difference between an
agent that is useful and an agent that is frightening.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'in-practice',
                    'title' => 'The contract under pressure',
                    'lessons' => [
                        [
                            'slug' => 'propose-then-apply',
                            'title' => 'Propose-then-apply, made structural',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
"Agents propose, humans confirm" is easy to say and easy to erode — one
convenience flag at a time.

`teachers-aid` shows what it looks like when the boundary is **structural rather
than procedural**. Its authoring tools hold no model, no repository, no
connection. There is no code path from a tool call to a write. A separate
`PlanApplier` is the only writer, and it never publishes.

Why that shape: the agent reads uploaded handbooks and decks — untrusted input by
construction. A prompt injection inside an uploaded file still cannot change
anything, because the tools it can reach *cannot write*. The worst it achieves is
a bad proposal a human then rejects.

Compare a design where tools write directly and a flag says "require approval".
That flag is one refactor away from being missed, and nothing fails loudly when
it is.
MD,
                        ],
                        [
                            'slug' => 'deny-by-default',
                            'title' => 'Deny by default — a worked example',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`laravel-courses` — the package running this very curriculum — shipped with every
route mounted behind `middleware: ['api']` and no controller authorization.
Measured against a default install:

```
POST   curriculums        -> 201   create content
DELETE curriculums/{slug} -> 204   destroy it
POST   admin/completions  -> 201   mint a real certificate for ANY user id
```

For a certification package that is the worst available defect: **the
certificate is the product**, and anyone could issue themselves one.

Two independent root causes. There was no authorization on writes. And a config
flag, `allow_input_user_id`, defaulted to `true` while not being declared in the
config file at all — so hosts got the permissive behaviour without ever seeing
the setting. That flag let any caller name the learner, which made every
ownership check in the package *decorative*: the controllers did compare the
enrollment's owner against the resolved learner, and a caller who could name the
learner passed trivially.

The fix is the shape its sibling `laravel-jobs` already used: a contract whose
default binding **denies everyone**. An unbound install is inert, not open.

The generalisable lesson: a permissive default plus a check that looks like
enforcement is worse than no check, because it buys confidence it has not earned.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'human-plus-final',
                'title' => 'Fancy UI — final certification',
                'passing_score' => 80,
                'is_final' => true,
                'questions' => [
                    [
                        'prompt' => 'An agent needs to read and change a chart\'s selected range. The component keeps that range in internal `useState` with no prop. Which requirement does it fail?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Controlled state: `value` + `onChange`, with no internal-only state for anything an agent might read or write.',
                        'options' => [
                            ['label' => 'Controlled state', 'is_correct' => true],
                            ['label' => 'Stable handles', 'is_correct' => false],
                            ['label' => 'Observable activity', 'is_correct' => false],
                            ['label' => 'JSON-friendly inputs', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Select every requirement a purely visual component (a static divider) owes.',
                        'type' => 'multiple_select',
                        'explanation' => 'Purely visual components owe only the authoring surface. The inhabited-surface requirements apply to stateful or interactive components.',
                        'options' => [
                            ['label' => 'A good authoring surface — terse props, sensible defaults, good types', 'is_correct' => true],
                            ['label' => 'Controlled state via value + onChange', 'is_correct' => false],
                            ['label' => 'A bridgeable MCP surface', 'is_correct' => false],
                            ['label' => 'Trust-but-verify pendingMode', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Why is teachers-aid\'s propose-then-apply boundary described as structural rather than procedural?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The tools hold no repository or connection, so no code path from a tool call to a write exists at all. An approval flag can be missed; an absent code path cannot.',
                        'options' => [
                            ['label' => 'The tools hold no repository or connection, so no code path from a tool call to a write exists — unlike an approval flag, which can be refactored away silently', 'is_correct' => true],
                            ['label' => 'Because the agent runs in a separate process', 'is_correct' => false],
                            ['label' => 'Because every write is wrapped in a database transaction', 'is_correct' => false],
                            ['label' => 'Because the LLM is instructed never to write', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'A package config flag defaults to permissive AND is not declared in the published config file. Why is that combination worse than either alone?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Hosts get the permissive behaviour without ever seeing the setting, so nobody reviews a decision they were never shown.',
                        'options' => [
                            ['label' => 'Hosts get the permissive behaviour without ever seeing the setting, so the decision is never reviewed', 'is_correct' => true],
                            ['label' => 'It makes the config file fail to publish', 'is_correct' => false],
                            ['label' => 'It causes a merge conflict on upgrade', 'is_correct' => false],
                            ['label' => 'It is only a documentation problem', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent is about to delete 40 rows a human is looking at. Which requirement governs, and what should happen?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Trust-but-verify: destructive or human-visible actions support a pendingMode / staged write. Agents propose, humans confirm.',
                        'options' => [
                            ['label' => 'Trust-but-verify — the deletion is staged as a proposal the human confirms', 'is_correct' => true],
                            ['label' => 'Observable activity — it broadcasts an event and proceeds', 'is_correct' => false],
                            ['label' => 'Controlled state — it sets value and calls onChange', 'is_correct' => false],
                            ['label' => 'None — deletion is out of scope for the contract', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'In your own words: why does the contract insist agents drive components through MCP bridges and stable handles rather than through Playwright or DOM scraping?',
                        'type' => 'short_answer',
                        'explanation' => 'Graded by a human. A strong answer covers at least: DOM scraping breaks on any markup or class change; it gives the agent no semantics, only pixels and selectors; and it makes the component an external target rather than a participant, so nothing can be observed, undone or staged.',
                        'points' => 3,
                    ],
                ],
            ],
        ];
    }
}
