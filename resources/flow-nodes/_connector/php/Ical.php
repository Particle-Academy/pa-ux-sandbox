<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Ical.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * RFC 5545 in, a structured invite and its join targets out — the read MOIC's
 * meeting bot needs from nothing but the text a calendar API hands back.
 *
 * Written from scratch (the owner: no third-party code), as ONE
 * implementation in two runtimes — `src/ical.ts` is the twin — and held to
 * the authored corpus under `fixtures/ical/`, which both must reproduce
 * exactly. `fixtures/ical/README.md` lists every decision a case pins; the
 * ones easy to get differently in two languages are restated here:
 *
 * - Folded lines (a line break followed by a single space or tab) join
 *   before anything else runs; TEXT values are then RFC 5545-unescaped
 *   (`\n`, `\,`, `\;`, `\\`).
 * - `DTSTART`/`DTEND` always come back as UTC instants. A `Z` suffix passes
 *   through; a `TZID` parameter resolves through the calendar's own
 *   `VTIMEZONE` (an unknown TZID is refused BY NAME, never guessed); a value
 *   with neither — RFC 5545's FLOATING time — is treated as UTC, a decision
 *   named here rather than left to look like an oversight.
 * - `RRULE` support is intentionally narrow: `FREQ` daily/weekly/monthly/
 *   yearly with `INTERVAL`, `COUNT` and `UNTIL`, and `BYDAY` for WEEKLY only.
 * - Join targets are ALLOW-LISTED: Google Meet, Zoom (with its meeting id
 *   and passcode read out of the URL), Microsoft Teams, and a dial-in phone
 *   number with a passcode read from its own line. Anything else is ignored.
 */
final class Ical
{
    private const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    private const FREQS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

    public static function parse(string $raw): Invite
    {
        $lines = array_values(array_filter(explode("\n", self::unfold($raw)), static fn (string $l): bool => $l !== ''));
        $zones = self::parseTimezones($lines);

        $eventBlocks = self::blockLines($lines, 'VEVENT');
        if ($eventBlocks === []) {
            throw new \InvalidArgumentException('ical: no VEVENT in this calendar');
        }
        $props = array_map(self::parseLine(...), $eventBlocks[0]);

        $methodLine = null;
        foreach ($lines as $line) {
            if (str_starts_with(strtoupper($line), 'METHOD:')) {
                $methodLine = $line;
                break;
            }
        }
        $methodValue = $methodLine !== null ? explode(':', $methodLine, 2)[1] : 'REQUEST';
        $method = strtoupper(trim($methodValue));
        if (! in_array($method, ['REQUEST', 'CANCEL'], true)) {
            throw new \InvalidArgumentException("ical: METHOD must be REQUEST or CANCEL, got \"{$methodValue}\"");
        }

        $get = static fn (string $name): ?array => self::firstProp($props, $name);
        $getAll = static fn (string $name): array => array_values(array_filter($props, static fn (array $p): bool => $p['name'] === $name));
        $text = static function (string $name) use ($get): ?string {
            $p = $get($name);

            return $p !== null ? self::unescapeText($p['value']) : null;
        };

        $uidProp = $get('UID');
        if ($uidProp === null) {
            throw new \InvalidArgumentException('ical: VEVENT has no UID');
        }

        $dtstartProp = $get('DTSTART');
        if ($dtstartProp === null) {
            throw new \InvalidArgumentException('ical: VEVENT has no DTSTART');
        }

        $dtendProp = $get('DTEND');
        $organizerProp = $get('ORGANIZER');
        $rruleProp = $get('RRULE');
        $sequenceProp = $get('SEQUENCE');
        $statusProp = $get('STATUS');

        return new Invite(
            method: $method,
            uid: $uidProp['value'],
            sequence: $sequenceProp !== null ? (int) $sequenceProp['value'] : 0,
            summary: $text('SUMMARY'),
            description: $text('DESCRIPTION'),
            location: $text('LOCATION'),
            status: $statusProp['value'] ?? null,
            dtstart: self::resolveInstant($dtstartProp, $zones),
            dtend: $dtendProp !== null ? self::resolveInstant($dtendProp, $zones) : null,
            organizer: $organizerProp !== null
                ? ['name' => $organizerProp['params']['CN'] ?? null, 'email' => self::emailOf($organizerProp['value'])]
                : null,
            attendees: array_map(self::parseAttendee(...), $getAll('ATTENDEE')),
            rrule: $rruleProp !== null ? self::parseRRule($rruleProp['value']) : null,
        );
    }

    /**
     * The next occurrence at or after `$afterIso`, or null when the series
     * (or the single occurrence, for a non-recurring invite) has nothing
     * left to offer at or after that instant.
     */
    public static function nextOccurrence(Invite $invite, string $afterIso): ?string
    {
        $afterTs = strtotime($afterIso);
        $dtstartTs = strtotime($invite->dtstart);
        if ($afterTs === false || $dtstartTs === false) {
            throw new \InvalidArgumentException('ical: unreadable instant passed to nextOccurrence');
        }

        if ($invite->rrule === null) {
            return $dtstartTs >= $afterTs ? $invite->dtstart : null;
        }

        foreach (self::occurrences($invite->rrule, $dtstartTs) as $ts) {
            if ($ts >= $afterTs) {
                return self::isoFromTs($ts);
            }
        }

        return null;
    }

    /**
     * The allow-listed places a bot can actually join, in the order they
     * appear in the text. Anything else — Webex, a generic link, an
     * unrecognised dial-in shape — is not returned.
     *
     * @return list<array{kind: string, url: ?string, meetingId: ?string, passcode: ?string, phone: ?string}>
     */
    public static function joinTargets(Invite $invite): array
    {
        $text = $invite->description ?? '';
        $found = [];

        if (preg_match_all('/https:\/\/[\w.-]*zoom\.us\/j\/(\d+)(\?[^\s)]*)?/', $text, $m, PREG_OFFSET_CAPTURE | PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $query = $match[2][0] ?? '';
                $passcode = preg_match('#[?&]pwd=([^&\s]+)#', $query, $pm) ? $pm[1] : null;
                $found[] = [
                    'index' => $match[0][1],
                    'target' => ['kind' => 'zoom', 'url' => $match[0][0], 'meetingId' => $match[1][0], 'passcode' => $passcode, 'phone' => null],
                ];
            }
        }

        if (preg_match_all('/https:\/\/(?:meet\.google\.com)\/[a-z0-9-]+/i', $text, $m, PREG_OFFSET_CAPTURE | PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $found[] = [
                    'index' => $match[0][1],
                    'target' => ['kind' => 'google-meet', 'url' => $match[0][0], 'meetingId' => null, 'passcode' => null, 'phone' => null],
                ];
            }
        }

        if (preg_match_all('/https:\/\/(?:teams\.(?:microsoft|live)\.com)\/l\/meetup-join\/[^\s)]+/i', $text, $m, PREG_OFFSET_CAPTURE | PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $found[] = [
                    'index' => $match[0][1],
                    'target' => ['kind' => 'teams', 'url' => $match[0][0], 'meetingId' => null, 'passcode' => null, 'phone' => null],
                ];
            }
        }

        if (preg_match('#^Dial(?:-in)?[:\s]+([+0-9][0-9\s().-]{6,}\d)#im', $text, $dm, PREG_OFFSET_CAPTURE)) {
            $passcode = preg_match('#Passcode[:\s]+([A-Za-z0-9]+)#i', $text, $pm) ? $pm[1] : null;
            $found[] = [
                'index' => $dm[0][1],
                'target' => ['kind' => 'dial-in', 'url' => null, 'meetingId' => null, 'passcode' => $passcode, 'phone' => trim($dm[1][0])],
            ];
        }

        usort($found, static fn (array $a, array $b): int => $a['index'] <=> $b['index']);

        return array_map(static fn (array $f): array => $f['target'], $found);
    }

    /* ── Unfolding, unescaping, the property/parameter grammar ────────────── */

    /** A line break followed by a single space or tab joins with nothing between. */
    private static function unfold(string $text): string
    {
        $normalised = preg_replace('/\r\n|\r/', "\n", $text) ?? $text;

        return preg_replace('/\n[ \t]/', '', $normalised) ?? $normalised;
    }

    /** `\n` -> newline, `\,` -> `,`, `\;` -> `;`, `\\` -> `\`. Order matters: `\\` last. */
    private static function unescapeText(string $value): string
    {
        $value = preg_replace('/\\\\[nN]/', "\n", $value) ?? $value;
        $value = str_replace('\\,', ',', $value);
        $value = str_replace('\\;', ';', $value);

        return str_replace('\\\\', '\\', $value);
    }

    /** @return array{name: string, params: array<string,string>, value: string} */
    private static function parseLine(string $line): array
    {
        $colon = self::findUnquoted($line, ':');
        $head = $colon === -1 ? $line : substr($line, 0, $colon);
        $value = $colon === -1 ? '' : substr($line, $colon + 1);
        $headParts = explode(';', $head);
        $name = strtoupper(array_shift($headParts) ?? '');
        $params = [];

        foreach ($headParts as $part) {
            $eq = strpos($part, '=');
            if ($eq === false) {
                continue;
            }
            $key = strtoupper(substr($part, 0, $eq));
            $raw = substr($part, $eq + 1);
            if (str_starts_with($raw, '"') && str_ends_with($raw, '"')) {
                $raw = substr($raw, 1, -1);
            }
            $params[$key] = $raw;
        }

        return ['name' => $name, 'params' => $params, 'value' => $value];
    }

    /** The first occurrence of `$char` outside a `"…"` run. */
    private static function findUnquoted(string $line, string $char): int
    {
        $quoted = false;
        $length = strlen($line);
        for ($i = 0; $i < $length; $i++) {
            if ($line[$i] === '"') {
                $quoted = ! $quoted;
            } elseif ($line[$i] === $char && ! $quoted) {
                return $i;
            }
        }

        return -1;
    }

    /**
     * A block's direct-child lines between BEGIN:name and its matching
     * END:name.
     *
     * @param  list<string>  $lines
     * @return list<list<string>>
     */
    private static function blockLines(array $lines, string $name): array
    {
        $blocks = [];
        $depth = 0;
        $current = null;

        foreach ($lines as $raw) {
            $upper = strtoupper($raw);
            if ($upper === "BEGIN:{$name}") {
                if ($depth === 0) {
                    $current = [];
                }
                $depth++;

                continue;
            }
            if ($upper === "END:{$name}") {
                $depth--;
                if ($depth === 0 && $current !== null) {
                    $blocks[] = $current;
                    $current = null;
                }

                continue;
            }
            if ($current !== null) {
                $current[] = $raw;
            }
        }

        return $blocks;
    }

    /** @param  list<array{name: string, params: array<string,string>, value: string}>  $props */
    private static function firstProp(array $props, string $name): ?array
    {
        foreach ($props as $p) {
            if ($p['name'] === $name) {
                return $p;
            }
        }

        return null;
    }

    /* ── VTIMEZONE ─────────────────────────────────────────────────────────── */

    /** @return array{offsetFrom: string, offsetTo: string, month: int, ordinal: int, weekday: int} */
    private static function parseTzTransition(array $lines): array
    {
        $props = array_map(self::parseLine(...), $lines);
        $get = static fn (string $n): ?string => self::firstProp($props, $n)['value'] ?? null;
        $offsetFrom = $get('TZOFFSETFROM');
        $offsetTo = $get('TZOFFSETTO');
        $rrule = $get('RRULE');
        if ($offsetFrom === null || $offsetTo === null || $rrule === null) {
            throw new \InvalidArgumentException('ical: a VTIMEZONE sub-component needs TZOFFSETFROM, TZOFFSETTO and an RRULE');
        }

        $parts = [];
        foreach (explode(';', $rrule) as $pair) {
            [$k, $v] = array_pad(explode('=', $pair, 2), 2, null);
            $parts[$k] = $v;
        }

        $month = isset($parts['BYMONTH']) ? (int) $parts['BYMONTH'] : 0;
        [$ordinal, $weekday] = self::parseByDayOrdinal($parts['BYDAY'] ?? '');
        if ($month === 0) {
            throw new \InvalidArgumentException("ical: this package only reads a yearly BYMONTH+BYDAY transition rule, got \"{$rrule}\"");
        }

        return ['offsetFrom' => $offsetFrom, 'offsetTo' => $offsetTo, 'month' => $month, 'ordinal' => $ordinal, 'weekday' => $weekday];
    }

    /** `2SU` -> [ordinal 2, weekday 0 (Sunday)]. `-1SU` -> [-1, 0]. @return array{0: int, 1: int} */
    private static function parseByDayOrdinal(string $token): array
    {
        if (! preg_match('/^(-?\d+)([A-Z]{2})$/', $token, $m)) {
            throw new \InvalidArgumentException("ical: VTIMEZONE rule has an unreadable BYDAY \"{$token}\"");
        }
        $weekday = array_search($m[2], self::WEEKDAY_CODES, true);
        if ($weekday === false) {
            throw new \InvalidArgumentException("ical: VTIMEZONE rule names an unknown weekday \"{$m[2]}\"");
        }

        return [(int) $m[1], $weekday];
    }

    /** Minutes east of UTC from `+HHMM` / `-HHMM` / `+HH:MM`. */
    private static function offsetMinutes(string $offset): int
    {
        if (! preg_match('/^([+-])(\d{2}):?(\d{2})/', $offset, $m)) {
            throw new \InvalidArgumentException("ical: unreadable UTC offset \"{$offset}\"");
        }
        $sign = $m[1] === '-' ? -1 : 1;

        return $sign * ((int) $m[2] * 60 + (int) $m[3]);
    }

    /** The Nth weekday of a UTC month, as a day-of-month — ordinal signed as RFC 5545 defines it. */
    private static function nthWeekdayOfMonth(int $year, int $month1, int $weekday, int $ordinal): int
    {
        if ($ordinal > 0) {
            $firstWeekday = (int) gmdate('w', gmmktime(0, 0, 0, $month1, 1, $year));
            $offset = ($weekday - $firstWeekday + 7) % 7;

            return 1 + $offset + ($ordinal - 1) * 7;
        }

        $lastDay = (int) gmdate('t', gmmktime(0, 0, 0, $month1, 1, $year));
        $lastWeekday = (int) gmdate('w', gmmktime(0, 0, 0, $month1, $lastDay, $year));
        $offset = ($lastWeekday - $weekday + 7) % 7;

        return $lastDay - $offset - (-$ordinal - 1) * 7;
    }

    /** @return array{standard: array{offsetFrom: string, offsetTo: string, month: int, ordinal: int, weekday: int}, daylight: ?array{offsetFrom: string, offsetTo: string, month: int, ordinal: int, weekday: int}} */
    private static function parseTimezone(array $block): array
    {
        $standardBlocks = self::blockLines($block, 'STANDARD');
        $daylightBlocks = self::blockLines($block, 'DAYLIGHT');
        if ($standardBlocks === []) {
            throw new \InvalidArgumentException('ical: VTIMEZONE has no STANDARD component');
        }

        return [
            'standard' => self::parseTzTransition($standardBlocks[0]),
            'daylight' => $daylightBlocks !== [] ? self::parseTzTransition($daylightBlocks[0]) : null,
        ];
    }

    /** @param  list<string>  $lines @return array<string, array{standard: array, daylight: ?array}> */
    private static function parseTimezones(array $lines): array
    {
        $zones = [];

        foreach (self::blockLines($lines, 'VTIMEZONE') as $block) {
            $props = array_map(self::parseLine(...), $block);
            $tzid = self::firstProp($props, 'TZID')['value'] ?? null;
            if ($tzid === null) {
                continue;
            }
            $zones[$tzid] = self::parseTimezone($block);
        }

        return $zones;
    }

    /**
     * A local wall-clock date/time under a named zone, resolved to a UTC
     * timestamp via that zone's DAYLIGHT/STANDARD transitions for the
     * specific YEAR the date falls in.
     */
    private static function resolveTz(array $zone, int $y, int $mo, int $d, int $h, int $mi, int $s): int
    {
        $naiveTs = gmmktime($h, $mi, $s, $mo, $d, $y);

        if ($zone['daylight'] === null) {
            return $naiveTs - self::offsetMinutes($zone['standard']['offsetTo']) * 60;
        }

        $springDay = self::nthWeekdayOfMonth($y, $zone['daylight']['month'], $zone['daylight']['weekday'], $zone['daylight']['ordinal']);
        $fallDay = self::nthWeekdayOfMonth($y, $zone['standard']['month'], $zone['standard']['weekday'], $zone['standard']['ordinal']);
        $spring = gmmktime(0, 0, 0, $zone['daylight']['month'], $springDay, $y);
        $fall = gmmktime(0, 0, 0, $zone['standard']['month'], $fallDay, $y);
        $inDaylight = $naiveTs >= $spring && $naiveTs < $fall;
        $offset = $inDaylight ? $zone['daylight']['offsetTo'] : $zone['standard']['offsetTo'];

        return $naiveTs - self::offsetMinutes($offset) * 60;
    }

    /** @return array{y: int, mo: int, d: int, h: int, mi: int, s: int, utc: bool} */
    private static function parseDateTimeParts(string $value): array
    {
        if (! preg_match('/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/', $value, $m)) {
            throw new \InvalidArgumentException("ical: unreadable date-time \"{$value}\"");
        }

        return [
            'y' => (int) $m[1], 'mo' => (int) $m[2], 'd' => (int) $m[3],
            'h' => (int) $m[4], 'mi' => (int) $m[5], 's' => (int) $m[6],
            'utc' => isset($m[7]) && $m[7] !== '',
        ];
    }

    /** A DTSTART/DTEND/UNTIL property resolved to an ISO 8601 UTC instant. */
    private static function resolveInstant(array $prop, array $zones): string
    {
        $parts = self::parseDateTimeParts($prop['value']);

        if ($parts['utc']) {
            return self::isoFromTs(gmmktime($parts['h'], $parts['mi'], $parts['s'], $parts['mo'], $parts['d'], $parts['y']));
        }

        $tzid = $prop['params']['TZID'] ?? null;
        if ($tzid === null) {
            // FLOATING: no TZID and no Z. Treated as UTC — see the class doc.
            return self::isoFromTs(gmmktime($parts['h'], $parts['mi'], $parts['s'], $parts['mo'], $parts['d'], $parts['y']));
        }

        $zone = $zones[$tzid] ?? null;
        if ($zone === null) {
            throw new \InvalidArgumentException("ical: DTSTART/DTEND names TZID \"{$tzid}\", which this calendar's VTIMEZONE does not define");
        }

        return self::isoFromTs(self::resolveTz($zone, $parts['y'], $parts['mo'], $parts['d'], $parts['h'], $parts['mi'], $parts['s']));
    }

    private static function isoFromTs(int $ts): string
    {
        return gmdate('Y-m-d\TH:i:s.000\Z', $ts);
    }

    /* ── ATTENDEE / ORGANIZER ─────────────────────────────────────────────── */

    private static function emailOf(string $value): string
    {
        return preg_replace('/^mailto:/i', '', $value) ?? $value;
    }

    /** @return array{name: ?string, email: string, role: ?string, partstat: ?string} */
    private static function parseAttendee(array $prop): array
    {
        return [
            'name' => $prop['params']['CN'] ?? null,
            'email' => self::emailOf($prop['value']),
            'role' => $prop['params']['ROLE'] ?? null,
            'partstat' => $prop['params']['PARTSTAT'] ?? null,
        ];
    }

    /* ── RRULE ─────────────────────────────────────────────────────────────── */

    /** @return array{freq: string, interval: int, count: ?int, until: ?string, byDay: ?list<string>} */
    private static function parseRRule(string $value): array
    {
        $parts = [];
        foreach (explode(';', $value) as $pair) {
            $eq = strpos($pair, '=');
            if ($eq === false) {
                continue;
            }
            $parts[strtoupper(substr($pair, 0, $eq))] = substr($pair, $eq + 1);
        }

        $freq = strtoupper($parts['FREQ'] ?? '');
        if (! in_array($freq, self::FREQS, true)) {
            throw new \InvalidArgumentException('ical: RRULE FREQ must be one of '.implode(', ', self::FREQS).", got \"{$freq}\"");
        }

        return [
            'freq' => $freq,
            'interval' => isset($parts['INTERVAL']) ? (int) $parts['INTERVAL'] : 1,
            'count' => isset($parts['COUNT']) ? (int) $parts['COUNT'] : null,
            'until' => isset($parts['UNTIL']) ? self::resolveInstant(['value' => $parts['UNTIL'], 'params' => []], []) : null,
            'byDay' => isset($parts['BYDAY']) ? explode(',', $parts['BYDAY']) : null,
        ];
    }

    /* ── occurrence enumeration ───────────────────────────────────────────── */

    private const DAY_SECONDS = 86_400;

    private static function addCalendarUnit(int $ts, string $freq, int $interval): int
    {
        if ($freq === 'DAILY') {
            return $ts + $interval * self::DAY_SECONDS;
        }
        if ($freq === 'WEEKLY') {
            return $ts + $interval * 7 * self::DAY_SECONDS;
        }

        $months = $freq === 'YEARLY' ? $interval * 12 : $interval;
        $y = (int) gmdate('Y', $ts);
        $mo = (int) gmdate('n', $ts);
        $d = (int) gmdate('j', $ts);
        $h = (int) gmdate('G', $ts);
        $mi = (int) gmdate('i', $ts);
        $s = (int) gmdate('s', $ts);

        $totalMonths = ($y * 12 + ($mo - 1)) + $months;
        $nextYear = intdiv($totalMonths, 12);
        $nextMonth1 = ($totalMonths % 12) + 1;
        $daysInNext = (int) gmdate('t', gmmktime(0, 0, 0, $nextMonth1, 1, $nextYear));

        return gmmktime($h, $mi, $s, $nextMonth1, min($d, $daysInNext), $nextYear);
    }

    /**
     * Every occurrence's timestamp, in order, stopping at COUNT or UNTIL.
     *
     * @param  array{freq: string, interval: int, count: ?int, until: ?string, byDay: ?list<string>}  $rrule
     * @return \Generator<int, int>
     */
    private static function occurrences(array $rrule, int $dtstartTs): \Generator
    {
        $untilTs = $rrule['until'] !== null ? strtotime($rrule['until']) : null;
        $n = 0;
        $emit = static function (int $ts) use ($untilTs, &$n): bool {
            if ($untilTs !== false && $untilTs !== null && $ts > $untilTs) {
                return false;
            }
            $n++;

            return true;
        };

        if ($rrule['freq'] === 'WEEKLY' && ! empty($rrule['byDay'])) {
            $wanted = array_values(array_unique(array_map(
                static fn (string $d): int => array_search($d, self::WEEKDAY_CODES, true),
                $rrule['byDay'],
            )));
            sort($wanted);

            $dayStartTs = gmmktime(0, 0, 0, (int) gmdate('n', $dtstartTs), (int) gmdate('j', $dtstartTs), (int) gmdate('Y', $dtstartTs));
            $timeOfDay = $dtstartTs - $dayStartTs;
            $dtstartWeekday = (int) gmdate('w', $dtstartTs);
            $startOfWeek = $dtstartTs - $timeOfDay - $dtstartWeekday * self::DAY_SECONDS;
            $weekIndex = 0;

            while (true) {
                if ($weekIndex % $rrule['interval'] === 0) {
                    foreach ($wanted as $weekday) {
                        $candidate = $startOfWeek + $weekIndex * 7 * self::DAY_SECONDS + $weekday * self::DAY_SECONDS + $timeOfDay;
                        if ($candidate < $dtstartTs) {
                            continue;
                        }
                        if (! $emit($candidate)) {
                            return;
                        }
                        yield $candidate;
                        if ($rrule['count'] !== null && $n >= $rrule['count']) {
                            return;
                        }
                    }
                }
                $weekIndex++;
            }
        }

        $current = $dtstartTs;
        while (true) {
            if (! $emit($current)) {
                return;
            }
            yield $current;
            if ($rrule['count'] !== null && $n >= $rrule['count']) {
                return;
            }
            $current = self::addCalendarUnit($current, $rrule['freq'], $rrule['interval']);
        }
    }
}
