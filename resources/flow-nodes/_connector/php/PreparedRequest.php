<?php


// GENERATED from particle-academy/fancy-connectors — php/src/PreparedRequest.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * One outgoing HTTP request, fully resolved and ready to send.
 *
 * Mutable on purpose: a service descriptor's `authorize` receives it and writes
 * a header, a query parameter or a body field, and the shapes providers use for
 * that are too varied to express as a return value without inventing a second
 * vocabulary for each.
 */
final class PreparedRequest
{
    /** @param array<string,string> $headers */
    public function __construct(
        public string $method,
        public string $url,
        public array $headers = [],
        public ?string $body = null,
    ) {}

    public function withHeader(string $name, string $value): self
    {
        $this->headers[$name] = $value;

        return $this;
    }
}
