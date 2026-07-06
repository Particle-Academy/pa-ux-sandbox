<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Validation\Rule;

/**
 * Username policy for the public /join/{username} referral links: lowercase
 * kebab handles, 3–30 chars, starting alphanumeric, with route-colliding and
 * abuse-prone names reserved.
 */
class Usernames
{
    /** Usernames that collide with routes or invite impersonation. */
    public const RESERVED = [
        'admin', 'administrator', 'analytics', 'api', 'app', 'assets', 'auth',
        'build', 'contact', 'dev-login', 'docs', 'gallery', 'heuristics',
        'help', 'home', 'join', 'login', 'logout', 'mail', 'me', 'moderator',
        'official', 'packages', 'privacy', 'profile', 'referrals', 'register',
        'root', 'settings', 'shop', 'showcase', 'staff', 'storage',
        'subscriptions', 'support', 'system', 'terms', 'vendor', 'www',
    ];

    public const PATTERN = '/^[a-z0-9][a-z0-9-]{2,29}$/';

    /** Lowercase + trim — usernames are stored and matched lowercase-only. */
    public static function normalize(?string $raw): ?string
    {
        $normalized = strtolower(trim((string) $raw));

        return $normalized === '' ? null : $normalized;
    }

    /**
     * The validation rules for a (already normalized) username.
     *
     * @return list<mixed>
     */
    public static function rules(?User $ignore = null): array
    {
        return [
            'required',
            'string',
            'regex:'.self::PATTERN,
            Rule::notIn(self::RESERVED),
            Rule::unique('users', 'username')->ignore($ignore?->getKey()),
        ];
    }

    /**
     * A prefill suggestion for the profile form: the user's GitHub handle when
     * it normalizes to a valid, unclaimed username.
     */
    public static function suggestionFor(User $user): ?string
    {
        $candidate = self::normalize($user->github_username);
        if ($candidate === null || preg_match(self::PATTERN, $candidate) !== 1) {
            return null;
        }
        if (in_array($candidate, self::RESERVED, true)) {
            return null;
        }
        $taken = User::query()
            ->where('username', $candidate)
            ->whereKeyNot($user->getKey())
            ->exists();

        return $taken ? null : $candidate;
    }
}
