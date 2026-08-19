<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** One outgoing HTTP request, fully resolved and ready to send. */
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
