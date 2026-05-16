@extends('layouts.showcase', ['title' => $package['name'].' · '.$component['name']])

@section('content')
    <flux:breadcrumbs>
        <flux:breadcrumbs.item href="{{ route('packages.index') }}">Packages</flux:breadcrumbs.item>
        <flux:breadcrumbs.item href="{{ route('packages.show', $package['slug']) }}">{{ $package['name'] }}</flux:breadcrumbs.item>
        <flux:breadcrumbs.item>{{ $component['name'] }}</flux:breadcrumbs.item>
    </flux:breadcrumbs>

    <flux:heading size="xl" level="1" class="mt-3">{{ $component['name'] }}</flux:heading>
    @if(!empty($component['blurb']))
        <flux:text class="mt-2 max-w-3xl">{{ $component['blurb'] }}</flux:text>
    @endif

    <div class="mt-6"
         data-component-demo
         data-package="{{ $package['slug'] }}"
         data-component="{{ $component['slug'] }}">
        {{-- React island; ./resources/js/component-demo.tsx mounts here --}}
    </div>

    @vite(['resources/js/component-demo.tsx'])
@endsection
