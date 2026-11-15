/**
 * Download counts as the server sends them (`DownloadStats` in PHP).
 *
 * `null` means NOT MEASURED, and every caller renders nothing for it. It is
 * never shown as 0: a package nobody has counted is not one nobody downloads.
 * `total` is null when a source keeps no history (PyPI), so a partial sum is
 * never passed off as all-time.
 */
export type Downloads = { monthly: number; total: number | null } | null;

const UNITS: Array<[number, string]> = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "k"],
];

/**
 * Human-readable count: 950, 28.7k, 120k, 1.2M.
 *
 * One decimal below 100 of a unit, none above, trailing ".0" dropped. Rounding
 * that reaches the next unit moves up to it, so 999,960 reads 1M, not 1000k.
 */
export function formatCount(n: number): string {
    if (!Number.isFinite(n) || n < 0) return "";
    const whole = Math.round(n);
    if (whole < 1000) return String(whole);

    const i = UNITS.findIndex(([size]) => whole >= size);
    const [size, suffix] = UNITS[i];
    const scaled = whole / size;
    const rounded = Number(scaled.toFixed(scaled < 100 ? 1 : 0));
    if (rounded >= 1000 && i > 0) {
        const [bigger, biggerSuffix] = UNITS[i - 1];
        return `${Number((whole / bigger).toFixed(1))}${biggerSuffix}`;
    }
    return `${rounded}${suffix}`;
}
