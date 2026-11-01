<?php

use App\Mcp\Servers\FancyUiRegistry;
use App\Mcp\Tools\TypographyGuide;
use App\Support\Docs\DocsRegistry;
use App\Support\Docs\TypographyGuide as TypographyGuideSource;
use Laravel\Mcp\Request;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The typography guide is served twice: as the `typography-guide` MCP tool and
 * as /docs/typography. Both read resources/docs/typography.md, so the tool can
 * never say something the page does not, and vice versa.
 */
function typographyGuide(array $args = []): array
{
    $response = (new TypographyGuide)->handle(new Request($args));

    return json_decode($response->content(), true, 512, JSON_THROW_ON_ERROR);
}

function typographyGuideText(array $args = []): string
{
    return implode("\n\n", array_column(typographyGuide($args)['sections'], 'markdown'));
}

it('is registered on the server and served by tools/list', function () {
    $tools = (new ReflectionClass(FancyUiRegistry::class))->getDefaultProperties()['tools'] ?? [];
    expect($tools)->toContain(TypographyGuide::class);

    $body = test()->postJson('/mcp', ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list'], [
        'Accept' => 'application/json, text/event-stream',
    ])->json();

    expect(array_column($body['result']['tools'], 'name'))->toContain('typography-guide');
});

it('is named in the server instructions, so an agent can discover it', function () {
    expect(FancyUiRegistry::instructions())->toContain('typography-guide');
});

it('returns the whole guide by default, leading with the self-hosting policy', function () {
    $guide = typographyGuide();

    expect(array_column($guide['sections'], 'topic'))->toBe(TypographyGuideSource::topics());
    expect($guide['sections'][0]['topic'])->toBe('policy');
    expect($guide['sections'][0]['markdown'])
        ->toContain('self-hosted')
        ->toContain('same origin')
        ->toContain("font-src 'self'");
    expect($guide['docs'])->toBe('https://ui.particle.academy/docs/typography');
});

it('returns only the requested section for each topic', function (string $topic, string $needle) {
    $guide = typographyGuide(['topic' => $topic]);

    expect($guide['sections'])->toHaveCount(1);
    expect($guide['sections'][0]['topic'])->toBe($topic);
    expect($guide['sections'][0]['markdown'])->toContain($needle);
    expect($guide['available_topics'])->toBe(TypographyGuideSource::topics());
})->with([
    'policy' => ['policy', 'GDPR'],
    'defaults' => ['defaults', '--font-mono'],
    'custom' => ['custom', 'font-display: swap'],
    'tailwind' => ['tailwind', '@theme'],
    'google-fonts' => ['google-fonts', 'github.com/google/fonts'],
    'licensing' => ['licensing', 'NOTICE'],
    'deterministic' => ['deterministic', 'Carlito'],
    'packages' => ['packages', 'fontResolver'],
]);

it('accepts loose spellings of a topic', function () {
    expect(typographyGuide(['topic' => 'Google Fonts'])['sections'][0]['topic'])->toBe('google-fonts');
    expect(typographyGuide(['topic' => 'google_fonts'])['sections'][0]['topic'])->toBe('google-fonts');
});

it('refuses an unknown topic and names the valid ones', function () {
    $response = (new TypographyGuide)->handle(new Request(['topic' => 'kerning-wizardry']));

    $message = (string) $response->content();

    expect($response->isError())->toBeTrue();
    expect($message)->toContain('kerning-wizardry');

    foreach (TypographyGuideSource::topics() as $topic) {
        expect($message)->toContain($topic);
    }
});

it('never recommends loading fonts from a CDN', function () {
    // The whole point of the guide. A hot-link may only ever appear as a thing
    // NOT to do: never inside a snippet someone would paste, and never in a
    // sentence that does not say "never" or "not".
    $markdown = TypographyGuideSource::markdown();

    preg_match_all('/```.*?```/s', $markdown, $blocks);
    expect($blocks[0])->not->toBeEmpty('no code blocks found; this check would assert nothing');

    foreach ($blocks[0] as $block) {
        expect($block)->not->toContain('fonts.googleapis.com')
            ->not->toContain('fonts.gstatic.com')
            ->not->toContain('fonts.bunny.net')
            ->not->toContain('<link rel="stylesheet"');
    }

    $prose = preg_replace('/```.*?```/s', '', $markdown);
    $mentions = array_filter(explode("\n", $prose), fn (string $line): bool => str_contains($line, 'fonts.googleapis.com'));

    expect($mentions)->not->toBeEmpty('the guide should say plainly not to paste the Google <link>');

    foreach ($mentions as $line) {
        expect(preg_match('/\b(never|not)\b/i', $line))->toBe(1, "Mentions a CDN without saying not to: {$line}");
    }
});

it('serves the same content as a docs page', function () {
    expect(collect(DocsRegistry::flat())->pluck('slug'))->toContain('typography');

    $this->get('/docs/typography')
        ->assertOk()
        ->assertSee('Typography', false)
        ->assertSee('font-display: swap', false);

    $this->get('/docs/typography.md')->assertOk();
});
