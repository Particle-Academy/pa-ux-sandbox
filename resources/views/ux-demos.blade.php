@extends('layouts.app')

@section('title', 'UX Demo Hub')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">UX Demo Hub</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">
        Interactive demos for two component libraries — same design language, different frameworks.
    </p>

    {{-- @particle-academy/react-fancy --}}
    <section class="mb-10">
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">@particle-academy/react-fancy</h2>
            <span class="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">React</span>
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            @php
                $reactDemos = [
                    ['name' => 'Action', 'slug' => 'action', 'desc' => 'Buttons, links, and interactive action elements', 'counterpart' => true],
                    ['name' => 'Carousel', 'slug' => 'carousel', 'desc' => 'Compound carousel with slides, controls, and steps', 'counterpart' => true],
                    ['name' => 'ColorPicker', 'slug' => 'color-picker', 'desc' => 'HSL color picker with swatches and input', 'counterpart' => true],
                    ['name' => 'Emoji', 'slug' => 'emoji', 'desc' => 'Render emojis by name with size variants', 'counterpart' => false],
                    ['name' => 'EmojiSelect', 'slug' => 'emoji-select', 'desc' => 'Searchable emoji picker with categories', 'counterpart' => true],
                    ['name' => 'Table', 'slug' => 'table', 'desc' => 'Data table with sorting, pagination, and search', 'counterpart' => false],
                    ['name' => 'Wizard Form', 'slug' => 'wizard', 'desc' => 'Multi-step form wizard built on Carousel', 'counterpart' => true],
                    ['name' => 'Nested Carousel', 'slug' => 'nested-carousel', 'desc' => 'Independent carousels nested inside each other', 'counterpart' => true],
                    ['name' => 'Dynamic Carousel', 'slug' => 'dynamic-carousel', 'desc' => 'Add and remove slides dynamically at runtime', 'counterpart' => true],
                ];
            @endphp
            @foreach($reactDemos as $demo)
                <a href="/react-demos/{{ $demo['slug'] }}" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-medium text-gray-900 dark:text-white">{{ $demo['name'] }}</h3>
                        <div class="flex shrink-0 gap-1">
                            <span class="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">React</span>
                            @if($demo['counterpart'])
                                <span class="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">LW</span>
                            @endif
                        </div>
                    </div>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $demo['desc'] }}</p>
                </a>
            @endforeach
        </div>
    </section>

    {{-- fancy-flux --}}
    <section>
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">fancy-flux</h2>
            <span class="inline-block rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">Livewire</span>
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            @php
                $livewireDemos = [
                    ['name' => 'Action', 'route' => 'fancy-flux-demos.action-examples', 'desc' => 'Buttons, links, and interactive action elements', 'counterpart' => true],
                    ['name' => 'Carousel', 'route' => 'fancy-flux-demos.basic-carousel', 'desc' => 'Flux carousel with variants and autoplay', 'counterpart' => true],
                    ['name' => 'ColorPicker', 'route' => 'fancy-flux-demos.color-picker-examples', 'desc' => 'HSL color picker with Livewire binding', 'counterpart' => true],
                    ['name' => 'EmojiSelect', 'route' => 'fancy-flux-demos.emoji-select-examples', 'desc' => 'Searchable emoji picker component', 'counterpart' => true],
                    ['name' => 'Wizard Form', 'route' => 'fancy-flux-demos.wizard-form', 'desc' => 'Multi-step wizard with validation and modals', 'counterpart' => true],
                    ['name' => 'Nested Carousel', 'route' => 'fancy-flux-demos.nested-carousel', 'desc' => 'Parent-child carousels with advancement', 'counterpart' => true],
                    ['name' => 'Dynamic Carousel', 'route' => 'fancy-flux-demos.dynamic-carousel', 'desc' => 'Dynamic slides and headless agent workflow', 'counterpart' => true],
                ];
            @endphp
            @foreach($livewireDemos as $demo)
                <a href="{{ Route::has($demo['route']) ? route($demo['route']) : '#' }}" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 {{ Route::has($demo['route']) ? '' : 'opacity-50 pointer-events-none' }}">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-medium text-gray-900 dark:text-white">{{ $demo['name'] }}</h3>
                        <div class="flex shrink-0 gap-1">
                            <span class="inline-block rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">Livewire</span>
                            @if($demo['counterpart'])
                                <span class="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">React</span>
                            @endif
                        </div>
                    </div>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $demo['desc'] }}</p>
                </a>
            @endforeach
        </div>
    </section>
</div>
@endsection
