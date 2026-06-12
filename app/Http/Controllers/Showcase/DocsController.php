<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Docs\Changelog;
use App\Support\Docs\DocsRegistry;
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
        $slug = $slug ?: 'introduction';

        $page = DocsRegistry::find($slug);
        abort_if($page === null, 404);

        $path = base_path("resources/docs/$slug.md");
        $markdown = File::exists($path) ? File::get($path) : $this->placeholder($page['title']);

        // The changelog's package index is generated from PackageRegistry so it
        // never drifts — the .md holds only the prose + a placeholder marker.
        if ($slug === 'changelog') {
            $markdown = str_replace(Changelog::PLACEHOLDER, Changelog::tables(), $markdown);
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
            'sections' => DocsRegistry::sections(),
            'neighbors' => DocsRegistry::neighbors($slug),
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
