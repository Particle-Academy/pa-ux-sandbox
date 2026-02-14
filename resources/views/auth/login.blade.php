@extends('layouts.app')

@section('title', 'Login')

@section('content')
<div class="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Login</h1>

        @if ($errors->any())
            <div class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <ul class="list-disc list-inside">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('login') }}" id="loginForm">
            @csrf

            <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    value="{{ old('email') }}"
                    required
                    autofocus
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
            </div>

            <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                </label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
            </div>

            <div class="mb-6">
                <label class="flex items-center">
                    <input
                        type="checkbox"
                        name="remember"
                        class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    >
                    <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
            </div>

            <div class="mb-4">
                <button
                    type="submit"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                    Login
                </button>
            </div>

            <div class="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">Quick Login:</p>
                <div class="flex gap-2">
                    <button
                        type="button"
                        onclick="fillCredentials('admin@example.com', 'password')"
                        class="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onclick="fillCredentials('user@example.com', 'password')"
                        class="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                    >
                        User
                    </button>
                </div>
            </div>
        </form>

        <script>
            function fillCredentials(email, password) {
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
            }
        </script>
    </div>
</div>
@endsection

