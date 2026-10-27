<?php

declare(strict_types=1);

namespace App\Support\Curriculum;

/**
 * The Fancy UI Curriculum — content as data.
 *
 * Structure follows the Features (App\Support\FeatureSites), rebuilt
 * 2026-10-27 on the owner's ask that the curriculum be "about the fancy
 * features": Fancy Core first as the foundation, then one course per Feature in
 * nav order, then the Human+ capstone that certifies. Each Feature names its
 * course in FeatureSites (`course`), and its page links here.
 *
 * Authoring rules this file follows, and edits should keep:
 *
 *  - **Facts over vibes.** Every claim was checked against a package README or
 *    source in the envelope, and the source per lesson is recorded with the
 *    rebuild (sandbox/curriculum-logs/truth-sources.md at the time). Run the
 *    curriculum-fact-check skill after any release that renames an API.
 *    No counts that drift: say what a thing is, not how many there are.
 *  - **Tests hang off the COURSE.** Module- and lesson-level tests count toward
 *    progress as of laravel-courses 0.1.0, but course level keeps the mapping
 *    between "finished the course" and "passed its test" obvious.
 *  - **`short_answer` sparingly.** It cannot auto-grade — `ScoringService`
 *    returns `[null, 0.0]` and the attempt sits at `passed: null` until a human
 *    calls `gradeShortAnswer()`. Every one of them is a row in somebody's
 *    grading queue.
 *
 * Rules for CHANGING the structure, because production already holds learner
 * progress against these rows (`fancy:build-curriculum` enforces each):
 *
 *  - **A lesson that moves keeps its row.** Give it `formerly => [old course
 *    slug, old lesson slug]`; the build re-parents the row, so every completion
 *    on it moves too. Authoring it fresh would strand those completions.
 *  - **A course is never deleted, only archived.** List it in archived(); the
 *    build unpublishes it and takes it out of the curriculum. A delete cascades
 *    into lesson completions and test attempts.
 *  - **A renamed course or test keeps its row** through `formerly`.
 *  - **An answered test never gets shorter.** Questions are keyed by position;
 *    the build refuses to delete one that learners have answered.
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
            'description' => 'Start with Fancy Core, then take the course for each Feature you build with: Flow, TUI, CMS, Documents, Git, 3D, Ecommerce and Gamification. The Human+ capstone certifies.',
        ];
    }

    /**
     * Every course a learner can take, in the order /learn lists them.
     *
     * @return array<int,array<string,mixed>>
     */
    public static function courses(): array
    {
        return [
            self::core(),
            self::flow(),
            self::tui(),
            self::cms(),
            self::documents(),
            self::git(),
            self::threeD(),
            self::ecommerce(),
            self::gamification(),
            self::humanPlus(),
        ];
    }

    /**
     * Courses retired by the 2026-10-27 rebuild. None is a Feature. Each is
     * unpublished and taken out of the curriculum, never deleted, so the
     * learner rows on it survive. Surfaces' and Tooling's lessons moved into
     * Flow, 3D and Core; Platform (SEO, x-files, passkeys) stays only here.
     *
     * @return list<string>
     */
    public static function archived(): array
    {
        return ['fancy-surfaces', 'fancy-platform', 'fancy-tooling'];
    }

    /**
     * Where an old course URL goes: a renamed course to its new slug, an
     * archived one to /learn. Null for anything else.
     */
    public static function redirectFor(string $slug): ?string
    {
        foreach (self::courses() as $course) {
            if (($course['formerly'] ?? null) === $slug) {
                return '/learn/'.$course['slug'];
            }
        }

        return in_array($slug, self::archived(), true) ? '/learn' : null;
    }

    /**
     * Every course slug a `formerly` reference names, so the build can resolve
     * old slugs to rows BEFORE anything is renamed.
     *
     * @return list<string>
     */
    public static function referencedCourseSlugs(): array
    {
        $slugs = [];
        foreach (self::courses() as $course) {
            if (isset($course['formerly'])) {
                $slugs[] = $course['formerly'];
            }
            foreach ($course['modules'] ?? [] as $module) {
                foreach ($module['lessons'] ?? [] as $lesson) {
                    if (isset($lesson['formerly'])) {
                        $slugs[] = $lesson['formerly'][0];
                    }
                }
            }
        }

        return array_values(array_unique($slugs));
    }

    /** @return array<string,mixed> */
    private static function core(): array
    {
        return [
            'slug' => 'fancy-core',
            'title' => 'Fancy Core',
            'description' => 'Start here. The stack every Fancy app starts from: the react-fancy primitives, how they get into your project, the Inertia bridge, and server state that stays live.',
            'estimated_minutes' => 37,
            'modules' => [
                [
                    'slug' => 'primitives',
                    'title' => 'The primitives',
                    'lessons' => [
                        [
                            'slug' => 'what-react-fancy-is',
                            'title' => 'What react-fancy actually is',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
`react-fancy` is the React component library the rest of the kit composes
against: buttons, inputs, tables, modals, menus and the layout shells that hold
them, styled with Tailwind v4.

**It stays raw React.** It imports no Inertia, no router and no data layer; its
peers are React 19 and Tailwind 4. That is why the same components work in a
Laravel + Inertia app, a Node app or a plain Vite SPA. The server story lives in
`fancy-inertia` and `fancy-query`, not here, and a router plugs in through the
`as` prop (two lessons on).

**`Action` is retired.** Emit `Button` and `ButtonColor`. `Action`, `ActionProps`
and `ActionColor` survive as `@deprecated` aliases so existing code keeps
working, and are due to go in a future major. New code should not reach for them.

Do not learn the component list by heart, and do not trust a count you read
somewhere: it grows most weeks. Ask the registry instead: the hosted `fancy-ui`
MCP server lists and searches every installable component, and each package has
its own page on this site.
MD,
                        ],
                        [
                            'slug' => 'fancy-cli',
                            'formerly' => ['fancy-tooling', 'fancy-cli'],
                            'title' => 'Install the package, or vendor the source',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
There are two ways to get a component into a project, and they are not the same
choice.

- `npm install @particle-academy/react-fancy` installs the package. Upgrades
  arrive with a version bump.
- `npx fancy-cli@latest add <slug>` copies that component's **source** into your
  project. You own it, you can edit it, and upgrades no longer reach it.

Vendor when you intend to diverge from the component; install when you want it
to keep improving underneath you.

A vendored copy is not cut off from news. `npx fancy-cli@latest diff <name>`
compares your copy with the latest registry version and prints a unified diff.
It never applies anything: you may have customised the copy, so merging is your
call.

**Mind the names.** The CLI publishes on npm as `fancy-cli`. `fancy-ui` is the
name of the hosted MCP server at `https://ui.particle.academy/mcp`, the registry
an agent asks for components. It is not a command, so an instruction that says
`npx fancy-ui add` is stale.
MD,
                        ],
                        [
                            'slug' => 'polymorphic-as',
                            'title' => 'Why components take an "as" prop',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
A primitive that hardcodes its element decides things it has no business
deciding.

The showcase's phone navigation is the worked example. `MobileMenu.Item` used to
hardcode `Tag = href ? "a" : "button"`, so every tap on the bottom bar did a
**full page load**, in a single-page app, with the router right there.
react-fancy 4.18.0 added a polymorphic `as` prop: pass `as={Link}` and the item
renders an Inertia link instead of an anchor.

The rule it follows now: an item with an `href` or an `as` is a link, rendered
as `as` when given and as `<a>` otherwise. An item with neither is still a
`<button>`. Nothing that already worked changed, which is what made the fix safe
to ship in a minor release.

Two things to take from it. The defect was invisible in a screenshot and obvious
in use: "it renders" is not "it works". And `as` is how react-fancy meets your
router without importing one.
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
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`fancy-inertia` is the bridge between the Fancy packages and an Inertia app, and
it is **not Laravel-only**. It has zero Laravel or PHP runtime dependencies:
Inertia is a router that mounts React components, so the package works with any
Inertia server adapter (its README names Laravel, Rails and Adonis). The
Laravel-flavoured pieces are optional integrations, not requirements.

What it carries are the app-shell layers that live above the Inertia outlet
rather than inside a page, plus a few entry points you import only when you need
them:

- `@particle-academy/fancy-inertia/seo`: the `<Seo>` component and JSON-LD
  builders, for per-page title, description, canonical and share cards.
- `@particle-academy/fancy-inertia/server`: the SSR entry.
- `@particle-academy/fancy-inertia/pwa`: the adapter between Inertia and a PWA.
- `useAppUpdate`, from the package root: it notices when a new build has been
  deployed underneath a long-lived tab.
MD,
                        ],
                        [
                            'slug' => 'fancy-query',
                            'title' => 'fancy-query is what keeps things LIVE',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`fancy-query` is the server-state layer for React + Inertia + Reverb apps: a thin
wrapper over TanStack Query that adds the integrations you would otherwise
hand-roll per component, starting with seeding the cache from Inertia page props
so the first render needs no fetch, and invalidating it from Echo events.

Treat it as the **live-data spine**, not an optional fetching helper. A surface
wired through it updates when the server changes, without anyone writing a
refresh button. A surface that is not quietly goes stale, and nobody notices
until a user is looking at old numbers.

**TanStack is a peer, never bundled.** `@tanstack/react-query` is a required peer
dependency: your app installs it and owns its version, and fancy-query uses that
copy. `@inertiajs/react` is an optional peer.
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
                        'prompt' => 'You expect to restyle a component heavily and diverge from upstream. Install the package, or vendor the source with `fancy-cli add`?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Vendoring copies the source into your project: you own it and can edit it freely, but upgrades no longer reach it. That trade is right when you intend to diverge, and wrong when you want the component to keep improving underneath you.',
                        'options' => [
                            ['label' => 'Vendor it — you own the source and can edit it, accepting that upgrades no longer reach it', 'is_correct' => true],
                            ['label' => 'Install the package and override everything with `!important` utilities', 'is_correct' => false],
                            ['label' => 'Vendor it — vendored components still receive upstream upgrades', 'is_correct' => false],
                            ['label' => 'Install the package; vendoring is only for components not published to npm', 'is_correct' => false],
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
                        'explanation' => 'It has zero Laravel or PHP runtime dependencies and works with any Inertia server adapter; the Laravel pieces are optional integrations.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'You add `fancy-query` to an app. What happens with `@tanstack/react-query`?',
                        'type' => 'multiple_choice',
                        'explanation' => 'It is a required peer dependency: your app installs it and owns its version, and fancy-query never bundles it.',
                        'options' => [
                            ['label' => 'Your app installs it: it is a required peer, and fancy-query does not bundle it', 'is_correct' => true],
                            ['label' => 'Nothing; fancy-query bundles its own copy', 'is_correct' => false],
                            ['label' => 'It is optional; without it fancy-query reads Inertia props only', 'is_correct' => false],
                            ['label' => 'fancy-query replaces it with its own cache', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'You vendored a component months ago and want to know what changed upstream. What do you run?',
                        'type' => 'multiple_choice',
                        'explanation' => '`fancy-cli diff` compares your copy with the latest registry version and prints a unified diff. It never applies changes; merging is your call.',
                        'options' => [
                            ['label' => '`npx fancy-cli@latest diff <name>`, which prints the differences and applies nothing', 'is_correct' => true],
                            ['label' => '`npm update`, which merges upstream changes into the vendored copy', 'is_correct' => false],
                            ['label' => '`npx fancy-cli@latest add <name>` again, which merges your edits with upstream', 'is_correct' => false],
                            ['label' => 'Nothing can tell you; a vendored copy has no link to the registry', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function flow(): array
    {
        return [
            'slug' => 'fancy-flow',
            'feature' => 'flow',
            'title' => 'Flow',
            'description' => 'Workflow graphs a person and an agent build together, run by one engine in TypeScript, PHP and Python: the engine, the twins, durable queued runs, marketplace nodes and the agent bridges.',
            'estimated_minutes' => 42,
            'modules' => [
                [
                    'slug' => 'engine',
                    'title' => 'One graph, three runtimes',
                    'lessons' => [
                        [
                            'slug' => 'fancy-flow',
                            'formerly' => ['fancy-surfaces', 'fancy-flow'],
                            'title' => 'fancy-flow: an engine, and an editor you can leave behind',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
`fancy-flow` is a **headless workflow engine** with an optional React Flow
editor, in three layers you import separately:

- `@particle-academy/fancy-flow/engine`: `runFlow` and the graph types. **Zero
  React**, so it runs a graph on a server, in a worker or from a CLI.
- `@particle-academy/fancy-flow/runtime`: the runner hooks (`useFlowRun`,
  `useFlowState`) for a UI that shows a run.
- `@particle-academy/fancy-flow`: the editor, with `<FlowEditor>`, canvas,
  palette and config panel.

**A kind ships schema and UI; the host wires the I/O.** The TypeScript core has
default executors only for the four pure-logic kinds: `branch`, `transform`,
`merge` and `for_each`. An `api_request`, `llm_call` or `memory_store` node does
nothing until your app binds an executor for it. (The HTTP kind is
`api_request`; there is no `http`.)

**On AI it is a shuttle, not an engine.** Core declares a `registerLlmClient`
contract and imports no provider SDK, so a flow with no AI node pays nothing. The
contract is narrow: it lets `llm_router` (alias `llm_branch`) pick one of a
node's declared ports. Two opt-in adapters do that: `./llm/prism` posts to an
endpoint you own, and `./llm/vercel-ai` uses the `ai` package as an optional
peer. Both refuse a port that was never declared rather than routing to it.

Do not hand-copy the kind list into generated graphs; it moves. Enumerate it
from the registry at runtime.
MD,
                        ],
                        [
                            'slug' => 'same-graph-three-runtimes',
                            'title' => 'The same document in TypeScript, PHP and Python',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
A fancy-flow graph is a JSON document, a `WorkflowSchema`, and three published
runtimes execute it:

- **TypeScript:** `@particle-academy/fancy-flow`.
- **PHP:** `particle-academy/fancy-flow-php`, framework-free at its core (PHP
  8.4+), with a Laravel integration for durable, queued runs.
- **Python:** `pip install fancy-flow` (the repo is `fancy-flow-py`), with zero
  runtime dependencies.

The promise is the same JSON in and the same outputs out, and it is held by
shared golden fixtures: each one a schema, its inputs and the expected result.
A divergence between runtimes shows up as a failing fixture, not as a bug report.

Three differences to plan around:

- **The kind sets are not identical.** PHP has no `rich_user_input`, `lane` or
  terminal kinds (terminal lanes are TypeScript-only, by decision) and adds an
  `agent` kind. Parity covers the kinds they share.
- **PHP ships default executors.** With no dependencies supplied, they are
  deterministic fakes, so a graph runs out of the box. The same graph on Node
  needs its I/O executors wired.
- **Every runtime refuses a document without `version: 1`**, even in lenient
  mode. In Python, check `result.refused` before you trust a run: an empty graph
  runs and reports success.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'durable',
                    'title' => 'Durable runs and nodes',
                    'lessons' => [
                        [
                            'slug' => 'per-node-jobs',
                            'formerly' => ['fancy-surfaces', 'per-node-jobs'],
                            'title' => 'Why one job per node, not one per workflow',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
Durable runs live in `fancy-flow-php`'s Laravel integration, which has two queue
drivers. The difference between them is where the checkpoint is written.

- `single` runs the whole graph as **one job** and writes its checkpoint once,
  when the graph returns.
- `per_node`, **the default since 0.11**, runs one job per node and checkpoints
  as each node finishes.

Think about the failure long runs actually hit: a worker killed mid-run by a
timeout, a deploy or an OOM. Under `single` that final write never happens, so
the retry re-runs every node the killed attempt had completed, including nodes
that must not run twice. Under `per_node` it loses at most the node that was in
flight. `single` is still supported (`FANCY_FLOW_QUEUE_DRIVER=single`), so know
which driver you are on.

`per_node` uses two jobs. `AdvanceWorkflowJob` computes the ready frontier and
dispatches what the run's limit allows: **one node at a time by default**, and
`max_concurrent` widens it. `RunNodeJob` claims one node, runs it and
checkpoints it. The claim is an insert against a **unique constraint**, not a
check, so a lost race is a no-op rather than a second execution. The claim's
`owner` token is what lets a job's own retry re-enter it.

A kind that writes should declare `sideEffects: 'unsafe-to-replay'`: it then
gets exactly one attempt, whatever `tries` says. The marketplace's `git_pr_open`
and `git_push` nodes declare it, and so do the PHP builtins `webhook_out` and
`notify`.
MD,
                        ],
                        [
                            'slug' => 'vendored-nodes',
                            'formerly' => ['fancy-tooling', 'vendored-nodes'],
                            'title' => 'Marketplace nodes are vendored source, not a package',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Beyond the builtins, fancy-flow has a node **marketplace**, and it works by
copying source into your project:

```
npx fancy-cli@latest add node <kind>
```

A first-party node is a directory holding its editor kind (`ui/`), a TypeScript
backend (`js/`), a PHP backend (`php/`), fixtures and a `fancy-flow.node.json`
manifest. `add node` copies the editor kind plus **the backend for each runtime
your project executes on**: it looks for `@particle-academy/fancy-flow` in
package.json and `particle-academy/fancy-flow-php` in composer.json. A node that
does not implement your runtime is refused. `--force` gets past the refusal and
leaves you a node that appears in the palette and fails at run time.

**There is no node package, and there must never be one.** The point is that
adding a node costs you no new dependency. `composer require
particle-academy/fancy-flow-nodes` is a natural thing to reach for and returns a
404, because that package never existed.

Look for a node before you hand-roll a step: the `fancy-ui` MCP server searches
the marketplace by concept. No first-party node ships a Python backend.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'agents',
                    'title' => 'Agents and flows',
                    'lessons' => [
                        [
                            'slug' => 'agents-on-the-canvas',
                            'title' => 'Two MCP surfaces: the canvas and the headless builder',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Two different MCP surfaces let an agent work with flows, and they are easy to mix
up.

**On the canvas: `registerFlowBridge`**, from
`@particle-academy/agent-integrations/bridges/flow`, drives a live
`<FlowEditor>` a person is looking at. Its tools are all `flow_*`: read the graph
(`flow_get_state`, `flow_list_nodes`, `flow_get_node_schema`), edit it
(`flow_add_node`, `flow_update_node`, `flow_connect`, `flow_delete_node`) and run
it (`flow_run`, `flow_cancel`). `flow_connect` enforces port types with the same
validator the canvas uses, and node config is checked against the kind's
`configSchema`.

Two defaults to know. **`pendingMode` is off**: flow authoring is high-frequency,
so an agent can delete a node or start a run without asking. Turn it on and
supply `adapter.confirm`, and `flow_delete_node` and `flow_run` wait for a
person. And `flow_run` only works if your host wired a `run` handler into the
adapter.

**Headless: `fancy-flow-mcp`** is a Laravel MCP server (with a Node twin,
`fancy-flow-mcp-js`) that lets an agent build workflows with no UI at all. Its
tools are deterministic wrappers over fancy-flow-php, with no LLM calls and no
network, and their names carry **no** prefix: `add_node`, `connect_nodes`,
`validate_workflow`, `run_workflow`.

Inside a durable run, people take part through nodes: `human_approval` pauses the
run (`awaiting_approval`) until your app calls `approve()` or `deny()`.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-flow-test',
                'title' => 'Flow — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Under fancy-flow-php\'s `single` driver, a worker is killed mid-run. What does the retry do?',
                        'type' => 'multiple_choice',
                        'explanation' => '`single` writes its checkpoint once, when the graph returns. A killed worker never writes it, so the retry re-runs everything the killed attempt had completed. `per_node` loses at most the node in flight.',
                        'options' => [
                            ['label' => 'Re-runs every node the killed attempt had completed, including any that must not run twice', 'is_correct' => true],
                            ['label' => 'Resumes from the node that was in flight', 'is_correct' => false],
                            ['label' => 'Marks the run failed and never retries', 'is_correct' => false],
                            ['label' => 'Replays only the node that was killed', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'In the `per_node` driver, a node claim is an insert against a unique constraint rather than a "check, then insert". Why does that matter?',
                        'type' => 'multiple_choice',
                        'explanation' => 'A check-then-insert has a race window. A unique constraint makes a lost race a no-op instead of a second execution of the same node.',
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
                        'explanation' => 'Core declares `registerLlmClient` and imports no provider SDK. The adapters live on opt-in subpaths.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'A graph runs through `@particle-academy/fancy-flow/engine` in Node, and its `api_request` node does nothing. Why?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The TypeScript core ships default executors only for branch, transform, merge and for_each. The host binds executors for I/O kinds such as api_request.',
                        'options' => [
                            ['label' => 'The TypeScript core only ships executors for the pure-logic kinds; your app must bind one for `api_request`', 'is_correct' => true],
                            ['label' => '`api_request` is a PHP-only kind', 'is_correct' => false],
                            ['label' => 'The HTTP kind is called `http`, so `api_request` is ignored', 'is_correct' => false],
                            ['label' => 'Graphs with network nodes must run through the editor, not `/engine`', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'How do you add a marketplace node to your project?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Nodes are vendored source: `fancy-cli add node` copies the editor kind and the backend for your runtime. No package is added; `particle-academy/fancy-flow-nodes` never existed.',
                        'options' => [
                            ['label' => '`npx fancy-cli@latest add node <kind>`, which copies its source and adds no dependency', 'is_correct' => true],
                            ['label' => '`composer require particle-academy/fancy-flow-nodes`', 'is_correct' => false],
                            ['label' => '`npm install` the node\'s own package', 'is_correct' => false],
                            ['label' => 'Nothing: every marketplace node already ships inside fancy-flow', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent on `registerFlowBridge` deleted a node without anyone confirming. What do you change?',
                        'type' => 'multiple_choice',
                        'explanation' => '`pendingMode` is off by default. Turn it on and supply `adapter.confirm`, and `flow_delete_node` and `flow_run` wait for a person.',
                        'options' => [
                            ['label' => 'Turn on `pendingMode` and supply `adapter.confirm`', 'is_correct' => true],
                            ['label' => 'Nothing; the flow bridge cannot stage writes', 'is_correct' => false],
                            ['label' => 'Remove `flow_connect` from the bridge', 'is_correct' => false],
                            ['label' => 'Switch the editor to `/engine`', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function tui(): array
    {
        return [
            'slug' => 'fancy-tui',
            'feature' => 'tui',
            'title' => 'TUI',
            'description' => 'Ink components for terminal apps a person and an agent run together: the components, the terminal habits that differ from the browser, surfaces with action policies, and the MCP bridge.',
            'estimated_minutes' => 31,
            'modules' => [
                [
                    'slug' => 'terminal',
                    'title' => 'Building for the terminal',
                    'lessons' => [
                        [
                            'slug' => 'ink-components',
                            'title' => 'What fancy-tui is',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
`@particle-academy/fancy-tui` is a set of Ink components for terminal apps that a
person and an agent use together. It needs Node 22, React 19.2 and Ink 7.

The vocabulary will feel familiar from the browser kit: layout (`Box`, `Stack`,
`Panel`, `Screen`, `StatusBar`), inputs (`Input`, `MultilineInput`, `Select`,
`Checkbox`, `Form`), navigation (`Tabs`, `Menu`, `Modal`, `Command`), data
(`Table`, `TreeNav`, `FileBrowser`) and content (`Markdown`, `CodeView`,
`MessageList`, `Composer`). Wrap the app in `FancyTuiProvider`, which mounts
mouse support unless you pass `mouse={false}`.

Two differences from plain Ink bite on day one:

- **Every interactive component requires an `id`.** That id is its stable
  handle, the terminal's answer to a `data-*` handle in the browser.
- **Components claim focus on mount by default**, the opposite of Ink's own
  `useFocus` default. Ink's focus manager is first-come, so moving focus later
  (opening a modal, switching panes) takes an explicit `focus(id)` through
  `useFocusManager`.
MD,
                        ],
                        [
                            'slug' => 'scrollback-keys-untrusted-text',
                            'title' => 'Scrollback, keys and untrusted text',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
A terminal is not a browser, and three browser habits fail in it.

**Scrollback.** Output that is finished, such as log lines and chat messages,
belongs in Ink's `Static`, through `StaticList` (alias `LogList`) or
`MessageList`. State that repaints belongs below it in `LiveRegion`. Keeping the
two apart is what protects the terminal's scrollback.

**Keys.** In `MultilineInput`, Enter submits and **Alt+Enter** inserts a newline
on every terminal. Shift+Enter inserts one only when enhanced keyboard support
is detected, which fancy-tui reads from the environment (Kitty, WezTerm, Ghostty,
iTerm). If you turn the enhanced protocol on with `enableEnhancedKeyboard()`,
call the restore function it returns when you exit. Teach your users Alt+Enter.

**Untrusted text.** Agent output is untrusted, and a terminal acts on escape
sequences. `Markdown` strips control characters other than tab, newline and
carriage return, so an ESC in a model's reply never reaches the terminal. Links
always print as `label (url)` and never as terminal hyperlinks, because a label
that names one site while the link goes to another is exactly the trick a
hostile reply would play.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'agents',
                    'title' => 'Handing the terminal to an agent',
                    'lessons' => [
                        [
                            'slug' => 'surfaces-and-policies',
                            'title' => 'Surfaces, and the policy on every command',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
fancy-tui keeps MCP out of the package. What it gives you instead is a
renderer-neutral **surface registry**, which a bridge then exposes.

Create one with `createTuiSurfaceRegistry()` and register a surface for each thing
an agent may see or touch. A surface has a unique `id`, a `kind`, a `read()` that
returns its state as data, and named `commands`. Registering a duplicate `id`
throws: a handle that could point at two things is not a handle.

Each command carries a **policy**, one of five:

- `observe`: the agent may read the surface and never act.
- `execute`: the agent's action runs immediately.
- `propose` and `confirm`: the agent's action is parked as pending, for a person
  to confirm or reject.
- `human-only`: never the agent.

**A command with no policy is `execute`.** That default is convenient, and it is
the one to audit: anything destructive, or visible to a person, should say
`propose` or `confirm` explicitly.
MD,
                        ],
                        [
                            'slug' => 'push-or-pull',
                            'title' => 'Push, or pull: how events reach the agent',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`registerTuiBridge(server, { registry, eventStore, appId })`, from
`@particle-academy/agent-integrations/bridges/tui`, puts a surface registry on
MCP. `appId` is required. agent-integrations ships an in-memory store,
`MemoryHumanPlusEventStore`, to start with.

The agent gets `tui_surfaces_list`, `tui_surface_read` and `tui_action_invoke`,
plus `tui_action_confirm` and `tui_action_reject` for parked actions. A parked
action publishes an `action.proposed` event at `attention` priority.

Events reach the agent two ways, and the difference matters:

- **Push.** `human_plus_events_subscribe` sends matching events on the agent's
  MCP connection as they happen, at least once, and **without waking the
  agent**. An agent that is not reading its connection will not notice them.
- **Pull.** `human_plus_events_list` reads a durable inbox from a cursor, and
  `human_plus_events_ack` marks each event `seen`, `handled`, `rejected` or
  `ignored`.

Pushed events are also kept in the inbox, so nothing is lost when an agent stops
listening; it simply has to come back and read.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-tui-test',
                'title' => 'TUI — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'In a fancy-tui `MultilineInput`, which key inserts a newline on every terminal?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Enter submits. Alt+Enter always inserts a newline; Shift+Enter does only when enhanced keyboard support is detected.',
                        'options' => [
                            ['label' => 'Alt+Enter', 'is_correct' => true],
                            ['label' => 'Shift+Enter', 'is_correct' => false],
                            ['label' => 'Enter', 'is_correct' => false],
                            ['label' => 'Tab', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'A surface command was registered with no policy. What can an agent do with it?',
                        'type' => 'multiple_choice',
                        'explanation' => 'A missing policy defaults to `execute`, so the action runs immediately. Say `propose` or `confirm` for anything destructive or human-visible.',
                        'options' => [
                            ['label' => 'Run it immediately: the default policy is `execute`', 'is_correct' => true],
                            ['label' => 'Only read it: the default policy is `observe`', 'is_correct' => false],
                            ['label' => 'Only propose it for a person to confirm', 'is_correct' => false],
                            ['label' => 'Nothing: a command without a policy is `human-only`', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent subscribed with `human_plus_events_subscribe` stops reading its MCP connection. What happens to new events?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Push is at-least-once and does not wake the agent. Pushed events are retained in the durable inbox, where the agent can list and ack them later.',
                        'options' => [
                            ['label' => 'They stay in the durable inbox, and nothing wakes the agent to read them', 'is_correct' => true],
                            ['label' => 'The bridge wakes the agent so it reads them', 'is_correct' => false],
                            ['label' => 'They are dropped once the push fails', 'is_correct' => false],
                            ['label' => 'The surface refuses new actions until the agent acks', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Where should finished chat messages go so they do not fight the terminal\'s scrollback?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Committed output belongs in Ink `Static` (StaticList / LogList / MessageList); repainting state belongs below it in `LiveRegion`.',
                        'options' => [
                            ['label' => 'In `Static`, through `MessageList` or `StaticList`, with live state below in `LiveRegion`', 'is_correct' => true],
                            ['label' => 'In a `LiveRegion`, repainted on every update', 'is_correct' => false],
                            ['label' => 'In a `Modal` that is re-rendered on each message', 'is_correct' => false],
                            ['label' => 'Anywhere; Ink manages scrollback on its own', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: fancy-tui\'s `Markdown` prints a model\'s links as clickable terminal hyperlinks.',
                        'type' => 'true_false',
                        'explanation' => 'Links always print as `label (url)`. A link label in agent output is untrusted, so a hyperlink could show one site and open another.',
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
    private static function cms(): array
    {
        return [
            'slug' => 'fancy-cms',
            'feature' => 'cms',
            'title' => 'CMS',
            'description' => 'A WYSIWYG page editor in React on a Laravel content backend: the Stages page document, the two renderers that must agree, where edits are validated, and how agents edit pages.',
            'estimated_minutes' => 33,
            'modules' => [
                [
                    'slug' => 'the-document',
                    'title' => 'One page document',
                    'lessons' => [
                        [
                            'slug' => 'stages-page-document',
                            'title' => 'Stages: the page as data',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
A fancy-cms page is one JSON document in the **Stages** model: a vertical stack
of full-bleed sections, with positioned layers inside each. Every node lives in a
**flat map keyed by id**, so an edit targets a stable identity rather than a path
that shifts when something above it moves.

A `PageDoc` carries `id`, `seq` (an operation counter), `meta` (title, slug,
scroll mode, SEO), `theme`, `breakpoints` (mobile-first, by convention `base`,
`md` and `lg`) and `nodes`. A node has a `type`, an optional `layout`, and a
`style` per breakpoint. Lengths are objects such as `{"value":24,"unit":"px"}`,
never bare numbers.

**Every edit is one operation from a closed vocabulary of 13**, the same in PHP
and JavaScript: `insert_node`, `remove_node`, `move_node`, `set_node_props`,
`set_layout`, `set_style`, `set_constraints`, `set_animation`,
`remove_animation`, `set_action`, `set_meta`, `set_theme` and `reorder_roots`.
`set_style` and `set_constraints` name the breakpoint they change.

That one vocabulary is the spine that undo, revisions, collaboration and agent
edits all run through. An agent gets no looser way to change a page than a
person does.
MD,
                        ],
                        [
                            'slug' => 'two-renderers-one-page',
                            'title' => 'Two renderers, one page',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
A page renders in two places, and they must agree.

- **`@particle-academy/fancy-cms-ui`** (React) holds the editor (`./editor`), the
  React renderer (`./react`, with `CmsPage` and `CmsRegion`) and the JavaScript
  CSS emitter.
- **`particle-academy/fancy-cms`** (PHP) holds the server renderer:
  `PageRenderer::render($doc, $data, $imageResolver)` returns HTML and CSS.

A parity harness runs canonical page documents through both engines and
requires **byte-identical** CSS and HTML. A server-rendered page and a
browser-rendered page must be the same page.

Three details follow from the split:

- There is no stylesheet to import. `CmsPage` injects the page's CSS as a
  `<style data-cms-styles>` tag. Pass `includeStyles={false}` when the host
  already emitted the CSS, for example through the PHP renderer.
- Images name a host asset (`props.asset`) and your synchronous `imageResolver`
  supplies the URL. An asset node never falls back to `props.src`.
- `richtext` accepts host-authored HTML in the browser, so PHP does not render it
  and the agent catalogue leaves it out.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'editing',
                    'title' => 'Editing, with people and agents',
                    'lessons' => [
                        [
                            'slug' => 'strict-server-lenient-browser',
                            'title' => 'Strict on the server, lenient in the browser',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
The two halves validate differently, on purpose.

In the browser, `reduce` is **pure and total**: an operation that cannot apply is
logged and skipped, never thrown. That keeps the editor from crashing on a bad
edit, and it means an agent's edit that "did nothing" may simply have been
invalid.

On the server, `PageDoc::apply` is strict. It validates the incoming document and
operation, refuses an edit that cannot apply, then validates the result.
`SchemaException::getErrors()` returns each error with `path`, `expected`, `got`
and `hint`. Use it at the storage boundary; `Reducer::reduce` is the lenient PHP
mirror of the JavaScript reducer. Decode wire input with `PageJson`, because
PHP's JSON decoder cannot tell an empty object from an empty list.

The editor has two modes. `defaultValue` keeps local undo and redo and reports
changes through `onChange`. `value` with `onOp` makes the server the owner, and
turns local undo off, because restoring an old snapshot could overwrite another
writer's work.

Both packages are 0.x early-release betas: expect breaking changes between 0.x
releases, and read the changelog before you move.
MD,
                        ],
                        [
                            'slug' => 'agents-on-the-page',
                            'title' => 'Agents on the page',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
Human+ is opt-in for the CMS: the core works single-user, with no agents and no
websockets. When you do add an agent there are two ways in, and both use tool
names that start with `cms_`, so know which one you are on.

**The bridge.** `registerCmsBridge` in agent-integrations is built on the generic
document bridge. That gives it `cms_describe`, `cms_get`, `cms_list`,
`cms_get_node`, `cms_add`, `cms_update`, `cms_remove`, `cms_move`, undo and
activity for free, and it adds two page tools: `cms_set_style` and
`cms_set_layout`. Two cautions: `cms_set_style` writes the `base` breakpoint
only, and writes apply immediately unless you set a `stagePolicy` that holds them
for confirmation.

**Server-side sessions.** fancy-cms's `PageSession` gives an agent and a person
revision-pinned, atomic batches and a change feed. A batch carrying a stale
`basedOn` revision is refused whole (`surface_changed_under_you`). A batch
without one is an unconditional write, so an agent's tool should always send the
revision it last saw.

**charlotte** is a ready-made website-builder agent kit for Laravel that edits
fancy-cms pages through nine closed tools. It edits **drafts only**: nothing it
does publishes, and publishing is one explicit host call. In `approve_on_save`
mode its edits collect in a change set a person approves or rejects.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-cms-test',
                'title' => 'CMS — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Why does the Stages model keep every node in a flat map keyed by id?',
                        'type' => 'multiple_choice',
                        'explanation' => 'An operation targets a stable identity, not a path that shifts when siblings move. That is what lets undo, collaboration and agent edits share one spine.',
                        'options' => [
                            ['label' => 'So every edit targets a stable identity rather than a position that can shift', 'is_correct' => true],
                            ['label' => 'Because a flat map produces smaller JSON than a tree', 'is_correct' => false],
                            ['label' => 'Because the PHP renderer cannot read nested JSON', 'is_correct' => false],
                            ['label' => 'So the browser can skip validation', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent\'s edit in the browser editor silently did nothing. What is the most likely cause?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The JavaScript reducer is pure and total: an operation that cannot apply is logged and skipped, never thrown.',
                        'options' => [
                            ['label' => 'The operation was invalid, and the browser reducer logged and skipped it', 'is_correct' => true],
                            ['label' => 'The browser reducer threw, and the editor swallowed the error', 'is_correct' => false],
                            ['label' => 'Browser edits only apply after the PHP renderer runs', 'is_correct' => false],
                            ['label' => 'The CMS bridge is read-only', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Where should a page edit be strictly validated before it is stored?',
                        'type' => 'multiple_choice',
                        'explanation' => '`PageDoc::apply` validates the document, the operation and the result, and refuses what cannot apply. The reducers, in both languages, are lenient.',
                        'options' => [
                            ['label' => 'In PHP, with `PageDoc::apply`, at the storage boundary', 'is_correct' => true],
                            ['label' => 'In the browser, with `reduce`', 'is_correct' => false],
                            ['label' => 'In PHP, with `Reducer::reduce`', 'is_correct' => false],
                            ['label' => 'Nowhere; the 13 operations cannot produce an invalid page', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: an agent tool that writes through `PageSession` should send the `basedOn` revision it last observed.',
                        'type' => 'true_false',
                        'explanation' => 'With a stale `basedOn` the whole batch is refused; without one the write is unconditional and can overwrite a person\'s edits.',
                        'options' => [
                            ['label' => 'True', 'is_correct' => true],
                            ['label' => 'False', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'charlotte\'s agent finishes building a page. What has been published?',
                        'type' => 'multiple_choice',
                        'explanation' => 'charlotte edits drafts only. Publishing is a separate, explicit host call.',
                        'options' => [
                            ['label' => 'Nothing: it edited a draft, and publishing is a separate host call', 'is_correct' => true],
                            ['label' => 'The page, as soon as the agent calls its finish tool', 'is_correct' => false],
                            ['label' => 'The page, after a timeout if nobody objects', 'is_correct' => false],
                            ['label' => 'The page, but only in `full` autonomy mode', 'is_correct' => false],
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
            'feature' => 'documents',
            'title' => 'Documents',
            'description' => 'xlsx, pptx and docx writers and readers for PHP, Node and Python, plus PDF for PHP: the JSON-in, file-out loop agents use, reading files back, and handling files you did not write.',
            'estimated_minutes' => 31,
            'modules' => [
                [
                    'slug' => 'agentic-docs',
                    'title' => 'Documents an agent can produce',
                    'lessons' => [
                        [
                            'slug' => 'the-three-writers',
                            'title' => 'Four formats, three languages',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
The Documents Feature is one package per format, each with an agent-facing
`Agent` API:

- **Holy Sheet**: `.xlsx`, and it reads `.ods` too.
- **Dark Slide**: `.pptx`.
- **Last Word**: `.docx`, with markdown bridges. It also reads `.doc`, `.odt`
  and `.rtf`.
- **Fine Print**: PDF.

**Each one writes AND reads.** Holy Sheet, Dark Slide and Last Word ship for PHP,
Node and Python; Fine Print is PHP only. The install names are not uniform, so
copy them rather than guess: Composer `particle-academy/holy-sheet`, npm
`@particle-academy/holy-sheet`, and on PyPI `fancy-holy-sheet`, imported as
`holy_sheet`. Dark Slide and Last Word follow the same pattern
(`fancy-dark-slide`, `fancy-last-word`).

They are **headless**. There is no UI to inhabit, so the Human+ component
contract does not apply to them, and there is no MCP bridge for them. The agent
surface is inside each package: a schema to register as a tool, validation, and
a written guide. The npm packages have zero runtime dependencies.
MD,
                        ],
                        [
                            'slug' => 'json-in-file-out',
                            'title' => 'JSON in, file out',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
An agent does not write a file. It writes a JSON document, and the package turns
that into bytes. The loop:

1. Register the package's schema as a tool: `toolDefinition()` on Holy Sheet,
   `jsonSchema()` on Dark Slide, Last Word and Fine Print.
2. Validate what the model produced with `validateAndRepair()`, which fixes what
   it can and reports what it cannot.
3. Write it: `toBytes()` for bytes, or `write()` to a path.

Give the model `guide()` as well. Every package ships one: a written brief on
what a professional file in that format looks like.

Sheets, decks and PDFs add `lint()`. Holy Sheet's PHP package also ships a ready
toolkit, `HolySheet\Toolkit\Toolkit`: framework-agnostic tool descriptors for
building, linting, writing, reading and describing a workbook, plus an agent
prompt. No other document package has one.

One name means different things, so check the signature before you wire it: Holy
Sheet's `describe()` **reads a file** from a path into a schema, while Dark
Slide's and Last Word's `describe()` summarise a JSON document as text.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'reading',
                    'title' => 'Reading files back',
                    'lessons' => [
                        [
                            'slug' => 'reading-files-back',
                            'title' => 'Reading back into the same model',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Every format reads back into the same model it was written from. That is what
lets an agent edit a file rather than only produce one.

- **Holy Sheet** reads `.xlsx` and `.ods`, choosing by the file's contents rather
  than its extension.
- **Dark Slide**'s reader is best-effort and deterministic: text, images, shapes
  and tables come back with their geometry, and constructs it cannot model are
  **skipped, never raised**.
- **Last Word** reads `.docx`, `.doc`, `.odt` and `.rtf`, deciding from the
  bytes.

Last Word also bridges to markdown both ways, with `toMarkdown` and
`fromMarkdown`, so a model can draft in the format it writes best. The bridge is
lossy only where GFM has no syntax: underline, colour, highlight, paragraph
alignment and image pixel sizes are dropped on the way out.

The read signatures differ by language. Dark Slide's `read` takes a path in PHP
and bytes in Node; Holy Sheet's PHP reader is `describe()` with a path; Last
Word's PHP `read` takes bytes or a path.
MD,
                        ],
                        [
                            'slug' => 'untrusted-files',
                            'title' => 'Files you did not write',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
A document an agent reads is input you did not write. Two protections, and their
limits.

**Fine Print's prompt-injection guard.** Everything an agent reads from a PDF
passes through a guard that can `flag`, `redact` or `discard` suspicious text.
The default is `redact`; use `discard` for untrusted uploads. `readUnredacted()`
always uses `flag`. The guard is a **detector, not a proof**: a determined author
can phrase around any list, so it lowers the risk rather than removing it. Fine
Print also reports a PDF's active content without ever running it.

**Archive checks.** An `.xlsx`, `.pptx` or `.docx` is a zip archive, and a
hostile archive can be built to overwhelm a reader. The PHP and Node readers of
Holy Sheet, Dark Slide and Last Word validate the archive before parsing and
throw `ArchiveRefused` on anything unsafe. **The Python ports do not have this
check yet**, so on Python do not rely on the reader to refuse a hostile archive.
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
                        'explanation' => 'The contract governs interactive SURFACES. The document packages are headless and have no surface to inhabit.',
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
                        'explanation' => 'Every Documents package reads as well as writes. Dark Slide reads a .pptx back into its deck model, best-effort.',
                        'options' => [
                            ['label' => 'True', 'is_correct' => true],
                            ['label' => 'False', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'You want Holy Sheet in a Python project. What do you install?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The PyPI names carry a `fancy-` prefix: `pip install fancy-holy-sheet`, then `import holy_sheet`.',
                        'options' => [
                            ['label' => '`pip install fancy-holy-sheet`, then `import holy_sheet`', 'is_correct' => true],
                            ['label' => '`pip install holy-sheet`', 'is_correct' => false],
                            ['label' => '`pip install particle-academy-holy-sheet`', 'is_correct' => false],
                            ['label' => 'Nothing: Holy Sheet has no Python port', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Which default does Fine Print\'s prompt-injection guard use when an agent reads a PDF?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The default policy is `redact`. Use `discard` for untrusted uploads; `readUnredacted()` always flags.',
                        'options' => [
                            ['label' => '`redact`', 'is_correct' => true],
                            ['label' => '`flag`', 'is_correct' => false],
                            ['label' => '`discard`', 'is_correct' => false],
                            ['label' => 'None; the guard is off unless you enable it', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'You read untrusted .docx uploads with Last Word\'s Python port. Which statement is true?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The archive checks that throw `ArchiveRefused` are in the PHP and Node readers only. The Python ports do not have them yet.',
                        'options' => [
                            ['label' => 'The Python port does not have the archive check that throws `ArchiveRefused` in PHP and Node', 'is_correct' => true],
                            ['label' => 'Every port throws `ArchiveRefused` on a hostile archive', 'is_correct' => false],
                            ['label' => 'The Python port cannot read .docx at all', 'is_correct' => false],
                            ['label' => 'Fine Print\'s guard scans .docx files on every port', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function git(): array
    {
        return [
            'slug' => 'fancy-git',
            'feature' => 'git',
            'title' => 'Git',
            'description' => 'Provider-neutral Git for PHP and Node, with GitHub, GitLab and Bitbucket adapters and a React UI: the normalized contracts, writes as proposals, and an agent that proposes while a person confirms.',
            'estimated_minutes' => 33,
            'modules' => [
                [
                    'slug' => 'contracts',
                    'title' => 'One contract, three hosts',
                    'lessons' => [
                        [
                            'slug' => 'local-git-normalized',
                            'title' => 'Local Git, normalized',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
The Git Feature starts from a headless core in two languages:

- **Node:** `@particle-academy/fancy-git`.
- **PHP:** `particle-academy/fancy-git` (PHP 8.4+), which runs the installed
  `git` binary through Symfony Process.

The repos are named `fancy-git-js` and `fancy-git-php`; the packages are not, so
install by the package name.

Both open a repository the same way, with `new GitRepository(process.cwd())` in
Node and `new GitRepository(getcwd())` in PHP, and both return the same
normalized shapes: `WorkingTreeStatus` (branch, upstream, ahead, behind, files,
clean), `Commit`, `Diff`, `Branch`, `Page<T>` and the rest. It is all plain data,
so it can go straight into a React prop or across an MCP bridge.

The core carries **no GitHub, GitLab or Bitbucket SDK**. Hosted providers are
separate packages, which is the next lesson. There is no Python mirror of the
Git Feature.
MD,
                        ],
                        [
                            'slug' => 'provider-adapters',
                            'title' => 'Provider adapters, and the optional issue contract',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
A hosted provider is one interface, `GitProvider`: a `kind` (`github`, `gitlab`
or `bitbucket`), `identify(remote)`, `repository`, `listReviews`, `getReview`,
`createReview`, `compare` and `checks`. Pull requests and merge requests both
become a **`Review`**, with the states `open`, `merged`, `closed` and `draft`.

Adapters ship per host, for Node and for PHP: `fancy-git-github`,
`fancy-git-gitlab` and `fancy-git-bitbucket`. Register the ones you need on a
`ProviderRegistry`; given a remote, `identify` asks each registered provider in
turn which one owns it. The GitHub Node adapter uses GitHub's Octokit SDK, the
GitLab Node adapter has no runtime dependency beyond fancy-git, and the Bitbucket
adapters target Bitbucket Cloud only.

**Issues are a separate, optional contract**, `IssueProvider`, and only the
GitHub adapters implement it. Check `supportsIssues(provider)` before calling an
issue method, rather than assuming every host has one.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'proposals',
                    'title' => 'Writes as proposals',
                    'lessons' => [
                        [
                            'slug' => 'propose-then-apply-git',
                            'title' => 'Propose, then apply',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
Every write in the Git core can be a **proposal** first: a JSON description of
what would happen, produced without touching the repository.

In Node, pass `{ pendingMode: "propose" }` to a mutation (`stage`, `unstage`,
`commit`, `checkout`, `fetch`, `pull` or `push`) and you get an
`OperationProposal` back: `{ operation, arguments, summary }`. In PHP the same
methods take `bool $propose` instead.

Two differences between the twins catch people out. The flag is spelled
differently, and **PHP's `GitRepository` has no `commit()`**: the PHP core
covers stage, unstage, checkout, fetch, pull and push.

In Node, `pull` is fast-forward only (`--ff-only`).

The proposal is the unit a person reviews: show it, let them confirm, then run
the operation for real. The Git bridge in the next lesson is built on exactly
that shape.
MD,
                        ],
                        [
                            'slug' => 'ui-and-bridge',
                            'title' => 'The UI renders, the agent proposes',
                            'estimated_minutes' => 10,
                            'content' => <<<'MD'
**`@particle-academy/fancy-git-ui`** renders what you pass it and nothing else.
Its components (`WorkingTree`, `DiffViewer`, `CommitHistory`,
`RepositoryBrowser`, `ReviewList`, `BranchPicker`, `CommitComposer` and
`CreateReviewForm`) take fancy-git's types as `value` and report **intents**
through callbacks such as `onStage` and `onSubmit`. They never call git or a
provider themselves, and every entity carries a stable `data-git-*` handle.
`DiffViewer` takes the unified patch fancy-git returns; in its hunk review, a
hunk with no entry is `pending`, which is **not** the same as rejected.

**`registerGitBridge`** puts a repository on MCP for an agent. Your host supplies
the adapter: `status`, `log`, `diff` and `propose` are required; `reviews`,
`checks` and `applyProposal` are optional. The agent always gets `git_status`,
`git_log` and `git_diff`. `git_reviews_list` and `git_checks` exist only when
your adapter provides them: the tools are absent, not failing.

The write tools (`git_stage` through `git_push`, and `git_review_create`)
**always propose first**. An agent asking for `apply: true` is refused unless the
host set `allowApply` and supplied `applyProposal`; set those only when your app
has its own confirmation policy. Confirming is your app's job, and the bridge
never applies by default.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-git-test',
                'title' => 'Git — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'In fancy-git, what does a GitLab merge request become?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Pull requests and merge requests are both normalized to `Review`, with the states open, merged, closed and draft.',
                        'options' => [
                            ['label' => 'A `Review`, the same type as a GitHub pull request', 'is_correct' => true],
                            ['label' => 'A `MergeRequest`, a GitLab-only type', 'is_correct' => false],
                            ['label' => 'A `Commit` with a review flag', 'is_correct' => false],
                            ['label' => 'Nothing; merge requests are not modelled', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent calls `git_push` with `apply: true` on a host that never set `allowApply`. What happens?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Write tools always propose first. Applying needs `allowApply` and an `applyProposal` adapter; otherwise the bridge refuses and asks for human confirmation.',
                        'options' => [
                            ['label' => 'It is refused: the host requires a person to confirm before Git writes apply', 'is_correct' => true],
                            ['label' => 'The push runs, because the agent asked for it', 'is_correct' => false],
                            ['label' => 'The push runs, then is reverted if nobody confirms', 'is_correct' => false],
                            ['label' => 'The `git_push` tool does not exist without `allowApply`', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'What should your code do before calling an issue method on a provider?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Issues are a separate, optional contract (`IssueProvider`) that only the GitHub adapters implement. `supportsIssues(provider)` checks for it.',
                        'options' => [
                            ['label' => 'Check `supportsIssues(provider)`: only the GitHub adapters implement issues', 'is_correct' => true],
                            ['label' => 'Nothing: every adapter implements issues', 'is_correct' => false],
                            ['label' => 'Call `identify()` again to refresh the provider', 'is_correct' => false],
                            ['label' => 'Switch to the PHP core, which has issues built in', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'In `DiffViewer`\'s hunk review, a hunk has no entry in the acceptance state. What is its status?',
                        'type' => 'multiple_choice',
                        'explanation' => 'A hunk with no entry is `pending`, which is not the same as rejected.',
                        'options' => [
                            ['label' => 'Pending', 'is_correct' => true],
                            ['label' => 'Rejected', 'is_correct' => false],
                            ['label' => 'Accepted', 'is_correct' => false],
                            ['label' => 'Invalid; every hunk must have an entry', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: PHP\'s `GitRepository` has a `commit()` method, like the Node core.',
                        'type' => 'true_false',
                        'explanation' => 'It does not. The PHP core covers stage, unstage, checkout, fetch, pull and push.',
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
    private static function threeD(): array
    {
        return [
            'slug' => 'fancy-3d',
            'feature' => '3d',
            'title' => '3D',
            'description' => 'Engine-agnostic 3D scenes, rendered in the DOM or through Babylon.js or three.js: scenes as data, the WebGL adapters you add only when you need them, and the scene bridge.',
            'estimated_minutes' => 24,
            'modules' => [
                [
                    'slug' => 'scenes',
                    'title' => 'Scenes and engines',
                    'lessons' => [
                        [
                            'slug' => 'fancy-3d-and-map',
                            'formerly' => ['fancy-surfaces', 'fancy-3d-and-map'],
                            'title' => 'One scene, swappable engines',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`@particle-academy/fancy-3d` is the engine-agnostic core: the Scene types, the
`<Canvas>` surface and a DOM renderer. It has **no dependencies at all**: its
peers are React 19 and, optionally, react-fancy. A page that shows a scene does
not ship a WebGL engine.

A scene is plain JSON: `{ nodes, edges }`. A node has an `id`, a `position`
(`x`, `y`, optional `z`), an optional `size` and a `widget`, which is a
discriminated union on `kind` with fourteen kinds, from `kpi` and `chart` to
`table`, `form` and `code`. An edge joins two node ids, with an optional label
and curve.

Rendering is per engine, through a **`WidgetAdapter`**: the scene data never
changes, only the adapter does. The DOM adapter returns React elements, a Babylon
adapter returns a mesh, and a three.js adapter returns an `Object3D`.

`<Canvas>` takes the engine as a prop. `engine` defaults to `"dom"`, and a WebGL
engine is passed as an **object**, `engine={babylonEngine}`, never as the string
`"babylon"`.

The same idea runs through `fancy-map`, which is not one of the Features: one
`<Map>` over OpenStreetMap (via Leaflet) or Google Maps, swapped with its
`provider` prop.
MD,
                        ],
                        [
                            'slug' => 'webgl-adapters',
                            'title' => 'WebGL when you need it',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
WebGL arrives in two adapter packages. Both implement the same `CanvasEngine`
interface and neither depends on the other:

- `@particle-academy/fancy-3d-babylon`, with `@babylonjs/core` installed by you.
- `@particle-academy/fancy-3d-three`, with `three` installed by you.

Each has an `/engine` entry (`babylonEngine`, `threeEngine`) for `<Canvas>`, and
a `/react` entry with `<Stage>`, `<Monitor>` and `useStage`. They mirror each
other's API, so a scene authored for one renders recognisably on the other.

`<Monitor>` puts **live React** on a 3D surface. It projects the mesh's corners
to the screen each frame and positions a real DOM overlay there, so the content
stays interactive and accessible. Because it is an overlay it always draws on top
of the WebGL canvas, and depth sorting against other 3D objects is approximate.
`Card3D` is a function, `createCard3D()`, from the adapter's root entry, not a
component.

**fancy-3d is not SSR-safe.** WebGL needs `window`, and DOM positioning needs
layout measurement, so render scenes on the client. The default DOM `<Canvas>`
is partly SSR-safe: its node tree renders on the server, and pan and zoom start
on the client.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'agents',
                    'title' => 'Agents in the scene',
                    'lessons' => [
                        [
                            'slug' => 'scene-bridge',
                            'title' => 'The scene bridge works on your state',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`registerSceneBridge`, from `@particle-academy/agent-integrations/bridges/scene`,
gives an agent seven tools: `scene_describe` and `scene_get_state` to read, and
`scene_add_object`, `scene_update_object`, `scene_delete_object`,
`scene_set_camera` and `scene_set_background` to write.

**The bridge's scene is not fancy-3d's `Scene`.** It works on a `SceneState` your
app owns, `{ objects, camera, background }`, whose objects are primitives such as
`box`, `sphere`, `plane` and `group` with `[x, y, z]` positions. Your adapter
supplies `getScene` and `setScene` (and optionally `setCamera`), and your code
maps between that state and whatever you render.

Two behaviours to design around. **Writes apply immediately**: this bridge has no
staged or `pendingMode` path, unlike the Git bridge's proposals, so give it
surfaces where an agent's change is cheap to undo. And every write broadcasts
agent activity, while the bridge registers the shared `agent_undo`, `agent_redo`
and `agent_history` tools.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-3d-test',
                'title' => '3D — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Why does fancy-3d ship a DOM renderer and no WebGL dependency?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The engine is the app\'s choice. The WebGL adapters are separate packages, so a page that only needs a simple scene never ships a 3D engine.',
                        'options' => [
                            ['label' => 'So an app that only needs a simple scene never ships a WebGL engine; Babylon and three.js are separate adapter packages', 'is_correct' => true],
                            ['label' => 'Because WebGL is not supported in React 19', 'is_correct' => false],
                            ['label' => 'Because CSS 3D always performs better than WebGL', 'is_correct' => false],
                            ['label' => 'To avoid a licensing conflict', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'How do you render a `<Canvas>` with Babylon.js?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Pass the engine object from the adapter\'s `/engine` entry. `engine` accepts `"dom"` or an engine object, and `@babylonjs/core` is a peer you install.',
                        'options' => [
                            ['label' => 'Install `@babylonjs/core` and the Babylon adapter, then pass `engine={babylonEngine}`', 'is_correct' => true],
                            ['label' => 'Pass `engine="babylon"`', 'is_correct' => false],
                            ['label' => 'Import `Stage` from `@particle-academy/fancy-3d/react`', 'is_correct' => false],
                            ['label' => 'Nothing; fancy-3d bundles Babylon.js', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent calls `scene_add_object`. What changes?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The bridge works on an app-owned `SceneState` of primitive objects, through the adapter\'s `setScene`. Mapping it to what you render is your code.',
                        'options' => [
                            ['label' => 'Your app\'s own `SceneState`, through the adapter\'s `setScene`', 'is_correct' => true],
                            ['label' => 'The fancy-3d `Scene` nodes array, directly', 'is_correct' => false],
                            ['label' => 'Nothing until a person confirms the proposal', 'is_correct' => false],
                            ['label' => 'The WebGL engine\'s scene graph, bypassing React', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: the scene bridge stages an agent\'s writes for a person to confirm.',
                        'type' => 'true_false',
                        'explanation' => 'It has no staged path: writes call `setScene` immediately. The Git bridge is the one that proposes first.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Why should WebGL scenes render on the client only?',
                        'type' => 'multiple_choice',
                        'explanation' => 'fancy-3d is not SSR-safe: WebGL engines need `window`, and DOM positioning needs layout measurement.',
                        'options' => [
                            ['label' => 'WebGL needs `window`, and positioning needs layout measurement', 'is_correct' => true],
                            ['label' => 'Server rendering would download Babylon.js twice', 'is_correct' => false],
                            ['label' => 'Scenes are too large to serialise into the page', 'is_correct' => false],
                            ['label' => 'They do not need to; fancy-3d is fully SSR-safe', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function ecommerce(): array
    {
        return [
            'slug' => 'fancy-ecommerce',
            'formerly' => 'fancy-commerce',
            'feature' => 'ecommerce',
            'title' => 'Ecommerce',
            'description' => 'Stripe catalog and checkout, plan and metered feature gating, and multi-level referrals, in PHP, Node and Python: what each package answers, how they meet, and what an agent may do at the till.',
            'estimated_minutes' => 40,
            'modules' => [
                [
                    'slug' => 'gating',
                    'title' => 'Selling and gating',
                    'lessons' => [
                        [
                            'slug' => 'catalog-and-plans',
                            'title' => 'The catalog: products, prices and plans',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`particle-academy/laravel-catalog` manages a Stripe catalog through a facade, for
apps that bring their own UI: products, prices, plans and checkout.

**There is no Plan model.** A plan is a Product with at least one recurring
Price. Prices are `recurring` (subscriptions) or `one_time`. Two ordering rules
follow, and both fail if you skip them:

- A Product **cannot sync to Stripe without at least one Price**. Create the
  price first, then `Catalog::syncProductAndPrices($product)`.
- **Sync before you check out.** `Catalog::subscriptionCheckout(...)` and
  `Catalog::oneTimeCheckout(...)` create Stripe Checkout sessions, and
  `getSubscriptionCheckoutUrl(...)` hands back a URL.

Products and prices are soft-deleted, which keeps your financial history intact.
Cashier's migrations are **not** loaded automatically, so an app that already has
a `subscriptions` table keeps it.

The twins carry the same model without a framework. The Node package,
`@particle-academy/fancy-catalog`, keeps storage behind store adapters and takes
the Stripe client you inject, and the Python package, `fancy-catalog`, holds
money as integer minor units and also takes Stripe injected.
MD,
                        ],
                        [
                            'slug' => 'catalog-and-fms',
                            'title' => 'A catalog is not a feature gate',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Catalog and feature gating are separate packages because they answer separate
questions. *What did they buy* and *what may they do right now* are not the same
question, and apps that conflate them end up unable to grant a feature without
inventing a fake purchase.

Feature gating is `particle-academy/laravel-fms`, with twins on npm
(`@particle-academy/fancy-features`) and PyPI (`fancy-features`). A feature is
**boolean** (on or off) or a metered **resource** with a limit.

How the two meet differs by language, so learn your own:

- **Node:** fancy-features owns a `FeatureSource` contract and fancy-catalog
  mirrors it, so neither imports the other at runtime.
  `createCatalogFeatureSource(catalog, { resolveSubscription })` turns a
  subscription's product features into grants.
- **Python:** the catalog's features bridge imports the contract from
  fancy-features, so install fancy-features alongside it.
- **PHP:** there is no `FeatureSource` type. laravel-catalog requires
  laravel-fms directly, and the subscription-scoped `Fms` service reads what a
  plan grants (subscription, then product, then its feature configuration).

In PHP, resolution runs pre-strategies, then a Gate or Policy, then the
registry, then feature groups, then config. The database step at the end is an
extension hook that declines unless you subclass it.
MD,
                        ],
                        [
                            'slug' => 'entitlement-is-not-quota',
                            'title' => 'Entitlement is not quota',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
For a metered feature there are three different questions, and each has its own
call.

- **May they use it at all?** `FMS::canAccess('ai-tokens', $user)` answers
  entitlement and ignores the quota.
- **Do N units fit?** `FMS::canConsume('ai-tokens', $user, 10)` is a **read**.
  Between it and your write, another request can take the last unit.
- **Spend them.** The `Fms` service's `tryIncrement()` takes a row lock and is
  the only variant that cannot be raced. In Node it is `tryConsume`.

Gate the write with the atomic call, not with a check followed by a write.

Three more traps:

- An `overage_limit` of `null` means **no overage**, not unlimited.
  Consumption stops at the included quantity.
- FMS **records** overage; it does not invoice it. Listen for
  `FeatureOverageRecorded` and bill from there.
- Every definition callback receives `($user, $context)`. A callback declaring
  three parameters gets the pre-0.8.0 order and a deprecation. And a closure in
  `config/fms.php` breaks `php artisan config:cache`.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'referrals',
                    'title' => 'Referrals',
                    'lessons' => [
                        [
                            'slug' => 'referral-engine',
                            'title' => 'The referral engine computes; your app decides what a reward is',
                            'estimated_minutes' => 9,
                            'content' => <<<'MD'
`particle-academy/fancy-mlm` is a framework-agnostic, multi-level referral engine
with a pure-PHP core and an optional Laravel bridge; `@particle-academy/fancy-mlm`
is its Node mirror. The plan is a `CompensationPlan`, and it is JSON: both
packages load the same shape and produce the same rewards, which their test
suites assert.

Per upline level, the engine computes `baseAmount × levelFactor(level) ×
tierMultiplier(uplineTier)`. Trees come in three shapes: `unilevel` (the sponsor
tree, unlimited width), `binary` (a placement tree two wide) and `matrix` (a
placement tree of a set width). With compression on, inactive uplines are skipped
and the next active member earns that level instead of it being lost.

You implement two ports: a `MemberRepository` (`find(id)`) and a `RewardSink`
(`pay(...)`). **What a reward is belongs to the sink**: points in an engagement
programme, or a commission ledger if you build one. Monetary ledgers are on the
roadmap, not in the package. In Laravel, `Mlm::distribute($memberId, 100.0)`
runs a distribution.

`@particle-academy/fancy-mlm-ui` renders it: `DownlineTree`,
`CommissionStatement` and `RankProgress`, each with stable `data-mlm-*` handles.
A legitimate programme pays on real product sales, not on recruitment.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'agents',
                    'title' => 'Agents at the till',
                    'lessons' => [
                        [
                            'slug' => 'commerce-bridges',
                            'title' => 'What an agent may do with your catalog and features',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
Two headless bridges in agent-integrations put commerce on MCP. Neither has a UI;
they act on the Node packages.

**`registerCatalogBridge`** covers `@particle-academy/fancy-catalog`: list, create and delete products and prices,
get a product, `catalog_sync_product`,
`catalog_test_connection` and `catalog_create_checkout`. With `pendingMode` on
(the default), **only the two deletes** need a `confirm: true` argument or a host
confirm callback. Creating, syncing to Stripe and minting a checkout URL are not
staged, so decide deliberately which agents get this bridge at all. Undoing a
delete is best-effort: the store has no un-delete, so undo re-creates the item
from a snapshot.

**`registerFeaturesBridge`** covers `@particle-academy/fancy-features`:
`features_list`, `features_check`, `features_explain`, `features_define`,
`features_groups`, `features_consume` (the atomic check-and-increment), and
`features_grant` and `features_revoke`. Granting works by assigning a subject to
a feature group, and grant and revoke **are** staged, because they change what a
real user can do.

There is no referral bridge yet: an MCP bridge for fancy-mlm is on its roadmap.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-ecommerce-test',
                'formerly' => 'fancy-commerce-test',
                'title' => 'Ecommerce — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Why are catalog and feature gating separate packages rather than one?',
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
                        'prompt' => 'The catalog and feature-gating packages ship in PHP, Node and Python. What does that buy?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The same capability works behind the same React UI whichever backend runs it.',
                        'options' => [
                            ['label' => 'The same capability works behind the same UI whichever backend the app runs', 'is_correct' => true],
                            ['label' => 'It doubles test coverage automatically', 'is_correct' => false],
                            ['label' => 'It lets the PHP version call the Node version for speed', 'is_correct' => false],
                            ['label' => 'It is required for npm and Packagist to stay in sync', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'You create a Product and immediately sync it to Stripe. What goes wrong?',
                        'type' => 'multiple_choice',
                        'explanation' => 'A Product cannot sync without at least one Price. A plan is just a Product with a recurring Price.',
                        'options' => [
                            ['label' => 'It cannot sync: a Product needs at least one Price first', 'is_correct' => true],
                            ['label' => 'Nothing; Stripe adds a default price', 'is_correct' => false],
                            ['label' => 'It syncs as a Plan, which cannot be sold one-time', 'is_correct' => false],
                            ['label' => 'It syncs, but checkout must use a separate Plan model', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Before spending a unit of a metered feature, which call cannot be raced by another request?',
                        'type' => 'multiple_choice',
                        'explanation' => '`canAccess` is entitlement only and `canConsume` is a read. The `Fms` service\'s `tryIncrement()` (Node: `tryConsume`) checks and writes under a lock.',
                        'options' => [
                            ['label' => '`tryIncrement()` on the `Fms` service (`tryConsume` in Node)', 'is_correct' => true],
                            ['label' => '`FMS::canConsume()` followed by your own write', 'is_correct' => false],
                            ['label' => '`FMS::canAccess()`', 'is_correct' => false],
                            ['label' => '`FMS::enabled()`', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: an `overage_limit` of `null` allows unlimited overage.',
                        'type' => 'true_false',
                        'explanation' => '`null` means no overage: consumption stops at the included quantity.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An agent on `registerCatalogBridge` calls `catalog_create_checkout`. Who has to confirm it?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Only the two deletes are staged. Create, sync and checkout-URL tools run without confirmation, so choose carefully which agents get this bridge.',
                        'options' => [
                            ['label' => 'Nobody: only the delete tools are staged', 'is_correct' => true],
                            ['label' => 'A person, because every catalog write is staged', 'is_correct' => false],
                            ['label' => 'The customer, through Stripe, before the URL is created', 'is_correct' => false],
                            ['label' => 'Nobody, because the bridge cannot create checkouts', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'In fancy-mlm, what decides whether a referral reward is points or money?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The engine computes amounts per upline level. What a reward IS belongs to the `RewardSink` you implement; monetary ledgers are on the roadmap.',
                        'options' => [
                            ['label' => 'The `RewardSink` your app implements', 'is_correct' => true],
                            ['label' => 'The `CompensationPlan`\'s currency field', 'is_correct' => false],
                            ['label' => 'Stripe, through laravel-catalog', 'is_correct' => false],
                            ['label' => 'The tree shape: binary pays money, unilevel pays points', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function gamification(): array
    {
        return [
            'slug' => 'fancy-gamification',
            'feature' => 'gamification',
            'title' => 'Gamification',
            'description' => 'XP, achievements, prizes and leaderboards for Laravel apps with laravel-fun-lab: awarding, how levels unlock achievements, reading the activity back, and the defaults that keep it safe.',
            'estimated_minutes' => 30,
            'modules' => [
                [
                    'slug' => 'awarding',
                    'title' => 'Awarding',
                    'lessons' => [
                        [
                            'slug' => 'profiles-and-awards',
                            'title' => 'Profiles, metrics and awards',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
`particle-academy/laravel-fun-lab` (LFL) calls itself analytics disguised as
gamification: it tracks engagement through XP, achievements and prizes while
capturing structured activity data that apps normally never record. It needs PHP
8.4+ and Laravel 13.

Install with `composer require particle-academy/laravel-fun-lab`, then
`php artisan lfl:install`. Add the `Awardable` trait to any model, usually
`User`, and it gets a **Profile** that tracks XP, achievements and prizes.

Define the game with `LFL::setup()`: a gamed metric (an XP track), its levels,
level groups, achievements and prizes, for example
`LFL::setup(a: 'gamed-metric', with: ['slug' => 'combat-xp', 'name' => 'Combat XP'])`.

Then award, with fluent builders that end in `save()`:

```
LFL::award('combat-xp')->to($user)->amount(50)->because('defeated boss')->save();
LFL::grant('first-login')->to($user)->because('completed onboarding')->save();
```

`award` adds XP to a metric; `grant` hands out an achievement or a prize. Check
progress with `LFL::hasLevel($user, 3, metric: 'combat-xp')`, or by a level
group with `group:`.
MD,
                        ],
                        [
                            'slug' => 'levels-achievements-prizes',
                            'title' => 'Levels, achievements and prizes',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
**Achievements can unlock themselves.** When a level is reached, LFL awards the
achievements attached to that level, once each. Attaching is done through the
level's `achievements()` relation, not through `LFL::setup()`, which creates
entities but does not link them. An achievement nothing is attached to and
nothing grants is one nobody can earn. Achievements can also be hidden ("secret")
until earned.

**Prizes** are `virtual`, `physical`, `feature_unlock` or `custom`, and carry an
inventory. A `null` inventory is unlimited; when a limited prize runs out, a
grant fails with an out-of-inventory result rather than over-issuing.

**An award can be refused, by throwing.** `AwardRejectedException` is raised
when one award exceeds the per-action cap (`lfl.defaults.max_points_per_action`,
10000 by default) and when the recipient has opted out of gamification. Catch it
where an award is a side effect of something more important.
MD,
                        ],
                    ],
                ],
                [
                    'slug' => 'reading',
                    'title' => 'Reading the activity',
                    'lessons' => [
                        [
                            'slug' => 'leaderboards-and-analytics',
                            'title' => 'Leaderboards and analytics',
                            'estimated_minutes' => 7,
                            'content' => <<<'MD'
A leaderboard is a builder:

```
$leaders = LFL::leaderboard()->for(User::class)->by('xp')->take(10);
```

Sort `by` `xp`, `achievements` or `prizes` (`points` is an alias for `xp`), and
narrow it to a `daily`, `weekly`, `monthly` or all-time period. Players who have
opted out are excluded by default. This site's own leaderboard is built exactly
this way.

The point of the package is the record underneath. Every award is written to an
event log, and the analytics builder reads it back: `count()`, `total()`,
`average()`, `activeUsers()`, `achievementCompletionRate()`, `timeSeries()`,
`byAwardType()` and `bySource()`, filtered with `byType()`, `fromSource()` and
`period()`, and `export()` when you want the rows. Tag awards with a source
(`from(...)`) and you can later ask which part of your app actually drives
engagement.
MD,
                        ],
                        [
                            'slug' => 'events-and-defaults',
                            'title' => 'Events, broadcasting and the safe defaults',
                            'estimated_minutes' => 8,
                            'content' => <<<'MD'
LFL fires Laravel events as it awards: `XpAwarded`, `AchievementUnlocked`,
`PrizeAwarded` and others. By default events are dispatched and logged to the
database, and **broadcasting is off**. Turn it on with `lfl.events.broadcast`, and
`XpAwarded`, `AchievementUnlocked` and `PrizeAwarded` broadcast on a private
channel per profile.

A broadcast payload's `reason`, `source` and `meta` are user-supplied, so
sanitise them before you render them.

The HTTP API is locked down by default, since 0.4.0. Writes are off
(`lfl.api.writes` is `false`), and when you turn them on, `lfl.awardables` must
list every model class that may receive awards. And `total_xp` is no longer
mass-assignable on `Profile`, so a `Profile::update()` that tries to set it
silently drops the field: XP cannot be forged that way.

Gamification has no MCP bridge.
MD,
                        ],
                    ],
                ],
            ],
            'test' => [
                'slug' => 'fancy-gamification-test',
                'title' => 'Gamification — check',
                'passing_score' => 70,
                'questions' => [
                    [
                        'prompt' => 'Which call gives a user 50 XP on the `combat-xp` metric?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Awards are fluent builders ending in `save()`. `award` is for XP; `grant` is for achievements and prizes.',
                        'options' => [
                            ['label' => '`LFL::award(\'combat-xp\')->to($user)->amount(50)->because(\'...\')->save()`', 'is_correct' => true],
                            ['label' => '`LFL::grant(\'combat-xp\')->to($user)->amount(50)->save()`', 'is_correct' => false],
                            ['label' => '`$user->profile->update([\'total_xp\' => 50])`', 'is_correct' => false],
                            ['label' => '`LFL::setup(a: \'gamed-metric\', with: [\'xp\' => 50])`', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'An achievement is attached to level 3 of a metric. When is it awarded?',
                        'type' => 'multiple_choice',
                        'explanation' => 'Achievements attached to a level are awarded automatically when that level is reached, once each.',
                        'options' => [
                            ['label' => 'Automatically, once, when the user reaches level 3', 'is_correct' => true],
                            ['label' => 'Only when your app calls `LFL::grant()` for it', 'is_correct' => false],
                            ['label' => 'Every time the user earns XP at level 3 or above', 'is_correct' => false],
                            ['label' => 'At the end of the leaderboard period', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'With default configuration, your app awards 50,000 XP in one call. What happens?',
                        'type' => 'multiple_choice',
                        'explanation' => 'One award above `lfl.defaults.max_points_per_action` (10000 by default) throws `AwardRejectedException`.',
                        'options' => [
                            ['label' => 'It throws `AwardRejectedException`: the per-action cap is 10000', 'is_correct' => true],
                            ['label' => 'It is awarded in full', 'is_correct' => false],
                            ['label' => 'It is silently reduced to 10000', 'is_correct' => false],
                            ['label' => 'It is queued for an admin to approve', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'True or false: laravel-fun-lab broadcasts `XpAwarded` over WebSockets by default.',
                        'type' => 'true_false',
                        'explanation' => 'Events are dispatched and logged by default; broadcasting is off until you set `lfl.events.broadcast`.',
                        'options' => [
                            ['label' => 'False', 'is_correct' => true],
                            ['label' => 'True', 'is_correct' => false],
                        ],
                    ],
                    [
                        'prompt' => 'Your front end renders the `reason` from a broadcast award event. What must it do first?',
                        'type' => 'multiple_choice',
                        'explanation' => 'The reason, source and meta fields in a broadcast payload are user-supplied and must be sanitised before rendering.',
                        'options' => [
                            ['label' => 'Sanitise it: the field is user-supplied', 'is_correct' => true],
                            ['label' => 'Nothing: LFL escapes every payload field', 'is_correct' => false],
                            ['label' => 'Translate it: reasons are stored as keys', 'is_correct' => false],
                            ['label' => 'Fetch it again over HTTP: broadcasts carry only ids', 'is_correct' => false],
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
