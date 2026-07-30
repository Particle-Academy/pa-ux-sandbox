<?php

use App\Models\ActiveUser;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The presence feed must never publish an internal identifier as a person's
 * activity.
 *
 * It did: users saw **"Wish Born — on generated::hDAoBhQKlhcWhD3X"**, a
 * different random string on every request. The cause is a Laravel detail that
 * reads as a null-safety bug and is not one — `Route::getName()` does NOT return
 * null for an unnamed route. `AbstractRouteCollection::generateRouteName()`
 * synthesises `'generated::'.Str::random()`, so `$route?->getName() ?? 'browsing'`
 * could never reach its fallback and the random name went straight to the feed.
 */
it('never publishes a generated:: route name as activity', function () {
    // A route with NO name — exactly what produces the synthesised identifier.
    Route::middleware(['web', 'auth'])->get('/label-probe-unnamed', fn () => 'ok');

    $user = User::factory()->create();

    $this->actingAs($user)->get('/label-probe-unnamed')->assertOk();

    $label = ActiveUser::where('user_id', $user->id)->value('activity_label');

    expect($label)->not->toContain('generated::');
    // And it must say something a person can read, not merely avoid the bad string.
    expect($label)->toContain('/label-probe-unnamed');
});

it('uses a named route when there is a real name', function () {
    // The counter-case: the fallback must not swallow legitimate names.
    Route::middleware(['web', 'auth'])->get('/label-probe-named', fn () => 'ok')
        ->name('probe.named');

    $user = User::factory()->create();

    $this->actingAs($user)->get('/label-probe-named')->assertOk();

    $label = ActiveUser::where('user_id', $user->id)->value('activity_label');

    // Punctuation is softened for reading, so assert on the words.
    expect($label)->toContain('probe');
    expect($label)->toContain('named');
    expect($label)->not->toContain('generated::');
});

it('describes an unnamed home page in words, not an empty path', function () {
    // `trim($path, '/')` on "/" yields "", which would render "browsing " —
    // trading one unreadable label for another.
    Route::middleware(['web', 'auth'])->get('/label-probe-root', fn () => 'ok');

    $user = User::factory()->create();
    $this->actingAs($user)->get('/label-probe-root')->assertOk();

    $label = (string) ActiveUser::where('user_id', $user->id)->value('activity_label');

    expect(trim($label))->not->toBe('browsing');
    expect(trim($label))->not->toBe('browsing /');
});
