<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What a node's executor needs once everything has been resolved. */
final class ResolvedConnection
{
    /**
     * @param  array<string,string>  $credentials  empty in `fake` mode — there is
     *                                             nothing to authenticate against
     */
    public function __construct(
        public readonly string $id,
        public readonly string $service,
        public readonly Mode $mode,
        public readonly array $credentials = [],
        public readonly ?string $baseUrl = null,
    ) {}
}
