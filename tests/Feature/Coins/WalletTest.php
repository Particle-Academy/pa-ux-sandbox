<?php

use App\Exceptions\InsufficientFundsException;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

it('auto-creates a wallet on first access', function () {
    $user = User::factory()->create();

    expect($user->getWallet()->balance)->toBe(0)
        ->and($user->wallet)->not->toBeNull();
});

it('credits balance, lifetime_earned, and records a transaction', function () {
    $user = User::factory()->create();
    $wallet = $user->getWallet();

    $tx = $wallet->credit(100, 'level up');

    expect($wallet->refresh()->balance)->toBe(100)
        ->and($wallet->lifetime_earned)->toBe(100)
        ->and($wallet->lifetime_spent)->toBe(0)
        ->and($tx->kind)->toBe('credit')
        ->and($tx->amount)->toBe(100)
        ->and($tx->reason)->toBe('level up');
});

it('debits balance, lifetime_spent, and records a transaction', function () {
    $user = User::factory()->create();
    $wallet = $user->getWallet();
    $wallet->credit(50, 'seed');

    $tx = $wallet->debit(30, 'bought thing');

    expect($wallet->refresh()->balance)->toBe(20)
        ->and($wallet->lifetime_earned)->toBe(50)
        ->and($wallet->lifetime_spent)->toBe(30)
        ->and($tx->kind)->toBe('debit')
        ->and($tx->amount)->toBe(30);
});

it('throws InsufficientFundsException when debit exceeds balance', function () {
    $user = User::factory()->create();
    $wallet = $user->getWallet();
    $wallet->credit(10, 'seed');

    expect(fn () => $wallet->debit(50, 'too much'))
        ->toThrow(InsufficientFundsException::class)
        ->and($wallet->refresh()->balance)->toBe(10);
});

it('rejects non-positive amounts', function () {
    $wallet = User::factory()->create()->getWallet();

    expect(fn () => $wallet->credit(0, 'noop'))->toThrow(InvalidArgumentException::class);
    expect(fn () => $wallet->credit(-5, 'neg'))->toThrow(InvalidArgumentException::class);
    expect(fn () => $wallet->debit(0, 'noop'))->toThrow(InvalidArgumentException::class);
    expect(fn () => $wallet->debit(-5, 'neg'))->toThrow(InvalidArgumentException::class);
});

it('persists polymorphic ref on transactions', function () {
    $user = User::factory()->create();
    $wallet = $user->getWallet();
    $submission = ShowcaseSubmission::create([
        'user_id' => $user->id,
        'kind' => 'website',
        'url' => 'https://example.com',
        'title' => 'demo',
        'description' => 'd',
        'status' => 'verified',
    ]);

    $tx = $wallet->credit(25, 'project approved', $submission);

    expect($tx->ref_type)->toBe(ShowcaseSubmission::class)
        ->and($tx->ref_id)->toBe($submission->id)
        ->and($tx->ref->is($submission))->toBeTrue();
});

it('reads coinBalance() via the HasWallet trait', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(42, 'seed');

    expect($user->coinBalance())->toBe(42);
});
