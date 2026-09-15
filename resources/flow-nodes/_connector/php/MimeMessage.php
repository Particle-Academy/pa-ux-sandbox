<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/MimeMessage.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A parsed message — the shape `Mime::parse()` returns and a host stores.
 *
 * Plain arrays inside, in the key order the TypeScript twin uses, so
 * `toArray()` round-trips through JSON to exactly what `parseMime` produces.
 */
final class MimeMessage
{
    /**
     * @param list<array{name: string, value: string}> $headers
     * @param list<array<string, mixed>> $parts
     * @param list<array<string, mixed>> $attachments
     */
    public function __construct(
        public readonly array $headers,
        public readonly ?string $subject,
        public readonly ?string $messageId,
        public readonly ?string $text,
        public readonly ?string $html,
        public readonly array $parts,
        public readonly array $attachments,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'headers' => $this->headers,
            'subject' => $this->subject,
            'messageId' => $this->messageId,
            'text' => $this->text,
            'html' => $this->html,
            'parts' => $this->parts,
            'attachments' => $this->attachments,
        ];
    }
}
