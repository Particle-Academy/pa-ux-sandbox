<?php

namespace App\Mcp\Tools;

use App\Http\Requests\Showcase\StoreShowcaseSubmissionRequest;
use App\Jobs\ScanShowcaseSubmission;
use App\Mcp\Tools\Concerns\ResolvesAgentKey;
use App\Models\AgentKey;
use App\Models\ShowcaseSubmission;
use App\Services\Showcase\SubmissionSnippets;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description(<<<'TXT'
Register a project built with Fancy packages in the showcase at
ui.particle.academy/showcase, on the user's behalf. ASK THE USER FOR PERMISSION
FIRST — never register a project they have not approved. Requires an
`agent_key` the user mints on their showcase page (/showcase/mine → Agent
access). Registration never blocks: it creates a PENDING entry and starts the
async verification scan. The response tells you exactly what verification
needs — the Fancy Pixel snippet for a website, or the Fancified badge + real
Fancy usage for a repo — and which packages get detected + linked once the
scan runs. Check progress with `showcase-project-status`.
TXT)]
class RegisterShowcaseProject extends Tool
{
    use ResolvesAgentKey;

    /** Registrations allowed per agent key per hour. */
    private const MAX_PER_HOUR = 10;

    public function handle(Request $request): Response
    {
        $key = $this->resolveAgentKey($request);
        if ($key instanceof Response) {
            return $key;
        }

        if (! RateLimiter::attempt('showcase-agent-register:'.$key->id, self::MAX_PER_HOUR, static fn () => true, 3600)) {
            return Response::error('Rate limit reached for this agent key (max '.self::MAX_PER_HOUR.' registrations per hour). Try again later.');
        }

        $data = [
            'kind' => (string) $request->get('kind', ''),
            'url' => (string) $request->get('url', ''),
            'title' => $request->get('title'),
            'description' => $request->get('description'),
            'category' => $request->get('category'),
            'nsfw_declared' => (bool) $request->get('nsfw_declared', false),
            'made_for_children' => (bool) $request->get('made_for_children', false),
        ];

        // Same rules as the web flow — one validation contract for both surfaces.
        $validator = Validator::make($data, (new StoreShowcaseSubmissionRequest)->rules());
        if ($validator->fails()) {
            return Response::error('Invalid registration: '.implode(' ', $validator->errors()->all()));
        }
        $valid = $validator->validated();

        // Idempotent for agents: re-registering a URL the user already
        // submitted returns the existing entry instead of duplicating it.
        $existing = ShowcaseSubmission::query()
            ->where('user_id', $key->user_id)
            ->where('url', $valid['url'])
            ->first();
        if ($existing !== null) {
            return Response::json([
                'already_registered' => true,
                'submission' => $this->present($existing, $key),
            ]);
        }

        $submission = ShowcaseSubmission::create([
            'user_id' => $key->user_id,
            'kind' => $valid['kind'],
            'url' => $valid['url'],
            'title' => $valid['title'] ?? null,
            'description' => $valid['description'] ?? null,
            'category' => $valid['category'] ?? null,
            'nsfw_declared' => $valid['nsfw_declared'] ?? false,
            'made_for_children' => $valid['made_for_children'] ?? false,
            'style' => 'badge',
            'mode' => 'floating',
            'status' => 'pending',
            'registered_via' => 'agent',
            'agent_name' => $key->name,
        ]);

        ScanShowcaseSubmission::dispatch($submission);

        return Response::json([
            'registered' => true,
            'submission' => $this->present($submission, $key),
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'agent_key' => $schema->string()
                ->description('The agent access key the user minted on /showcase/mine. Attributes this registration to their account.')
                ->required(),
            'kind' => $schema->string()
                ->enum(['website', 'repo'])
                ->description('`website` = a live URL verified via the Fancy Pixel + Fancy usage on the homepage. `repo` = a GitHub repo verified via the Fancified README badge + >=30% Fancy usage in component files.')
                ->required(),
            'url' => $schema->string()
                ->description('The live site URL, or the GitHub repository URL for kind=repo.')
                ->required(),
            'title' => $schema->string()->description('Display title (max 120 chars). Auto-backfilled from the page when omitted.'),
            'description' => $schema->string()->description('Short description (max 600 chars). Auto-backfilled from the page when omitted.'),
            'category' => $schema->string()
                ->enum(array_keys(ShowcaseSubmission::CATEGORIES))
                ->description('Showcase category slug.'),
            'nsfw_declared' => $schema->boolean()->description('Declare the project NSFW (kept out of the public listing).'),
            'made_for_children' => $schema->boolean()->description('The project is made for children (listed with a badge; no behavioral tracking, no screenshots).'),
        ];
    }

    /** @return array<string, mixed> */
    private function present(ShowcaseSubmission $submission, AgentKey $key): array
    {
        $snippets = app(SubmissionSnippets::class);

        return [
            'id' => $submission->id,
            'site_key' => $submission->site_key,
            'kind' => $submission->kind,
            'url' => $submission->url,
            'status' => $submission->status,
            'registered_via' => $submission->registered_via,
            'agent_name' => $submission->agent_name,
            'verification' => $submission->kind === 'website'
                ? [
                    'how' => 'Add the Fancy Pixel snippet to the site (ask the user / do it with their permission), then rescan. The scan also verifies Fancy package usage on the homepage and records WHICH packages it found.',
                    'pixel_snippet' => $snippets->pixelSnippet($submission),
                ]
                : [
                    'how' => 'Add the Fancified badge to the repo README AND use Fancy packages in >=30% of view/component files, then rescan. The scan reads the dependency manifests + source to record WHICH packages the project uses.',
                    'badge_markdown' => $snippets->badgeMarkdown($submission),
                ],
            'install_page' => url('/showcase/submit/'.$submission->id.'/installed'),
            'next' => 'Poll `showcase-project-status` (or call `rescan-showcase-project` after installing the snippet/badge).',
        ];
    }
}
