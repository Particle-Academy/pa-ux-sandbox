<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\DevAccounts;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Local-only test accounts that back the dev quick-login on the login page.
 *
 * Idempotent (updateOrCreate, keyed on email) so it is safe to re-run. Refuses
 * to run in production so it can never plant known-credential accounts on a
 * real environment.
 *
 * Run it directly:  php artisan db:seed --class=DevUsersSeeder
 */
class DevUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new \RuntimeException('DevUsersSeeder must never run in production.');
        }

        foreach (DevAccounts::all() as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($account['password']),
                ],
            )->forceFill(['is_admin' => $account['is_admin']])->save();

            $this->command?->info("  ✓ {$account['label']}: {$account['email']} / {$account['password']}");
        }
    }
}
