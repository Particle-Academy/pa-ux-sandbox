<?php

namespace App\Support\McpStats;

use DateTimeInterface;

/**
 * A SHA-256 of the client IP salted with a key that changes every day.
 *
 * The salt is derived from the app key and the calendar day and is never
 * stored, so a hash can be compared with others from the same day (distinct
 * visitors per day) but not linked to the same IP on another day, and cannot
 * be reversed by hashing the IPv4 space without the app key.
 */
class IpHasher
{
    public function hash(?string $ip, DateTimeInterface $at): ?string
    {
        if ($ip === null || $ip === '') {
            return null;
        }

        return hash('sha256', $this->salt($at).'|'.$ip);
    }

    private function salt(DateTimeInterface $at): string
    {
        return hash_hmac('sha256', 'mcp-stats-ip|'.$at->format('Y-m-d'), (string) config('app.key'));
    }
}
