<?php

namespace App\Support;

use App\Models\User;

/**
 * The single server-side shape for "how a user is shown to other people".
 *
 * Every payload that ends up rendering a person — the nav chip, the
 * leaderboard, the profile hero, the presence pills, the referral invite,
 * the admin tables — embeds this array under an `identity` key, and the
 * frontend renders it through the matching `<PlayerAvatar>` / `<PlayerName>`
 * seam in `resources/js/components/PlayerIdentity.tsx`.
 *
 * Keeping name + avatar + cosmetics together is the whole point: a purchased
 * cosmetic can only show up where the slots travel alongside the identity, so
 * adding a new cosmetic slot never means revisiting a controller again.
 */
final class PlayerIdentity
{
    /**
     * Build the identity payload for a user.
     *
     * The public display name is the GitHub handle when there is one — that's
     * what players recognise each other by. Surfaces that deliberately show
     * the account's real name instead (the admin tables) pass `$displayName`.
     *
     * @return array{name: string, avatarUrl: string|null, cosmetics: array<string, string>}
     */
    public static function for(?User $user, ?string $displayName = null): array
    {
        $name = $displayName
            ?? ($user?->github_username ?: null)
            ?? ($user?->name ?: null)
            ?? 'Anonymous';

        return [
            'name' => $name,
            'avatarUrl' => $user?->avatar_url,
            'cosmetics' => self::slots($user?->cosmetic_slots),
        ];
    }

    /**
     * Build the identity payload from already-denormalised columns — used by
     * the live presence rows, which snapshot name/avatar/cosmetics onto
     * `active_users` instead of joining back to `users` on every broadcast.
     *
     * @param  array<string, string>|null  $cosmetics
     * @return array{name: string, avatarUrl: string|null, cosmetics: array<string, string>}
     */
    public static function fromParts(?string $name, ?string $avatarUrl, ?array $cosmetics): array
    {
        return [
            'name' => $name ?: 'Anonymous',
            'avatarUrl' => $avatarUrl,
            'cosmetics' => self::slots($cosmetics),
        ];
    }

    /**
     * Normalise a raw `cosmetic_slots` value to a string=>string map.
     *
     * @param  mixed  $slots
     * @return array<string, string>
     */
    private static function slots($slots): array
    {
        if (! is_array($slots)) {
            return [];
        }

        return array_filter(
            $slots,
            fn ($value, $slot) => is_string($slot) && is_string($value),
            ARRAY_FILTER_USE_BOTH,
        );
    }
}
