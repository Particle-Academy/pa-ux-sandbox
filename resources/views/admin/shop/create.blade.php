@extends('admin.layout')

@section('title', 'New Shop Item')

@section('content')
<div class="max-w-3xl">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">New Shop Item</h1>

    <form method="POST" action="{{ route('admin.shop.store') }}" class="mt-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        @csrf
        @include('admin.shop._form')
        <div class="mt-6 flex items-center gap-3">
            <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Create
            </button>
            <a href="{{ route('admin.shop.index') }}" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Cancel
            </a>
        </div>
    </form>
</div>
@endsection
