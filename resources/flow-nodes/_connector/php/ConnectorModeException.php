<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** A requested mode cannot be honoured. Never downgraded silently. */
final class ConnectorModeException extends ConnectorException {}
