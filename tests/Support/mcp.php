<?php

use Laravel\Mcp\Response;

/*
 * Shared MCP test helpers.
 *
 * mcpBody() used to live in McpNodeToolsTest.php while ConnectorListingTest.php
 * also called it, so the second file only passed when the parallel runner
 * happened to load the first one into the same process. Every file that uses
 * it require_once's this file instead.
 */

if (! function_exists('mcpBody')) {
    /**
     * The tool's JSON body.
     *
     * `Response::content()` returns a single `Content\Text`, not an array, and it
     * json_encodes to `{}`: the payload is only reachable through `toArray()`.
     */
    function mcpBody(Response $response): array
    {
        return json_decode($response->content()->toArray()['text'] ?? '{}', true) ?? [];
    }
}
