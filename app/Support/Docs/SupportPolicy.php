<?php

namespace App\Support\Docs;

use Carbon\CarbonImmutable;

/**
 * The kit's support lifecycle: which release lines are maintained, in what way,
 * and until when.
 *
 * The dates are DERIVED, not typed. A line's clock starts the day its successor
 * ships, so the only fact worth recording per line is that release date —
 * everything else is arithmetic. Writing the end dates by hand would mean three
 * numbers per line that can silently disagree with each other, and a support
 * table that is wrong is worse than none, because people plan against it.
 */
class SupportPolicy
{
    /** Months of bug fixes after the next line ships. */
    public const BUG_FIX_MONTHS = 6;

    /** Months of security fixes after the next line ships. Includes the bug-fix window. */
    public const SECURITY_MONTHS = 12;

    /**
     * Every kit line, oldest first. `released` is when that line shipped;
     * `superseded` is when its successor shipped (null for the current line).
     *
     * Lines before 0.4 are deliberately absent: 0.4 is the oldest supported
     * line, and listing an EOL line with no dates invites the reading that it
     * is merely undocumented.
     *
     * @var list<array{version: string, released: string, superseded: string|null}>
     */
    private const LINES = [
        ['version' => '0.4', 'released' => '2026-06-14', 'superseded' => null],
    ];

    /**
     * @return list<array{
     *   version: string, released: string, superseded: string|null,
     *   status: string, bugFixesUntil: string|null, securityUntil: string|null, current: bool
     * }>
     */
    public static function lines(): array
    {
        $today = CarbonImmutable::today();

        return collect(self::LINES)
            ->map(function (array $line) use ($today): array {
                if ($line['superseded'] === null) {
                    // The current line has no end dates because its clock has
                    // not started. Inventing them would be a guess presented as
                    // a commitment.
                    return $line + [
                        'status' => 'Active development',
                        'bugFixesUntil' => null,
                        'securityUntil' => null,
                        'current' => true,
                    ];
                }

                $superseded = CarbonImmutable::parse($line['superseded']);
                $bugFixesUntil = $superseded->addMonths(self::BUG_FIX_MONTHS);
                $securityUntil = $superseded->addMonths(self::SECURITY_MONTHS);

                return $line + [
                    'status' => match (true) {
                        $today->lessThan($bugFixesUntil) => 'Active support',
                        $today->lessThan($securityUntil) => 'Security fixes only',
                        default => 'End of life',
                    },
                    'bugFixesUntil' => $bugFixesUntil->toDateString(),
                    'securityUntil' => $securityUntil->toDateString(),
                    'current' => false,
                ];
            })
            ->reverse()
            ->values()
            ->all();
    }

    /** The current line — what `/docs` serves and the footer shows. */
    public static function current(): string
    {
        return (string) config('kit.version');
    }

    /** Every line still receiving fixes of any kind, newest first. */
    public static function supported(): array
    {
        return collect(self::lines())
            ->reject(fn (array $line): bool => $line['status'] === 'End of life')
            ->values()
            ->all();
    }

    /** The markdown table injected into the docs page in place of {@see PLACEHOLDER}. */
    public const PLACEHOLDER = '<!--SUPPORT_TABLE-->';

    public static function table(): string
    {
        $rows = collect(self::lines())->map(function (array $line): string {
            $version = $line['current'] ? "**v{$line['version']}**" : "v{$line['version']}";
            $released = CarbonImmutable::parse($line['released'])->format('M j, Y');
            $bugs = $line['bugFixesUntil'] ? CarbonImmutable::parse($line['bugFixesUntil'])->format('M j, Y') : '—';
            $security = $line['securityUntil'] ? CarbonImmutable::parse($line['securityUntil'])->format('M j, Y') : '—';

            return "| $version | $released | {$line['status']} | $bugs | $security |";
        });

        return implode("\n", [
            '| Version | Released | Status | Bug fixes until | Security fixes until |',
            '|---|---|---|---|---|',
            ...$rows,
        ]);
    }
}
