@extends('layouts.showcase', ['title' => 'Archived dreams'])

@section('content')
    <flux:heading size="xl" level="1">Archived dreams</flux:heading>
    <flux:text class="mt-2 max-w-3xl">
        Dreams whose net votes went negative are archived here. We keep them so
        we know what's already been considered and rejected.
    </flux:text>

    @if($archives->isEmpty())
        <flux:card class="mt-6">
            <div class="p-10 text-center text-sm text-zinc-500">Nothing archived yet.</div>
        </flux:card>
    @else
        <flux:card class="mt-6">
            <ul class="divide-y divide-zinc-100 dark:divide-zinc-800">
                @foreach ($archives as $a)
                    <li class="px-4 py-3">
                        <div class="flex items-center gap-2 text-sm">
                            <flux:heading size="sm" inline>{{ $a->title }}</flux:heading>
                            @if($a->pkg)<flux:badge color="zinc" size="sm">{{ $a->pkg }}</flux:badge>@endif
                            @if($a->theme)<flux:text size="xs" class="text-zinc-500">— {{ $a->theme }}</flux:text>@endif
                        </div>
                        @if($a->blurb)<flux:text size="sm" class="mt-0.5">{{ $a->blurb }}</flux:text>@endif
                        <flux:text size="xs" class="mt-1 text-zinc-500">
                            archived {{ $a->archived_at?->diffForHumans() }} · {{ $a->up_votes }} 👍 / {{ $a->down_votes }} 👎 · reason: <code class="font-mono">{{ $a->reason }}</code>
                        </flux:text>
                    </li>
                @endforeach
            </ul>
        </flux:card>
    @endif
@endsection
