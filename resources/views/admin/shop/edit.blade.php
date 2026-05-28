@extends('admin.layout')

@section('title', 'Edit Shop Item')

@section('content')
<div class="max-w-3xl">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Edit: {{ $item->name }}</h1>
        <span class="font-mono text-xs text-gray-500">{{ $item->slug }}</span>
    </div>

    <form method="POST" action="{{ route('admin.shop.update', $item) }}" class="mt-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        @csrf
        @method('PUT')
        @include('admin.shop._form')
        <div class="mt-6 flex items-center justify-between">
            <div class="space-x-3">
                <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                    Save
                </button>
                <a href="{{ route('admin.shop.index') }}" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    Cancel
                </a>
            </div>
        </div>
    </form>

    <form method="POST" action="{{ route('admin.shop.destroy', $item) }}" class="mt-8"
          onsubmit="return confirm('Archive this item? (purchase history is preserved)')">
        @csrf
        @method('DELETE')
        <button type="submit" class="text-sm text-red-600 hover:text-red-500">
            Archive (set inactive)
        </button>
    </form>
</div>
@endsection
