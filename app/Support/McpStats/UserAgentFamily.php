<?php

namespace App\Support\McpStats;

/**
 * Reduces a User-Agent header to a short family name, so the dashboard can
 * group clients without storing the full string. Families and their patterns
 * live in `mcp-stats.user_agent_families`, checked in order.
 */
class UserAgentFamily
{
    public function of(?string $userAgent): string
    {
        $userAgent = trim((string) $userAgent);
        if ($userAgent === '') {
            return 'unknown';
        }

        foreach ((array) config('mcp-stats.user_agent_families', []) as $family => $pattern) {
            if (preg_match('~'.$pattern.'~i', $userAgent) === 1) {
                return (string) $family;
            }
        }

        if (preg_match('~^([A-Za-z][A-Za-z0-9._-]{0,48})~', $userAgent, $match) === 1) {
            return strtolower($match[1]);
        }

        return 'other';
    }
}
