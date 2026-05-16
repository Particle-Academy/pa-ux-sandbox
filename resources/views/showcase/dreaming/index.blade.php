@extends('layouts.showcase', ['title' => 'Dreaming · Fancy UI'])

@php
    $taillyArr = $tallies ?? [];
    // Inject the current user's vote alongside each tally entry the server already counted.
    $payloadTallies = [];
    foreach ($dreams as $d) {
        $slug = $d['slug'];
        $t = $taillyArr[$slug] ?? ['up' => 0, 'down' => 0];
        $payloadTallies[$slug] = [
            'up' => $t['up'] ?? 0,
            'down' => $t['down'] ?? 0,
            'mine' => null,
        ];
    }
    if (auth()->check()) {
        $myVotes = \App\Models\Vote::query()
            ->where('user_id', auth()->id())
            ->where('subject_type', 'dream')
            ->pluck('value', 'subject_slug');
        foreach ($myVotes as $slug => $value) {
            if (isset($payloadTallies[$slug])) {
                $payloadTallies[$slug]['mine'] = (int) $value;
            }
        }
    }
@endphp

@section('content')
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
            <flux:heading size="xl" level="1">Dreaming</flux:heading>
            <flux:text class="mt-2 max-w-3xl">
                Speculative components proposed for inclusion in the Fancy UI kit.
                Browse anonymously; vote when you sign in with GitHub. Components
                that net negative votes auto-archive once at least 3 people have weighed in —
                we keep them so we know what not to build again.
            </flux:text>
        </div>
        <div class="flex gap-2">
            @guest
                <flux:action href="{{ route('auth.github') }}" icon="github" color="zinc">
                    Sign in to vote
                </flux:action>
            @endguest
            <flux:action href="{{ route('dreaming.archived') }}" variant="default">
                Archived
            </flux:action>
        </div>
    </div>

    <flux:separator class="my-6" />

    <div id="dreaming-gallery"
         data-auth="{{ auth()->check() ? '1' : '0' }}"
         data-csrf="{{ csrf_token() }}"
         data-dreams="{{ json_encode($dreams->values()->all(), JSON_HEX_QUOT | JSON_HEX_APOS) }}"
         data-tallies="{{ json_encode($payloadTallies, JSON_HEX_QUOT | JSON_HEX_APOS) }}">
        {{-- React island; resources/js/dreaming-public.tsx mounts here --}}
    </div>

    @vite(['resources/js/dreaming-public.tsx'])
@endsection
