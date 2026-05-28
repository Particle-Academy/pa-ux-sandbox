@extends('admin.layout')

@section('title', $user->name)

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <a href="{{ route('admin.users.index') }}" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">&larr; Users</a>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $user->name }}</h1>
            <p class="text-sm text-gray-500">{{ $user->email }} @if($user->github_username) · &commat;{{ $user->github_username }} @endif</p>
        </div>
        <div class="text-right">
            <div class="text-3xl font-bold text-amber-600 dark:text-amber-400">{{ number_format($wallet->balance) }}</div>
            <div class="text-xs uppercase tracking-wide text-gray-500">coins</div>
            <div class="mt-1 text-xs text-gray-400">
                earned {{ number_format($wallet->lifetime_earned) }} · spent {{ number_format($wallet->lifetime_spent) }}
            </div>
        </div>
    </div>

    {{-- Status toggles --}}
    <div class="flex flex-wrap gap-3">
        <form method="POST" action="{{ route('admin.users.toggle-opt-out', $user) }}">
            @csrf
            <button class="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:text-gray-200">
                {{ $user->isOptedOut() ? 'Opt back in' : 'Opt out' }} of gamification
            </button>
        </form>
        <form method="POST" action="{{ route('admin.users.toggle-admin', $user) }}">
            @csrf
            <button class="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:text-gray-200">
                {{ $user->is_admin ? 'Revoke admin' : 'Make admin' }}
            </button>
        </form>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {{-- XP per metric --}}
        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">XP by metric</h2>
            <p class="mt-1 text-xs text-gray-500">Total: {{ number_format($profile->total_xp) }} XP</p>
            <table class="mt-3 min-w-full text-sm">
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    @forelse($metrics as $m)
                    <tr>
                        <td class="py-1.5 text-gray-700 dark:text-gray-300">{{ $m['name'] }}</td>
                        <td class="py-1.5 text-right text-gray-500">L{{ $m['level'] }}</td>
                        <td class="py-1.5 text-right font-medium text-gray-900 dark:text-white">{{ number_format($m['total_xp']) }}</td>
                    </tr>
                    @empty
                    <tr><td class="py-2 text-gray-400">No XP yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- Achievements --}}
        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Achievements ({{ $achievements->count() }})</h2>
            <ul class="mt-3 space-y-1 text-sm">
                @forelse($achievements as $a)
                    <li class="text-gray-700 dark:text-gray-300">{{ $a->name ?? $a->slug }}</li>
                @empty
                    <li class="text-gray-400">None yet.</li>
                @endforelse
            </ul>
        </div>
    </div>

    {{-- Manual grants --}}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Grant XP</h2>
            <form method="POST" action="{{ route('admin.users.grant-xp', $user) }}" class="mt-3 space-y-3">
                @csrf
                <select name="metric" required class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    @foreach($allMetrics as $metric)
                        <option value="{{ $metric->slug }}">{{ $metric->name }}</option>
                    @endforeach
                </select>
                <input name="amount" type="number" min="1" placeholder="amount" required
                       class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <input name="reason" placeholder="reason (optional)"
                       class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Grant XP</button>
            </form>
        </div>

        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Grant coins</h2>
            <form method="POST" action="{{ route('admin.users.grant-coins', $user) }}" class="mt-3 space-y-3">
                @csrf
                <input name="amount" type="number" min="1" placeholder="amount" required
                       class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <input name="reason" placeholder="reason (optional)"
                       class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <button class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">Credit coins</button>
            </form>
        </div>

        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Grant achievement</h2>
            <form method="POST" action="{{ route('admin.users.grant-achievement', $user) }}" class="mt-3 flex gap-2">
                @csrf
                <select name="achievement" required class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    @foreach($allAchievements as $a)
                        <option value="{{ $a->slug }}">{{ $a->name }}</option>
                    @endforeach
                </select>
                <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Grant</button>
            </form>
        </div>

        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Grant prize</h2>
            <form method="POST" action="{{ route('admin.users.grant-prize', $user) }}" class="mt-3 flex gap-2">
                @csrf
                <select name="prize" required class="block w-full rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    @foreach($allPrizes as $p)
                        <option value="{{ $p->slug }}">{{ $p->name }}</option>
                    @endforeach
                </select>
                <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Grant</button>
            </form>
        </div>
    </div>

    {{-- Wallet ledger --}}
    <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent wallet transactions</h2>
        <table class="mt-3 min-w-full text-sm">
            <thead>
                <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th class="py-2">When</th>
                    <th class="py-2">Kind</th>
                    <th class="py-2 text-right">Amount</th>
                    <th class="py-2">Reason</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                @forelse($transactions as $tx)
                <tr>
                    <td class="py-1.5 text-gray-500">{{ $tx->created_at->diffForHumans() }}</td>
                    <td class="py-1.5">
                        <span @class([
                            'text-green-600 dark:text-green-400' => $tx->kind === 'credit',
                            'text-red-600 dark:text-red-400' => $tx->kind === 'debit',
                        ])>{{ $tx->kind }}</span>
                    </td>
                    <td class="py-1.5 text-right font-medium text-gray-900 dark:text-white">
                        {{ $tx->kind === 'debit' ? '−' : '+' }}{{ number_format($tx->amount) }}
                    </td>
                    <td class="py-1.5 text-gray-500">{{ $tx->reason }}</td>
                </tr>
                @empty
                <tr><td colspan="4" class="py-2 text-gray-400">No transactions yet.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
