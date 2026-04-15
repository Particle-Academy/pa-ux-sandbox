<?php

use FancyFlux\EmojiData;
use FancyFlux\Repositories\EmojiRepository;
use Tests\TestCase;

uses(TestCase::class);

it('loads the full Unicode 15.1 base set', function () {
    $all = EmojiData::all();

    expect(count($all))->toBeGreaterThan(1800);
});

it('exposes all nine Unicode categories', function () {
    $categories = EmojiData::categories();

    expect(array_keys($categories))->toEqualCanonicalizing([
        'smileys', 'people', 'animals', 'food', 'travel',
        'activities', 'objects', 'symbols', 'flags',
    ]);
});

it('populates the Objects category', function () {
    $categories = EmojiData::categories();

    expect($categories['objects']['emojis'])->not->toBeEmpty();
});

it('returns five skin tones for a tonable slug', function () {
    $repo = new EmojiRepository();
    $tones = $repo->skinTones('waving-hand');

    expect($tones)->toBeArray()->toHaveCount(5)
        ->and($tones[0])->toBe('👋🏻')
        ->and($tones[4])->toBe('👋🏿');
});

it('reports hasSkinTones correctly', function () {
    $repo = new EmojiRepository();

    expect($repo->hasSkinTones('waving-hand'))->toBeTrue()
        ->and($repo->hasSkinTones('fire'))->toBeFalse();
});

it('applies a tone to a tonable emoji', function () {
    $repo = new EmojiRepository();

    expect($repo->applyTone('waving-hand', 'medium-dark'))->toBe('👋🏾')
        ->and($repo->applyTone('fire', 'medium-dark'))->toBe('🔥')
        ->and($repo->applyTone('waving-hand', null))->toBe('👋');
});

it('still resolves previously supported slugs', function () {
    $repo = new EmojiRepository();

    expect($repo->get('fire'))->toBe('🔥')
        ->and($repo->get('rocket'))->toBe('🚀')
        ->and($repo->get(':)'))->toBe('😊');
});
