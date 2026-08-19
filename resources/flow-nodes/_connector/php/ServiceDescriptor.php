<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ServiceDescriptor.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Everything true of a SERVICE rather than of one operation.
 *
 * One per provider, declared once and shared by that provider's connectors: base
 * URLs, which credential keys a remote call needs, how the sandbox is selected,
 * how a request is authorized, and the faker. It is DATA, so the facts verified
 * against provider documentation live in one reviewable place instead of being
 * retyped into every connector — and when a provider changes something, one file
 * changes.
 */
final class ServiceDescriptor
{
    /**
     * @param  array<string,string>  $baseUrls  keyed by Mode value. A `credential`-sandbox
     *                                          provider gives the SAME url for live and
     *                                          sandbox, which is itself worth writing down:
     *                                          it is why a live key pointed at "sandbox"
     *                                          quietly reaches production.
     * @param  list<string>  $requires  credential keys a remote call cannot proceed without
     * @param  callable(array<string,string>, PreparedRequest, Mode): void  $authorize
     *                                                                                  A FUNCTION rather than a declarative header name, because there is no common
     *                                                                                  shape: the key can be a header under any of a dozen names, a Basic username
     *                                                                                  with a blank password, a query parameter, a body field, or a URL path
     *                                                                                  segment — and several providers need more than one at once. It receives the
     *                                                                                  resolved mode too, because for some providers auth and estate are the same
     *                                                                                  decision expressed in the URL.
     * @param  callable(string, array<string,mixed>, FakeValues, mixed): mixed  $faker
     *                                                                                  Required. Every connector ships one — see {@see FakeValues}.
     * @param  string|null  $idempotencyHeader  header the provider uses for idempotency
     */
    public function __construct(
        public readonly string $service,
        public readonly string $title,
        public readonly SandboxKind $sandbox,
        public readonly array $baseUrls,
        public readonly array $requires,
        public readonly mixed $authorize,
        public readonly mixed $faker,
        public readonly ?string $idempotencyHeader = null,
    ) {}
}
