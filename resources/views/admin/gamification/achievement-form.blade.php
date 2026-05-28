@extends('admin.layout')

@section('title', $achievement ? 'Edit Achievement' : 'New Achievement')

@php $a = $achievement ?? null; @endphp

@section('content')
<div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $a ? 'Edit' : 'New' }} Achievement</h1>

    @if ($errors->any())
        <div class="mt-4 rounded bg-red-100 px-4 py-3 text-sm text-red-700">
            <ul class="list-disc pl-5">@foreach ($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul>
        </div>
    @endif

    <form method="POST"
          action="{{ $a ? route('admin.gamification.achievements.update', $a) : route('admin.gamification.achievements.store') }}"
          class="mt-6 space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        @csrf
        @if($a) @method('PUT') @endif

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                <input name="slug" value="{{ old('slug', $a?->slug) }}" required pattern="[a-z0-9\-]+"
                       class="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input name="name" value="{{ old('name', $a?->name) }}" required
                       class="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
                <input name="icon" value="{{ old('icon', $a?->icon) }}" placeholder="lucide icon name"
                       class="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort order</label>
                <input name="sort_order" type="number" min="0" value="{{ old('sort_order', $a?->sort_order ?? 0) }}"
                       class="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea name="description" rows="2"
                      class="mt-1 block w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">{{ old('description', $a?->description) }}</textarea>
        </div>
        <div class="flex items-center">
            <input id="is_active" name="is_active" type="checkbox" value="1" @checked(old('is_active', $a?->is_active ?? true))
                   class="h-4 w-4 rounded border-gray-300 text-indigo-600" />
            <label for="is_active" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</label>
        </div>

        <div class="flex items-center gap-3">
            <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Save</button>
            <a href="{{ route('admin.gamification.index') }}" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</a>
        </div>
    </form>
</div>
@endsection
