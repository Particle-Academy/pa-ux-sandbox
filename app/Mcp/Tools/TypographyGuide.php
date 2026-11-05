<?php

namespace App\Mcp\Tools;

use App\Support\Docs\TypographyGuide as Guide;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Choosing or adding fonts in a Fancy UI app — call this before adding a custom font, a web font or a Google Font, or when text must lay out identically on every machine. Returns the kit\'s font policy (self-hosted, same origin, never hot-linked from a CDN, and why), the default stacks react-fancy and Tailwind v4 use, step-by-step setup for Laravel + Vite + Tailwind v4 with snippets, how to self-host Google Fonts, non-Latin scripts (Myanmar and Karen, Hanifi Rohingya, Devanagari, Arabic: families, subsetting, lang and dir, line height, WCAG text spacing), licensing, deterministic layout, and the font hooks in Fancy packages. Pass `topic` for one section, or omit it for the whole guide.')]
class TypographyGuide extends Tool
{
    public function handle(Request $request): Response
    {
        $raw = trim((string) $request->get('topic', ''));
        $sections = Guide::sections();
        $topics = array_keys($sections);

        if ($raw === '') {
            $selected = array_values($sections);
        } else {
            $topic = Guide::normalizeTopic($raw);

            if ($topic === null) {
                return Response::error("Unknown typography topic '{$raw}'. Valid topics: ".implode(', ', $topics).'. Omit `topic` for the whole guide.');
            }

            $selected = [$sections[$topic]];
        }

        return Response::json([
            'title' => 'Typography in a Fancy UI app',
            'read_this_first' => 'Fonts are self-hosted and served from your own origin. Never hot-link them from a font CDN.',
            'topic' => $raw === '' ? null : $selected[0]['topic'],
            'available_topics' => $topics,
            'sections' => $selected,
            'docs' => Guide::URL,
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'topic' => $schema->string()
                ->description('Optional. One section of the guide: policy, defaults, custom, tailwind, google-fonts, scripts, licensing, deterministic or packages. Omit for the whole guide.'),
        ];
    }
}
