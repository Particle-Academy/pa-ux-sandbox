<?php

declare(strict_types=1);

namespace App\Support\UseCases;

/**
 * Use cases — "I have this problem" → "here is how the suite solves it".
 *
 * The package list answers "what is this?". This answers "why would I reach for
 * it?", which is the question a visitor actually arrives with. Every entry
 * starts from a PROBLEM stated without any Fancy vocabulary in it, because
 * someone who already knows to search for `fancy-flow` is not the reader who
 * needs this page.
 *
 * Authoring rules:
 *
 *  - **Every `packages` slug must exist in `PackageRegistry`, and every `link`
 *    must be a real route.** A use case pointing at a package page that 404s is
 *    worse than no use case. `UseCasesTest` fails on either, so this cannot rot
 *    quietly — the failure mode being that nothing reports it.
 *  - **Steps are a HOW-TO, not a tour.** Numbered, ordered, each one an action
 *    the reader takes. If a step does not change the reader's project, cut it.
 *  - **Commands are real.** The CLI is `fancy-cli` (the bare `fancy-ui` name is
 *    blocked on npm and belongs to the MCP server); npm packages are scoped
 *    `@particle-academy/*`, Composer packages are `particle-academy/*`.
 *  - **Claims get fact-checked** the same way lessons do — see the
 *    `curriculum-fact-check` skill in the envelope, which takes this file as an
 *    argument.
 */
final class UseCaseContent
{
    /**
     * Ordered categories. The index groups by these, so the order here is the
     * order on the page.
     *
     * @return array<int,string>
     */
    public static function categories(): array
    {
        return [
            'Build this app',
            'Agents in your app',
            'Automation',
            'Documents',
            'Commerce',
            'Surfaces',
            'Platform',
        ];
    }

    /** @return array<int,array<string,mixed>> */
    public static function all(): array
    {
        return [
            self::saasSubscriptionApp(),
            self::ecommerceStorefront(),
            self::mlmNetworkPlatform(),
            self::analyticsDashboard(),
            self::onlineCoursePlatform(),
            self::realEstatePortal(),
            self::agentDrivesUi(),
            self::agentFillsSpreadsheet(),
            self::terminalApp(),
            self::agentProposesEdits(),
            self::approvalWorkflow(),
            self::durableWorkflow(),
            self::generateReports(),
            self::sellSubscriptions(),
            self::gateFeatures(),
            self::referralProgram(),
            self::liveDashboard(),
            self::liveMap(),
            self::sharedCanvas(),
            self::codeAndFiles(),
            self::gitInApp(),
            self::passwordlessLogin(),
            self::pageEditor(),
            self::crawlableByAgents(),
            self::selfUpdatingPwa(),
            self::understandUsage(),
        ];
    }

    /** @return array<string,mixed>|null */
    public static function find(string $slug): ?array
    {
        foreach (self::all() as $useCase) {
            if ($useCase['slug'] === $slug) {
                return $useCase;
            }
        }

        return null;
    }

    // ---------------------------------------------------------------- agents

    /** @return array<string,mixed> */
    private static function agentDrivesUi(): array
    {
        return [
            'slug' => 'agent-drives-your-ui',
            'title' => 'Let an agent operate your app alongside the user',
            'category' => 'Agents in your app',
            'summary' => 'Give an AI assistant real control of your interface — without screen scraping.',
            'problem' => <<<'MD'
You want an assistant that can actually *do* things in your product: fill the
form, switch the tab, correct the entry. The usual answer is browser automation —
point Playwright at your own app and have it hunt for buttons.

That works until it doesn't. Automation driving a real UI breaks on every markup
change, cannot tell a disabled button from a missing one, and locks the human out
while it runs. You end up maintaining a second, worse client for your own app.

The problem is the interface: the agent is on the *outside*, guessing. It should
be a participant, with the same access to state the UI has.
MD,
            'packages' => ['agent-integrations', 'react-fancy', 'fancy-screens'],
            'screens' => ['agent/cobrowse', 'agent/share'],
            'code' => [
                [
                    'label' => 'Expose the surface as tools, not a DOM',
                    'language' => 'ts',
                    'code' => <<<'TS'
// The adapter is the whole contract: getters and setters over the state the
// human is already looking at. Every mutation broadcasts an AgentActivity
// event, so presence, undo and coaching compose for free.
registerFormBridge(server, {
  adapter: {
    getFields: () => fields,
    setField: (handle, value) => update(handle, value),
    submit: () => form.submit(),
  },
  pendingMode: true,   // destructive actions are PROPOSED, a human confirms
});
TS,
                ],
                [
                    'label' => 'Hand an external agent the session',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// One session, one tool surface. Site tools are always present; a page's tools
// are contributed while it is mounted and withdrawn when it unmounts.
const { contributeBridges } = useCoBrowse();

useEffect(() => contributeBridges((server) =>
  registerArtboardBridge(server, { adapter }).dispose), []);
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Make the surface controlled',
                    'body' => 'An agent can only read what your app can hand it. Anything the agent should see or change needs to live in `value` + `onChange` state rather than inside the component. Most Fancy components are already controlled this way.',
                ],
                [
                    'title' => 'Install the bridge layer',
                    'body' => 'One package carries the MCP server and every per-surface bridge.',
                    'code' => 'npm install @particle-academy/agent-integrations',
                ],
                [
                    'title' => 'Register a bridge for each surface',
                    'body' => 'A bridge is an adapter: getters and setters over your existing state. Registering one exposes MCP tools the agent can call — `form_*` for forms, `sheet_*` for workbooks, `flow_*` for workflows, `page_*` to navigate the app itself. The agent calls a tool; your `onChange` fires exactly as if a human had typed.',
                ],
                [
                    'title' => 'Show the human what the agent touched',
                    'body' => 'Every mutation broadcasts an `AgentActivity` event. Wire it up and the element the agent is working on highlights in the live UI, so the human watches rather than wonders.',
                ],
                [
                    'title' => 'Stage anything destructive',
                    'body' => 'Mutations that a human would want to approve support a `pendingMode`: the agent proposes, the change appears as pending, and a person confirms it. Use it for anything you would not want done silently.',
                ],
            ],
            'link' => '/agent-playground',
            'link_label' => 'Try the Agent Playground',
        ];
    }

    /** @return array<string,mixed> */
    private static function agentFillsSpreadsheet(): array
    {
        return [
            'slug' => 'agent-builds-a-spreadsheet',
            'title' => 'Have an agent build a spreadsheet the user can check',
            'category' => 'Agents in your app',
            'summary' => 'Model-generated workbooks, reviewed in the browser, exported as real xlsx.',
            'problem' => <<<'MD'
Asking a model for "a budget spreadsheet" gets you a wall of CSV in a chat
window. The user cannot check the formulas, cannot fix the one wrong cell, and
cannot hand the result to a colleague who expects a real file.

You need the model's output to land somewhere a person can *inspect and correct*
before it becomes a deliverable — and then to leave as a genuine xlsx, not a
comma-separated approximation of one.
MD,
            'packages' => ['fancy-sheets', 'holy-sheet', 'holy-sheet-js', 'agent-integrations'],
            'screens' => ['sheets/workbook'],
            'code' => [
                [
                    'label' => 'The agent writes cells, not a file',
                    'language' => 'ts',
                    'code' => <<<'TS'
// The sheet bridge exposes the workbook as controlled state, so an agent edits
// the SAME surface the human is looking at -- formulas recalculate live, and
// nothing has to be re-opened to see the result.
registerSheetsBridge(server, {
  adapter: {
    getWorkbook: () => workbook,
    setWorkbook,
  },
});
TS,
                ],
                [
                    'label' => 'Export the finished thing server-side',
                    'language' => 'php',
                    'code' => <<<'PHP'
// holy-sheet writes real xlsx from the same data -- no headless browser, no
// spreadsheet application on the server. The Node twin (holy-sheet-js) writes
// the identical file if your backend is not PHP.
HolySheet::fromArray($rows)->write(storage_path('app/q1-sales.xlsx'));
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Put a real workbook on the page',
                    'body' => 'Render the sheet surface with the workbook in controlled state, so both the human and the agent write to the same object.',
                    'code' => 'npm install @particle-academy/fancy-sheets',
                ],
                [
                    'title' => 'Bridge it',
                    'body' => 'Register the sheets bridge to expose the `sheet_*` tools. The agent writes cells and ranges through them, which is a normal state update — the human keeps editing the whole time.',
                ],
                [
                    'title' => 'Let the human correct it',
                    'body' => 'This is the step that makes the pattern worth it. The agent produces a draft; the user fixes the two cells it got wrong. Neither has to redo the other\'s work.',
                ],
                [
                    'title' => 'Write a real file server-side',
                    'body' => 'Export through the xlsx writer that matches your runtime — they are ports of each other, so the same workbook produces the same file whichever side runs it.',
                    'code' => "composer require particle-academy/holy-sheet\n# or, on Node:\nnpm install @particle-academy/holy-sheet",
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function terminalApp(): array
    {
        return [
            'slug' => 'terminal-app-humans-and-agents-share',
            'title' => 'Build a terminal app an agent can use too',
            'category' => 'Agents in your app',
            'summary' => 'Ink components for CLIs, plus a bridge so an agent drives the same TUI.',
            'problem' => <<<'MD'
CLI tools get the worst of both worlds. For humans they are a wall of flags with
no discoverability; for agents they are text output to be parsed with regular
expressions that break the first time you improve a message.

A terminal UI fixes the human half. The agent half needs the same thing the web
side needed: a way in that is not scraping the output.
MD,
            'packages' => ['fancy-tui', 'fancy-term', 'fancy-term-host'],
            'screens' => ['terminal/session'],
            'code' => [
                [
                    'label' => 'The output buffer is controlled',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// The component diffs `output` and writes only the appended delta, so a host can
// drive it from React state -- which is what lets an agent and a human write to
// the SAME session rather than two views of it.
const [output, setOutput] = useState("");

<Terminal
  output={output}
  shells={BUILTIN_SHELLS}
  onInput={(data) => pty.write(data)}
/>
TSX,
                ],
                [
                    'label' => 'The session outlives the browser',
                    'language' => 'bash',
                    'code' => 'npm i @particle-academy/fancy-term-host',
                ],
            ],
            'steps' => [
                [
                    'title' => 'Build the interface from TUI components',
                    'body' => 'Ink components for terminal apps — lists, tables, modals, drawers — so the CLI has a real interface instead of flags.',
                    'code' => 'npm install @particle-academy/fancy-tui',
                ],
                [
                    'title' => 'Register the TUI bridge',
                    'body' => 'The same Human+ contract as the web surfaces: the agent reads and drives the actual TUI state rather than parsing what it prints.',
                ],
                [
                    'title' => 'Embed a terminal in the web app, if you need one',
                    'body' => 'A themeable, controlled terminal component for the browser, with a headless Node backend when you need real PTYs that survive a page reload.',
                    'code' => 'npm install @particle-academy/fancy-term',
                ],
            ],
            'link' => '/fancy-tui',
            'link_label' => 'See the TUI components',
        ];
    }

    /** @return array<string,mixed> */
    private static function agentProposesEdits(): array
    {
        return [
            'slug' => 'review-agent-document-edits',
            'title' => 'Let people accept or reject an agent\'s edits',
            'category' => 'Agents in your app',
            'summary' => 'Per-change review for anything a model rewrites.',
            'problem' => <<<'MD'
A model rewrites a document and hands back the whole thing. Now someone has to
read all of it to find what moved, and the only controls are "keep everything" or
"throw it away" — so people paste it into a diff tool, or just accept it and hope.

Rewriting is not the hard part. Reviewing is. What is missing is a way to see
each change on its own and take the good ones.
MD,
            'packages' => ['fancy-diff', 'fancy-doc-commons', 'fancy-file-commons'],
            'screens' => ['review/diff'],
            'code' => [
                [
                    'label' => 'Feed it the unified format git already produces',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// `source` is a discriminated union: {before, after} to diff in-house,
// {unified} for a git patch, {diff} for a pre-built structure. Accepting the
// unified format matters because it is what your VCS and your agent already
// produce -- no conversion step to get wrong.
<FancyDiff
  source={{ unified: patch }}
  onAcceptHunk={(hunk) => apply(hunk)}
  onRejectHunk={(hunk) => discard(hunk)}
/>
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Render the before and after as hunks',
                    'body' => 'The diff surface splits a rewrite into individual changes, each accepted or rejected on its own.',
                    'code' => 'npm install @particle-academy/fancy-diff',
                ],
                [
                    'title' => 'Keep the agent on the same document model',
                    'body' => 'The shared document core gives the editors, viewers and writers one node/tree/op model, so a change proposed against one surface means the same thing in another.',
                ],
                [
                    'title' => 'Apply only what was accepted',
                    'body' => 'Accepted hunks compose back into the document. Rejected ones never landed, so there is nothing to undo.',
                ],
            ],
        ];
    }

    // ------------------------------------------------------------ automation

    /** @return array<string,mixed> */
    private static function approvalWorkflow(): array
    {
        return [
            'slug' => 'multi-step-process-with-approvals',
            'title' => 'Automate a process that needs a human to sign off',
            'category' => 'Automation',
            'summary' => 'A visual workflow that pauses for a person and then carries on.',
            'problem' => <<<'MD'
The process is six steps, and step four is "someone senior checks it". So it
lives in a checklist, and the automation you wrote covers the three steps before
the check and nothing after.

Most workflow tools treat a human as an interruption to route around. What you
need is a run that *stops*, waits as long as it takes, and resumes with the
decision recorded — without holding a worker open for three days.
MD,
            'packages' => ['fancy-flow', 'fancy-flow-php'],
            'screens' => ['flow/approval'],
            'code' => [
                [
                    'label' => 'The approval node pauses the run',
                    'language' => 'php',
                    'code' => <<<'PHP'
// `human_approval` does not poll or block a worker -- it PERSISTS the run as
// awaiting_input and returns. The job finishes; the run does not.
$run = Flow::dispatch($workflow, ['expense' => $expense->toArray()]);

// Later, from the approval UI:
Flow::resume($run, ['approved' => true, 'by' => $manager->id]);
PHP,
                ],
                [
                    'label' => 'Refuse to save a loop before it runs',
                    'language' => 'php',
                    'code' => <<<'PHP'
use FancyFlow\Analysis\SubflowCycle;

// The runtime depth cap catches a loop only AFTER every node above the subflow
// has run on each pass, side effects included. This refuses it at the door.
$loop = SubflowCycle::find($graph, $resolver, $name);

abort_if($loop !== [], 422, 'That workflow loops: '.implode(' -> ', $loop));
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Model the process as a graph',
                    'body' => 'The editor is a React surface for designing; the engine that runs the graph is separate and needs no React at all, so the same workflow runs on a server, a worker, or a CLI.',
                    'code' => 'npm install @particle-academy/fancy-flow',
                ],
                [
                    'title' => 'Put a human node where the sign-off goes',
                    'body' => 'Built-in nodes pause the run and present a form. The run holds — not a worker — until someone answers, then continues from that point with the response available downstream.',
                ],
                [
                    'title' => 'Add AI steps if you want them, without adopting a vendor',
                    'body' => 'The core declares an LLM client contract and imports no provider SDK. You register the client you already use; opt-in adapters exist for the common ones. Swapping providers does not touch the workflow.',
                ],
                [
                    'title' => 'Run it on your backend',
                    'body' => 'A PHP runtime twin runs the same graphs on Laravel queues, so a Laravel app does not need a Node service to execute workflows.',
                    'code' => 'composer require particle-academy/fancy-flow-php',
                ],
            ],
            'link' => '/flow',
            'link_label' => 'Open the Flow gallery',
        ];
    }

    /** @return array<string,mixed> */
    private static function durableWorkflow(): array
    {
        return [
            'slug' => 'workflows-that-survive-a-restart',
            'title' => 'Run long workflows that survive a deploy',
            'category' => 'Automation',
            'summary' => 'Per-node checkpointing, so a killed worker does not redo side effects.',
            'problem' => <<<'MD'
A long automation runs inside one job. Halfway through, the worker is killed — a
deploy, a timeout, an out-of-memory. The retry starts the whole thing again.

For a pure calculation that is wasted time. For a step that sent an email, opened
a pull request or charged a card, the retry does it a second time. "Run it again"
is not a safe default once a step touches the outside world.
MD,
            'packages' => ['fancy-flow-php', 'fancy-flow'],
            'screens' => ['flow/runs'],
            'code' => [
                [
                    'label' => 'A paused run is a row, not a process',
                    'language' => 'php',
                    'code' => <<<'PHP'
// This is the whole trick. Nothing is held in memory between steps, so a deploy,
// a crash or a queue restart cannot lose a run that is waiting on a person.
Schema::create('flow_runs', function (Blueprint $table) {
    $table->id();
    $table->string('workflow');
    $table->string('status');        // running | awaiting_input | done | failed
    $table->json('state');           // everything needed to resume
    $table->timestamps();
});
PHP,
                ],
                [
                    'label' => 'Same graph, both runtimes',
                    'language' => 'bash',
                    'code' => 'composer require particle-academy/fancy-flow-php',
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the PHP runtime',
                    'body' => 'The durable runner executes a workflow as queued jobs rather than one long-running process.',
                    'code' => 'composer require particle-academy/fancy-flow-php',
                ],
                [
                    'title' => 'Checkpoint per node, not per run',
                    'body' => 'One job computes which nodes are ready and dispatches them; another claims a single node and checkpoints it when it completes. A resume picks up from the last completed node instead of the start.',
                ],
                [
                    'title' => 'Declare which steps must not be replayed',
                    'body' => 'A node marked unsafe to replay gets one attempt regardless of the retry setting, because retrying it would repeat the side effect rather than recover from it.',
                ],
                [
                    'title' => 'Let a claim be a race, safely',
                    'body' => 'Node claims are enforced by a unique constraint rather than a check-then-act, so two workers racing for the same node produce a no-op, not a double run.',
                ],
            ],
        ];
    }

    // ------------------------------------------------------------- documents

    /** @return array<string,mixed> */
    private static function generateReports(): array
    {
        return [
            'slug' => 'generate-office-documents',
            'title' => 'Generate Excel, Word and PowerPoint files from your app',
            'category' => 'Documents',
            'summary' => 'Real xlsx/docx/pptx, written headlessly — no Office, no headless browser.',
            'problem' => <<<'MD'
Someone needs the report as a real file: a spreadsheet their finance team can
open, a document their lawyer can track changes in, a deck they can present.

The usual options are all bad. A PDF is not editable. CSV loses everything. A
headless browser rendering to PDF adds a fragile binary to your deploy. And most
libraries either generate something Office opens with a repair prompt, or require
Office itself to be installed on your server.
MD,
            'packages' => ['holy-sheet', 'last-word', 'dark-slide', 'holy-sheet-js', 'last-word-js', 'dark-slide-js'],
            'screens' => ['docs/artifacts'],
            'code' => [
                [
                    'label' => 'Write a real spreadsheet',
                    'language' => 'php',
                    'code' => <<<'PHP'
use HolySheet\Workbook;

// A declarative sheet, not a cell-by-cell API -- which is what makes it
// something an AGENT can emit in one shot rather than drive imperatively.
$workbook = Workbook::make()
    ->sheet('Forecast', function ($sheet) use ($rows) {
        $sheet->headers(['Region', 'Q3', 'Q4']);
        $sheet->rows($rows);
        $sheet->format('B:C', ['numberFormat' => '#,##0']);
    });

$workbook->write(storage_path('app/reports/Q3-forecast.xlsx'));
PHP,
                ],
                [
                    'label' => 'The same call from Node',
                    'language' => 'ts',
                    'code' => <<<'TS'
// holy-sheet-js is a PORT, not a binding -- same shapes, same output, no PHP
// in the process. Pick the one that matches the runtime you are already in.
import { Workbook } from "@particle-academy/holy-sheet";

await Workbook.make()
  .sheet("Forecast", (sheet) => {
    sheet.headers(["Region", "Q3", "Q4"]);
    sheet.rows(rows);
  })
  .write("storage/reports/Q3-forecast.xlsx");
TS,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Pick the writer for the format',
                    'body' => 'Three headless writers: xlsx, docx and pptx. No Office dependency and no browser — they write the file format directly.',
                    'code' => "composer require particle-academy/holy-sheet    # xlsx\ncomposer require particle-academy/last-word     # docx\ncomposer require particle-academy/dark-slide    # pptx",
                ],
                [
                    'title' => 'Or the same thing on Node',
                    'body' => 'Each has a matched port. Same contract, same output — pick the one matching the runtime you are in rather than standing up a service in the other language.',
                    'code' => "npm install @particle-academy/holy-sheet\nnpm install @particle-academy/last-word\nnpm install @particle-academy/dark-slide",
                ],
                [
                    'title' => 'Build the document from data, not markup',
                    'body' => 'The writers take plain structures, which is what makes them usable by an agent as well as by your code — the input is JSON-shaped rather than a template language.',
                ],
                [
                    'title' => 'Round-trip when you need to read one back',
                    'body' => 'The docx and pptx packages read as well as write, and docx carries markdown bridges in both directions — useful when a model produced markdown and the deliverable is a Word file.',
                ],
            ],
        ];
    }

    // -------------------------------------------------------------- commerce

    /** @return array<string,mixed> */
    private static function sellSubscriptions(): array
    {
        return [
            'slug' => 'sell-subscriptions',
            'title' => 'Sell plans and subscriptions with Stripe',
            'category' => 'Commerce',
            'summary' => 'Products, prices and checkout, managed in your app instead of the Stripe dashboard.',
            'problem' => <<<'MD'
Your pricing lives in the Stripe dashboard. Your app has a hardcoded list of
plans that has to agree with it. When someone edits a price in Stripe, nothing
tells your app, and the mismatch surfaces as a customer being charged something
your pricing page does not show.

You want the catalog to live in your application, synced outward — one place to
change a price, and checkout that follows from it.
MD,
            'packages' => ['laravel-catalog', 'fancy-catalog-js'],
            'screens' => ['saas/plans'],
            'code' => [
                [
                    'label' => 'Create the plan and sync it outward',
                    'language' => 'php',
                    'code' => <<<'PHP'
use LaravelCatalog\Facades\Catalog;

// A plan is a product with a recurring price -- no second model to keep in step.
$pro = Catalog::createProduct(['name' => 'Pro', 'description' => 'Professional features']);

Catalog::createPrice($pro, [
    'amount'    => 2999,
    'currency'  => 'usd',
    'recurring' => ['interval' => 'month'],
]);

Catalog::syncProductAndPrices($pro);
PHP,
                ],
                [
                    'label' => 'Send the customer to checkout',
                    'language' => 'php',
                    'code' => <<<'PHP'
// One call for subscriptions and one-offs alike, so the purchase flow carries no
// Stripe-specific branching into your controllers.
$checkout = Catalog::createCheckoutSession($user, [
    'price'       => $price->stripe_price_id,
    'mode'        => 'subscription',
    'success_url' => route('checkout.success'),
    'cancel_url'  => route('pricing'),
]);

return redirect($checkout->url);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the catalog',
                    'body' => 'Products and prices as models in your own database, synced to Stripe.',
                    'code' => 'composer require particle-academy/laravel-catalog',
                ],
                [
                    'title' => 'Create products and prices',
                    'body' => 'A plan is simply a product with a recurring price — there is no separate plan model to keep in step. Every product needs at least one price before it can sync.',
                ],
                [
                    'title' => 'Sync to Stripe',
                    'body' => 'Sync explicitly, or turn on auto-sync so a saved product reaches Stripe without a second step. Queue it in production.',
                ],
                [
                    'title' => 'Send the customer to checkout',
                    'body' => 'Checkout sessions for both subscriptions and one-off payments come from the same facade, so the purchase flow does not need Stripe-specific code in your controllers.',
                ],
                [
                    'title' => 'Build the pricing page from your own data',
                    'body' => 'Because the catalog is local, the pricing page reads from your database — no API call on page load, and no second copy of the prices to keep honest.',
                ],
            ],
            'link' => '/catalog-demo',
            'link_label' => 'See the catalog demo',
        ];
    }

    /** @return array<string,mixed> */
    private static function gateFeatures(): array
    {
        return [
            'slug' => 'gate-features-by-plan',
            'title' => 'Gate features by plan and meter usage',
            'category' => 'Commerce',
            'summary' => 'One check for "can they do this?", whether it is a flag or a quota.',
            'problem' => <<<'MD'
Plan checks start as one `if` and end up everywhere: in controllers, in views, in
a job, in a queue worker. Each copy encodes the plan names slightly differently,
and the day you add a tier you find them all by grepping and missing one.

Metered limits are worse, because the failure is silent. A quota that is never
checked does not error — it just never runs out, and you find out from the bill.
MD,
            'packages' => ['laravel-fms', 'fancy-features-js'],
            'screens' => ['saas/usage'],
            'code' => [
                [
                    'label' => 'Define the feature once',
                    'language' => 'php',
                    'code' => <<<'PHP'
// config/fms.php -- boolean for on/off, resource for anything metered. Both take
// callables, so entitlement is DERIVED from the subscription rather than copied
// onto the user record where it goes stale.
'features' => [
    'use-mcp' => [
        'name'    => 'Use MCP',
        'type'    => 'boolean',
        'enabled' => fn ($user) => $user->subscribedToProduct('pro'),
    ],

    'ai-tokens' => [
        'name'  => 'AI tokens',
        'type'  => 'resource',
        'limit' => 10_000,
        'usage' => fn ($user) => $user->tokenUsage()->thisPeriod()->sum('tokens'),
    ],
],
PHP,
                ],
                [
                    'label' => 'Ask the same question everywhere',
                    'language' => 'php',
                    'code' => <<<'PHP'
use ParticleAcademy\Fms\Facades\FMS;

// Route boundary.
Route::middleware(['auth', RequireFeature::class.':use-mcp'])->group(/* ... */);

// UI hint, from the SAME source -- so the interface never offers something the
// route will refuse, and a metered feature can show what is left before it
// denies.
return Inertia::render('Workspace', [
    'can'       => ['useMcp' => FMS::canAccess('use-mcp')],
    'remaining' => FMS::remaining('ai-tokens'),
]);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install feature management',
                    'body' => 'Boolean features and metered resource features behind a single access check.',
                    'code' => 'composer require particle-academy/laravel-fms',
                ],
                [
                    'title' => 'Define features once, in config',
                    'body' => 'Each feature declares its type and either its enabled rule or its limit. Callbacks receive the user and a context, so a limit can vary by plan without the call sites knowing how.',
                ],
                [
                    'title' => 'Check access the same way everywhere',
                    'body' => 'One facade, one helper, one middleware for routes. Gates and policies are consulted first, so existing authorization keeps working rather than being replaced.',
                ],
                [
                    'title' => 'Attach features to what you sell',
                    'body' => 'With the catalog installed, features attach to products — so the plan a customer bought determines what they can reach, with no second mapping to maintain.',
                ],
            ],
            'link' => '/packages/laravel-fms',
            'link_label' => 'laravel-fms reference',
        ];
    }

    /** @return array<string,mixed> */
    private static function referralProgram(): array
    {
        return [
            'slug' => 'referral-program',
            'title' => 'Run a referral or affiliate program',
            'category' => 'Commerce',
            'summary' => 'Referral trees, commissions and rank progress, with the UI to show them.',
            'problem' => <<<'MD'
Referral schemes look trivial until the second level. Who gets credit when a
referred user refers someone else? What happens to a commission when the
underlying payment is refunded? How does a participant see why they were paid
what they were paid?

Get the arithmetic wrong and you are not fixing a bug, you are correcting
people's money — which is a different kind of problem.
MD,
            'packages' => ['fancy-mlm', 'fancy-mlm-js', 'fancy-mlm-ui'],
            'screens' => ['mlm/downline', 'mlm/commissions'],
            'code' => [
                [
                    'label' => 'Compute a reward per order',
                    'language' => 'php',
                    'code' => <<<'PHP'
// One computation PER REWARD, carrying level, metric and recipient -- that
// record is what a statement is rendered from months later, when somebody asks
// why a specific number is what it is.
$rewards = Mlm::computeRewards($order, [
    'levels' => [1 => 0.10, 2 => 0.05],
]);
PHP,
                ],
                [
                    'label' => 'Reverse, do not delete',
                    'language' => 'php',
                    'code' => <<<'PHP'
// Refunds land after payout runs. A reversed row that stays visible -- struck
// through and excluded from the paid total -- is the difference between a
// statement someone trusts and one they dispute.
Commission::where('order_id', $order->id)
    ->where('status', '!=', 'paid')
    ->update(['status' => 'reversed', 'reversed_at' => now()]);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the engine',
                    'body' => 'Referral trees with the common structures — unilevel, binary, matrix — and the commission rules that go with them.',
                    'code' => 'composer require particle-academy/fancy-mlm',
                ],
                [
                    'title' => 'Record referrals as they happen',
                    'body' => 'Sign-ups attach to the referrer, building the tree as a side effect of registration rather than as a nightly reconciliation.',
                ],
                [
                    'title' => 'Show participants their own numbers',
                    'body' => 'Ready surfaces for the downline tree, the commission statement and rank progress — the three things a participant asks for, and the three that generate support tickets when missing.',
                    'code' => 'npm install @particle-academy/fancy-mlm-ui',
                ],
            ],
            'link' => '/packages/fancy-mlm',
            'link_label' => 'fancy-mlm reference',
        ];
    }

    // -------------------------------------------------------------- surfaces

    /** @return array<string,mixed> */
    private static function liveDashboard(): array
    {
        return [
            'slug' => 'live-dashboard',
            'title' => 'Build a dashboard that stays current',
            'category' => 'Surfaces',
            'summary' => 'Charts that update when the server changes, without a refresh button.',
            'problem' => <<<'MD'
A dashboard is only useful if the numbers are current, and most dashboards are
current only at page load. The usual patch is a refresh button, or a timer that
re-fetches everything every thirty seconds whether or not anything changed.

The real failure is quieter: nobody notices stale data. A number that is twenty
minutes old looks exactly like a number that is correct, and decisions get made
on it.
MD,
            'packages' => ['fancy-echarts', 'fancy-query', 'react-fancy'],
            'screens' => ['dashboard/analytics'],
            'code' => [
                [
                    'label' => 'The chart follows state',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// An option object, not an imperative instance: no ref, no setOption, nothing to
// forget on update. A charting library that owns its own DOM is how dashboards
// end up stale without saying so.
<EChart
  style={{ height: 240 }}
  option={{
    xAxis: { type: "category", data: months },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: revenue }],
  }}
/>
TSX,
                ],
                [
                    'label' => 'Hydrate, then invalidate on events',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// First paint is server data rather than a spinner; the panel then refreshes
// when its data actually changes. Polling is a tax you pay forever.
const { data } = useHydratedQuery({
  queryKey: ["revenue", period],
  initialData: page.props.revenue,
});

useEchoInvalidation("orders", ["revenue"]);
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Lay the page out with the primitives',
                    'body' => 'Cards, tables, layout shells and stat blocks from the core library, so the dashboard chrome is not hand-rolled.',
                    'code' => 'npm install @particle-academy/react-fancy',
                ],
                [
                    'title' => 'Add charts',
                    'body' => 'A React wrapper over Apache ECharts — the full chart vocabulary, driven by props rather than by an imperative instance you have to manage.',
                    'code' => 'npm install @particle-academy/fancy-echarts',
                ],
                [
                    'title' => 'Wire the data through the server-state layer',
                    'body' => 'TanStack Query, Inertia hydration and Echo-driven invalidation together: the page arrives hydrated, then invalidates when the server says something changed. No polling, and no refresh button.',
                    'code' => 'npm install @particle-academy/fancy-query',
                ],
                [
                    'title' => 'Let an agent read the charts too',
                    'body' => 'The charts bridge exposes the same chart state to an assistant, so "why did this dip?" can be answered against the data on screen rather than a screenshot of it.',
                ],
            ],
            'link' => '/inspiration',
            'link_label' => 'Browse 20 dashboard designs',
        ];
    }

    /** @return array<string,mixed> */
    private static function liveMap(): array
    {
        return [
            'slug' => 'live-map-tracking',
            'title' => 'Put a map with live tracking in your app',
            'category' => 'Surfaces',
            'summary' => 'One map component, either engine, with tracking built in.',
            'problem' => <<<'MD'
You add a map, and you have picked a vendor. The component you wrote wraps their
API, their marker objects and their event names, so changing engine later means
rewriting every screen that shows a map — usually because of pricing rather than
anything technical.

And live tracking, the thing maps are usually for, is rarely included: you get a
map and then build the moving part yourself.
MD,
            'packages' => ['fancy-map'],
            'steps' => [
                [
                    'title' => 'Install the map surface',
                    'body' => 'Engine-agnostic by design: OpenStreetMap and Google are adapters behind the same component, so the choice is configuration rather than architecture.',
                    'code' => 'npm install @particle-academy/fancy-map',
                ],
                [
                    'title' => 'Drive it with data, not imperative calls',
                    'body' => 'Markers and view state are props. Moving something means updating state, which is also what makes the surface bridgeable.',
                ],
                [
                    'title' => 'Turn on live tracking',
                    'body' => 'Following a moving subject is part of the component rather than something you assemble from event handlers.',
                ],
                [
                    'title' => 'Let an agent drive the view',
                    'body' => 'The map bridge exposes pan, pins, fit-bounds and follow — so an assistant can take the user to the right place instead of describing where to look.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function sharedCanvas(): array
    {
        return [
            'slug' => 'shared-canvas',
            'title' => 'Give people a canvas to work on together',
            'category' => 'Surfaces',
            'summary' => 'Whiteboard and design-canvas surfaces, with agents as participants.',
            'problem' => <<<'MD'
Planning happens on a shared canvas, and then the canvas is somewhere else —
another tab, another vendor, another login, disconnected from the data the plan
is about.

Embedding one usually means an iframe you cannot read from, which makes the
canvas a picture rather than part of your application.
MD,
            'packages' => ['fancy-whiteboard', 'fancy-artboard', 'fancy-screens'],
            'screens' => ['canvas/whiteboard'],
            'code' => [
                [
                    'label' => 'Viewport and items are controlled',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// The board holds no state of its own, which is what lets a human drag a note
// and an agent move the same note through the bridge without the two fighting
// over who is authoritative.
const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

<Board viewport={viewport} onViewportChange={setViewport}>
  {items.map((item) => (
    <StickyNote key={item.id} item={item} onChange={updateItem} />
  ))}
</Board>
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Add the canvas',
                    'body' => 'A collaborative whiteboard, or the design-canvas surface when the content is pieces and notes rather than freehand.',
                    'code' => "npm install @particle-academy/fancy-whiteboard\n# or\nnpm install @particle-academy/fancy-artboard",
                ],
                [
                    'title' => 'Keep the contents as your data',
                    'body' => 'Board state is controlled, so what is on the canvas is something your app can read, save and act on — not an opaque document owned by a third party.',
                ],
                [
                    'title' => 'Add presence across screens',
                    'body' => 'The screen registry tracks who is where, so several people (and any agents) on different surfaces can see each other working.',
                ],
                [
                    'title' => 'Let an agent contribute',
                    'body' => 'The whiteboard bridge means an assistant can add and arrange items on the same board, which is more useful than describing what it would add.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function codeAndFiles(): array
    {
        return [
            'slug' => 'code-and-file-surfaces',
            'title' => 'Add a code editor and a file browser',
            'category' => 'Surfaces',
            'summary' => 'Editing, browsing and previewing files inside your product.',
            'problem' => <<<'MD'
Your product needs to show a file: a config, a template, a snippet, an upload.
The choices are a `<textarea>` with no highlighting, or a full IDE-scale editor
that dwarfs the rest of your bundle and still needs a week of configuration.

And "show a file" quickly means several kinds of file — an image, a PDF, an
audio clip — each of which becomes its own integration.
MD,
            'packages' => ['fancy-code', 'react-fancy', 'fancy-file-commons'],
            'screens' => ['code/editor'],
            'code' => [
                [
                    'label' => 'An editor an agent can drive',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// Controlled value + onChange, so `code_*` bridge tools edit exactly what the
// human sees. The toolbar and panel are composable rather than baked in.
<CodeEditor value={source} onChange={setSource} language="typescript" lineNumbers>
  <CodeEditor.Toolbar />
  <CodeEditor.Panel />
</CodeEditor>
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Add the editor',
                    'body' => 'A lightweight embedded code editor — highlighting and editing without an IDE\'s footprint.',
                    'code' => 'npm install @particle-academy/fancy-code',
                ],
                [
                    'title' => 'Browse files with the core library',
                    'body' => 'The file browser is a core primitive. It is controlled, so selection and navigation are your state, and it takes an opt-in new-folder affordance when your app allows creating them.',
                ],
                [
                    'title' => 'Preview whatever the file turns out to be',
                    'body' => 'Media viewers for images, video, audio and PDFs, plus a resolver that picks the right one — so "show this file" is one component rather than a switch statement you maintain.',
                ],
                [
                    'title' => 'Show changes as changes',
                    'body' => 'The shared file core is what lets the editor show a diff gutter against a base revision instead of just current contents.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function gitInApp(): array
    {
        return [
            'slug' => 'git-inside-your-app',
            'title' => 'Show repositories, history and pull requests in your product',
            'category' => 'Surfaces',
            'summary' => 'Provider-neutral Git surfaces — GitHub, GitLab or Bitbucket.',
            'problem' => <<<'MD'
Your product needs to show what changed: a history, a diff, a pull request. So
you integrate with GitHub — and now GitHub's shapes are in your domain model, and
supporting GitLab means a second integration that is similar enough to look
shareable and different enough not to be.

Meanwhile anything that *writes* to a repository is a mutation on someone else's
source of truth, which is not a thing to do on a model's say-so.
MD,
            'packages' => ['fancy-git', 'fancy-git-ui', 'fancy-git-js'],
            'screens' => ['git/history'],
            'code' => [
                [
                    'label' => 'One contract, any host',
                    'language' => 'php',
                    'code' => <<<'PHP'
// The provider adapters normalise GitHub, GitLab and Bitbucket to the SAME
// shape, so the surface above does not branch on which host a repo lives at --
// and adding a host is a package, not a rewrite.
$prs = Git::provider($repo->host)->pullRequests($repo->fullName);

return Inertia::render('Repo/Show', [
    'commits' => Git::log($repo->path, limit: 50),
    'status'  => Git::status($repo->path),
    'reviews' => $prs,
]);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the headless core',
                    'body' => 'Git operations plus a normalized provider contract, so a repository looks the same to your code whichever host it lives on.',
                    'code' => 'composer require particle-academy/fancy-git',
                ],
                [
                    'title' => 'Add the host adapter you need',
                    'body' => 'GitHub, GitLab and Bitbucket ship as separate adapter packages in both languages. Adding a second host is adding a package, not a parallel integration.',
                ],
                [
                    'title' => 'Render the surfaces',
                    'body' => 'Controlled, provider-neutral components for repository, history and pull-request views.',
                    'code' => 'npm install @particle-academy/fancy-git-ui',
                ],
                [
                    'title' => 'Keep writes proposal-first',
                    'body' => 'The Git bridge exposes reads directly, but mutations are proposals a human confirms. An agent can prepare a commit or a review; a person decides whether it lands.',
                ],
            ],
        ];
    }

    // -------------------------------------------------------------- platform

    /** @return array<string,mixed> */
    private static function passwordlessLogin(): array
    {
        return [
            'slug' => 'passwordless-login',
            'title' => 'Add passkey sign-in',
            'category' => 'Platform',
            'summary' => 'WebAuthn login and passkey management, on top of Fortify.',
            'problem' => <<<'MD'
Passwords are the support burden that never ends: resets, reuse, and the phishing
that no amount of user education prevents.

Passkeys solve it, but WebAuthn is a specification with sharp edges, and the
tempting move — implementing the ceremony yourself — means writing cryptographic
verification code, which is the last place you want to be original.
MD,
            'packages' => ['fancy-passkeys', 'fancy-passkeys-js', 'fancy-passkeys-ui'],
            'screens' => ['auth/passkeys'],
            'code' => [
                [
                    'label' => 'Augment Fortify rather than replace it',
                    'language' => 'php',
                    'code' => <<<'PHP'
// Passkeys are an ADDITIONAL factor route, not a parallel auth stack -- the
// package wraps web-auth/webauthn-lib and adds routes beside Fortify's, so
// password login, 2FA and recovery keep working exactly as before.
Passkeys::routes();          // /passkeys/register, /passkeys/login

// There is NO cryptography of our own here. That is deliberate: a hand-rolled
// WebAuthn verifier is the last thing an application should own.
PHP,
                ],
                [
                    'label' => 'Detect capability before offering it',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// Offering a passkey the device cannot produce is a dead end the user cannot
// diagnose. Ask first, then render the prompt.
const { supported, platformAuthenticator, conditionalUi } = usePasskeySupport();

{supported ? <PasskeySignIn /> : <PasswordSignIn />}
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the server side',
                    'body' => 'A thin wrapper over the established WebAuthn library — no cryptography of our own. On Laravel it augments Fortify rather than replacing your auth stack.',
                    'code' => 'composer require particle-academy/fancy-passkeys',
                ],
                [
                    'title' => 'Add the sign-in and management UI',
                    'body' => 'Passkey sign-in plus a manager where users name, review and remove their keys. A React-free client subpath exists if your login page is not React.',
                    'code' => 'npm install @particle-academy/fancy-passkeys-ui',
                ],
                [
                    'title' => 'Understand what an agent may and may not do',
                    'body' => 'The passkey bridge is management-only by design. An assistant can list keys, rename one, or propose a revoke — but no tool completes a ceremony, because a gesture and a biometric are exactly the parts only the human has. That boundary is enforced by a test, not by convention.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function pageEditor(): array
    {
        return [
            'slug' => 'let-non-developers-edit-pages',
            'title' => 'Let non-developers edit pages',
            'category' => 'Platform',
            'summary' => 'A CMS whose output is your components, not arbitrary HTML.',
            'problem' => <<<'MD'
Marketing wants to change the headline without a deploy. Bolting on a general
CMS gets you a second rendering path, a second design system, and pages that stop
looking like your product the moment someone uses the WYSIWYG.

The requirement is narrower than "a CMS": editable content that still renders
through the components you already ship.
MD,
            'packages' => ['fancy-cms', 'fancy-cms-ui'],
            'screens' => ['cms/editor'],
            'code' => [
                [
                    'label' => 'Edit the page where it sits',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
import { EditablePage } from "@particle-academy/fancy-cms-ui/editor";

// Inline edit mode over the LIVE page -- hold Ctrl+Shift to reveal the toggle,
// then copy is edited in place with a floating toolbar. No IDE for marketing to
// learn, and no second rendering path: what they edit is the page.
//
// The full three-pane `Editor` (tree | canvas | inspector) is the authoring IDE
// for building layouts, and wants real width.
<EditablePage doc={doc} registry={registry} />
TSX,
                ],
                [
                    'label' => 'Render it with your own components',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
import { CmsPage } from "@particle-academy/fancy-cms-ui/react";

// The registry maps node kinds to YOUR components, so there is no second
// rendering path and no second design system to keep in step.
const registry = { hero: Hero, features: FeatureGrid, cta: CallToAction };

<CmsPage doc={doc} registry={registry} />
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the backend',
                    'body' => 'A document model for pages, stored in your database.',
                    'code' => 'composer require particle-academy/fancy-cms',
                ],
                [
                    'title' => 'Add the editor',
                    'body' => 'A WYSIWYG surface over that document model — editing structured content rather than producing free-form markup.',
                    'code' => 'npm install @particle-academy/fancy-cms-ui',
                ],
                [
                    'title' => 'Render through your own components',
                    'body' => 'Because the stored document is structured, rendering maps nodes to the components you already have. An edited page inherits your design system instead of escaping it.',
                ],
                [
                    'title' => 'Let an agent draft, and a human publish',
                    'body' => 'The CMS bridge exposes style and layout tools, so an assistant can prepare a page — with the publish decision still belonging to a person.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function crawlableByAgents(): array
    {
        return [
            'slug' => 'discoverable-by-crawlers-and-agents',
            'title' => 'Be legible to search engines and to AI agents',
            'category' => 'Platform',
            'summary' => 'Server-rendered SEO plus the well-known files agents look for.',
            'problem' => <<<'MD'
A single-page app ships an empty document and fills it in with JavaScript. Search
crawlers have mostly adapted; the newer readers — the agents fetching your pages
on someone's behalf — often have not, and either way you are relying on someone
else's renderer to see your content.

There is also a second audience now with its own conventions: files agents look
for to learn what your site is and what it permits. Missing them is not an error
anywhere, it is simply an absence.
MD,
            'packages' => ['fancy-seo', 'fancy-x-files', 'fancy-x-files-ui', 'fancy-inertia'],
            'screens' => ['seo/well-known'],
            'code' => [
                [
                    'label' => 'The files are structure, not strings',
                    'language' => 'php',
                    'code' => <<<'PHP'
// robots.txt hand-edited in a textarea is how a site ends up disallowing the
// path it meant to protect. Model the rules, render the file.
XFiles::robots()
    ->group(userAgents: ['*'], allow: ['/'], disallow: ['/admin', '/api'])
    ->sitemap(route('sitemap'))
    ->protect('/admin');           // refuses to emit a rule that exposes it
PHP,
                ],
                [
                    'label' => 'Server-render the head, not just the body',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// A page that assembles its own head after hydration is a page crawlers see as
// untitled. fancy-seo emits it in the first byte, with the JSON-LD alongside.
<Seo
  title={page.title}
  description={page.summary}
  jsonLd={{ "@context": "https://schema.org", "@type": "Article", headline: page.title }}
/>
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Render metadata on the server',
                    'body' => 'Head tags, sitemap and crawlability handled server-side for Laravel and Inertia, so what a crawler receives does not depend on running your JavaScript.',
                    'code' => 'composer require particle-academy/fancy-seo',
                ],
                [
                    'title' => 'Serve the well-known files',
                    'body' => 'robots.txt, security.txt, llms.txt, humans.txt, the sitemap and an agents manifest — generated from your app rather than pasted into public/ and forgotten.',
                    'code' => 'composer require particle-academy/fancy-x-files',
                ],
                [
                    'title' => 'Give someone a way to edit them',
                    'body' => 'Editors for each of those files, so changing what crawlers and agents are told is not a deploy.',
                ],
                [
                    'title' => 'Turn on SSR for the pages that matter',
                    'body' => 'The Inertia bridge carries a server entry point, so the pages that need to arrive complete do.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function selfUpdatingPwa(): array
    {
        return [
            'slug' => 'pwa-that-updates-itself',
            'title' => 'Ship a PWA that notices when it is out of date',
            'category' => 'Platform',
            'summary' => 'Installable, offline-capable, and honest about stale builds.',
            'problem' => <<<'MD'
A long-lived tab is running a build you deployed over three weeks ago. It keeps
calling an API that has moved on, and the errors look like backend bugs.

Service workers make this worse before better: cache aggressively and users get
stuck on an old build with no way to know. The usual toolchains bring a large
dependency and a build step that is difficult to reason about.
MD,
            'packages' => ['fancy-pwa', 'fancy-app-update'],
            'screens' => ['pwa/states'],
            'code' => [
                [
                    'label' => 'Detect a new build',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
import { AppUpdateAlert } from "@particle-academy/fancy-app-update";

// Mount once near the root. It renders NOTHING until a redeploy is detected,
// which is why it is safe to leave in place -- there is no state to manage and
// nothing to show on a normal load.
<AppUpdateAlert position="bottom-right" />
TSX,
                ],
                [
                    'label' => 'Or bring your own prompt',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// The built-in prompt is a fixed-position card. When you want it inline -- in
// your own chrome, with your own components -- take the render prop and compose
// it yourself; the detection stays the package's problem.
<AppUpdateAlert
  render={({ refresh, dismiss }) => (
    <Callout color="violet">
      <Text weight="semibold">Update available</Text>
      <Button size="sm" onClick={refresh}>Refresh</Button>
      <Button size="sm" variant="ghost" onClick={dismiss}>Later</Button>
    </Callout>
  )}
/>
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Add the PWA layer',
                    'body' => 'A lean, SSR-safe implementation with no Workbox — small enough to read and understand what it caches.',
                    'code' => 'npm install @particle-academy/fancy-pwa',
                ],
                [
                    'title' => 'Detect new builds',
                    'body' => 'A framework-agnostic detector that notices a new build is available and lets you prompt for a refresh. Pure React, no backend requirement.',
                    'code' => 'npm install @particle-academy/fancy-app-update',
                ],
                [
                    'title' => 'Tell the user, do not force them',
                    'body' => 'A prompt rather than a reload: nobody loses a half-filled form because a deploy happened while they were typing.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private static function understandUsage(): array
    {
        return [
            'slug' => 'understand-how-your-app-is-used',
            'title' => 'Find out where your interface actually fails people',
            'category' => 'Platform',
            'summary' => 'Interaction analytics you host, plus an embeddable verification badge.',
            'problem' => <<<'MD'
Page views tell you where people went, not where they struggled. The click that
did nothing, the field filled in three times, the control nobody found — none of
it shows up in a funnel.

The tools that do capture it are usually third-party scripts sending your users'
behaviour somewhere else, which is a privacy decision made on your behalf.
MD,
            'packages' => ['fancy-heuristics', 'fancy-heuristics-js', 'fancy-pixel'],
            'screens' => ['analytics/usage'],
            'code' => [
                [
                    'label' => 'Record intent, not page views',
                    'language' => 'php',
                    'code' => <<<'PHP'
// A page view tells you someone arrived. This tells you whether the app did the
// thing they came for -- which is the only number worth optimising.
Heuristics::record('checkout.completed', [
    'plan'  => $plan->slug,
    'steps' => $session->stepCount(),
]);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the collector and the server',
                    'body' => 'Interaction analytics as a matched pair: a browser collector and your own backend. The data stays in your database.',
                    'code' => "composer require particle-academy/fancy-heuristics\nnpm install @particle-academy/fancy-heuristics-js",
                ],
                [
                    'title' => 'Instrument the surfaces you doubt',
                    'body' => 'Start with the flows people contact support about. Measuring everything produces a dashboard nobody reads.',
                ],
                [
                    'title' => 'Add a verification badge if you publish work',
                    'body' => 'An embeddable badge with an interaction beacon — useful when you want a public marker on something you shipped.',
                    'code' => 'npm install @particle-academy/fancy-pixel',
                ],
            ],
            'link' => '/packages/fancy-heuristics',
            'link_label' => 'fancy-heuristics reference',
        ];
    }

    // ------------------------------------------------------- app blueprints

    /** @return array<string,mixed> */
    private static function saasSubscriptionApp(): array
    {
        return [
            'slug' => 'saas-subscription-app',
            'title' => 'A subscription SaaS app',
            'category' => 'Build this app',
            'summary' => 'Plans, checkout, per-plan feature gating and metered usage — with the catalog in your database rather than the payment processor.',
            'problem' => <<<'MD'
Every subscription app rebuilds the same four things: a pricing page, a
checkout, a way to ask "is this customer allowed to do this?", and a meter for
whatever you sell by the unit. The first two are usually fine. The third leaks —
plan checks end up as `if ($user->plan === 'pro')` scattered across controllers,
so adding a plan means finding every one of them.

The fourth is worse. Metered limits get enforced in three places with three
different answers: the UI shows a quota, the API enforces a different one, and
the invoice is computed from a third. The customer notices before you do.
MD,
            'stack' => 'Laravel + Inertia. The catalog and the gate are separate packages on purpose, so the pricing page and the enforcement can read the same source without one importing the other.',
            'packages' => ['laravel-catalog', 'laravel-fms', 'fancy-catalog-js', 'fancy-features-js', 'react-fancy'],
            'screens' => ['saas/plans', 'saas/usage'],
            'code' => [
                [
                    'label' => 'A plan is a product with a recurring price',
                    'language' => 'php',
                    'code' => <<<'PHP'
use LaravelCatalog\Facades\Catalog;

// There is no separate Plan model to keep in step with the product -- which is
// the usual source of drift between what you sell and what you charge.
$team = Catalog::createProduct(['name' => 'Team', 'description' => 'For small teams']);

Catalog::createPrice($team, [
    'amount'    => 4900,                        // cents
    'currency'  => 'usd',
    'recurring' => ['interval' => 'month'],
]);

Catalog::syncProductAndPrices($team);           // outward to Stripe; queue it in production
PHP,
                ],
                [
                    'label' => 'Define entitlement once, in config',
                    'language' => 'php',
                    'code' => <<<'PHP'
// config/fms.php -- one definition, so adding a plan is not a hunt for
// `$user->plan === '...'` across the codebase.
'features' => [
    'audit-log' => [
        'name'    => 'Audit log',
        'type'    => 'boolean',
        'enabled' => fn ($user) => $user->subscribedToProduct('team'),
    ],

    'api-calls' => [
        'name'  => 'API calls',
        'type'  => 'resource',
        'limit' => fn ($user) => $user->onPlan('scale') ? 500_000 : 10_000,
        'usage' => fn ($user) => $user->apiCalls()->thisPeriod()->count(),
    ],
],
PHP,
                ],
                [
                    'label' => 'Enforce at the edge, mirror in the UI',
                    'language' => 'php',
                    'code' => <<<'PHP'
use ParticleAcademy\Fms\Facades\FMS;
use ParticleAcademy\Fms\Http\Middleware\RequireFeature;

Route::middleware(['auth', RequireFeature::class.':audit-log'])
    ->get('/audit', [AuditController::class, 'index']);

// The SAME question in the page payload, so the UI hides what the middleware
// would refuse instead of offering a button that 403s.
return Inertia::render('Dashboard', [
    'can' => [
        'auditLog'     => FMS::canAccess('audit-log'),
        'apiRemaining' => FMS::remaining('api-calls'),
    ],
]);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the catalog and the gate',
                    'body' => 'Two packages: one owns products and prices, the other owns "is this allowed?". Keeping them separate is what lets the pricing page and the enforcement agree without a circular dependency.',
                    'code' => 'composer require particle-academy/laravel-catalog particle-academy/laravel-fms',
                ],
                [
                    'title' => 'Model plans as products with recurring prices',
                    'body' => 'Every product needs at least one price before it can sync. There is no second model to keep honest.',
                ],
                [
                    'title' => 'Define features once',
                    'body' => 'Boolean for on/off, resource for anything metered. Both take callables, so entitlement is derived from the subscription rather than copied onto the user record where it goes stale.',
                ],
                [
                    'title' => 'Answer the question in one place',
                    'body' => 'Middleware is the boundary; the payload is the hint. Because both call the same facade, the UI cannot offer something the route refuses.',
                ],
                [
                    'title' => 'Build pricing from your own database',
                    'body' => 'The catalog is local, so the pricing page needs no API call on load and cannot disagree with what checkout charges.',
                ],
            ],
            'link' => '/catalog-demo',
            'link_label' => 'See the catalog demo',
        ];
    }

    /** @return array<string,mixed> */
    private static function ecommerceStorefront(): array
    {
        return [
            'slug' => 'ecommerce-storefront',
            'title' => 'An e-commerce storefront',
            'category' => 'Build this app',
            'summary' => 'Catalog, cart and Stripe checkout, with the product data owned by your app instead of the payment processor.',
            'problem' => <<<'MD'
The tempting shortcut is to let Stripe hold the products. It works until you
need a category page, a search filter, stock, or a price that depends on who is
looking — none of which the payment processor knows about. Now every page load
is an API call, and the catalog you actually query is a cache you have to keep
honest.

The other half is the storefront itself. A product grid, a cart and a checkout
are not hard, but they are the surfaces customers judge you on, and they are
usually where a project quietly stops using its design system.
MD,
            'stack' => 'The catalog lives in your database and syncs outward to Stripe. The storefront is composed from react-fancy, so it inherits the same tokens as the rest of the app.',
            'packages' => ['laravel-catalog', 'fancy-catalog-js', 'react-fancy', 'fancy-inertia', 'fancy-seo'],
            'screens' => ['ecommerce/storefront', 'ecommerce/checkout'],
            'code' => [
                [
                    'label' => 'Query your own catalog, not an API',
                    'language' => 'php',
                    'code' => <<<'PHP'
// Products are local models, so the storefront filters, sorts and paginates in
// SQL -- no network call on page load, and no second copy of the prices.
public function index(Request $request): Response
{
    return Inertia::render('Shop/Index', [
        'products' => Product::query()
            ->where('active', true)
            ->when($request->string('q')->toString(), fn ($q, $term) =>
                $q->where('name', 'like', "%{$term}%"))
            ->with('prices')
            ->paginate(24),
    ]);
}
PHP,
                ],
                [
                    'label' => 'One checkout call for subscriptions and one-offs',
                    'language' => 'php',
                    'code' => <<<'PHP'
use LaravelCatalog\Facades\Catalog;

// The same facade covers both modes, so the cart carries no Stripe-specific
// branching into your controllers.
$checkout = Catalog::createCheckoutSession($request->user(), [
    'price'       => $price->stripe_price_id,
    'mode'        => $price->isRecurring() ? 'subscription' : 'payment',
    'success_url' => route('checkout.success'),
    'cancel_url'  => route('shop.index'),
]);

return redirect($checkout->url);
PHP,
                ],
                [
                    'label' => 'A product page a crawler can read',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// fancy-seo server-renders the head and emits Product JSON-LD, so the listing
// arrives complete in the first byte rather than after hydration. A storefront
// that only assembles itself in the browser is one search engines see as empty.
<Seo
  title={product.name}
  description={product.description}
  jsonLd={{
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    offers: {
      "@type": "Offer",
      price: (product.price.amount / 100).toFixed(2),
      priceCurrency: product.price.currency.toUpperCase(),
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  }}
/>
TSX,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the catalog',
                    'body' => 'Products and prices become models in your own database, synced outward to Stripe rather than read back from it.',
                    'code' => 'composer require particle-academy/laravel-catalog',
                ],
                [
                    'title' => 'Build the grid from your own query',
                    'body' => 'Because the catalog is local, filtering and pagination are ordinary SQL. This is the decision that keeps category pages fast.',
                ],
                [
                    'title' => 'Send the customer to checkout',
                    'body' => 'One facade call covers subscriptions and one-off payments, so the cart does not branch on payment mode.',
                ],
                [
                    'title' => 'Make product pages crawlable',
                    'body' => 'Server-rendered head plus Product JSON-LD, with price and availability that match what checkout will actually charge.',
                ],
            ],
            'link' => '/shop',
            'link_label' => 'See the shop',
        ];
    }

    /** @return array<string,mixed> */
    private static function mlmNetworkPlatform(): array
    {
        return [
            'slug' => 'mlm-network-platform',
            'title' => 'A referral or network-marketing platform',
            'category' => 'Build this app',
            'summary' => 'Downline trees, commission runs and rank qualification — the parts that are hard to get right and expensive to get wrong.',
            'problem' => <<<'MD'
Network compensation is money arithmetic over a graph, and both halves are
unforgiving. The graph has two different parent pointers — who enrolled you, and
where you sit — and they are not the same edge. Drawing one when you meant the
other is why so many downline views are quietly wrong.

The money is worse. Commissions accrue per level, get held, and get reversed
when an order refunds. Someone will ask you to explain a specific number months
later, and a statement that cannot show a reversal is a statement that disagrees
with the bank.
MD,
            'stack' => 'A PHP engine with a matching Node port, and a React surface. Unilevel, binary and matrix trees all render from the same JSON.',
            'packages' => ['fancy-mlm', 'fancy-mlm-js', 'fancy-mlm-ui', 'react-fancy'],
            'screens' => ['mlm/downline', 'mlm/commissions', 'mlm/rank'],
            'code' => [
                [
                    'label' => 'Two pointers, because they answer two questions',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// `sponsorId` is who enrolled you; `placementId` is where you sit in the tree.
// They diverge constantly in binary and matrix plans, and the component takes
// either -- so which tree you draw stays a data decision, not a rewrite.
const members = [
  { id: "m1", label: "Rosa Delgado", tier: "Director" },
  { id: "m2", label: "Ken Mbeki",    tier: "Manager", sponsorId: "m1" },
  { id: "m3", label: "Priya Raman",  tier: "Manager", sponsorId: "m1" },
];

<DownlineTree value={members} rootId="m1" edge="sponsor" />   // or edge="placement"
TSX,
                ],
                [
                    'label' => 'A commission run you can re-explain later',
                    'language' => 'php',
                    'code' => <<<'PHP'
// The engine returns a computation PER REWARD rather than one total, so a
// statement can show why a number is what it is: level, metric, recipient.
$rewards = Mlm::computeRewards($order, [
    'levels' => [1 => 0.10, 2 => 0.05, 3 => 0.02],
]);

foreach ($rewards as $reward) {
    Commission::create([
        'member_id' => $reward->recipientMemberId,
        'level'     => $reward->level,
        'amount'    => $reward->amount,
        'status'    => 'pending',
    ]);
}
PHP,
                ],
                [
                    'label' => 'Reversal is a status, not a delete',
                    'language' => 'php',
                    'code' => <<<'PHP'
// Refunds land after payout runs. Marking rather than deleting is what keeps the
// statement explainable: the row is struck through and excluded from the paid
// total instead of vanishing and leaving an unexplained gap.
public function reverseFor(Order $order): void
{
    Commission::where('order_id', $order->id)
        ->where('status', '!=', 'paid')
        ->update(['status' => 'reversed', 'reversed_at' => now()]);
}
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the engine and the surface',
                    'body' => 'The engine ships as a matched PHP and Node pair, so the same compensation rules run whichever backend you have.',
                    'code' => 'composer require particle-academy/fancy-mlm',
                ],
                [
                    'title' => 'Decide which edge your plan draws',
                    'body' => 'Unilevel usually means sponsor; binary and matrix mean placement. Get this wrong and every downline view is subtly incorrect while looking fine.',
                ],
                [
                    'title' => 'Compute rewards per order',
                    'body' => 'One computation per reward, carrying level, metric and recipient. That record is what the statement is rendered from later.',
                ],
                [
                    'title' => 'Model reversal as a status',
                    'body' => 'A reversed row that stays visible is the difference between a statement someone trusts and one they dispute.',
                ],
                [
                    'title' => 'Show rank against a real threshold',
                    'body' => 'Qualification thresholds come from your compensation plan, not the component — so changing the plan is a config change.',
                ],
            ],
            'link' => '/packages/fancy-mlm-ui',
            'link_label' => 'fancy-mlm-ui reference',
        ];
    }

    /** @return array<string,mixed> */
    private static function analyticsDashboard(): array
    {
        return [
            'slug' => 'analytics-dashboard',
            'title' => 'An analytics dashboard or admin console',
            'category' => 'Build this app',
            'summary' => 'Charts, stat bands and tables over live data — the internal surface every product grows whether it was planned or not.',
            'problem' => <<<'MD'
Every product eventually grows an internal console, and it is usually the
ugliest surface in the codebase because it was never anyone's project. It is
also the one your team looks at daily, and the one where a wrong number does the
most damage: a dashboard nobody trusts gets replaced by someone exporting to a
spreadsheet.

The technical trap is charts. A charting library that owns its own DOM will
fight your framework about who re-renders, and the usual outcome is a panel that
flickers or goes stale without saying so.
MD,
            'stack' => 'ECharts behind a React wrapper that keeps the option object declarative, so a chart is data rather than an imperative instance you have to remember to update.',
            'packages' => ['fancy-echarts', 'react-fancy', 'fancy-query', 'fancy-heuristics'],
            'screens' => ['dashboard/analytics'],
            'code' => [
                [
                    'label' => 'A chart is an option object, not an instance',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// The wrapper diffs and applies the option, so the chart follows state the way
// any other component does -- no ref, no imperative setOption, nothing to forget
// on update.
<EChart
  style={{ height: 240 }}
  option={{
    xAxis: { type: "category", data: months },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: revenue }],
  }}
/>
TSX,
                ],
                [
                    'label' => 'Live without a refresh button',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// Hydrate from the Inertia payload so the first paint is server data rather than
// a spinner, then invalidate on a broadcast event. Polling is a tax you pay
// forever; invalidation updates the panel that changed, when it changed.
const { data } = useHydratedQuery({
  queryKey: ["revenue", period],
  initialData: page.props.revenue,
});

useEchoInvalidation("orders", ["revenue"]);
TSX,
                ],
                [
                    'label' => 'Measure the console itself',
                    'language' => 'php',
                    'code' => <<<'PHP'
// An internal tool nobody opens is worth deleting, and you cannot tell without
// measuring. fancy-heuristics records interaction server-side, with no
// third-party pixel on an authenticated admin surface.
Heuristics::record('dashboard.viewed', [
    'panel'  => 'revenue',
    'period' => $period,
]);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the chart wrapper',
                    'body' => 'ECharts is the engine; the wrapper makes it declarative. Register only the chart types you use so the bundle carries only those.',
                    'code' => 'npm i @particle-academy/fancy-echarts',
                ],
                [
                    'title' => 'Lead with the numbers, not the chart',
                    'body' => 'The figures people came for should be readable before anything renders. Tabular numerals line up in a band; the chart is the explanation underneath.',
                ],
                [
                    'title' => 'Hydrate from the server payload',
                    'body' => 'First paint should be real data. A console that opens on skeletons trains people to distrust it.',
                ],
                [
                    'title' => 'Invalidate on events, not on a timer',
                    'body' => 'Broadcast invalidation refreshes the panel whose data actually changed, instead of re-fetching everything on a schedule.',
                ],
            ],
            'link' => '/packages/fancy-echarts',
            'link_label' => 'fancy-echarts reference',
        ];
    }

    /**
     * The courses blueprint deliberately previews the REAL `classroom`
     * components rather than lookalikes — a page that argues you should build
     * from the kit, illustrated with hand-rolled copies of the kit, argues
     * against itself.
     *
     * @return array<string,mixed>
     */
    private static function onlineCoursePlatform(): array
    {
        return [
            'slug' => 'online-course-platform',
            'title' => 'An online course and coaching platform',
            'category' => 'Build this app',
            'summary' => 'Curriculum, lessons, graded tests and certificates — with the selling side already attached.',
            'problem' => <<<'MD'
A course platform is two apps wearing one coat. There is the learning side —
curriculum, lessons, progress, grading, certificates — and the commercial side,
which is a subscription app with different nouns. Most builds do one well and
bolt the other on, which is why so many course sites can tell you what you
bought but not where you got to.

Progress is the part that looks trivial and is not. It is per learner, per
lesson, resumable, and it decides whether someone is certified — so it is also
the thing you get support tickets about. Grading adds a second trap: an attempt
that has not been marked yet is not a failure, and a UI that cannot tell those
apart will tell a learner they failed a test nobody has looked at.
MD,
            'stack' => 'laravel-courses owns courses, lessons, attempts and certificates; classroom is the React surface over it. Access is gated by the same feature layer that runs billing.',
            'packages' => ['laravel-courses', 'classroom', 'laravel-fms', 'react-fancy'],
            'screens' => ['courses/curriculum', 'courses/player', 'courses/certificate', 'courses/gradebook'],
            'code' => [
                [
                    'label' => 'The player is one controlled component',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// classroom ships the whole learner surface -- modules, lessons, progress and
// the graded test -- as controlled components. You supply the data and the
// handlers; there is no course-player UI to rebuild.
<CoursePlayer
  course={course}
  enrollment={enrollment}
  completedLessonIds={completedLessonIds}
  onMarkLessonComplete={(lessonId) => router.post(`/lessons/${lessonId}/complete`)}
  onStartAttempt={() => api.post(`/tests/${test.id}/attempts`)}
  onSubmitAttempt={(answers) => api.post(`/attempts/${attempt.id}/submit`, answers)}
/>
TSX,
                ],
                [
                    'label' => 'Progress belongs to (learner, lesson)',
                    'language' => 'php',
                    'code' => <<<'PHP'
// Not to a route and not to a video player -- that is what makes it resumable,
// and what makes certification a query rather than a guess.
public function complete(Request $request, Lesson $lesson): RedirectResponse
{
    $request->user()->progress()->updateOrCreate(
        ['lesson_id' => $lesson->id],
        ['completed_at' => now(), 'seconds' => $request->integer('seconds')],
    );

    return back();
}
PHP,
                ],
                [
                    'label' => 'Ungraded is not failed',
                    'language' => 'php',
                    'code' => <<<'PHP'
// An attempt with no score yet is AWAITING GRADING. Collapsing that into a
// boolean pass/fail is how a learner gets told they failed a short-answer test
// nobody has marked. The component renders the three states separately, so the
// model has to keep them separate too.
public function getStatusAttribute(): string
{
    return match (true) {
        $this->graded_at === null => 'awaiting_grading',
        $this->score >= $this->test->pass_mark => 'passed',
        default => 'failed',
    };
}
PHP,
                ],
                [
                    'label' => 'Gate the course on the subscription',
                    'language' => 'php',
                    'code' => <<<'PHP'
use ParticleAcademy\Fms\Facades\FMS;

// The learning side asks the SAME question the billing side answers, so an
// expired subscription closes the lessons without a second source of truth --
// and without the content staying reachable by URL.
'features' => [
    'cohort-coaching' => [
        'name'    => 'Live cohort coaching',
        'type'    => 'boolean',
        'enabled' => fn ($user) => $user->subscribedToProduct('coaching'),
    ],
],

abort_unless(FMS::canAccess('cohort-coaching'), 403);
PHP,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the engine and the surface',
                    'body' => '`laravel-courses` owns the models — curriculum, courses, lessons, tests, attempts, certificates. `classroom` is the React surface over them, so the learner UI is not a rebuild.',
                    'code' => 'composer require particle-academy/laravel-courses && npm i @particle-academy/classroom',
                ],
                [
                    'title' => 'Model progress per learner and per lesson',
                    'body' => 'Not per page, not per video. That is what makes it resumable and what turns certification into a query.',
                ],
                [
                    'title' => 'Keep ungraded separate from failed',
                    'body' => 'Short-answer questions need marking. An attempt awaiting grading is a third state, and the surface already renders it as one.',
                ],
                [
                    'title' => 'Attach access to the subscription',
                    'body' => 'One feature gate answers for the paywall, the lesson list and the route, so there is no second entitlement to keep in step.',
                ],
                [
                    'title' => 'Issue certificates with a verification code',
                    'body' => 'A certificate nobody can verify is a picture. The issued record carries a code, and the view renders it literal-coloured so it looks the same on every theme.',
                ],
            ],
            'link' => '/learn',
            'link_label' => 'See the curriculum',
        ];
    }

    /**
     * Industry blueprints answer a different question from the capability use
     * cases above: not "how do I solve X" but "what does MY app look like built
     * on this". They lead with composed screens for that reason — a reader
     * deciding on a stack wants to see the application, not a component.
     *
     * @return array<string,mixed>
     */
    private static function realEstatePortal(): array
    {
        return [
            'slug' => 'real-estate-portal',
            'title' => 'A real estate listing portal',
            'category' => 'Build this app',
            'summary' => 'Search, map, listing detail and enquiry capture — with the agent-facing side built in.',
            'problem' => <<<'MD'
Property search is a map and a grid showing the same result set, and they have
to agree. Filters change both. Clicking a pin scrolls the list; hovering a card
highlights the pin. Every portal rebuilds that from scratch, usually around a
map library that owns its own state and disagrees with React about who is in
charge.

Then the agent side arrives: your sales team wants to hand a buyer a link and
walk them through listings live, and an AI assistant should be able to shortlist
properties against a brief without anyone screen-scraping the site.
MD,
            'stack' => 'React + Inertia on Laravel. The map is engine-agnostic, so OpenStreetMap in development and Google in production is a one-line swap.',
            'packages' => ['react-fancy', 'fancy-map', 'agent-integrations', 'fancy-inertia', 'fancy-seo'],
            // 'real-estate/map' is BUILT and lives in screens.tsx, but is held
            // back: Leaflet paints its tiles against stale geometry in this
            // layout (measured — 1 of 6 tiles lands inside the container), and
            // fancy-map's MapHandle exposes no way to invalidate size after
            // mount. Shipping a visibly broken map on the page that exists to
            // prove the kit works would be worse than shipping two screens.
            'screens' => ['real-estate/listings', 'real-estate/enquiry'],
            'code' => [
                [
                    'label' => 'Map and list share one state',
                    'language' => 'tsx',
                    'code' => <<<'TSX'
// `view`, `markers` and `selectedId` are all CONTROLLED, so the map never holds
// state the list disagrees with. Selecting in either updates the same value.
const [selectedId, setSelectedId] = useState<string | null>(null);
const [view, setView] = useState({ center: { lat: 40.015, lng: -105.27 }, zoom: 12 });

<Map
  provider={leafletProvider()}          // googleProvider({ apiKey }) in production
  view={view}
  onViewChange={setView}
  markers={listings.map((l) => ({
    id: l.id,
    position: { lat: l.lat, lng: l.lng },
    label: formatPrice(l.price),
  }))}
  selectedId={selectedId}
  onSelect={setSelectedId}
/>
TSX,
                ],
                [
                    'label' => 'Filters run on the server',
                    'language' => 'php',
                    'code' => <<<'PHP'
// Inertia hands the filtered set to the page; the map and the grid render from
// the same array, so they cannot drift apart.
public function index(Request $request): Response
{
    $filters = $request->validate([
        'min_price' => ['nullable', 'integer'],
        'beds'      => ['nullable', 'integer', 'min:0'],
        'bounds'    => ['nullable', 'array'],
    ]);

    return Inertia::render('Listings/Index', [
        'filters'  => $filters,
        'listings' => Listing::query()
            ->when($filters['min_price'] ?? null, fn ($q, $v) => $q->where('price', '>=', $v))
            ->when($filters['beds'] ?? null, fn ($q, $v) => $q->where('beds', '>=', $v))
            ->withinBounds($filters['bounds'] ?? null)
            ->limit(200)
            ->get(),
    ]);
}
PHP,
                ],
                [
                    'label' => 'Let an agent shortlist against a brief',
                    'language' => 'ts',
                    'code' => <<<'TS'
// The map bridge exposes pan / fit / select as MCP tools, so an assistant works
// the same controlled state a human does -- no DOM scraping, no Playwright.
import { registerMapBridge } from "@particle-academy/agent-integrations";

registerMapBridge(server, {
  adapter: {
    getView: () => view,
    setView,
    listMarkers: () => markers,
    select: (id) => setSelectedId(id),
  },
});
TS,
                ],
            ],
            'steps' => [
                [
                    'title' => 'Install the map and the kit',
                    'body' => 'The map core carries no engine, so you choose Leaflet or Google per environment without changing component code.',
                    'code' => 'npm i @particle-academy/react-fancy @particle-academy/fancy-map',
                ],
                [
                    'title' => 'Render the grid and the map from ONE array',
                    'body' => 'Both read the same server-provided listings. This is the decision that stops the two views disagreeing — everything else follows from it.',
                ],
                [
                    'title' => 'Make selection controlled',
                    'body' => 'Hold `selectedId` in the page, not in the map. A pin click and a card click become the same state change, which is what makes hover-to-highlight fall out for free.',
                ],
                [
                    'title' => 'Capture the enquiry',
                    'body' => 'Controlled fields with stable handles. That is the Human+ requirement, and it is also what makes the form testable without selectors.',
                ],
                [
                    'title' => 'Make it findable',
                    'body' => 'Listings are the crawlable part of the business. `fancy-seo` server-renders the head and emits per-listing JSON-LD, so a property page arrives complete in the first byte.',
                ],
            ],
            'link' => '/packages/fancy-map',
            'link_label' => 'fancy-map reference',
        ];
    }
}
