<?php

namespace App\Mcp\Tools;

use App\Support\Docs\SupportPolicy;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Upgrade an app to a newer Fancy UI kit version — call this when a project is on an older kit line, when an install starts failing to resolve, or when asked "how do I update Fancy UI?". Returns WHY the release exists, exactly WHAT breaks, the ordered commands to run, and how to tell when it worked. Pass `from` (e.g. "0.4") to scope it to one hop.')]
class UpgradeKit extends Tool
{
    public function handle(Request $request): Response
    {
        $from = $this->normalizeVersion((string) $request->get('from', ''));
        $current = (string) config('kit.version');

        if ($from !== '' && version_compare($from, $current, '>=')) {
            return Response::json([
                'title' => "Already on kit {$current}",
                'summary' => $from === $current
                    ? "You are on the current kit line ({$current}). Nothing to upgrade."
                    : "You named {$from}, which is ahead of the published current line ({$current}).",
                'still_worth_doing' => 'Package versions move on their own schedule inside a kit line. `npm outdated` / `composer outdated` will still show upgrades — those are ordinary releases, not a kit hop.',
                'support' => $this->support(),
            ]);
        }

        return Response::json([
            'title' => "Upgrade Fancy UI to kit {$current}",
            'read_this_first' => $this->headline(),
            'why' => $this->why(),
            'what_breaks' => $this->whatBreaks(),
            'how' => $this->how(),
            'verify' => $this->verify(),
            'if_it_goes_wrong' => $this->troubleshooting(),
            'support' => $this->support(),
            'docs' => [
                'upgrade' => 'https://ui.particle.academy/docs/installation',
                'versions_and_support' => 'https://ui.particle.academy/docs/versions',
                'requirements' => 'https://ui.particle.academy/docs/requirements',
                'per_package_changelogs' => 'Every package keeps a Keep a Changelog CHANGELOG.md. Read the entry for the version you are moving to — it states the consumer action, not just what changed.',
            ],
        ]);
    }

    private function headline(): string
    {
        return 'Kit 0.5 changes what the packages REQUIRE, not what they do. No component API changed, nothing was removed, nothing was renamed. If your app is already on React 19 and Node 22, this upgrade is a version bump and nothing else — most of the work below is verification, not migration.';
    }

    /** @return array<string, mixed> */
    private function why(): array
    {
        return [
            'summary' => 'The suite was split across incompatible platform floors, so no package could rely on anything newer than its weakest sibling.',
            'reasons' => [
                'PHP was split across 8.2 and 8.3 with the framework spanning Laravel 11-13, which meant every package tested against a matrix it did not actually support in anger.',
                'Most TypeScript packages declared NO Node engine range at all. That is not "supporting old Node" — it means a consumer on Node 18 installed cleanly and discovered the problem at runtime.',
                'React 18 support was a claim nothing tested. Every build and every test ran against React 19, so the 18 half of the peer range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.',
            ],
            'what_a_kit_version_is' => 'A kit version is the set of package releases that shipped and were TESTED TOGETHER. Individual packages keep their own version numbers on their own schedule — react-fancy being 5.x while fancy-flow is 0.38 is not drift, it is the point of having a kit tag. Do not try to align package versions.',
        ];
    }

    /** @return list<array<string, string>> */
    private function whatBreaks(): array
    {
        return [
            [
                'change' => 'Node floor is now >=22 on every package',
                'who_is_affected' => 'Anyone on Node 18 or 20.',
                'what_you_must_do' => 'Upgrade to Node 22 (the active LTS). Node 18 is end-of-life; 20 is maintenance-only.',
                'how_it_will_show_up' => 'npm only WARNS on an engines mismatch, so it may look fine and fail later at runtime. pnpm FAILS the install outright. The same declaration behaves differently depending on your package manager.',
            ],
            [
                'change' => 'React 18 is no longer supported — peers are ^19.0.0',
                'who_is_affected' => 'Anyone still on React 18.',
                'what_you_must_do' => 'Upgrade the app to React 19 first, then take this release. Or stay on the 0.4 line, which keeps receiving fixes for the window below.',
                'how_it_will_show_up' => 'An ERESOLVE peer conflict on install.',
            ],
            [
                'change' => 'PHP floor is now ^8.4, framework requirement narrows to ^13.0',
                'who_is_affected' => 'Laravel apps on PHP 8.2/8.3, or on Laravel 11/12.',
                'what_you_must_do' => 'Upgrade PHP to 8.4 and Laravel to 13, then `composer update`.',
                'how_it_will_show_up' => 'Composer reports the platform requirement it cannot satisfy, naming your PHP version.',
            ],
            [
                'change' => 'Two packages took a MAJOR: fancy-echarts 5→6 and holy-sheet 1→2',
                'who_is_affected' => 'Direct consumers of either.',
                'what_you_must_do' => 'Nothing beyond the floors. They are past 1.0, so a floor raise takes a major — that is semver, not a bigger change. react-fancy 4→5 is the same story.',
                'how_it_will_show_up' => 'A caret range pinned to the old major will silently keep resolving the old version. Bump the range explicitly.',
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function how(): array
    {
        return [
            'order_matters' => 'Raise the platform FIRST. Upgrading packages while still on Node 18 or React 18 produces a resolution error that looks like a broken package rather than an unmet floor.',
            'steps' => [
                '1. Node 22: `node -v` must report v22 or newer. Use nvm/fnm/volta, and update your CI `setup-node` and any Dockerfile at the same time — a local upgrade that CI does not share fails on the next push.',
                '2. React 19: `npm install react@^19.2 react-dom@^19.2 @types/react@^19.2 @types/react-dom@^19.2`. React 19 shipped in December 2024; most apps need no code change.',
                '3. PHP apps only: PHP 8.4 and Laravel 13, then `composer update`.',
                '4. Fancy packages: `npx npm-check-updates -u --filter "@particle-academy/*" && npm install`. A plain `npm update` is NOT enough — a caret on a 0.x range locks the MINOR, so `^0.6.0` will never resolve 0.7.0 and the update silently does nothing.',
                '5. Read the CHANGELOG entry for each package you moved. Every breaking entry states the consumer action.',
                '6. Rebuild and run your tests. `npm run build` plus your suite — and if you have an SSR build, build that too.',
            ],
            'laravel_starter_kit' => 'A fresh `laravel new --using=particle-academy/fancy-starter-kit` is already on kit 0.5 — the kit ships its own lockfile, so new projects need none of this.',
            'the_cli' => 'Vendored components: `npx fancy-cli@latest add <slug>` pulls current source. The registry is version-aware — `/r/index.json?version=0.4` still serves the 0.4 set, so an app that has not upgraded yet keeps getting 0.4-correct source.',
        ];
    }

    /** @return list<string> */
    private function verify(): array
    {
        return [
            'node -v reports v22+, and your CI config says the same.',
            'npm ls react resolves a single React 19 — two copies of React is its own class of bug, and an upgrade is when it appears.',
            'The build passes, including the SSR build if you have one.',
            'Your own test suite passes. This release changes no component API, so a failure here is a real signal rather than expected churn.',
            'npm ls @particle-academy/react-fancy shows 5.x with no unmet peer warnings.',
        ];
    }

    /** @return list<array<string, string>> */
    private function troubleshooting(): array
    {
        return [
            [
                'symptom' => 'ERESOLVE: conflicting peer dependency on react',
                'cause' => 'Something in the tree still wants React 18 — often a package you have not upgraded yet.',
                'fix' => 'Upgrade every @particle-academy package together. They are released as a set; mixing kit lines is what produces this.',
            ],
            [
                'symptom' => 'npm update ran and nothing changed',
                'cause' => 'A caret on a 0.x version locks the MINOR: ^0.6.0 admits 0.6.9 but never 0.7.0.',
                'fix' => 'Bump the ranges explicitly (npm-check-updates, or edit package.json), then install.',
            ],
            [
                'symptom' => 'The install works but the app breaks at runtime with no error at install time',
                'cause' => 'Node engine mismatch under npm, which warns rather than failing.',
                'fix' => 'Check node -v. This is the failure the Node floor exists to make visible.',
            ],
            [
                'symptom' => 'A package resolves to an older version than you asked for',
                'cause' => 'A first-party sibling range capping the major. A resolver quietly choosing an older version looks exactly like success.',
                'fix' => 'npm ls <package> to see what actually resolved and which range forced it. Report it — a sibling range that caps a major is a bug on our side, not yours.',
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function support(): array
    {
        $lines = [];

        foreach (SupportPolicy::lines() as $line) {
            $lines[] = [
                'version' => $line['version'],
                'status' => $line['status'],
                'bug_fixes_until' => $line['bugFixesUntil'],
                'security_fixes_until' => $line['securityUntil'],
                'current' => $line['current'],
            ];
        }

        return [
            'lines' => $lines,
            'policy' => 'Bug fixes for '.SupportPolicy::BUG_FIX_MONTHS.' months and security fixes for '.SupportPolicy::SECURITY_MONTHS.' months, both measured from the day the NEXT kit version ships — not from a line\'s own release date.',
            'staying_put' => 'Staying on an older line is a supported choice inside that window. Published versions are never unpublished; end of life only means nothing new lands.',
        ];
    }

    private function normalizeVersion(string $raw): string
    {
        $raw = ltrim(trim($raw), 'vV');

        return preg_match('/^\d+\.\d+$/', $raw) === 1 ? $raw : '';
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'from' => $schema->string()
                ->description('Optional. The kit version the project is currently on, e.g. "0.4". Used to tell you whether there is anything to do. Omit if you do not know — the guide is the same either way.'),
        ];
    }
}
