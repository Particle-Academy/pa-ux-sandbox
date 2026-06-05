<?php

namespace App\Support;

/**
 * Editorial Why / What / How for each *package* detail page — the package-level
 * sibling of {@see ComponentContext}. Hand-curated entries live in
 * {@see ENTRIES}; a generated JSON sidecar (written by the docs workflow) fills
 * the rest. Hand-curated always wins on a key collision.
 *
 * Why  — the gap in the ecosystem this package fills; why you&apos;d reach for it.
 * What — the shape of the package: its primitives, its contract, its surface.
 * How  — install + the smallest "first render" so a reader can start.
 *
 * Keyed by package slug.
 */
class PackageContext
{
    /** @var array<string, array{why: string, what: string, how: string}> */
    private const ENTRIES = [
        'fancy-diff' => [
            'why' => 'Reviewing and accepting changes is the human&apos;s job in a Human+ app — and the changes increasingly come from an <em>agent</em> that drafts an edit and waits for a person to confirm it. That is the trust-but-verify loop: agents propose, humans accept or reject, hunk by hunk. Every team rebuilds this surface and most ship a read-only diff with no acceptance, or bolt acceptance onto opaque DOM an embedded agent can&apos;t drive. <code>fancy-diff</code> closes the gap with a controlled, client-side diff viewer where a human and an agent operate the <em>same</em> acceptance state — no server processing, no third-party runtime deps, and no DOM scraping.',
            'what' => 'A React side-by-side (or inline) document diff viewer with per-hunk accept/reject and a live merged result. The diff engine — line-level LCS plus intra-line word/char segments — runs in-browser, in-house, with <strong>zero third-party runtime dependencies</strong>. Acceptance is controlled: <code>value</code> is a <code>Record&lt;hunkId, "accepted" | "rejected" | "pending"&gt;</code> map with <code>onChange</code>; <code>getMergedResult()</code> / <code>onResult</code> fold the diff and acceptance into the merged document. The <code>source</code> is a JSON-friendly discriminated union with <strong>three datasources</strong>: <code>{ before, after }</code> (compute the diff in-house), <code>{ unified }</code> (parse a git unified diff), or <code>{ diff }</code> (a pre-built structured <code>Diff</code>). It composes react-fancy primitives (toolbar, buttons, badges, cards), exposes stable <code>data-fancy-diff-hunk</code> handles plus render-prop slots (<code>renderHunk</code> / <code>renderToolbar</code> / <code>renderGutter</code>), supports <code>mode="split" | "inline"</code> and trust-but-verify <code>pendingMode</code>, and emits optional <code>AutoActivity</code> events through <code>@particle-academy/fancy-auto-common</code>. <strong>Git-diff caveat:</strong> a unified diff carries only the changed hunks plus a little context, so parsed files are flagged <code>partial</code> and the merged result reconstructs only the lines in the diff window — feed full <code>{ before, after }</code> documents when you need a fully merged file.',
            'how' => 'Install <code>npm i @particle-academy/fancy-diff</code> (peers: <code>react</code>, <code>react-dom</code>, <code>@particle-academy/react-fancy</code>) and import the stylesheet: <code>import { FancyDiff } from "@particle-academy/fancy-diff"; import "@particle-academy/fancy-diff/styles.css";</code>. Diff two documents: <code>&lt;FancyDiff source={{ before, after }} value={value} onChange={setValue} onResult={(r) =&gt; setMerged(r.text)} /&gt;</code>. Parse a git diff instead: <code>&lt;FancyDiff source={{ unified }} mode="inline" /&gt;</code>. Read the merged document imperatively via a ref — <code>ref.current.getMergedResult().text</code> — and turn on <code>pendingMode</code> so an embedded agent stages proposals a human confirms. A one-sitting MCP bridge maps <code>diff_accept_hunk</code> / <code>diff_reject_hunk</code> onto the same controlled <code>value</code>/<code>onChange</code> loop.',
        ],
    ];

    /**
     * @var array<string, array{why: string, what: string, how: string}>|null
     */
    private static ?array $generated = null;

    /** @return array{why: string, what: string, how: string}|null */
    public static function find(string $packageSlug): ?array
    {
        return self::ENTRIES[$packageSlug] ?? self::generated()[$packageSlug] ?? null;
    }

    /**
     * Lazily load + cache the generated entries from the JSON sidecar.
     *
     * @return array<string, array{why: string, what: string, how: string}>
     */
    private static function generated(): array
    {
        if (self::$generated !== null) {
            return self::$generated;
        }

        $path = resource_path('data/package-context.json');
        if (! is_file($path)) {
            return self::$generated = [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return self::$generated = is_array($decoded) ? $decoded : [];
    }
}
