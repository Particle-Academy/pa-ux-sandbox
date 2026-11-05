<?php

declare(strict_types=1);

namespace App\Support\Notices;

/**
 * The one line a "What's new" release card says about what changed, derived
 * from that release's own section of the package's CHANGELOG.md.
 *
 * Pure: markdown in, plain text or null out. `null` means the changelog has
 * nothing to say about exactly this version, and the card says nothing. It is
 * never another version's entry, a description, or anything made up.
 *
 * ## Which entry
 *
 *  1. The first bullet under a Keep a Changelog heading (or under no heading).
 *  2. Otherwise the first bullet anywhere in the section (`### Upgrade`).
 *  3. Otherwise the first paragraph.
 *
 * Consumer notes ("What you must do: nothing.") open many sections and say
 * nothing about what changed, so they are skipped wherever they appear.
 *
 * ## Which words
 *
 * The bold lead if the entry has one, otherwise its first sentence. A lead of one
 * word says too little alone (`**print**`, `**DeckFileView**`), and one ending in
 * a colon is a label (`**BREAKING:**`), so those keep the sentence they introduce.
 *
 * The result is text, not markup: it is capped, control characters are gone, and
 * a `<script>` in a changelog stays the literal characters, as `<Button>` must.
 */
final class ChangelogSummary
{
    public const MAX_LENGTH = 120;

    /**
     * A changelog fetched from somewhere else is cut to this before it is parsed.
     * Twice the largest one in the kit (react-fancy, about 230 KB, 2026-11-05):
     * the sections a 60-day window asks for sit at the top.
     */
    public const MAX_CHANGELOG_BYTES = 512 * 1024;

    /** An entry longer than this is not read further: a summary comes from its start. */
    private const MAX_ENTRY_BYTES = 4000;

    private const STANDARD_SUBSECTION = '/^(added|changed|deprecated|removed|fixed|security|breaking)\b/i';

    /** Openers that talk about the upgrade rather than the change. */
    private const CONSUMER_NOTE = '/^(what (you|a consumer|consumers) (must|need to|needs to|should|have to) do|what to do|nothing to\b|nothing in this release|(no |one )?consumer action|additive\b|pre-1\.0|a minor release|(the )?first release\b|initial release\b|no (api )?changes?\b|no breaking changes?\b|none$)/i';

    /** The headings GitHub's generated release notes open with. */
    private const GENERATED_NOTES = "/^(what['\u{2019}]s changed|full changelog\\b|new contributors\\b)/iu";

    /** The word before a period that does not end the sentence. */
    private const ABBREVIATION = '/(?:\b(?:e\.g|i\.e|vs|etc|cf|approx|incl|resp)|\b\p{Lu})\.$/iu';

    /**
     * The summary for exactly `$version`, or null when there is nothing honest to say.
     */
    public static function forVersion(string $markdown, string $version): ?string
    {
        $section = self::section($markdown, $version);

        if ($section === null) {
            return null;
        }

        $blocks = self::blocks($section);

        $standard = array_filter($blocks, fn (array $b): bool => $b['bullet']
            && ($b['under'] === null || preg_match(self::STANDARD_SUBSECTION, $b['under']) === 1));
        $otherBullets = array_filter($blocks, fn (array $b): bool => $b['bullet']);
        $prose = array_filter($blocks, fn (array $b): bool => ! $b['bullet']);

        foreach ([$standard, $otherBullets, $prose] as $candidates) {
            foreach ($candidates as $block) {
                $summary = self::summarize($block['text']);

                if ($summary !== null) {
                    return $summary;
                }
            }
        }

        return null;
    }

    /**
     * The summary in one line of release notes (a GitHub Release body's first
     * line), or null. Same rules as a changelog entry: consumer notes are not a
     * summary, markup becomes text, and the result is capped.
     *
     * A leading `v1.2.3 - ` is the version, not news, and GitHub's generated
     * notes open with a heading (`## What's Changed`) that says nothing.
     */
    public static function forLine(string $line): ?string
    {
        $line = substr($line, 0, self::MAX_ENTRY_BYTES);
        $line = trim(mb_scrub($line, 'UTF-8'));
        $line = (string) preg_replace('/^#{1,6}\s+/', '', $line);
        $line = (string) preg_replace('/^(?:[-*+]|\d+[.)])\s+/', '', $line);
        $line = (string) preg_replace('/^v?\d+\.\d+\.\d+(?:\s*[:—–-]\s*|\s*$)/u', '', $line);

        if (preg_match(self::GENERATED_NOTES, self::plain($line)) === 1) {
            return null;
        }

        return self::summarize($line);
    }

    /**
     * Whether a line of release notes is only the release's title: its version,
     * alone or after one name (`# 0.6.0`, `prism-acp 0.24.1`,
     * `@particle-academy/prism-harness v0.7.0`). A title says nothing about
     * what changed, so the summary is the line after it.
     */
    public static function isReleaseTitle(string $line, string $version): bool
    {
        $line = substr($line, 0, self::MAX_ENTRY_BYTES);
        $text = self::plain((string) preg_replace('/^#{1,6}\s+/', '', trim(mb_scrub($line, 'UTF-8'))));

        return preg_match('/^(?:\S+\s+)?v?'.preg_quote($version, '/').'$/u', trim($text, " \t*_")) === 1;
    }

    /** Whether the changelog has a section for exactly `$version`, usable or not. */
    public static function hasSection(string $markdown, string $version): bool
    {
        return self::section($markdown, $version) !== null;
    }

    /**
     * The lines under exactly `$version`'s heading.
     *
     * The character after the version is what keeps 0.1.1 off 0.1.10 and
     * 0.1.1-rc.1. A roll-up (`## 0.3.0 and earlier`, `## 0.60.0 – 0.62.0`) is not
     * this release's section, so it does not count.
     *
     * @return list<string>|null
     */
    private static function section(string $markdown, string $version): ?array
    {
        $heading = '/^##\s+\[?v?'.preg_quote($version, '/').'\]?(?![\w.+-])(.*)$/u';
        $lines = preg_split('/\r\n|\n|\r/', mb_scrub($markdown, 'UTF-8')) ?: [];

        $fence = null;
        $found = null;

        foreach ($lines as $line) {
            $fence = self::nextFence($fence, $line, $wasFence);

            if ($fence !== null || $wasFence) {
                if ($found !== null) {
                    $found[] = $line;
                }

                continue;
            }

            if ($found !== null) {
                if (preg_match('/^#{1,2}\s/', $line) === 1) {
                    break;
                }
                $found[] = $line;

                continue;
            }

            if (preg_match($heading, $line, $m) === 1 && ! self::isRollup($m[1])) {
                $found = [];
            }
        }

        return $found;
    }

    private static function isRollup(string $afterVersion): bool
    {
        return preg_match('/\bearlier\b/i', $afterVersion) === 1
            || preg_match('/^\s*[–—-]\s*v?\d+\.\d+/u', $afterVersion) === 1;
    }

    /**
     * Track a code fence: the marker that opened it, or null outside one.
     * `$isFenceLine` says this line was itself a fence marker.
     */
    private static function nextFence(?string $open, string $line, ?bool &$isFenceLine): ?string
    {
        $isFenceLine = false;

        if (preg_match('/^\s*(`{3,}|~{3,})/', $line, $m) !== 1) {
            return $open;
        }

        if ($open === null) {
            $isFenceLine = true;

            return $m[1];
        }

        if ($m[1][0] === $open[0] && strlen($m[1]) >= strlen($open)) {
            $isFenceLine = true;

            return null;
        }

        return $open;
    }

    /**
     * The section's entries in order: top-level bullets and paragraphs, each with
     * its wrapped lines joined. Code, tables, rules and nested lists are not entries.
     *
     * @param  list<string>  $lines
     * @return list<array{bullet: bool, under: ?string, text: string}>
     */
    private static function blocks(array $lines): array
    {
        $blocks = [];
        $under = null;
        $open = null;          // index into $blocks still taking wrapped lines
        $inBullet = false;     // indented text after a bullet belongs to that bullet
        $fence = null;

        foreach ($lines as $line) {
            $fence = self::nextFence($fence, $line, $wasFence);

            if ($fence !== null || $wasFence) {
                $open = null;

                continue;
            }

            if (trim($line) === '') {
                $open = null;

                continue;
            }

            if (preg_match('/^#{3,}\s+(.*)$/', $line, $m) === 1) {
                $under = trim($m[1]);
                $open = null;
                $inBullet = false;

                continue;
            }

            if (preg_match('/^\s*([-*_])\s*(\1\s*){2,}$/', $line) === 1 || str_starts_with(ltrim($line), '|')) {
                $open = null;

                continue;
            }

            if (preg_match('/^ ?(?:[-*+]|\d+[.)])(?:\s+(.*))?$/', $line, $m) === 1) {
                $blocks[] = ['bullet' => true, 'under' => $under, 'text' => trim($m[1] ?? '')];
                $open = array_key_last($blocks);
                $inBullet = true;

                continue;
            }

            if (preg_match('/^\s{2,}(?:[-*+]|\d+[.)])\s/', $line) === 1) {
                $open = null;

                continue;
            }

            if ($open !== null) {
                $blocks[$open]['text'] .= ' '.trim($line);

                continue;
            }

            if ($inBullet && preg_match('/^\s{2,}/', $line) === 1) {
                continue;
            }

            $blocks[] = ['bullet' => false, 'under' => $under, 'text' => trim(ltrim($line, ' >'))];
            $open = array_key_last($blocks);
            $inBullet = false;
        }

        return $blocks;
    }

    /** One entry down to its one line, or null when it has nothing usable. */
    private static function summarize(string $entry): ?string
    {
        $entry = substr($entry, 0, self::MAX_ENTRY_BYTES);
        $entry = mb_scrub($entry, 'UTF-8');

        if (preg_match(self::CONSUMER_NOTE, ltrim(self::plain($entry), '([ ')) === 1) {
            return null;
        }

        if (preg_match('/^\*\*(.+?)\*\*(?!\*)(.*)$/su', $entry, $m) === 1 || preg_match('/^__(.+?)__(?!_)(.*)$/su', $entry, $m) === 1) {
            return self::finish(self::fromLead($m[1], $m[2]));
        }

        return self::finish(self::firstSentence(self::plain($entry)));
    }

    /** The bold lead, keeping the sentence it introduces when the lead is only a name or a label. */
    private static function fromLead(string $rawLead, string $rawRest): string
    {
        $lead = self::plain($rawLead);
        $rest = self::plain($rawRest);

        $introduced = trim((string) preg_replace('/^[\s:,;.—–-]+/u', '', $rest));
        $isName = preg_match('/\s/u', $lead) !== 1;
        $endsInColon = str_ends_with($lead, ':');

        if ($introduced !== '' && ($endsInColon || $isName)) {
            return rtrim($lead, ':.').': '.self::firstSentence($introduced);
        }

        return self::firstSentence($lead);
    }

    /** Up to the first real sentence end: not a version number, not an abbreviation. */
    private static function firstSentence(string $text): string
    {
        if (preg_match_all('/[.!?](?=\s|$)/u', $text, $matches, PREG_OFFSET_CAPTURE) >= 1) {
            foreach ($matches[0] as [$mark, $offset]) {
                $upTo = substr($text, 0, $offset + strlen($mark));

                if ($offset + strlen($mark) >= strlen(rtrim($text)) || preg_match(self::ABBREVIATION, $upTo) !== 1) {
                    return $upTo;
                }
            }
        }

        return $text;
    }

    /** Markdown down to text. Code spans and escapes are held aside so their stars stay stars. */
    private static function plain(string $markdown): string
    {
        $text = self::clean($markdown);
        $held = [];
        $hold = function (string $value) use (&$held): string {
            $held[] = $value;

            return "\u{E000}".(count($held) - 1)."\u{E001}";
        };

        $text = (string) preg_replace('/<!--.*?-->/su', '', $text);
        $text = (string) preg_replace_callback('/(`+)(.+?)\1/su', fn (array $m): string => $hold(trim($m[2])), $text);
        $text = (string) preg_replace_callback('/\\\\([\\\\`*_\[\]#-])/u', fn (array $m): string => $hold($m[1]), $text);
        $text = (string) preg_replace('/!\[[^\]]*\]\([^)]*\)/u', '', $text);
        $text = (string) preg_replace('/\[([^\]]*)\]\([^)]*\)/u', '$1', $text);
        $text = (string) preg_replace('/\[([^\]]+)\]\[[^\]]*\]/u', '$1', $text);
        $text = (string) preg_replace('/<([a-z][a-z0-9+.-]*:[^>\s]+)>/iu', '$1', $text);
        $text = (string) preg_replace('/\*\*(.+?)\*\*/su', '$1', $text);
        $text = (string) preg_replace('/(?<![\p{L}\p{N}_])__(.+?)__(?![\p{L}\p{N}_])/su', '$1', $text);
        $text = (string) preg_replace('/(?<![\p{L}\p{N}*])\*(?!\s)(.+?)(?<!\s)\*(?![\p{L}\p{N}*])/su', '$1', $text);
        $text = (string) preg_replace('/(?<![\p{L}\p{N}_])_(?!\s)(.+?)(?<!\s)_(?![\p{L}\p{N}_])/su', '$1', $text);
        $text = (string) preg_replace_callback("/\u{E000}(\\d+)\u{E001}/u", fn (array $m): string => $held[(int) $m[1]], $text);

        return trim((string) preg_replace('/\s+([.,;:!?])(?=\s|$)/u', '$1', (string) preg_replace('/\s+/u', ' ', $text)));
    }

    /** No terminal escapes, no line breaks, no control or format characters. */
    private static function clean(string $text): string
    {
        $text = (string) preg_replace('/\x1B\[[0-9;?]*[ -\/]*[@-~]/u', '', $text);
        $text = (string) preg_replace('/[\t\r\n\x{0085}\x{2028}\x{2029}]+/u', ' ', $text);

        return (string) preg_replace('/[\p{Cc}\p{Cf}\p{Cs}\p{Co}]/u', '', $text);
    }

    /** Trim what a heading-style line would not carry, require real content, and cap it. */
    private static function finish(string $text): ?string
    {
        $text = trim((string) preg_replace('/[\s.:,;—–-]+$/u', '', $text));

        if (preg_match('/[\p{L}\p{N}]/u', $text) !== 1) {
            return null;
        }

        if (mb_strlen($text) <= self::MAX_LENGTH) {
            return $text;
        }

        $room = self::MAX_LENGTH - 1;
        $cut = mb_substr($text, 0, $room);

        if (mb_substr($text, $room, 1) !== ' ') {
            $space = mb_strrpos($cut, ' ');

            if ($space === false) {
                return null;   // one enormous token: cutting it would cut a word
            }
            $cut = mb_substr($cut, 0, $space);
        }

        return (string) preg_replace('/[\s.:,;(\[—–-]+$/u', '', $cut).'…';
    }
}
