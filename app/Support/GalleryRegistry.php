<?php

namespace App\Support;

/**
 * Registry of the Inspiration Gallery — the single source of truth for its
 * COLLECTIONS. Each collection is one fictional business designed twenty ways;
 * every page is built from the same restyled Fancy UI primitives.
 *
 *   fieldwork  — "FIELDWORK", a fictional creative-studio portfolio
 *                (20 styles, common → experimental)
 *   mom-n-pops — "Mom-n-Pops", a fictional Milwaukee family food truck
 *                (20 trucks, one per cuisine, storefront → data surface)
 *
 * Drives /inspiration (all collections), /inspiration/{collection} (one
 * catalog), and /inspiration/{collection}/{style} (one style page). Legacy
 * pre-collection URLs (/inspiration/{style}) resolve via findAnywhere().
 *
 * Collection meta:
 *   name    — brand name shown in the chrome ("FIELDWORK", "Mom-n-Pops")
 *   kicker  — short mono chip label on the catalog header
 *   title   — the catalog headline
 *   subject — "a fictional …" (used in a11y labels + demo framing)
 *   blurb   — the catalog intro paragraph
 *   framing — the demo-frame one-liner shown on every style page
 *   range   — mono meta line ("common → experimental")
 *
 * Style entry:
 *   id      — url slug (unique across ALL collections — see findAnywhere())
 *   num     — display index ("01"…"20")
 *   name    — display name
 *   note    — one-line description
 *   mode    — "light" | "dark" (the style's base theme)
 *   swatch  — placeholder thumbnail color (hex or CSS gradient) shown while
 *             the real screenshot loads
 *   cuisine — (mom-n-pops only) the truck's cuisine chip
 *   surface — (mom-n-pops only) the woven-in Fancy UI surface chip
 */
class GalleryRegistry
{
    /**
     * @var array<string, array{name:string, kicker:string, title:string, subject:string, blurb:string, framing:string, range:string, styles:list<array<string,string>>}>
     */
    private const COLLECTIONS = [
        'fieldwork' => [
            'name' => 'FIELDWORK',
            'kicker' => 'style index',
            'title' => 'One portfolio, twenty ways to build it.',
            'subject' => 'a fictional creative studio',
            'blurb' => 'FIELDWORK is a fictional studio — the same one-page site, designed twenty times, from quiet Swiss grids to agent-native surfaces. Every one is built from the same Fancy UI primitives, restyled: a design kit is really a box of primitives you can arrange for almost any use case. These are read-only blueprints to reference and remix — not starter code to fork.',
            'framing' => 'Fictional studio · the same site, 20 ways · read-only',
            'range' => 'common → experimental',
            'styles' => [
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
            ],
        ],
        'mom-n-pops' => [
            'name' => 'Mom-n-Pops',
            'kicker' => 'truck index',
            'title' => 'One truck, twenty interfaces.',
            'subject' => 'a fictional family food truck',
            'blurb' => 'Mom-n-Pops is a fictional Milwaukee family food truck — Rosa & Sal, est. 2026 — as twenty complete truck sites, each with its own cuisine and art direction. Where it earns its place, a Fancy UI surface is woven in: live order trackers, build-your-own configurators, a today\'s-catch board, a cook timeline, a reservations calendar, ⌘K ordering, agentic catering. Real sites first — read-only blueprints to reference and remix.',
            'framing' => 'Fictional food truck · the same truck, 20 cuisines · read-only',
            'range' => 'storefront → data surface',
            'styles' => [
                ['id' => 'tacos', 'num' => '01', 'name' => 'Taquería', 'cuisine' => 'Tacos', 'note' => 'Warm storefront — hero, menu grid, item detail.', 'surface' => 'Storefront', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#E4572E,#F3A712)'],
                ['id' => 'coffee', 'num' => '02', 'name' => 'Coffee', 'cuisine' => 'Coffee', 'note' => 'Editorial menu, serif, dotted price list.', 'surface' => 'Editorial', 'mode' => 'light', 'swatch' => '#6F4E37'],
                ['id' => 'seafood', 'num' => '03', 'name' => 'Seafood', 'cuisine' => 'Lobster', 'note' => 'Coastal site + live "today\'s catch" board.', 'surface' => '+ Catch board', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#1C3F60,#C1352B)'],
                ['id' => 'pizza', 'num' => '04', 'name' => 'Pizzeria', 'cuisine' => 'Pizza', 'note' => 'Wood-fired site + live order tracker (kanban).', 'surface' => '+ Order tracker', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#B71C1C,#141210)'],
                ['id' => 'chicken', 'num' => '05', 'name' => 'Fried Chicken', 'cuisine' => 'Chicken', 'note' => 'Big-type enamel-sign poster storefront.', 'surface' => 'Poster', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#2E6E6A,#B3352E)'],
                ['id' => 'gyros', 'num' => '06', 'name' => 'Gyros', 'cuisine' => 'Greek', 'note' => 'Aegean site + build-your-plate configurator.', 'surface' => '+ Configurator', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#1668B3,#C8992F)'],
                ['id' => 'bbq', 'num' => '07', 'name' => 'Smokehouse', 'cuisine' => 'BBQ', 'note' => 'Smokehouse site + "on the pit" cook timeline.', 'surface' => '+ Cook timeline', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#241F1B,#C24A1E)'],
                ['id' => 'burgers', 'num' => '08', 'name' => 'Diner', 'cuisine' => 'Burgers', 'note' => 'Diner site + ⌘K quick-order command bar.', 'surface' => '+ ⌘K order', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#0F1216,#D22B2B)'],
                ['id' => 'icecream', 'num' => '09', 'name' => 'Creamery', 'cuisine' => 'Ice cream', 'note' => 'Pastel parlor with a bento flavor grid.', 'surface' => 'Bento', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#EC6A9C,#7FD8C0)'],
                ['id' => 'sushi', 'num' => '10', 'name' => 'Sushi', 'cuisine' => 'Sushi', 'note' => 'Zen counter site + omakase reservation calendar.', 'surface' => '+ Reservations', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#0E1116,#C0362C)'],
                ['id' => 'bagels', 'num' => '11', 'name' => 'The Daily Bagel', 'cuisine' => 'Bagels', 'note' => 'Newspaper storefront — masthead & columns.', 'surface' => 'Newsprint', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#141414,#B22222)'],
                ['id' => 'ramen', 'num' => '12', 'name' => 'Ramen', 'cuisine' => 'Ramen', 'note' => 'Late-night site + order-ahead tracker.', 'surface' => '+ Order tracker', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#0B0E12,#E8613C)'],
                ['id' => 'crepes', 'num' => '13', 'name' => 'Crêperie', 'cuisine' => 'Crêpes', 'note' => 'Parisian chalkboard menu storefront.', 'surface' => 'Chalkboard', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#1A1E17,#D4AF37)'],
                ['id' => 'donuts', 'num' => '14', 'name' => 'Donuts', 'cuisine' => 'Donuts', 'note' => 'Pop-art site + sticky-note specials board.', 'surface' => '+ Specials board', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#EDEFF2,#FF4D8D)'],
                ['id' => 'pretzels', 'num' => '15', 'name' => 'Brezeln', 'cuisine' => 'Pretzels', 'note' => 'Bavarian site + "where we\'ll be" calendar.', 'surface' => '+ Calendar', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#1C6BB0,#F0C64B)'],
                ['id' => 'vegan', 'num' => '16', 'name' => 'Green Bowl', 'cuisine' => 'Vegan', 'note' => 'Earthy site + farm-to-bowl sourcing flow.', 'surface' => '+ Sourcing flow', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#0F140E,#6E8B5A)'],
                ['id' => 'poke', 'num' => '17', 'name' => 'Poke', 'cuisine' => 'Poke', 'note' => 'Tropical site + build-your-own bowl configurator.', 'surface' => '+ Configurator', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#12B5A5,#FF6B5E)'],
                ['id' => 'churros', 'num' => '18', 'name' => 'Churros', 'cuisine' => 'Churros', 'note' => 'Carnival marquee storefront.', 'surface' => 'Marquee', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#1B1620,#F4A825)'],
                ['id' => 'boba', 'num' => '19', 'name' => 'Boba', 'cuisine' => 'Bubble tea', 'note' => 'Y2K site + build-a-drink configurator.', 'surface' => '+ Configurator', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#14101C,#8A6BFF,#FF6FB5)'],
                ['id' => 'grilledcheese', 'num' => '20', 'name' => 'Melts', 'cuisine' => 'Grilled cheese', 'note' => 'Late-night site + agentic catering booking.', 'surface' => '+ Agentic', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#141019,#F2A93B)'],
            ],
        ],
        'dashboards' => [
            'name' => 'Dashboards',
            'kicker' => 'app index',
            'title' => 'Twenty dashboards, twenty apps.',
            'subject' => 'twenty fictional apps',
            'blurb' => 'Twenty dashboard designs on the Fancy UI Kit — a mix of user-facing and admin/operator surfaces, from fitness and budgeting to fleet ops, crypto, and hospital operations. Each is built from real Fancy components: every chart is a fancy-echarts EChart, KPI tiles are Cards, data grids are Tables, pipelines are Kanban boards. Read-only blueprints to reference and remix — not starter code to fork.',
            'framing' => 'Fictional apps · 20 dashboards · built from Fancy components · read-only',
            'range' => 'user-facing + admin',
            'styles' => [
                ['id' => 'pulse', 'num' => '01', 'name' => 'Pulse', 'cuisine' => 'Fitness & training', 'note' => 'Rings, streaks, heart-rate trends.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#f43f5e,#fb923c)'],
                ['id' => 'helm', 'num' => '02', 'name' => 'Helm', 'cuisine' => 'Cloud infrastructure', 'note' => 'Live metrics, incidents, service health.', 'surface' => 'admin', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#0f172a,#3b82f6)'],
                ['id' => 'ledger', 'num' => '03', 'name' => 'Ledger', 'cuisine' => 'Personal budgeting', 'note' => 'Spending by category, balance, goals.', 'surface' => 'user-facing', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#059669,#34d399)'],
                ['id' => 'merchant', 'num' => '04', 'name' => 'Merchant', 'cuisine' => 'E-commerce seller', 'note' => 'Revenue, orders, funnel, top products.', 'surface' => 'admin', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#4f46e5,#818cf8)'],
                ['id' => 'wrapped', 'num' => '05', 'name' => 'Wrapped', 'cuisine' => 'Music streaming', 'note' => 'Listening minutes, top artists, genres.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#7c3aed,#ec4899)'],
                ['id' => 'fleet', 'num' => '06', 'name' => 'Fleet', 'cuisine' => 'Logistics operations', 'note' => 'Vehicle map, deliveries, fuel, ETAs.', 'surface' => 'admin', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#1e293b,#f59e0b)'],
                ['id' => 'hearth', 'num' => '07', 'name' => 'Hearth', 'cuisine' => 'Smart home', 'note' => 'Rooms, energy, climate, devices.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#0891b2,#22d3ee)'],
                ['id' => 'cadence', 'num' => '08', 'name' => 'Cadence', 'cuisine' => 'Email marketing', 'note' => 'Campaign opens, clicks, deliverability.', 'surface' => 'admin', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#0d9488,#2dd4bf)'],
                ['id' => 'scholar', 'num' => '09', 'name' => 'Scholar', 'cuisine' => 'Learning platform', 'note' => 'Course progress, streak, next lessons.', 'surface' => 'user-facing', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#2563eb,#60a5fa)'],
                ['id' => 'griddle', 'num' => '10', 'name' => 'Griddle', 'cuisine' => 'Restaurant manager', 'note' => 'Sales, covers, labor, table turnover.', 'surface' => 'admin', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#9a3412,#f97316)'],
                ['id' => 'vertex', 'num' => '11', 'name' => 'Vertex', 'cuisine' => 'Crypto & trading', 'note' => 'Portfolio, watchlist, candlesticks.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#0b0f14,#22c55e)'],
                ['id' => 'relay', 'num' => '12', 'name' => 'Relay', 'cuisine' => 'Support helpdesk', 'note' => 'Ticket queue, SLA, CSAT, agents.', 'surface' => 'admin', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#4338ca,#38bdf8)'],
                ['id' => 'voyage', 'num' => '13', 'name' => 'Voyage', 'cuisine' => 'Airline & travel', 'note' => 'Trips, boarding, miles, itineraries.', 'surface' => 'user-facing', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#0369a1,#38bdf8)'],
                ['id' => 'roster', 'num' => '14', 'name' => 'Roster', 'cuisine' => 'HR & people ops', 'note' => 'Headcount, attrition, hiring pipeline.', 'surface' => 'admin', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#5b21b6,#a78bfa)'],
                ['id' => 'helios', 'num' => '15', 'name' => 'Helios', 'cuisine' => 'Solar & energy', 'note' => 'Production, usage, savings, battery.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#ca8a04,#facc15)'],
                ['id' => 'northstar', 'num' => '16', 'name' => 'Northstar', 'cuisine' => 'SaaS product analytics', 'note' => 'MAU, retention cohorts, funnel, churn.', 'surface' => 'admin', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#1e1b4b,#8b5cf6)'],
                ['id' => 'meridian', 'num' => '17', 'name' => 'Meridian', 'cuisine' => 'Personal banking', 'note' => 'Accounts, cards, transactions, transfers.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#0f172a,#38bdf8)'],
                ['id' => 'vitals', 'num' => '18', 'name' => 'Vitals', 'cuisine' => 'Hospital operations', 'note' => 'Bed occupancy, ER wait, staffing.', 'surface' => 'admin', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#be123c,#fb7185)'],
                ['id' => 'still', 'num' => '19', 'name' => 'Still', 'cuisine' => 'Meditation & habit', 'note' => 'Sessions, streaks, mood, minutes.', 'surface' => 'user-facing', 'mode' => 'dark', 'swatch' => 'linear-gradient(120deg,#0f766e,#5eead4)'],
                ['id' => 'amplify', 'num' => '20', 'name' => 'Amplify', 'cuisine' => 'Social media manager', 'note' => 'Follower growth, engagement, schedule.', 'surface' => 'admin', 'mode' => 'light', 'swatch' => 'linear-gradient(120deg,#c026d3,#f472b6)'],
            ],
        ],
    ];

    /**
     * Every collection's meta (no styles), keyed order preserved.
     *
     * @return list<array<string, mixed>>
     */
    public static function collections(): array
    {
        return array_map(
            fn (string $id) => self::meta($id),
            array_keys(self::COLLECTIONS),
        );
    }

    /**
     * One collection's meta + its decorated styles, or null if unknown.
     *
     * @return array<string, mixed>|null
     */
    public static function collection(string $id): ?array
    {
        if (! isset(self::COLLECTIONS[$id])) {
            return null;
        }

        return self::meta($id) + ['styles' => self::styles($id)];
    }

    /**
     * One collection's styles in display order, each decorated with its
     * `collection` and derived `thumb` screenshot path.
     *
     * @return list<array<string, mixed>>
     */
    public static function styles(string $collection): array
    {
        $styles = self::COLLECTIONS[$collection]['styles'] ?? [];

        return array_map(fn (array $style) => self::decorate($collection, $style), $styles);
    }

    /**
     * Find a single style inside one collection, or null.
     *
     * @return array<string, mixed>|null
     */
    public static function find(string $collection, string $id): ?array
    {
        foreach (self::COLLECTIONS[$collection]['styles'] ?? [] as $style) {
            if ($style['id'] === $id) {
                return self::decorate($collection, $style);
            }
        }

        return null;
    }

    /**
     * Find a style by id across every collection — legacy pre-collection URLs
     * (/inspiration/{style}, /gallery/{style}.json) resolve through this.
     * Style ids are unique across collections (enforced by tests).
     *
     * @return array<string, mixed>|null
     */
    public static function findAnywhere(string $id): ?array
    {
        foreach (array_keys(self::COLLECTIONS) as $collection) {
            $style = self::find($collection, $id);
            if ($style !== null) {
                return $style;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private static function meta(string $id): array
    {
        $collection = self::COLLECTIONS[$id];

        return [
            'id' => $id,
            'name' => $collection['name'],
            'kicker' => $collection['kicker'],
            'title' => $collection['title'],
            'subject' => $collection['subject'],
            'blurb' => $collection['blurb'],
            'framing' => $collection['framing'],
            'range' => $collection['range'],
            'count' => count($collection['styles']),
        ];
    }

    /**
     * Decorate a raw style entry with its collection + derived `thumb` path.
     *
     * NB: thumbs live at /inspiration-thumbs/{collection}/, NOT under
     * /inspiration/ — a public/inspiration/ directory would shadow the
     * /inspiration route on nginx (it 301s /inspiration → /inspiration/,
     * breaking the Inertia visit).
     *
     * @param  array<string, string>  $style
     * @return array<string, mixed>
     */
    private static function decorate(string $collection, array $style): array
    {
        return $style + [
            'collection' => $collection,
            'thumb' => "/inspiration-thumbs/{$collection}/{$style['id']}.jpeg",
        ];
    }
}
