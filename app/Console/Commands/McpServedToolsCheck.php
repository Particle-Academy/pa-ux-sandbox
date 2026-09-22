<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Mcp\Servers\FancyUiRegistry;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use ReflectionClass;

/**
 * Does the LIVE MCP serve every tool this server declares?
 *
 * ## Why this exists
 *
 * `search-backend-packages` was committed on 2026-08-22, merged to `main`,
 * deployed, and **never served**. A month later `tools/list` on the public
 * endpoint returned 15 tools against the 18 the server declares — the three
 * missing being exactly the last three appended to `$tools`, in order.
 *
 * Nothing caught it because nothing compared the two. The site was current, the
 * MCP's DATA was current (`list-connector-services` returned the connector
 * index committed that same morning), and a cache-busted `tools/list` still
 * returned 15 — so every signal anyone would think to look at said "deployed".
 * The tool list alone came from somewhere stale, and a tool that is registered
 * but unreachable looks exactly like a tool that works.
 *
 * That is this estate's most familiar defect: a mechanism built, tested,
 * committed, and wired to nothing. Here it happened at the deploy layer, which
 * is the one place none of our other checks were standing.
 *
 * ## What it does NOT do
 *
 * It does not assert a count. A count passes for the wrong reason the moment one
 * tool is added and another removed in the same change. It compares the NAMES,
 * both ways, and reports each side of the difference separately — declared but
 * not served is a deploy problem; served but not declared is a stale server.
 */
class McpServedToolsCheck extends Command
{
    protected $signature = 'mcp:served {--url=https://ui.particle.academy/mcp : The MCP endpoint to ask}
                                       {--json : Machine-readable output}';

    protected $description = 'Verify the live MCP serves every tool this server declares';

    public function handle(): int
    {
        $declared = $this->declaredToolNames();

        // Guard the guard. An empty declared list would make every comparison
        // trivially pass, which is the vacuous check this command exists to
        // replace rather than become.
        if ($declared === []) {
            $this->error('This server declares NO tools, which cannot be right.');
            $this->line('Comparing an empty list against anything passes for the wrong reason.');

            return self::FAILURE;
        }

        $served = $this->servedToolNames((string) $this->option('url'));

        // A lookup failure FAILS. "I could not ask" quietly meaning "fine" is
        // the same mistake connectors:check refuses to make.
        if ($served === null) {
            $this->error('Could not read tools/list from '.$this->option('url').'.');
            $this->line('That is a FAILURE, not a pass: an unanswered question is not a clean answer.');

            return self::FAILURE;
        }

        $missing = array_values(array_diff($declared, $served));
        $extra = array_values(array_diff($served, $declared));

        if ($this->option('json')) {
            $this->line((string) json_encode([
                'declared' => $declared,
                'served' => $served,
                'declared_but_not_served' => $missing,
                'served_but_not_declared' => $extra,
            ], JSON_PRETTY_PRINT));

            return $missing === [] && $extra === [] ? self::SUCCESS : self::FAILURE;
        }

        $this->line(sprintf('%d declared, %d served.', count($declared), count($served)));

        if ($missing !== []) {
            $this->newLine();
            $this->error(count($missing).' tool(s) are DECLARED but not served:');
            foreach ($missing as $name) {
                $this->line('  '.$name);
            }
            $this->line('Registered, deployed, and unreachable. Consumers cannot call these,');
            $this->line('and nothing else reports it — the code and the site both look current.');
        }

        if ($extra !== []) {
            $this->newLine();
            $this->error(count($extra).' tool(s) are SERVED but not declared here:');
            foreach ($extra as $name) {
                $this->line('  '.$name);
            }
            $this->line('The endpoint is running a different build than this checkout.');
        }

        if ($missing === [] && $extra === []) {
            $this->info('Every declared tool is served, and nothing else is.');

            return self::SUCCESS;
        }

        return self::FAILURE;
    }

    /**
     * The tool names THIS server declares.
     *
     * Asks each tool for its own `name()` rather than kebab-casing the class,
     * because that method honours a `#[Name]` attribute and a `$name` property
     * first. Re-deriving the name here would be a second implementation of the
     * rule, and it would disagree with the server on exactly the tools someone
     * renamed deliberately.
     *
     * @return list<string>
     */
    private function declaredToolNames(): array
    {
        // Without the constructor: the server takes a Transport it does not
        // need in order to say what it declares, and building one here would
        // couple this check to how the endpoint is wired.
        $reflection = new ReflectionClass(FancyUiRegistry::class);
        $property = $reflection->getProperty('tools');
        $property->setAccessible(true);

        $names = [];
        foreach ((array) $property->getValue($reflection->newInstanceWithoutConstructor()) as $class) {
            // Through the CONTAINER: several tools take injected dependencies,
            // and this must build them the way the server does rather than a
            // way that happens to work for the ones with no constructor.
            if (is_string($class) && class_exists($class)) {
                $names[] = app($class)->name();
            }
        }

        sort($names);

        return $names;
    }

    /**
     * The tool names the live endpoint actually serves.
     *
     * `null` means the question could not be asked — distinct from "it serves
     * none", which would be a finding.
     *
     * @return list<string>|null
     */
    private function servedToolNames(string $url): ?array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders(['Accept' => 'application/json, text/event-stream'])
                ->post($url, [
                    'jsonrpc' => '2.0',
                    'id' => 1,
                    'method' => 'tools/list',
                    'params' => (object) [],
                ]);
        } catch (ConnectionException) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $tools = $response->json('result.tools');

        if (! is_array($tools)) {
            return null;
        }

        $names = [];
        foreach ($tools as $tool) {
            if (is_array($tool) && is_string($tool['name'] ?? null)) {
                $names[] = $tool['name'];
            }
        }

        sort($names);

        return $names;
    }
}
