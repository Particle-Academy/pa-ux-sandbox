<?php

use App\Models\User;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Composer\InstalledVersions;
use FinePrint\Agent;
use FinePrint\Document;
use FinePrint\Laravel\PageImages;
use FinePrint\Laravel\PageSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

it('lists published fine-print as a document package with its installed documentation', function () {
    expect(PackageRegistry::PLANNED)->not->toHaveKey('fine-print');
    $package = PackageRegistry::findAny('fine-print');
    expect($package)->not->toBeNull()
        ->and($package['composer'])->toBe('particle-academy/fine-print')
        ->and($package['packagist'])->toBe('particle-academy/fine-print')
        ->and($package['group'])->toBe('documents')
        ->and($package['ecosystem'])->toBe('php')
        ->and($package['kind'])->toBe('headless');
    expect(PackageFamily::groupFor('fine-print')['group'])->toBe('documents');

    $this->get('/packages/fine-print')->assertOk()->assertInertia(fn ($page) => $page
        ->component('Packages/Show')
        ->where('readmeHtml', fn (string $html) => str_contains($html, 'Laravel page images') && str_contains($html, 'PageImages'))
    );
});

it('reads and renders the published Composer package without a sibling source alias', function () {
    $installed = InstalledVersions::getInstallPath('particle-academy/fine-print');
    expect($installed)->not->toBeNull();
    $class = (new ReflectionClass(Agent::class))->getFileName();
    expect(realpath($class))->toStartWith(realpath($installed).DIRECTORY_SEPARATOR);

    $pdf = Agent::toBytes(['blocks' => [['type' => 'paragraph', 'runs' => [['text' => 'Private board memo']]]]]);
    $document = Document::open($pdf);
    expect(Agent::read($pdf)['ok'])->toBeTrue()
        ->and($document->text(1))->toContain('Private board memo')
        ->and($document->activeContent())->toBe([]);
});

it('serves private marked pages and rechecks a revoked policy on a warm cache', function () {
    $pdf = Agent::toBytes(['blocks' => [['type' => 'paragraph', 'runs' => [['text' => 'Private board memo']]]]]);
    $allowed = true;
    $calls = 0;
    PageImages::register(app('router'), '/_test/fine-print/{file}/{page}.png', function (Request $request, string $file) use ($pdf, &$allowed, &$calls): ?PageSource {
        $calls++;

        return $allowed && $file === 'board' ? new PageSource($pdf, 'tenant:board', '1') : null;
    }, Cache::store('array'));

    $url = '/_test/fine-print/board/1.png';
    $this->get($url)->assertRedirect(route('login'));
    expect($calls)->toBe(0);

    $alex = User::factory()->create(['name' => 'Alex', 'email' => 'alex@example.test']);
    $riley = User::factory()->create(['name' => 'Riley', 'email' => 'riley@example.test']);
    $first = $this->actingAs($alex)->get($url)->assertOk()->assertHeader('Content-Type', 'image/png')
        ->assertHeader('X-Content-Type-Options', 'nosniff');
    $second = $this->actingAs($riley)->get($url)->assertOk();
    expect($first->getContent())->toStartWith("\x89PNG")
        ->and($first->headers->get('Cache-Control'))->toContain('private', 'no-store')
        ->and($first->getContent())->not->toBe($second->getContent());

    $allowed = false;
    $this->get($url)->assertNotFound();
    expect($calls)->toBe(3);
});
