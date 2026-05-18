<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Exercises the Human+ UX "agent emits a page" path end-to-end on the
 * server side: a controller hands `Inertia::render` an LLM-emitted JSON
 * page schema, the response carries it through Inertia's standard prop
 * envelope, and the client (which we do not run here — see
 * `<InertiaSchemaScreen>` for that side) reads it from `usePage().props`.
 *
 * The test inlines its own route so we don't keep an agent-only endpoint
 * around in production routes/web.php.
 */
beforeEach(function () {
    Route::get('/__test/agent-page', function () {
        return Inertia::render('AgentPage', [
            'schema' => [
                'type' => 'Card',
                'props' => ['variant' => 'elevated'],
                'children' => [[
                    'type' => 'Card.Body',
                    'children' => [
                        [
                            'type' => 'Heading',
                            'props' => ['level' => 2],
                            'children' => ['Welcome back'],
                        ],
                        [
                            'type' => 'Text',
                            'children' => ['Three tasks need your attention today.'],
                        ],
                        [
                            'type' => 'Action',
                            'props' => ['color' => 'violet'],
                            'children' => ['Review'],
                        ],
                    ],
                ]],
            ],
        ]);
    });
});

it('serves the agent-authored schema as JSON on an Inertia XHR visit', function () {
    $response = $this->withHeader('X-Inertia', 'true')->get('/__test/agent-page');
    $response->assertOk();

    $body = $response->json();
    expect($body['component'])->toBe('AgentPage');
    expect($body['props']['schema'])->toBeArray();
    expect($body['props']['schema']['type'])->toBe('Card');
    expect($body['props']['schema']['props']['variant'])->toBe('elevated');

    $cardBody = $body['props']['schema']['children'][0];
    expect($cardBody['type'])->toBe('Card.Body');

    $heading = $cardBody['children'][0];
    expect($heading['type'])->toBe('Heading');
    expect($heading['props']['level'])->toBe(2);
    expect($heading['children'][0])->toBe('Welcome back');
});

it('preserves nested children in the schema payload', function () {
    $body = $this->withHeader('X-Inertia', 'true')->get('/__test/agent-page')->json();

    $action = $body['props']['schema']['children'][0]['children'][2];
    expect($action['type'])->toBe('Action');
    expect($action['props']['color'])->toBe('violet');
    expect($action['children'])->toBe(['Review']);
});
