<?php

use App\Support\Documents\QuoteDemo;
use App\Support\FeatureSites;
use App\Support\PackageRegistry;
use Carbon\CarbonImmutable;
use FancyQr\QrCode;
use FancyTemplate\Template;
use FinePrint\Agent as FinePrint;
use HolySheet\Agent as HolySheet;
use Illuminate\Support\Facades\Route;
use LastWord\Agent as LastWord;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/documents: the Documents micro-site (Phase B,
 * .ai/plans/features-microsites.md).
 *
 * PHP cannot render the React page, so this pins the props the server sends
 * (four product families through App\Support\FeatureSites) and the page
 * source: a real in-browser writer, the agent JSON beside it, no Phase A
 * TODOs, and no import of a writer the showcase does not install.
 */

function documentsFeaturePage(TestCase $test): array
{
    $html = $test->get('/features/documents')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** Every source file of the Documents micro-site, concatenated. */
function documentsFeatureSource(): string
{
    $source = '';
    foreach (glob(resource_path('js/Pages/Features/Documents/*.{ts,tsx,css}'), GLOB_BRACE) ?: [] as $file) {
        $source .= (string) file_get_contents($file)."\n";
    }

    return $source;
}

it('serves the Documents page with all four families', function () {
    $page = documentsFeaturePage($this);
    $slugs = array_column($page['props']['feature']['members'] ?? [], 'slug');

    expect($page['component'] ?? null)->toBe('Features/Documents/Index')
        ->and($page['props']['feature']['slug'] ?? null)->toBe('documents')
        ->and($slugs)->toContain('holy-sheet', 'dark-slide', 'last-word', 'fine-print')
        ->and($slugs)->toContain('last-word-js', 'dark-slide-js', 'last-word-py')
        ->and($page['props']['feature']['languages'] ?? [])->toContain('PHP', 'Node / TypeScript', 'Python');
});

it('has no Phase A placeholders left', function () {
    $source = documentsFeatureSource();

    expect($source)->not->toBe('')
        ->and($source)->not->toContain('TODO')
        ->and($source)->not->toContain('feature-todo');
});

it('generates real files in the browser with the installed npm writers', function () {
    $source = documentsFeatureSource();

    expect($source)->toMatch('#from\s*"@particle-academy/last-word"#')
        ->and($source)->toMatch('#from\s*"@particle-academy/dark-slide"#')
        ->and($source)->toContain('toBytes(')
        ->and($source)->toContain('describe(')
        ->and($source)->toContain('<DemoFrame');
});

it('imports only writers the showcase actually installs', function () {
    $dependencies = json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'] ?? [];
    preg_match_all('#from\s*"(@particle-academy/[a-z0-9-]+)#', documentsFeatureSource(), $imports);

    expect($imports[1])->not->toBeEmpty();
    foreach (array_unique($imports[1]) as $package) {
        expect(array_keys($dependencies))->toContain($package);
    }
});

it('renders every kit section from feature data, not typed copies', function () {
    $source = documentsFeatureSource();

    expect($source)->toMatch('/<HowItFits\s+members=\{feature\.members\}\s+bridges=\{feature\.bridges\}/')
        ->and($source)->toMatch('/<InstallSteps\s+members=/')
        ->and($source)->toMatch('/<PackagesGrid\s+members=\{feature\.members\}/')
        ->and($source)->toContain('<FeatureTour')
        ->and($source)->toContain('<FeatureCta');
});

/*
 * Every capability, not four families (owner, 2026-11-13: Features gather
 * capabilities across packages). The page once covered holy-sheet, dark-slide,
 * last-word and fine-print while seven published members of the `documents`
 * group had no section at all; these fail the day a new member joins the group
 * and not the page.
 */

/** Every listed package PackageRegistry puts in the `documents` group. */
function documentsGroupSlugs(): array
{
    $slugs = [];
    foreach (array_merge(PackageRegistry::all(), PackageRegistry::companions()) as $package) {
        if (($package['group'] ?? null) === 'documents' && ! PackageRegistry::isHidden($package['slug'])) {
            $slugs[] = $package['slug'];
        }
    }

    return array_values(array_unique($slugs));
}

it('makes every documents-group package a member of the Feature', function () {
    $group = documentsGroupSlugs();
    $members = array_column(FeatureSites::resolved('documents')['members'], 'slug');

    expect(count($group))->toBeGreaterThanOrEqual(19)
        ->and(array_values(array_diff($group, $members)))->toBe([]);
});

it('gives every documents-group package a section or a Built on card', function () {
    $content = (string) file_get_contents(resource_path('js/Pages/Features/Documents/content.ts'));
    preg_match_all('/slugs:\s*\[([^\]]*)\]/', $content, $lists);
    preg_match_all('/\{\s*slug:\s*"([a-z0-9-]+)"/', $content, $builtOn);
    $named = $builtOn[1];
    foreach ($lists[1] as $list) {
        preg_match_all('/"([a-z0-9-]+)"/', $list, $slugs);
        $named = array_merge($named, $slugs[1]);
    }

    // A -js / -py twin is shown as a chip on its original's capability card.
    $missing = array_filter(documentsGroupSlugs(), function (string $slug) use ($named): bool {
        $original = (string) preg_replace('/-(js|py)$/', '', $slug);

        return ! in_array($slug, $named, true) && ! in_array($original, $named, true);
    });

    expect(array_values($missing))->toBe([])
        ->and($builtOn[1])->toContain('fancy-doc-commons', 'fancy-file-commons');
});

it('has a live section for every capability', function () {
    $source = documentsFeatureSource();

    foreach (['id="templates"', 'id="viewers"', 'id="formulas"', 'id="codes"', 'id="signing"', 'id="documents-demo"'] as $anchor) {
        expect($source)->toContain($anchor);
    }
    expect($source)->toContain('<SignerCeremony', '<EnvelopeTimeline', '<CompletionCertificate', '<SignatureVerifier', '<DocViewer', '<QrCode', 'qrCodeSvg(');
});

it('renders both quote templates cleanly in the PHP leg', function (string $writer) {
    $template = QuoteDemo::template($writer);

    expect(Template::inspect($template))->toBe(['ok' => true, 'issues' => []])
        ->and(json_encode($template))->toContain('"$each"');
})->with(['last-word', 'holy-sheet']);

it('spreads a section per pricing model in the document template', function () {
    expect(json_encode(QuoteDemo::template('last-word')))->toContain('"$spread":true');

    $text = json_encode((new QuoteDemo(['models' => ['fixed', 'usage']]))->document());

    expect($text)->toContain('Fixed-fee build subtotal')
        ->toContain('Platform licence subtotal')
        ->not->toContain('Monthly care retainer subtotal');
});

it('prices the quote with fancy-formula, including the seat price break', function () {
    $amounts = (new QuoteDemo(['seats' => 120]))->amounts();

    expect($amounts['seat_unit'])->toBe(975)
        ->and($amounts['total'])->toBe($amounts['subtotal'] + $amounts['tax'])
        ->and((new QuoteDemo(['seats' => 49]))->amounts()['seat_unit'])->toBe(1250)
        ->and((new QuoteDemo(['seats' => 500]))->amounts()['seat_unit'])->toBe(840);
});

it('serves the priced quote as JSON with the PHP render and the trace', function () {
    $response = $this->getJson('/features/documents/quote?company=Acme%20Rockets&contact=Sam%20Ortiz&models[]=retainer&hours=10&months=3')
        ->assertOk()
        ->assertJsonPath('data.client.company', 'Acme Rockets')
        ->assertJsonPath('data.models.0.key', 'retainer');

    expect(collect($response->json('trace'))->pluck('name')->all())->toContain('seat_unit', 'total')
        ->and(json_encode($response->json('document')))->toContain('Acme Rockets');
});

it('generates a real PDF, DOCX and XLSX that read back', function (string $format) {
    $response = $this->get("/features/documents/quote.{$format}?company=Acme%20Rockets&contact=Sam%20Ortiz")->assertOk();
    $bytes = (string) $response->getContent();

    expect($response->headers->get('Content-Disposition'))->toContain('Fieldwork-Studio-quote-Q-2026-0142.'.$format);

    if ($format === 'pdf') {
        expect(substr($bytes, 0, 5))->toBe('%PDF-')
            ->and(FinePrint::pageCount($bytes))->toBe(5)
            ->and(json_encode(FinePrint::read($bytes)))->toContain('Acme Rockets')->toContain('91,492.90');
    }
    if ($format === 'docx') {
        $doc = LastWord::read($bytes);
        expect(LastWord::validate($doc))->toBe([])
            ->and(LastWord::describe($doc))->toContain('Website platform rebuild');
    }
    if ($format === 'xlsx') {
        expect(array_column(HolySheet::read($bytes)['sheets'], 'name'))
            ->toBe(['Quote', 'Summary', 'Fixed-fee build', 'Care retainer', 'Platform licence']);
    }
})->with(['pdf', 'docx', 'xlsx']);

it('refuses quote input out of bounds', function (string $query) {
    $this->getJson('/features/documents/quote?'.$query)->assertStatus(422);
})->with([
    'unknown model' => ['models[]=bogus'],
    'too many seats' => ['seats=5001'],
    'zero months' => ['months=0'],
    'long company' => ['company='.str_repeat('a', 81)],
]);

it('serves fancy-qr codes byte-identical to the package', function () {
    $svg = $this->get('/features/documents/qr.svg?value=https%3A%2F%2Fexample.com&label=Link%20to%20the%20quote')->assertOk();

    expect($svg->getContent())->toBe(QrCode::svg('https://example.com', label: 'Link to the quote'))
        ->and($svg->headers->get('Content-Type'))->toContain('image/svg+xml');

    $png = (string) $this->get('/features/documents/qr.png?value=hello')->assertOk()->getContent();
    expect(bin2hex(substr($png, 0, 8)))->toBe('89504e470d0a1a0a');

    $this->getJson('/features/documents/qr.svg?value='.str_repeat('x', 301))->assertStatus(422);
});

it('throttles every documents demo route', function (string $name) {
    $middleware = array_filter(Route::getRoutes()->getByName($name)->gatherMiddleware(), 'is_string');

    expect(implode(',', $middleware))->toContain('throttle:');
})->with(['features.documents.quote', 'features.documents.quote.file', 'features.documents.qr']);

it('keeps the JS parity fixture equal to what PHP renders today', function () {
    $quote = new QuoteDemo([], CarbonImmutable::parse('2026-11-17'));
    $fixture = base_path('tests/js/fixtures/documents-quote.json');
    $current = json_encode(['data' => $quote->data(), 'document' => $quote->document()], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n";

    if (getenv('UPDATE_FIXTURES') === '1') {
        file_put_contents($fixture, $current);
    }

    expect(file_exists($fixture))->toBeTrue()
        ->and((string) file_get_contents($fixture))->toBe($current);
});
