<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Invite.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A parsed invite — the shape `Ical::parse()` returns and a host stores.
 *
 * Plain arrays inside, in the key order the TypeScript twin uses, so
 * `toArray()` round-trips through JSON to exactly what `parseInvite` produces.
 */
final class Invite
{
    /**
     * @param  'REQUEST'|'CANCEL'  $method
     * @param  list<array{name: ?string, email: string, role: ?string, partstat: ?string}>  $attendees
     * @param  ?array{name: ?string, email: string}  $organizer
     * @param  ?array{freq: string, interval: int, count: ?int, until: ?string, byDay: ?list<string>}  $rrule
     */
    public function __construct(
        public readonly string $method,
        public readonly string $uid,
        public readonly int $sequence,
        public readonly ?string $summary,
        public readonly ?string $description,
        public readonly ?string $location,
        public readonly ?string $status,
        public readonly string $dtstart,
        public readonly ?string $dtend,
        public readonly ?array $organizer,
        public readonly array $attendees,
        public readonly ?array $rrule,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'method' => $this->method,
            'uid' => $this->uid,
            'sequence' => $this->sequence,
            'summary' => $this->summary,
            'description' => $this->description,
            'location' => $this->location,
            'status' => $this->status,
            'dtstart' => $this->dtstart,
            'dtend' => $this->dtend,
            'organizer' => $this->organizer,
            'attendees' => $this->attendees,
            'rrule' => $this->rrule,
        ];
    }
}
