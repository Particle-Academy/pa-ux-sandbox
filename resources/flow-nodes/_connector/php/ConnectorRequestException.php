<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** A 4xx we caused. The same request will fail the same way. */
final class ConnectorRequestException extends ConnectorException {}
