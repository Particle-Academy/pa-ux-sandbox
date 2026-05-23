<?php

declare(strict_types=1);

namespace DarkSlide\Helpers;

/**
 * EMU (English Metric Units) conversion helpers.
 *
 * PPTX positions every shape in EMU: 914,400 EMU = 1 inch. The default
 * 16:9 slide is 9,144,000 × 5,143,500 EMU (10" × 5.625"). DarkSlide stores
 * coords as 0..1 slide-relative fractions; this helper converts to EMU on
 * write and back on read.
 */
final class Emu
{
    public const EMU_PER_INCH = 914400;

    /** Default slide dimensions for 16:9 at 10". */
    public const DEFAULT_SLIDE_WIDTH = 9144000;
    public const DEFAULT_SLIDE_HEIGHT = 5143500;

    /** Convert a 0..1 fraction of slide width to EMU. */
    public static function fromFracX(float $f, int $slideWidthEmu = self::DEFAULT_SLIDE_WIDTH): int
    {
        return (int) round($f * $slideWidthEmu);
    }

    /** Convert a 0..1 fraction of slide height to EMU. */
    public static function fromFracY(float $f, int $slideHeightEmu = self::DEFAULT_SLIDE_HEIGHT): int
    {
        return (int) round($f * $slideHeightEmu);
    }

    /** Convert EMU back to a 0..1 fraction. */
    public static function toFracX(int $emu, int $slideWidthEmu = self::DEFAULT_SLIDE_WIDTH): float
    {
        return $slideWidthEmu === 0 ? 0.0 : $emu / $slideWidthEmu;
    }

    /** Convert EMU back to a 0..1 fraction. */
    public static function toFracY(int $emu, int $slideHeightEmu = self::DEFAULT_SLIDE_HEIGHT): float
    {
        return $slideHeightEmu === 0 ? 0.0 : $emu / $slideHeightEmu;
    }

    /**
     * Convert a point (1/72 inch) value to EMU. PPTX font sizes are in
     * "centipoints" (1 pt = 100); use {@see hundredthsOfPoint()} for those.
     */
    public static function fromPt(float $pt): int
    {
        return (int) round($pt * (self::EMU_PER_INCH / 72));
    }

    /**
     * PPTX text run font size attribute (`sz`) uses hundredths of a point
     * (24pt → 2400). This helper applies the multiplier with rounding.
     */
    public static function hundredthsOfPoint(float $pt): int
    {
        return (int) round($pt * 100);
    }
}
