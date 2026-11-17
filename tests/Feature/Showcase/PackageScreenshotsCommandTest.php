<?php

use App\Services\Showcase\PackageShotRenderer;
use App\Support\PackageScreenshots;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `php artisan packages:screenshots` captures each package's page from this
 * site and writes public/package-shots/<slug>.jpg. The renderer is the one
 * seam; it is faked here, so no browser starts.
 */

function fakeShotRenderer(): object
{
    $fake = new class extends PackageShotRenderer
    {
        /** @var list<array{url: string, selector: ?string}> */
        public array $calls = [];

        public function render(string $url, ?string $selector): string
        {
            $this->calls[] = ['url' => $url, 'selector' => $selector];

            return "\xFF\xD8\xFF fake jpeg for {$url}";
        }
    };
    app()->instance(PackageShotRenderer::class, $fake);

    return $fake;
}

beforeEach(function () {
    $this->dir = storage_path('framework/testing/package-shots-'.uniqid());
    config(['screenshots.package_shots_dir' => $this->dir]);
});

afterEach(function () {
    File::deleteDirectory($this->dir);
});

it('captures the named packages from the given base URL, cropped to the demo', function () {
    $fake = fakeShotRenderer();

    $this->artisan('packages:screenshots', ['slugs' => ['fancy-flow', 'fancy-heuristics'], '--base' => 'https://fancy.example.test'])
        ->assertSuccessful();

    expect($fake->calls)->toBe([
        ['url' => 'https://fancy.example.test/packages/fancy-flow/flow-editor', 'selector' => '[data-package-shot]'],
        ['url' => 'https://fancy.example.test/features/heuristics', 'selector' => null],
    ])
        ->and(File::get($this->dir.'/fancy-flow.jpg'))->toContain('fancy-flow/flow-editor')
        ->and(File::exists($this->dir.'/fancy-heuristics.jpg'))->toBeTrue();
});

it('captures every listed package when none is named', function () {
    $fake = fakeShotRenderer();

    $this->artisan('packages:screenshots', ['--base' => 'https://fancy.example.test'])->assertSuccessful();

    expect($fake->calls)->toHaveCount(count(PackageScreenshots::all()));
});

it('refuses a slug it has no capture for, and writes nothing', function () {
    $fake = fakeShotRenderer();

    $this->artisan('packages:screenshots', ['slugs' => ['holy-sheet'], '--base' => 'https://fancy.example.test'])
        ->assertFailed();

    expect($fake->calls)->toBe([])
        ->and(File::exists($this->dir.'/holy-sheet.jpg'))->toBeFalse();
});

it('crops a capture taller than 16:10 to its top, so the package page frame is filled', function () {
    $tall = imagecreatetruecolor(1200, 3000);
    ob_start();
    imagejpeg($tall);
    $jpeg = (string) ob_get_clean();

    app()->instance(PackageShotRenderer::class, new class($jpeg) extends PackageShotRenderer
    {
        public function __construct(private string $jpeg) {}

        public function render(string $url, ?string $selector): string
        {
            return $this->jpeg;
        }
    });

    $this->artisan('packages:screenshots', ['slugs' => ['fancy-flow'], '--base' => 'https://fancy.example.test'])
        ->assertSuccessful();

    [$width, $height] = getimagesize($this->dir.'/fancy-flow.jpg');
    expect($width)->toBe(1200)->and($height)->toBe(750);
});

it('fails, and keeps the old image, when a capture fails', function () {
    File::ensureDirectoryExists($this->dir);
    File::put($this->dir.'/fancy-flow.jpg', 'old');

    app()->instance(PackageShotRenderer::class, new class extends PackageShotRenderer
    {
        public function render(string $url, ?string $selector): string
        {
            throw new RuntimeException('browser died');
        }
    });

    $this->artisan('packages:screenshots', ['slugs' => ['fancy-flow'], '--base' => 'https://fancy.example.test'])
        ->assertFailed();

    expect(File::get($this->dir.'/fancy-flow.jpg'))->toBe('old');
});
