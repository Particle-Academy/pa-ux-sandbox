<?php

use Database\Factories\Support\FakeData;
use Illuminate\Container\Container;

afterEach(function () {
    Container::setInstance(null);
});

/**
 * @return list<string>
 */
function fakeDataSequence(FakeData $fake): array
{
    $values = [];
    for ($i = 0; $i < 20; $i++) {
        $values[] = $fake->name();
        $values[] = $fake->safeEmail();
        $values[] = $fake->unique()->safeEmail();
    }

    return $values;
}

it('makes a name from a capitalised first and last name', function () {
    $fake = new FakeData(seed: 1);

    for ($i = 0; $i < 200; $i++) {
        expect($fake->name())->toMatch('/^[A-Z][a-z]+ [A-Z][a-z]+$/');
    }
});

it('makes a safe email that is valid and on a reserved example domain', function () {
    $fake = new FakeData(seed: 1);

    for ($i = 0; $i < 200; $i++) {
        $email = $fake->safeEmail();

        expect(filter_var($email, FILTER_VALIDATE_EMAIL))->not->toBeFalse()
            ->and($email)->toMatch('/^[a-z0-9._]+@example\.(com|net|org)$/');
    }
});

it('produces the same sequence from the same seed', function () {
    expect(fakeDataSequence(new FakeData(seed: 42)))->toBe(fakeDataSequence(new FakeData(seed: 42)));
});

it('produces a different sequence from a different seed', function () {
    expect(fakeDataSequence(new FakeData(seed: 42)))->not->toBe(fakeDataSequence(new FakeData(seed: 43)));
});

it('restarts the sequence when reseeded', function () {
    $fake = new FakeData(seed: 7);
    $first = [$fake->name(), $fake->safeEmail()];

    $fake->seed(7);

    expect([$fake->name(), $fake->safeEmail()])->toBe($first);
});

it('is not a fixed sequence when unseeded', function () {
    expect(fakeDataSequence(new FakeData))->not->toBe(fakeDataSequence(new FakeData));
});

it('never repeats a unique value for the same formatter', function () {
    $fake = new FakeData(seed: 3);

    $emails = [];
    for ($i = 0; $i < 2000; $i++) {
        $emails[] = $fake->unique()->safeEmail();
    }

    expect(array_unique($emails))->toHaveCount(2000);
});

it('keeps one unique proxy so uniqueness spans calls', function () {
    $fake = new FakeData;

    expect($fake->unique())->toBe($fake->unique());
});

it('can reset unique', function () {
    $fake = new FakeData;
    $before = $fake->unique();

    expect($fake->unique(reset: true))->not->toBe($before);
});

it('throws once unique runs out of values', function () {
    $fake = new FakeData(seed: 5);

    // There are fewer distinct names than this, so the loop cannot finish.
    for ($i = 0; $i < 20_000; $i++) {
        $fake->unique(maxRetries: 1)->name();
    }
})->throws(OverflowException::class);

it('rejects anything through unique that is not a formatter', function (string $method) {
    (new FakeData)->unique()->{$method}();
})->with(['seed', 'unique', 'shared', 'noSuchFormatter'])->throws(BadMethodCallException::class);

it('shares one instance per container', function () {
    $first = FakeData::shared();

    expect(FakeData::shared())->toBe($first);

    Container::setInstance(new Container);

    expect(FakeData::shared())->not->toBe($first);
});
