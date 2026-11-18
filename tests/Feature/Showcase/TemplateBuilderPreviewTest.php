<?php

use FancyTemplate\Template;
use FinePrint\Agent;
use FinePrint\Render\Renderer;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The exact preview behind /packages/fancy-template-ui/template-builder: the
 * builder posts its template, the host renders it with fancy-template (PHP)
 * and fine-print, and fine-print's own renderer draws the pages. So the
 * preview IS the PDF a consumer would send, page for page.
 *
 * Public showcase, so: bounded input, throttled, nothing stored beyond a
 * short cache entry keyed to the visitor's session, and a refusal names a
 * code and a JSON Pointer, never a data value.
 */

function builderTemplate(): array
{
    return [
        'fancyTemplate' => 1,
        'writer' => 'fine-print',
        'variables' => ['customer' => ['type' => 'object', 'required' => true, 'properties' => [
            'name' => ['type' => 'string', 'required' => true],
        ]]],
        'document' => ['blocks' => [
            ['type' => 'heading', 'level' => 1, 'runs' => [['text' => 'Quote for {{ customer.name }}']]],
            ['type' => 'pageBreak'],
            ['type' => 'paragraph', 'runs' => [['text' => 'Page two']]],
        ]],
    ];
}

/** The session cookie a response set, so the next request is the same visitor, as a browser would be. */
function sameVisitor(TestCase $test, TestResponse $res): TestCase
{
    $name = config('session.cookie');

    return $test->withCookie($name, $res->getCookie($name)->getValue());
}

it('renders a template and serves its pages as fine-print draws them', function () {
    $res = $this->postJson('/packages/fancy-template-ui/preview', [
        'template' => builderTemplate(),
        'data' => ['customer' => ['name' => 'Ada Lovelace']],
    ])->assertOk();

    expect($res->json('key'))->toMatch('/^[0-9a-f]{64}$/')
        ->and($res->json('count'))->toBe(2)
        ->and($res->json('aspect'))->toBeFloat();

    $page = sameVisitor($this, $res)->get('/packages/fancy-template-ui/preview/'.$res->json('key').'/pages/2?scale=0.5')->assertOk();
    expect($page->headers->get('Content-Type'))->toContain('image/png')
        ->and(substr((string) $page->getContent(), 0, 8))->toBe("\x89PNG\r\n\x1a\n");
});

it('serves the same bytes fine-print writes: no watermark on an exact preview', function () {
    $template = builderTemplate();
    $data = ['customer' => ['name' => 'Ada Lovelace']];
    $res = $this->postJson('/packages/fancy-template-ui/preview', ['template' => $template, 'data' => $data]);
    $key = $res->json('key');

    $bytes = Agent::toBytes(Template::render($template, $data));
    $direct = Renderer::render($bytes, 1, 1.0)->png();
    $served = sameVisitor($this, $res)->get("/packages/fancy-template-ui/preview/{$key}/pages/1?scale=1")->assertOk()->getContent();

    expect($key)->toBe(hash('sha256', $bytes))
        ->and(hash('sha256', (string) $served))->toBe(hash('sha256', $direct));
});

it('keeps a preview to the session that made it', function () {
    $res = $this->postJson('/packages/fancy-template-ui/preview', [
        'template' => builderTemplate(), 'data' => ['customer' => ['name' => 'Ada']],
    ]);
    $key = $res->json('key');

    // The visitor who made it sees it ...
    sameVisitor($this, $res)->get("/packages/fancy-template-ui/preview/{$key}/pages/1")->assertOk();

    // ... and anyone else, holding the same key, does not.
    $this->flushSession();
    $this->withCookie(config('session.cookie'), str_repeat('b', 40))->get("/packages/fancy-template-ui/preview/{$key}/pages/1")->assertNotFound();
});

it('refuses an invalid template with its code and pointer, never a data value', function () {
    $template = builderTemplate();
    $template['document']['blocks'][0]['runs'][0]['text'] = '{{ secret }}';

    $res = $this->postJson('/packages/fancy-template-ui/preview', [
        'template' => $template, 'data' => ['customer' => ['name' => 'Ada Lovelace']],
    ])->assertStatus(422);

    expect($res->json('code'))->toBe('TOKEN_UNDECLARED')
        ->and($res->json('path'))->toBe('/document/blocks/0/runs/0/text')
        ->and((string) $res->getContent())->not->toContain('Ada Lovelace');
});

it('refuses data that does not fit the template, by pointer', function () {
    $this->postJson('/packages/fancy-template-ui/preview', [
        'template' => builderTemplate(), 'data' => [],
    ])->assertStatus(422)->assertJsonPath('code', 'DATA_REQUIRED');
});

it('bounds what it accepts', function () {
    $this->postJson('/packages/fancy-template-ui/preview', ['template' => 'nope'])->assertStatus(422);
    $big = builderTemplate();
    $big['description'] = str_repeat('x', 600 * 1024);
    $this->postJson('/packages/fancy-template-ui/preview', ['template' => $big, 'data' => []])->assertStatus(422);
});

it('is throttled and needs no sign-in', function () {
    $post = collect(Route::getRoutes()->getRoutes())->first(fn ($r) => $r->uri() === 'packages/fancy-template-ui/preview');
    $pages = collect(Route::getRoutes()->getRoutes())->first(fn ($r) => str_starts_with($r->uri(), 'packages/fancy-template-ui/preview/{file}/pages'));

    expect($post)->not->toBeNull()
        ->and(collect($post->gatherMiddleware())->filter(fn ($m) => str_starts_with((string) $m, 'throttle:'))->all())->not->toBeEmpty()
        ->and($pages)->not->toBeNull()
        ->and(collect($pages->gatherMiddleware())->filter(fn ($m) => str_starts_with((string) $m, 'throttle:'))->all())->not->toBeEmpty()
        ->and($pages->gatherMiddleware())->not->toContain('auth');
});
