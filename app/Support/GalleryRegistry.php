<?php

namespace App\Support;

/**
 * Registry of the Inspiration Gallery styles — the single source of truth for
 * the 20 ways "FIELDWORK" (a fictional creative studio portfolio) is designed.
 * Drives the /inspiration index + /inspiration/{style} per-style routes.
 *
 * Each style is one self-contained inspiration / forkable starting point built
 * on the Fancy UI Kit, ordered common → experimental. The per-style pages are
 * separate tasks; this registry + index/show scaffold is the foundation.
 *
 * Each entry:
 *   id     — url slug (e.g. "swiss")
 *   num    — display index ("01"…"20")
 *   name   — display name (sentence-case)
 *   note   — one-line description
 *   mode   — "light" | "dark" (the style's base theme)
 *   swatch — placeholder thumbnail color (hex or CSS gradient). Real
 *            screenshots replace these in a later task.
 */
class GalleryRegistry
{
    /**
     * The 20 styles, common → experimental.
     *
     * @var list<array{id:string, num:string, name:string, note:string, mode:string, swatch:string}>
     */
    private const STYLES = [
        ['id' => 'swiss', 'num' => '01', 'name' => 'Swiss / Minimal', 'note' => 'Grid, whitespace, restraint.', 'mode' => 'light', 'swatch' => '#ffffff'],
        ['id' => 'dark', 'num' => '02', 'name' => 'Dark Studio', 'note' => 'Near-black, refined, a single blue accent.', 'mode' => 'dark', 'swatch' => '#0a0a0c'],
        ['id' => 'editorial', 'num' => '03', 'name' => 'Editorial', 'note' => 'Magazine columns and big display type.', 'mode' => 'light', 'swatch' => '#e9e7e1'],
        ['id' => 'product', 'num' => '04', 'name' => 'Product UI', 'note' => 'The portfolio as a Fancy dashboard.', 'mode' => 'light', 'swatch' => '#f1f5f9'],
        ['id' => 'bento', 'num' => '05', 'name' => 'Bento', 'note' => 'Modular tiles of work and numbers.', 'mode' => 'dark', 'swatch' => '#101014'],
        ['id' => 'gradient', 'num' => '06', 'name' => 'Brand Gradient', 'note' => 'Sky to indigo to violet, front and center.', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#7dd3fc,#818cf8,#c4b5fd)'],
        ['id' => 'mono', 'num' => '07', 'name' => 'Monochrome', 'note' => 'One ink, one accent, strict.', 'mode' => 'light', 'swatch' => '#fafafa'],
        ['id' => 'bigtype', 'num' => '08', 'name' => 'Big Type', 'note' => 'Typography at maximum volume.', 'mode' => 'light', 'swatch' => '#111111'],
        ['id' => 'terminal', 'num' => '09', 'name' => 'Terminal', 'note' => 'A monospace, command-line portfolio.', 'mode' => 'dark', 'swatch' => '#0b0f14'],
        ['id' => 'shell', 'num' => '10', 'name' => 'App Shell', 'note' => 'Sidebar and tabs — the react-fancy shell.', 'mode' => 'dark', 'swatch' => '#15151a'],
        ['id' => 'broken', 'num' => '11', 'name' => 'Broken Grid', 'note' => 'Asymmetry, overlap, off-axis layout.', 'mode' => 'light', 'swatch' => '#efe9dd'],
        ['id' => 'sheet', 'num' => '12', 'name' => 'Spreadsheet', 'note' => "The studio's work as a living data grid.", 'mode' => 'light', 'swatch' => '#f8fafc'],
        ['id' => 'kinetic', 'num' => '13', 'name' => 'Kinetic', 'note' => 'Scroll-driven motion and marquees.', 'mode' => 'dark', 'swatch' => '#0a0a0c'],
        ['id' => 'brutalist', 'num' => '14', 'name' => 'Brutalist', 'note' => 'Raw borders, system type, no decoration.', 'mode' => 'light', 'swatch' => '#ffffff'],
        ['id' => 'neobrutal', 'num' => '15', 'name' => 'Neo-Brutalist', 'note' => 'Chunky color blocks and hard shadows.', 'mode' => 'light', 'swatch' => '#fde047'],
        ['id' => 'whiteboard', 'num' => '16', 'name' => 'Whiteboard', 'note' => 'Sticky notes on an infinite canvas.', 'mode' => 'light', 'swatch' => '#eef1f4'],
        ['id' => 'retro', 'num' => '17', 'name' => 'Retro Web', 'note' => 'OS windows and web-1.0 nostalgia.', 'mode' => 'light', 'swatch' => '#008080'],
        ['id' => 'cursor', 'num' => '18', 'name' => 'Cursor', 'note' => 'A custom cursor and hover-reveal world.', 'mode' => 'dark', 'swatch' => '#08080c'],
        ['id' => 'cobrowse', 'num' => '19', 'name' => 'Agent Co-Browse', 'note' => 'An agent tours the work beside you.', 'mode' => 'dark', 'swatch' => '#0b0b14'],
        ['id' => 'agentic', 'num' => '20', 'name' => 'Agentic Studio', 'note' => 'Brief the studio; an agent scopes and books it.', 'mode' => 'dark', 'swatch' => '#160f2e'],
    ];

    /**
     * Every gallery style, in display order (common → experimental). Each entry
     * is decorated with a `thumb` path — a real screenshot of the live style page
     * (public/inspiration/thumbs/<id>.jpeg), used on the catalog cards in place
     * of the `swatch` placeholder.
     *
     * @return list<array{id:string, num:string, name:string, note:string, mode:string, swatch:string, thumb:string}>
     */
    public static function all(): array
    {
        return array_map(self::withThumb(...), self::STYLES);
    }

    /**
     * Find a single style by its id, or null if no such style exists.
     *
     * @return array{id:string, num:string, name:string, note:string, mode:string, swatch:string, thumb:string}|null
     */
    public static function find(string $id): ?array
    {
        foreach (self::STYLES as $style) {
            if ($style['id'] === $id) {
                return self::withThumb($style);
            }
        }

        return null;
    }

    /**
     * Decorate a raw style entry with its derived `thumb` screenshot path.
     *
     * @param  array{id:string, num:string, name:string, note:string, mode:string, swatch:string}  $style
     * @return array{id:string, num:string, name:string, note:string, mode:string, swatch:string, thumb:string}
     */
    private static function withThumb(array $style): array
    {
        return $style + ['thumb' => "/inspiration/thumbs/{$style['id']}.jpeg"];
    }
}
