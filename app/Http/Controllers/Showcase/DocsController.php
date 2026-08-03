<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Docs\Changelog;
use App\Support\Docs\DocsArchive;
use App\Support\Docs\DocsRegistry;
use App\Support\Docs\SupportPolicy;
use App\Support\XpAwarder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use League\CommonMark\GithubFlavoredMarkdownConverter;

class DocsController extends Controller
{
    public function show(Request $request, ?string $slug = null): Response
    {
        return $this->render($request, DocsArchive::current(), $slug);
    }

    /** `/docs/{version}/{slug}` — a frozen snapshot of an older kit line. */
    public function showVersioned(Request $request, string $version, ?string $slug = null): Response
    {
        abort_unless(DocsArchive::exists($version), 404);

        // The current version is served from /docs/{slug}, so having two URLs
        // for the same page would split its search ranking and its inbound
        // links. Redirecting is not possible from a method returning Response,
        // so route registration excludes it; this is the belt to that braces.
        abort_if($version === DocsArchive::current(), 404);

        return $this->render($request, $version, $slug);
    }

    private function render(Request $request, string $version, ?string $slug): Response
    {
        $slug = $slug ?: 'introduction';
        $isCurrent = $version === DocsArchive::current();

        $page = $isCurrent ? DocsRegistry::find($slug) : DocsArchive::find($version, $slug);
        abort_if($page === null, 404);

        $path = $isCurrent
            ? base_path("resources/docs/$slug.md")
            : DocsArchive::markdownPath($version, $slug);
        $markdown = File::exists($path) ? File::get($path) : $this->placeholder($page['title']);

        // Generated tables, injected in place of a marker so the .md holds only
        // prose. Both derive from live sources and so cannot drift — but a
        // SNAPSHOT must not be regenerated, or an archived page would silently
        // describe today's packages and today's support dates.
        if ($isCurrent) {
            $markdown = match ($slug) {
                'changelog' => str_replace(Changelog::PLACEHOLDER, Changelog::tables(), $markdown),
                'versions' => str_replace(SupportPolicy::PLACEHOLDER, SupportPolicy::table(), $markdown),
                default => $markdown,
            };
        }

        // reader-xp for reading a docs page, once per page per day per user.
        XpAwarder::award(
            user: $request->user(),
            metric: 'reader-xp',
            amount: 3,
            reason: "read docs/{$slug}",
            throttleKey: "docs:{$slug}",
            throttleSeconds: 86400,
        );

        return Inertia::render('Docs/Show', [
            'page' => $page,
            'html' => $this->renderMarkdown($markdown),
            'sections' => $isCurrent ? DocsRegistry::sections() : DocsArchive::sections($version),
            'neighbors' => $isCurrent ? DocsRegistry::neighbors($slug) : DocsArchive::neighbors($version, $slug),
            'version' => [
                'active' => $version,
                'current' => DocsArchive::current(),
                'isCurrent' => $isCurrent,
                'available' => DocsArchive::selectable(),
            ],
        ]);
    }

    private function renderMarkdown(string $markdown): string
    {
        $converter = new GithubFlavoredMarkdownConverter([
            'html_input' => 'allow',
            'allow_unsafe_links' => false,
        ]);

        return (string) $converter->convert($markdown);
    }

    private function placeholder(string $title): string
    {
        return "# $title\n\nDocumentation for this page is being written.";
    }
}
