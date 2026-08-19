<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** The provider rejected the credential. Retrying cannot help. */
final class ConnectorAuthException extends ConnectorException {}
