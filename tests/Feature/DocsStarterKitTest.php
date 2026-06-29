<?php

use Tests\TestCase;

uses(TestCase::class);

it('renders the Laravel starter-kit docs page', function () {
    $this->get('/docs/starter-kit')
        ->assertOk()
        ->assertSee('Laravel starter kit', false)
        ->assertSee('fancy-starter-kit', false);
});

it('serves the starter-kit docs page as a clean markdown variant', function () {
    $res = $this->get('/docs/starter-kit.md');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/markdown');
    expect($res->getContent())->toContain('laravel new my-app --using=particle-academy/fancy-starter-kit');
});
