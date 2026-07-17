<?php

namespace App\Mcp\Tools;

use App\Mcp\Tools\Concerns\ResolvesAgentKey;
use App\Models\ShowcaseSubmission;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description(<<<'TXT'
Check the verification status of the user's showcase submissions (requires
their `agent_key`). Pass `id` or `url` for one submission — including its
verification result and the Fancy packages the scan detected, each linked to
its registry page — or pass neither to list all of the user's submissions.
TXT)]
class ShowcaseProjectStatus extends Tool
{
    use ResolvesAgentKey;

    public function handle(Request $request): Response
    {
        $key = $this->resolveAgentKey($request);
        if ($key instanceof Response) {
            return $key;
        }

        $query = ShowcaseSubmission::query()->where('user_id', $key->user_id);

        $id = $request->get('id');
        $url = $request->get('url');

        if ($id !== null || $url !== null) {
            $submission = (clone $query)
                ->when($id !== null, fn ($q) => $q->where('id', (int) $id))
                ->when($id === null && $url !== null, fn ($q) => $q->where('url', (string) $url))
                ->orderByDesc('id')
                ->first();

            if ($submission === null) {
                return Response::error('No submission with that id/url belongs to this user. Omit both to list all of their submissions.');
            }

            return Response::json(['submission' => $this->present($submission)]);
        }

        return Response::json([
            'count' => (clone $query)->count(),
            'submissions' => $query->orderByDesc('id')->limit(50)->get()
                ->map(fn (ShowcaseSubmission $s) => $this->present($s))
                ->all(),
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'agent_key' => $schema->string()
                ->description('The agent access key the user minted on /showcase/mine.')
                ->required(),
            'id' => $schema->integer()->description('A specific submission id.'),
            'url' => $schema->string()->description('Look up by the registered URL instead of id.'),
        ];
    }

    /** @return array<string, mixed> */
    private function present(ShowcaseSubmission $submission): array
    {
        $scan = $submission->scan_result ?? [];

        return [
            'id' => $submission->id,
            'site_key' => $submission->site_key,
            'kind' => $submission->kind,
            'url' => $submission->url,
            'title' => $submission->title,
            'status' => $submission->status,
            'publicly_listed' => $submission->isPubliclyListable(),
            'scanned_at' => $submission->scanned_at?->toIso8601String(),
            'verification' => [
                'verified' => ($scan['verified'] ?? false) === true,
                'reason' => $scan['reason'] ?? null,
                'badge_detected' => $scan['badge'] ?? null,
                'usage_ratio' => $scan['usage_ratio'] ?? null,
            ],
            // The structured record of WHICH Fancy packages this project uses,
            // each linked to its page in the package registry when known.
            'packages' => $submission->packages ?? [],
            'registered_via' => $submission->registered_via,
            'showcase_url' => url('/showcase'),
        ];
    }
}
