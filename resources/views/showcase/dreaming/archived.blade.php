@extends('layouts.showcase', ['title' => 'Archived dreams'])

@section('content')
    <h1 class="text-3xl font-semibold tracking-tight">Archived dreams</h1>
    <p class="mt-2 max-w-3xl text-base" style="color: var(--fg-2);">
        Dreams whose net votes went negative are archived here. We keep them so
        we know what's already been considered and rejected.
    </p>

    @if($archives->isEmpty())
        <div class="mt-6 fancy-card p-10 text-center" style="color: var(--fg-3);">
            Nothing archived yet.
        </div>
    @else
        <ul class="mt-6 divide-y" style="border-color: var(--border-1);">
            @foreach ($archives as $a)
                <li class="py-3">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="font-semibold">{{ $a->title }}</span>
                        @if($a->pkg)<span class="rounded bg-[color:var(--bg-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{{ $a->pkg }}</span>@endif
                        @if($a->theme)<span class="text-[11px]" style="color: var(--fg-3);">— {{ $a->theme }}</span>@endif
                    </div>
                    @if($a->blurb)<p class="mt-0.5 text-sm" style="color: var(--fg-2);">{{ $a->blurb }}</p>@endif
                    <div class="mt-1 text-[11px]" style="color: var(--fg-3);">
                        archived {{ $a->archived_at?->diffForHumans() }} · {{ $a->up_votes }} 👍 / {{ $a->down_votes }} 👎 · reason: <code class="fancy-mono">{{ $a->reason }}</code>
                    </div>
                </li>
            @endforeach
        </ul>
    @endif
@endsection
