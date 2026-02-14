@extends('admin.layout')

@section('title', 'Create Plan')

@section('content')
<div class="max-w-2xl">
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create Plan</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create a new subscription plan using Catalog facade
        </p>
    </div>

    <form action="{{ route('admin.plans.store') }}" method="POST" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        @csrf
        <div class="px-4 py-5 sm:p-6 space-y-6">
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" name="name" id="name" value="{{ old('name') }}" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                @error('name')
                    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea name="description" id="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">{{ old('description') }}</textarea>
                @error('description')
                    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                @enderror
            </div>

            <div class="flex items-center">
                <input type="checkbox" name="active" id="active" value="1" {{ old('active', true) ? 'checked' : '' }} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
                <label for="active" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Active</label>
            </div>

            <div>
                <label for="order" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Order</label>
                <input type="number" name="order" id="order" value="{{ old('order', 0) }}" min="0" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                @error('order')
                    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                @enderror
            </div>

            <div class="flex items-center">
                <input type="checkbox" name="show_on_storefront" id="show_on_storefront" value="1" {{ old('show_on_storefront') ? 'checked' : '' }} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
                <label for="show_on_storefront" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Show on Storefront</label>
            </div>

            <div class="flex items-center">
                <input type="checkbox" name="recommended" id="recommended" value="1" {{ old('recommended') ? 'checked' : '' }} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
                <label for="recommended" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Mark as Recommended</label>
            </div>
        </div>

        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 sm:px-6 flex justify-end space-x-3">
            <a href="{{ route('admin.plans.index') }}" class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
            </a>
            <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Create Plan
            </button>
        </div>
    </form>
</div>
@endsection

