<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Mime.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Raw MIME in, headers / parts / attachments out — the payload TRANSFORM an
 * inbound-email trigger declares.
 *
 * Written from scratch (the owner: no third-party code), as ONE implementation
 * in two runtimes — `src/mime.ts` is the twin — and held to the authored corpus
 * under `fixtures/mime/`, which both must reproduce exactly. The decisions that
 * are easy to get differently in two languages:
 *
 * - Header lines are bytes read one-byte-one-char, unfolded with a single
 *   space, names lowercased, values RFC 2047-decoded (B and Q; adjacent
 *   encoded-words join without the whitespace between them).
 * - The line break before a boundary delimiter belongs to the DELIMITER.
 * - `size` is the transfer-decoded byte length, before any charset conversion.
 * - A text part comes back as UTF-8 with the message's own line endings. A
 *   charset this class does not decode (anything but utf-8, us-ascii,
 *   iso-8859-1, iso-8859-15, windows-1252) leaves the part with no text.
 * - Every non-text leaf is an attachment, as is a text leaf declared
 *   `attachment`; attachments carry their bytes as base64. `filename*` (RFC
 *   2231) wins over `filename`, which wins over Content-Type's `name`.
 * - `messageId` is the header verbatim; `contentId` has its angle brackets
 *   stripped, because `cid:` references omit them.
 */
final class Mime
{
    private const ENCODED_WORD = '/=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/';

    public static function parse(string $raw): MimeMessage
    {
        [$headerEnd, $bodyStart] = self::splitEntity($raw);
        $headers = self::parseHeaders(substr($raw, 0, $headerEnd));
        $body = substr($raw, $bodyStart);

        $acc = ['parts' => [], 'attachments' => [], 'text' => null, 'html' => null];
        $type = self::parseParams(self::header($headers, 'content-type') ?? 'text/plain');
        if (str_starts_with($type['main'], 'multipart/') && isset($type['params']['boundary'])) {
            foreach (self::splitMultipart($body, $type['params']['boundary']) as $child) {
                self::walk($child, null, $acc);
            }
        } else {
            // A non-multipart message is one part whose headers are the
            // message's content-* headers.
            self::walk($body, array_values(array_filter($headers, fn (array $h): bool => str_starts_with($h['name'], 'content-'))), $acc);
        }

        return new MimeMessage(
            headers: $headers,
            subject: self::header($headers, 'subject'),
            messageId: self::header($headers, 'message-id'),
            text: $acc['text'],
            html: $acc['html'],
            parts: $acc['parts'],
            attachments: $acc['attachments'],
        );
    }

    /* ── Entities ─────────────────────────────────────────────────────── */

    /**
     * @param  list<array{name: string, value: string}>|null  $entityHeaders
     * @param  array{parts: list<array<string, mixed>>, attachments: list<array<string, mixed>>, text: ?string, html: ?string}  $acc
     */
    private static function walk(string $bytes, ?array $entityHeaders, array &$acc): void
    {
        [$headerEnd, $bodyStart] = self::splitEntity($bytes);
        $headers = $entityHeaders ?? self::parseHeaders(substr($bytes, 0, $headerEnd));
        $body = $entityHeaders !== null ? $bytes : substr($bytes, $bodyStart);

        $type = self::parseParams(self::header($headers, 'content-type') ?? 'text/plain');

        if (str_starts_with($type['main'], 'multipart/') && isset($type['params']['boundary'])) {
            foreach (self::splitMultipart($body, $type['params']['boundary']) as $child) {
                self::walk($child, null, $acc);
            }

            return;
        }

        $disposition = self::parseParams(self::header($headers, 'content-disposition') ?? '');
        $decoded = self::transferDecode($body, self::header($headers, 'content-transfer-encoding'));
        $declaredDisposition = in_array($disposition['main'], ['attachment', 'inline'], true) ? $disposition['main'] : null;
        $filename = $disposition['params']['filename'] ?? $type['params']['name'] ?? null;
        $contentIdHeader = self::header($headers, 'content-id');
        $contentId = $contentIdHeader === null ? null : preg_replace('/^<|>$/', '', $contentIdHeader);
        $isText = str_starts_with($type['main'], 'text/');
        $isAttachment = $declaredDisposition === 'attachment' || ! $isText;

        $part = [
            'index' => count($acc['parts']),
            'contentType' => $type['main'],
            'charset' => isset($type['params']['charset']) ? strtolower($type['params']['charset']) : null,
            'disposition' => $declaredDisposition,
            'filename' => $filename,
            'contentId' => $contentId,
            'size' => strlen($decoded),
            'headers' => $headers,
        ];
        $acc['parts'][] = $part;

        if ($isAttachment) {
            $acc['attachments'][] = $part + ['content' => base64_encode($decoded)];

            return;
        }

        $text = self::decodeCharset($decoded, $type['params']['charset'] ?? 'utf-8');
        if ($text === null) {
            return;
        }
        if ($type['main'] === 'text/plain' && $acc['text'] === null) {
            $acc['text'] = $text;
        }
        if ($type['main'] === 'text/html' && $acc['html'] === null) {
            $acc['html'] = $text;
        }
    }

    /** Where the header block ends: the first blank line, CRLF or LF. @return array{int, int} */
    private static function splitEntity(string $bytes): array
    {
        $n = strlen($bytes);
        for ($i = 0; $i < $n; $i++) {
            if ($bytes[$i] !== "\n") {
                continue;
            }
            if (($bytes[$i + 1] ?? '') === "\n") {
                return [$i, $i + 2];
            }
            if (($bytes[$i + 1] ?? '') === "\r" && ($bytes[$i + 2] ?? '') === "\n") {
                return [$i, $i + 3];
            }
        }

        return [$n, $n];
    }

    /** The bodies between delimiters — the line break before each delimiter is the delimiter's. @return list<string> */
    private static function splitMultipart(string $body, string $boundary): array
    {
        $delimiter = "--{$boundary}";
        $dlen = strlen($delimiter);
        $children = [];
        $partStart = -1;
        $n = strlen($body);

        for ($i = 0; $i <= $n - $dlen; $i++) {
            if ($i !== 0 && $body[$i - 1] !== "\n") {
                continue;
            }
            if (substr_compare($body, $delimiter, $i, $dlen) !== 0) {
                continue;
            }

            $partEnd = $i;
            if ($partEnd > 0 && $body[$partEnd - 1] === "\n") {
                $partEnd--;
            }
            if ($partEnd > 0 && $body[$partEnd - 1] === "\r") {
                $partEnd--;
            }
            if ($partStart >= 0) {
                $children[] = substr($body, $partStart, $partEnd - $partStart);
            }

            $j = $i + $dlen;
            if (($body[$j] ?? '') === '-' && ($body[$j + 1] ?? '') === '-') {
                return $children;
            }
            while ($j < $n && $body[$j] !== "\n") {
                $j++;
            }
            $partStart = $j + 1;
            $i = $j;
        }
        if ($partStart >= 0 && $partStart <= $n) {
            $children[] = substr($body, $partStart);
        }

        return $children;
    }

    /* ── Headers ──────────────────────────────────────────────────────── */

    /** @return list<array{name: string, value: string}> */
    private static function parseHeaders(string $block): array
    {
        $unfolded = [];
        foreach (preg_split('/\r?\n/', $block) ?: [] as $line) {
            if ($line === '') {
                continue;
            }
            if (($line[0] === ' ' || $line[0] === "\t") && $unfolded !== []) {
                $unfolded[count($unfolded) - 1] .= ' '.trim($line);
            } else {
                $unfolded[] = $line;
            }
        }
        $headers = [];
        foreach ($unfolded as $line) {
            $colon = strpos($line, ':');
            if ($colon === false || $colon === 0) {
                continue;
            }
            $headers[] = [
                'name' => strtolower(trim(substr($line, 0, $colon))),
                'value' => self::decodeWords(trim(substr($line, $colon + 1))),
            ];
        }

        return $headers;
    }

    /** @param list<array{name: string, value: string}> $headers */
    private static function header(array $headers, string $name): ?string
    {
        foreach ($headers as $h) {
            if ($h['name'] === $name) {
                return $h['value'];
            }
        }

        return null;
    }

    /* ── RFC 2047 encoded-words ───────────────────────────────────────── */

    private static function decodeWords(string $value): string
    {
        // Adjacent encoded-words are one token: the whitespace between them is
        // not part of the text (RFC 2047 §6.2).
        $joined = preg_replace('/(\?=)[ \t\r\n]+(=\?)/', '$1$2', $value) ?? $value;

        return preg_replace_callback(self::ENCODED_WORD, static function (array $m): string {
            [$whole, $charset, $encoding, $text] = $m;
            $bytes = strtoupper($encoding) === 'B'
                ? base64_decode(preg_replace('/[^A-Za-z0-9+\/=]/', '', $text) ?? '', false)
                : preg_replace_callback('/=([0-9A-Fa-f]{2})/', static fn (array $h): string => chr((int) hexdec($h[1])), str_replace('_', ' ', $text));
            $decoded = self::decodeCharset((string) $bytes, $charset);

            return $decoded ?? $whole;
        }, $joined) ?? $joined;
    }

    /* ── Parameters, with RFC 2231 ────────────────────────────────────── */

    /** @return array{main: string, params: array<string, string>} */
    private static function parseParams(string $value): array
    {
        $pieces = explode(';', $value);
        $head = array_shift($pieces) ?? '';
        $params = [];
        $continued = [];
        $charset2231 = 'utf-8';

        foreach ($pieces as $piece) {
            $eq = strpos($piece, '=');
            if ($eq === false) {
                continue;
            }
            $key = strtolower(trim(substr($piece, 0, $eq)));
            $raw = trim(substr($piece, $eq + 1));
            if (strlen($raw) >= 2 && $raw[0] === '"' && str_ends_with($raw, '"')) {
                $raw = preg_replace('/\\\\(.)/', '$1', substr($raw, 1, -1)) ?? '';
            }

            if (preg_match('/^(.+?)\*(\d+)(\*)?$/', $key, $seg) === 1) {
                $continued[$seg[1]][(int) $seg[2]] = ($seg[3] ?? '') !== ''
                    ? self::decode2231($raw, (int) $seg[2] === 0, $charset2231)
                    : $raw;

                continue;
            }
            if (str_ends_with($key, '*')) {
                $params[substr($key, 0, -1)] = self::decode2231($raw, true, $charset2231);

                continue;
            }
            $params[$key] ??= $raw;
        }
        foreach ($continued as $base => $segments) {
            ksort($segments);
            $params[$base] = implode('', $segments);
        }

        return ['main' => strtolower(trim($head)), 'params' => $params];
    }

    private static function decode2231(string $raw, bool $first, string &$charset): string
    {
        $text = $raw;
        if ($first && preg_match("/^([^']*)'[^']*'(.*)$/s", $raw, $m) === 1) {
            $charset = $m[1] !== '' ? $m[1] : 'utf-8';
            $text = $m[2];
        }
        $bytes = preg_replace_callback('/%([0-9A-Fa-f]{2})/', static fn (array $h): string => chr((int) hexdec($h[1])), $text) ?? $text;

        return self::decodeCharset($bytes, $charset) ?? $text;
    }

    /* ── Transfer encodings and charsets ──────────────────────────────── */

    private static function transferDecode(string $body, ?string $encoding): string
    {
        return match (strtolower(trim($encoding ?? '7bit'))) {
            'base64' => (string) base64_decode(preg_replace('/[^A-Za-z0-9+\/=]/', '', $body) ?? '', false),
            'quoted-printable' => self::quotedPrintable($body),
            default => $body,
        };
    }

    private static function quotedPrintable(string $bytes): string
    {
        $out = '';
        $n = strlen($bytes);
        for ($i = 0; $i < $n; $i++) {
            $b = $bytes[$i];
            if ($b !== '=') {
                $out .= $b;

                continue;
            }
            $a = $bytes[$i + 1] ?? '';
            $c = $bytes[$i + 2] ?? '';
            if ($a === "\n") {
                $i += 1;

                continue;
            }
            if ($a === "\r" && $c === "\n") {
                $i += 2;

                continue;
            }
            if ($a !== '' && $c !== '' && ctype_xdigit($a) && ctype_xdigit($c)) {
                $out .= chr((int) hexdec($a.$c));
                $i += 2;

                continue;
            }
            $out .= $b;
        }

        return $out;
    }

    /** UTF-8 text for a charset this class decodes; null for one it does not. */
    private static function decodeCharset(string $bytes, string $charset): ?string
    {
        return match (strtolower(trim($charset))) {
            'utf-8', 'utf8' => $bytes,
            'us-ascii', 'ascii', 'iso-8859-1', 'latin1' => mb_convert_encoding($bytes, 'UTF-8', 'ISO-8859-1'),
            'windows-1252', 'cp1252' => mb_convert_encoding($bytes, 'UTF-8', 'Windows-1252'),
            'iso-8859-15', 'latin9' => mb_convert_encoding($bytes, 'UTF-8', 'ISO-8859-15'),
            default => null,
        };
    }
}
