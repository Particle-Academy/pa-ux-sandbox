<?php

namespace App\Models;

use FancyFlow\Marketplace\NodeManifest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A third-party fancy-flow node package in the marketplace.
 *
 * MARKETPLACE ONLY — core builtins ship with fancy-flow and are not installable.
 *
 * @property array<string,mixed> $manifest
 * @property list<string> $runtimes
 */
class FlowNodePackage extends Model
{
    /** Curated category taxonomy (slug => label). Mirrors a node kind's category. */
    public const CATEGORIES = [
        'integrations' => 'Vendor integrations',
        'ai' => 'AI',
        'data' => 'Data',
        'logic' => 'Logic',
        'human' => 'Human-in-the-loop',
        'io' => 'Input / Output',
        'other' => 'Other',
    ];

    public const PENDING = 'pending';

    public const LISTED = 'listed';

    public const REJECTED = 'rejected';

    /**
     * Where the package came from.
     *
     * Submissions originating inside our own workstation are ours. Anything
     * arriving from a public repository is untrusted until someone says
     * otherwise — the distinction is the whole reason this column exists.
     */
    public const FIRST_PARTY = 'first-party';

    public const EXTERNAL = 'external';

    protected $fillable = [
        'kind', 'name', 'title', 'description', 'category', 'manifest', 'runtimes',
        'pauses_for_human', 'side_effects', 'provenance', 'verified',
        'fixtures_attestation', 'verified_at', 'status', 'review_note',
        'repository', 'submitted_by', 'submitted_via', 'agent_name',
    ];

    protected $casts = [
        'manifest' => 'array',
        'runtimes' => 'array',
        'pauses_for_human' => 'boolean',
        'verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /** Only packages an install command should ever resolve. */
    public function scopeListed(Builder $query): Builder
    {
        return $query->where('status', self::LISTED);
    }

    /**
     * Build a row from a validated manifest.
     *
     * Validation is delegated to `FancyFlow\Marketplace\NodeManifest` rather
     * than reimplemented here. A registry that disagrees with the engine about
     * what a valid manifest is would accept packages the runtime then refuses,
     * which is worse than having no check.
     *
     * @param  array<string,mixed>  $manifest
     * @return array{ok:bool,problems:list<array{level:string,field:string,message:string}>}
     */
    public static function validateManifest(array $manifest): array
    {
        $problems = NodeManifest::validate($manifest);

        return [
            'ok' => ! collect($problems)->contains(fn (array $p) => $p['level'] === 'error'),
            'problems' => $problems,
        ];
    }

    /**
     * Denormalised attributes for a manifest, for storing alongside it.
     *
     * `verified` is deliberately NOT read from the manifest. It is a claim the
     * registry makes about a package; a package that sets it is rejected by
     * validation before reaching here.
     *
     * @param  array<string,mixed>  $manifest
     * @return array<string,mixed>
     */
    public static function attributesFrom(array $manifest, string $provenance = self::EXTERNAL): array
    {
        $kind = (string) ($manifest['kind'] ?? '');

        return [
            'kind' => $kind,
            'name' => (string) ($manifest['name'] ?? ''),
            // Fall back to the bare kind name — a package without a title is
            // still listable, just less legible.
            'title' => (string) ($manifest['title'] ?? str_replace('_', ' ', (string) (explode('/', $kind)[1] ?? $kind))),
            'description' => $manifest['description'] ?? null,
            'category' => array_key_exists((string) ($manifest['category'] ?? ''), self::CATEGORIES)
                ? (string) $manifest['category']
                : 'other',
            'manifest' => $manifest,
            'runtimes' => array_keys(is_array($manifest['runtimes'] ?? null) ? $manifest['runtimes'] : []),
            'pauses_for_human' => isset($manifest['pausesForHuman']),
            'side_effects' => $manifest['sideEffects'] ?? null,
            'provenance' => $provenance,
        ];
    }

    /** The shape the public index serves, and what `list_nodes` returns. */
    public function toIndexEntry(): array
    {
        return [
            'kind' => $this->kind,
            'name' => $this->name,
            'title' => $this->title,
            'description' => (string) $this->description,
            'category' => $this->category,
            'runtimes' => $this->runtimes ?? [],
            'verified' => (bool) $this->verified,
            'url' => "/r/nodes/{$this->slug()}.json",
        ];
    }

    /**
     * URL-safe slug for the manifest endpoint.
     *
     * A kind id contains a slash, and percent-encoding a path separator is
     * handled inconsistently by static hosts, CDNs and proxies — so the URL
     * uses a flattened slug and the index carries the mapping.
     */
    public function slug(): string
    {
        return str_replace(['@', '/'], ['', '__'], $this->kind);
    }
}
