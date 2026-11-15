<?php

namespace App\Support\Downloads;

use App\Models\PackageDownload;
use Illuminate\Support\Collection;

/**
 * Download counts as the pages show them: per package, per family, and for the
 * whole kit this month.
 *
 * `null` means "not measured" and the pages render nothing for it. The
 * all-time total is offered only when every measured source has one: pypistats
 * keeps no history, so adding a PyPI package's month to an npm all-time figure
 * would quietly undercount and still look like a total.
 */
final class DownloadStats
{
    /** @return array{monthly: int, total: ?int}|null */
    public static function forPackage(string $slug): ?array
    {
        return self::forPackages([$slug]);
    }

    /**
     * @param  list<string>  $slugs
     * @return array{monthly: int, total: ?int}|null
     */
    public static function forPackages(array $slugs): ?array
    {
        return self::summarise(self::measured()->whereIn('slug', $slugs));
    }

    /**
     * slug => counts, for a listing that needs many packages at once.
     *
     * @return array<string, array{monthly: int, total: ?int}>
     */
    public static function map(): array
    {
        return self::measured()
            ->groupBy('slug')
            ->map(fn (Collection $rows) => self::summarise($rows))
            ->filter()
            ->all();
    }

    /** Sum the counts of several slugs out of a {@see map()} result. */
    public static function sumFromMap(array $map, array $slugs): ?array
    {
        $parts = array_values(array_filter(array_map(fn (string $s) => $map[$s] ?? null, $slugs)));
        if ($parts === []) {
            return null;
        }

        $totals = array_column($parts, 'total');

        return [
            'monthly' => array_sum(array_column($parts, 'monthly')),
            'total' => in_array(null, $totals, true) ? null : array_sum($totals),
        ];
    }

    /** Downloads in the last month across every published package, or null. */
    public static function kitMonthly(): ?int
    {
        $rows = self::measured()->whereIn('slug', PublishedNames::slugs());

        return $rows->isEmpty() ? null : (int) $rows->sum('monthly');
    }

    /** Rows with a monthly figure: a row that has only ever failed has none. */
    private static function measured(): Collection
    {
        return PackageDownload::query()
            ->whereNotNull('monthly')
            ->get(['slug', 'source', 'monthly', 'total']);
    }

    /** @return array{monthly: int, total: ?int}|null */
    private static function summarise(Collection $rows): ?array
    {
        if ($rows->isEmpty()) {
            return null;
        }

        return [
            'monthly' => (int) $rows->sum('monthly'),
            'total' => $rows->contains(fn (PackageDownload $r) => $r->total === null) ? null : (int) $rows->sum('total'),
        ];
    }
}
