<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Everything true of a SERVICE rather than of one operation.
 *
 * One of these per provider, declared once and shared by that provider's nodes:
 * base URLs, which credential keys a remote call needs, how the sandbox is
 * selected, how a request is authorized, and the faker. It is DATA, so the facts
 * verified against provider documentation live in one reviewable place instead
 * of being retyped into every node — and when a provider changes something, one
 * file changes.
 *
 * The twin of `ServiceDescriptor` in `../js/client.ts`.
 */
final class ServiceDescriptor
{
    /**
     * @param  array<string,string>  $baseUrls  keyed by `Mode` value. A
     *                                          `credential`-sandbox provider gives the
     *                                          SAME url for live and sandbox, which is
     *                                          itself worth writing down: it is why a
     *                                          live key pointed at "sandbox" quietly
     *                                          reaches production.
     * @param  list<string>  $requires  credential keys a remote call cannot proceed without
     * @param  callable(array<string,string>, PreparedRequest, Mode): void  $authorize
     * @param  callable(string, array<string,mixed>, FakeValues, mixed): mixed  $faker
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
