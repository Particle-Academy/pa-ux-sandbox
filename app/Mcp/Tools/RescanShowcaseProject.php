<?php

namespace App\Mcp\Tools;

use App\Jobs\ScanShowcaseSubmission;
use App\Mcp\Tools\Concerns\ResolvesAgentKey;
use App\Models\ShowcaseSubmission;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description(<<<'TXT'
Re-run verification for one of the user's showcase submissions (requires their
`agent_key`) — call it after installing the Fancy Pixel snippet (website) or
the Fancified README badge (repo). The scan re-checks verification AND
refreshes the detected + registry-linked package list. Then poll
`showcase-project-status` for the outcome.
TXT)]
class RescanShowcaseProject extends Tool
{
    use ResolvesAgentKey;

    /** Rescans allowed per submission per 10 minutes. */
    private const MAX_PER_WINDOW = 3;

    public function handle(Request $request): Response
    {
        $key = $this->resolveAgentKey($request);
        if ($key instanceof Response) {
            return $key;
        }

        $submission = ShowcaseSubmission::query()
            ->where('user_id', $key->user_id)
            ->where('id', (int) $request->get('id', 0))
            ->first();

        if ($submission === null) {
            return Response::error('No submission with that id belongs to this user. Use `showcase-project-status` to list their submissions.');
        }

        if (! RateLimiter::attempt('showcase-agent-rescan:'.$submission->id, self::MAX_PER_WINDOW, static fn () => true, 600)) {
            return Response::error('Rescan rate limit reached for this submission (max '.self::MAX_PER_WINDOW.' per 10 minutes). Poll `showcase-project-status` instead.');
        }

        ScanShowcaseSubmission::dispatch($submission);

        return Response::json([
            'rescanning' => true,
            'id' => $submission->id,
            'kind' => $submission->kind,
            'checking' => $submission->kind === 'repo'
                ? 'Fancified badge in the README + Fancy usage across component files (+ package detection from manifests/source)'
                : 'Fancy Pixel + Fancy package usage on the homepage',
            'next' => 'Poll `showcase-project-status` in ~30s.',
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'agent_key' => $schema->string()
                ->description('The agent access key the user minted on /showcase/mine.')
                ->required(),
            'id' => $schema->integer()->description('The submission id to rescan.')->required(),
        ];
    }
}
