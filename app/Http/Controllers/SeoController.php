<?php

namespace App\Http\Controllers;

use App\Support\PackageRegistry;
use App\Support\Seo;
use Illuminate\Http\Response;

/**
 * Discovery / well-known endpoints — served dynamically so they stay in sync
 * with the route table + PackageRegistry and resolve absolute URLs from
 * config('app.url') (env-correct on Forge without hardcoding the domain):
 *
 *   /robots.txt                    crawl policy (welcomes LLM bots) + sitemap ref
 *   /sitemap.xml                   every public page + package + component + doc
 *   /llms.txt                      llmstxt.org curated index for LLMs
 *   /llms-full.txt                 expanded index (full package + concept dump)
 *   /.well-known/security.txt      RFC 9116 vulnerability-reporting policy
 *   /security.txt                  convenience alias for the above
 *   /humans.txt                    colophon / credits
 *
 * Everything here is PUBLIC by design — only published package metadata, never
 * the private monorepo's internal/process knowledge.
 */
class SeoController extends Controller
{
    /** LLM / AI crawler user-agents we explicitly welcome (we WANT to be ingested). */
    private const AI_BOTS = [
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
        'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended',
        'CCBot', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai',
    ];

    private function base(): string
    {
        return rtrim((string) config('app.url'), '/');
    }

    private function text(string $body, string $contentType = 'text/plain; charset=utf-8'): Response
    {
        return response($body, 200)->header('Content-Type', $contentType);
    }

    public function robots(): Response
    {
        $base = $this->base();
        $lines = [
            '# Fancy UI — robots.txt',
            '# Humans and agents both welcome. We want LLMs to read us.',
            '',
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /auth',
            'Disallow: /subscriptions',
            'Disallow: /checkout',
            '',
        ];

        foreach (self::AI_BOTS as $bot) {
            $lines[] = "User-agent: {$bot}";
            $lines[] = 'Allow: /';
            $lines[] = '';
        }

        $lines[] = "Sitemap: {$base}/sitemap.xml";
        $lines[] = "# LLM index: {$base}/llms.txt";

        return $this->text(implode("\n", $lines)."\n");
    }

    public function sitemap(): Response
    {
        $base = $this->base();
        $urls = [];

        $add = function (string $path, string $priority = '0.5', string $changefreq = 'weekly') use (&$urls, $base): void {
            $loc = $base.($path === '/' ? '/' : '/'.ltrim($path, '/'));
            $urls[] = compact('loc', 'priority', 'changefreq');
        };

        // Top-level public pages.
        $add('/', '1.0', 'daily');
        $add('packages', '0.9', 'weekly');
        $add('docs', '0.8', 'weekly');
        $add('starter-kits', '0.7', 'weekly');
        $add('agent-playground', '0.8', 'weekly');
        $add('dreaming', '0.6', 'weekly');
        $add('showcase', '0.6', 'weekly');
        $add('leaderboard', '0.5', 'daily');

        // Every package + every component.
        foreach (PackageRegistry::all() as $pkg) {
            $slug = $pkg['slug'] ?? null;
            if (! is_string($slug)) {
                continue;
            }
            $add("packages/{$slug}", '0.8', 'weekly');
            foreach ($pkg['components'] ?? [] as $component) {
                $cslug = $component['slug'] ?? null;
                if (is_string($cslug)) {
                    $add("packages/{$slug}/{$cslug}", '0.6', 'monthly');
                }
            }
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        foreach ($urls as $u) {
            $xml .= '  <url>'
                .'<loc>'.htmlspecialchars($u['loc'], ENT_XML1).'</loc>'
                .'<changefreq>'.$u['changefreq'].'</changefreq>'
                .'<priority>'.$u['priority'].'</priority>'
                .'</url>'."\n";
        }
        $xml .= '</urlset>'."\n";

        return $this->text($xml, 'application/xml; charset=utf-8');
    }

    public function llms(): Response
    {
        $base = $this->base();
        $v = Seo::VERSION;

        $out = [];
        $out[] = '# Fancy UI';
        $out[] = '';
        $out[] = "> A suite of React + Laravel UI primitives engineered for **Human+ UX** — applications where humans and AI agents share the same UI surface and trade control fluidly. Every component is both an *authoring surface* (terse, JSON-friendly props humans and agents compose) and an *inhabited surface* (agents drive it over MCP tool bridges with stable handles — never DOM scraping). Public showcase version {$v}.";
        $out[] = '';
        $out[] = 'Fancy UI ships JS/TS packages on npm and PHP packages on Packagist. The showcase is a Laravel + Inertia + React app that consumes them like any external app would. Agents inhabit running apps through `@particle-academy/agent-integrations` — a per-session MCP server with one bridge per surface (whiteboard, flow, sheets, slides, charts, code, screens, scene).';
        $out[] = '';

        $out[] = '## Packages';
        $out[] = '';
        foreach (PackageRegistry::all() as $pkg) {
            $slug = $pkg['slug'] ?? '';
            $name = $pkg['name'] ?? $slug;
            $tagline = trim((string) ($pkg['tagline'] ?? ''));
            $out[] = "- [{$name}]({$base}/packages/{$slug}): {$tagline}";
        }
        $out[] = '';

        $out[] = '## Companion PHP packages';
        $out[] = '';
        foreach (PackageRegistry::companions() as $pkg) {
            $name = $pkg['name'] ?? ($pkg['slug'] ?? '');
            $tagline = trim((string) ($pkg['tagline'] ?? ''));
            $out[] = "- {$name}: {$tagline}";
        }
        $out[] = '';

        $out[] = '## Key pages';
        $out[] = '';
        $out[] = "- [Packages]({$base}/packages): the full suite index.";
        $out[] = "- [Docs]({$base}/docs): installation, the Human+ UX contract, MCP bridges.";
        $out[] = "- [Agent Playground]({$base}/agent-playground): connect your own agent over MCP and watch it drive the UI live.";
        $out[] = "- [Starter Kits]({$base}/starter-kits): production-ready apps built on the kit.";
        $out[] = '';
        $out[] = '## Optional';
        $out[] = '';
        $out[] = "- [Full index]({$base}/llms-full.txt): every package + component + the Human+ UX contract in one file.";

        return $this->text(implode("\n", $out)."\n", 'text/markdown; charset=utf-8');
    }

    public function llmsFull(): Response
    {
        $base = $this->base();
        $v = Seo::VERSION;

        $out = [];
        $out[] = '# Fancy UI — full index';
        $out[] = '';
        $out[] = "> Public showcase version {$v}. The complete package + component map plus the Human+ UX contract every component satisfies. Pure public metadata.";
        $out[] = '';

        $out[] = '## The Human+ UX contract';
        $out[] = '';
        $out[] = 'Every stateful or interactive Fancy UI component meets all of:';
        $out[] = '';
        $out[] = '- **Controlled state** — `value` + `onChange`; no internal-only state an agent might need to read or write.';
        $out[] = '- **Stable handles** — each interactive element has a stable identity (`id`, `data-*`, or a selector prop); agents never guess at the DOM.';
        $out[] = '- **JSON-friendly inputs** — agent-emittable props: arrays of objects, primitives, simple discriminated unions.';
        $out[] = '- **Bridgeable surface** — a `register<Surface>Bridge(server, { adapter })` exposes MCP tools (`grid_paint`, `deck_set`, …).';
        $out[] = '- **Observable activity** — mutations broadcast `AgentActivity` events so presence, undo, and coaching layers compose for free.';
        $out[] = '- **Trust-but-verify hooks** — destructive or human-visible actions support a staged-write / pending mode: agents propose, humans confirm.';
        $out[] = '';

        $out[] = '## Packages and components';
        $out[] = '';
        foreach (PackageRegistry::all() as $pkg) {
            $slug = $pkg['slug'] ?? '';
            $name = $pkg['name'] ?? $slug;
            $tagline = trim((string) ($pkg['tagline'] ?? ''));
            $lang = $pkg['language'] ?? '';
            $dist = $pkg['npm'] ?? ($pkg['composer'] ?? '');
            $out[] = "### {$name}";
            $out[] = '';
            $out[] = $tagline;
            $out[] = '';
            if ($dist !== '') {
                $out[] = "- Install: `{$dist}`".($lang !== '' ? " ({$lang})" : '');
            }
            $out[] = "- Page: {$base}/packages/{$slug}";
            $components = $pkg['components'] ?? [];
            if (! empty($components)) {
                $names = array_map(fn ($c) => (string) ($c['name'] ?? $c['slug'] ?? ''), $components);
                $names = array_filter($names);
                $out[] = '- Components: '.implode(', ', $names);
            }
            $out[] = '';
        }

        return $this->text(implode("\n", $out)."\n", 'text/markdown; charset=utf-8');
    }

    public function securityTxt(): Response
    {
        $base = $this->base();
        // RFC 9116 requires an Expires field; refresh ~yearly.
        $expires = now()->addYear()->startOfDay()->toAtomString();

        $lines = [
            '# Fancy UI — security contact (RFC 9116)',
            'Contact: mailto:glenn@impactivism.net',
            "Expires: {$expires}",
            'Preferred-Languages: en',
            "Canonical: {$base}/.well-known/security.txt",
        ];

        return $this->text(implode("\n", $lines)."\n");
    }

    public function humans(): Response
    {
        $base = $this->base();
        $lines = [
            '/* humans.txt — the people + machines behind Fancy UI */',
            '',
            '# TEAM',
            'Particle Academy — particle.academy',
            '',
            '# THANKS',
            'Built with humans and AI agents sharing one keyboard. Human+ UX.',
            '',
            '# TECH',
            'React 19, Tailwind v4, Laravel, Inertia.js, Model Context Protocol (MCP).',
            "Site: {$base}",
            "LLM index: {$base}/llms.txt",
        ];

        return $this->text(implode("\n", $lines)."\n");
    }
}
